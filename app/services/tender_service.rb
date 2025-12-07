# frozen_string_literal: true

# Service for managing tender workflow operations
# Handles tender creation, validation, Airtable synchronization, and bid decision support
class TenderService
  class ValidationError < StandardError; end
  class SyncError < StandardError; end
  class WebhookError < StandardError; end

  # Airtable configuration
  AIRTABLE_BASE_ID = ENV.fetch("AIRTABLE_BASE_ID", "")
  CRM_TABLE = "CRM"

  # Process incoming tender webhook
  # @param payload [Hash] Webhook payload data
  # @return [Hash] Result with success status and tender record
  def process_webhook(payload)
    # Validate webhook payload
    validation_result = validate_webhook_payload(payload)
    return validation_result unless validation_result[:success]

    # Extract and normalize tender data
    tender_data = extract_tender_data(payload)

    # Check for duplicate by reference number
    existing_tender = Tender.find_by(reference_number: tender_data[:reference_number])

    if existing_tender
      # Update existing tender
      update_existing_tender(existing_tender, tender_data)
    else
      # Create new tender
      create_new_tender(tender_data)
    end
  rescue StandardError => e
    Rails.logger.error("Tender webhook processing failed: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    { success: false, errors: [ "Webhook processing failed: #{e.message}" ] }
  end

  # Create tender in Airtable CRM
  # @param tender [Tender] The tender to sync
  # @return [Hash] Result with success status and Airtable record ID
  def create_in_airtable(tender)
    fields = build_airtable_fields(tender)

    result = Adapters::AirtableAdapter.create_record(
      base_id: AIRTABLE_BASE_ID,
      table: CRM_TABLE,
      fields: fields
    )

    # Store Airtable ID
    tender.update_column(:airtable_id, result["id"])

    # Log successful sync
    AuditLogger.log(
      action: :tender_airtable_create,
      resource: tender,
      metadata: { airtable_id: result["id"] }
    )

    { success: true, airtable_id: result["id"], record: result }
  rescue Adapters::AirtableAdapter::ApiError => e
    Rails.logger.error("Airtable tender creation failed for tender #{tender.id}: #{e.message}")
    raise SyncError, "Failed to create tender in Airtable: #{e.message}"
  end

  # Update tender in Airtable CRM
  # @param tender [Tender] The tender to sync
  # @return [Hash] Result with success status
  def update_in_airtable(tender)
    return { success: false, errors: [ "Tender has no Airtable ID" ] } unless tender.airtable_id.present?

    fields = build_airtable_fields(tender)

    result = Adapters::AirtableAdapter.update_record(
      base_id: AIRTABLE_BASE_ID,
      table: CRM_TABLE,
      record_id: tender.airtable_id,
      fields: fields
    )

    # Log successful sync
    AuditLogger.log(
      action: :tender_airtable_update,
      resource: tender,
      metadata: { airtable_id: tender.airtable_id }
    )

    { success: true, airtable_id: tender.airtable_id, record: result }
  rescue Adapters::AirtableAdapter::ApiError => e
    Rails.logger.error("Airtable tender update failed for tender #{tender.id}: #{e.message}")
    raise SyncError, "Failed to update tender in Airtable: #{e.message}"
  end

  # Evaluate tender and make bid/no-bid recommendation
  # @param tender [Tender] The tender to evaluate
  # @return [Hash] Evaluation result with recommendation, score, and details
  def evaluate_tender(tender)
    engine = BidDecisionEngine.new
    evaluation = engine.evaluate(tender)

    # Update tender with evaluation results
    tender.update!(
      bid_decision: evaluation[:recommendation].downcase,
      bid_score: evaluation[:score],
      bid_rationale: evaluation[:rationale]
    )

    # Log evaluation
    AuditLogger.log(
      action: :tender_evaluation,
      resource: tender,
      metadata: evaluation
    )

    evaluation
  end

  # Validate webhook payload structure
  # @param payload [Hash] Webhook payload
  # @return [Hash] Validation result
  def validate_webhook_payload(payload)
    errors = []

    # Check required fields
    required_fields = %w[reference_number title source]
    missing_fields = required_fields - payload.keys.map(&:to_s)

    if missing_fields.any?
      errors << "Missing required fields: #{missing_fields.join(', ')}"
      # Return early if required fields are missing
      return { success: false, errors: errors }
    end

    # Validate reference_number format
    if payload["reference_number"].to_s.strip.empty?
      errors << "Reference number cannot be empty"
    end

    # Validate title
    if payload["title"].to_s.strip.empty?
      errors << "Title cannot be empty"
    end

    # Validate source
    if payload["source"].to_s.strip.empty?
      errors << "Source cannot be empty"
    end

    # Validate tender_value if present
    if payload["tender_value"].present?
      unless payload["tender_value"].to_s.match?(/^\d+(\.\d{1,2})?$/)
        errors << "Tender value must be a valid number"
      end
    end

    # Validate submission_deadline if present
    if payload["submission_deadline"].present?
      begin
        DateTime.parse(payload["submission_deadline"].to_s)
      rescue ArgumentError
        errors << "Submission deadline must be a valid date/time"
      end
    end

    # Validate required_capabilities if present
    if payload["required_capabilities"].present?
      unless payload["required_capabilities"].is_a?(Array)
        errors << "Required capabilities must be an array"
      end
    end

    if errors.any?
      { success: false, errors: errors }
    else
      { success: true, errors: [] }
    end
  end

  private

  # Extract and normalize tender data from webhook payload
  def extract_tender_data(payload)
    {
      reference_number: payload["reference_number"].to_s.strip,
      title: payload["title"].to_s.strip,
      source: payload["source"].to_s.strip,
      tender_value: parse_tender_value(payload["tender_value"]),
      submission_deadline: parse_submission_deadline(payload["submission_deadline"]),
      required_capabilities: normalize_capabilities(payload["required_capabilities"]),
      bid_decision: "pending"
    }
  end

  # Parse tender value to decimal
  def parse_tender_value(value)
    return nil if value.blank?
    value.to_s.gsub(/[^\d.]/, "").to_f
  end

  # Parse submission deadline to datetime
  def parse_submission_deadline(deadline)
    return nil if deadline.blank?
    DateTime.parse(deadline.to_s)
  rescue ArgumentError
    nil
  end

  # Normalize capabilities array
  def normalize_capabilities(capabilities)
    return [] if capabilities.blank?
    return [] unless capabilities.is_a?(Array)

    capabilities.map { |cap| cap.to_s.strip }.reject(&:empty?).uniq
  end

  # Create new tender record
  def create_new_tender(tender_data)
    tender = Tender.new(tender_data)

    if tender.save
      # Create in Airtable
      begin
        create_in_airtable(tender)
      rescue SyncError => e
        # Log error but don't fail the webhook
        Rails.logger.error("Failed to create tender in Airtable: #{e.message}")
      end

      # Log tender creation
      AuditLogger.log(
        action: :tender_create,
        resource: tender,
        metadata: { source: tender.source }
      )

      { success: true, tender: tender, operation: "create" }
    else
      { success: false, errors: tender.errors.full_messages }
    end
  end

  # Update existing tender record
  def update_existing_tender(tender, tender_data)
    # Store old values for audit
    old_values = tender.attributes.slice("title", "tender_value", "submission_deadline", "required_capabilities")

    tender.assign_attributes(tender_data.except(:reference_number, :bid_decision))

    if tender.save
      # Update in Airtable if ID exists
      if tender.airtable_id.present?
        begin
          update_in_airtable(tender)
        rescue SyncError => e
          # Log error but don't fail the webhook
          Rails.logger.error("Failed to update tender in Airtable: #{e.message}")
        end
      end

      # Log tender update
      AuditLogger.log(
        action: :tender_update,
        resource: tender,
        change_data: { old: old_values, new: tender.attributes.slice("title", "tender_value", "submission_deadline", "required_capabilities") },
        metadata: { source: tender.source }
      )

      { success: true, tender: tender, operation: "update" }
    else
      { success: false, errors: tender.errors.full_messages }
    end
  end

  # Build Airtable fields from tender data
  def build_airtable_fields(tender)
    fields = {
      "Reference Number" => tender.reference_number,
      "Title" => tender.title,
      "Source" => tender.source,
      "Bid Decision" => tender.bid_decision.titleize,
      "Status" => "New Opportunity"
    }

    fields["Tender Value"] = tender.tender_value if tender.tender_value.present?
    fields["Submission Deadline"] = tender.submission_deadline.iso8601 if tender.submission_deadline.present?
    fields["Required Capabilities"] = tender.required_capabilities if tender.required_capabilities.any?
    fields["Bid Score"] = tender.bid_score if tender.bid_score.present?
    fields["Bid Rationale"] = tender.bid_rationale if tender.bid_rationale.present?

    fields
  end
end
