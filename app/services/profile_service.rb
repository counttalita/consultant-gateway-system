# frozen_string_literal: true

# Service for managing consultant profile operations
# Handles profile updates, validation, and Airtable synchronization
class ProfileService
  class ValidationError < StandardError; end
  class SyncError < StandardError; end

  # South African banking validation patterns
  SA_BANK_ACCOUNT_PATTERN = /^\d{9,11}$/
  SA_BRANCH_CODE_PATTERN = /^\d{6}$/
  VALID_ACCOUNT_TYPES = %w[savings cheque transmission].freeze

  # Airtable configuration
  AIRTABLE_BASE_ID = ENV.fetch("AIRTABLE_BASE_ID", "")
  TALENT_POOL_TABLE = "Talent Pool"

  # Update consultant profile with validation and Airtable sync
  # @param consultant [Consultant] The consultant to update
  # @param attributes [Hash] Profile attributes to update
  # @return [Hash] Result with success status and any errors
  def update_profile(consultant, attributes)
    # Validate attributes
    validation_result = validate_profile_attributes(attributes)
    return validation_result unless validation_result[:success]

    # Update consultant record
    consultant.assign_attributes(sanitize_attributes(attributes))

    if consultant.save
      # Queue background job for Airtable sync
      ProfileSyncJob.perform_later(consultant.id)

      # Log the profile update
      AuditLogger.log(
        action: :profile_update,
        resource: consultant,
        change_data: consultant.previous_changes,
        metadata: { synced_to_airtable: false }
      )

      { success: true, consultant: consultant, errors: [] }
    else
      { success: false, consultant: consultant, errors: consultant.errors.full_messages }
    end
  rescue StandardError => e
    Rails.logger.error("Profile update failed for consultant #{consultant.id}: #{e.message}")
    { success: false, consultant: consultant, errors: [ "Profile update failed: #{e.message}" ] }
  end

  # Synchronize consultant profile to Airtable
  # @param consultant [Consultant] The consultant to sync
  # @return [Hash] Result with success status and Airtable record ID
  def sync_to_airtable(consultant)
    fields = build_airtable_fields(consultant)

    if consultant.airtable_id.present?
      # Update existing record
      result = Adapters::AirtableAdapter.update_record(
        base_id: AIRTABLE_BASE_ID,
        table: TALENT_POOL_TABLE,
        record_id: consultant.airtable_id,
        fields: fields
      )
    else
      # Create new record
      result = Adapters::AirtableAdapter.create_record(
        base_id: AIRTABLE_BASE_ID,
        table: TALENT_POOL_TABLE,
        fields: fields
      )

      # Store Airtable ID
      consultant.update_column(:airtable_id, result["id"])
    end

    # Log successful sync
    AuditLogger.log(
      action: :airtable_sync,
      resource: consultant,
      metadata: { airtable_id: result["id"], operation: consultant.airtable_id.present? ? "update" : "create" }
    )

    { success: true, airtable_id: result["id"], record: result }
  rescue Adapters::AirtableAdapter::ApiError => e
    Rails.logger.error("Airtable sync failed for consultant #{consultant.id}: #{e.message}")
    raise SyncError, "Failed to sync to Airtable: #{e.message}"
  end

  # Validate profile attributes
  # @param attributes [Hash] Attributes to validate
  # @return [Hash] Validation result
  def validate_profile_attributes(attributes)
    errors = []

    # Validate bio length
    if attributes[:bio].present? && attributes[:bio].length > 1000
      errors << "Bio must be 1000 characters or less"
    end

    # Validate skills format
    if attributes[:skills].present?
      unless attributes[:skills].is_a?(Array)
        errors << "Skills must be an array"
      else
        if attributes[:skills].any? { |skill| !skill.is_a?(String) }
          errors << "All skills must be strings"
        end
      end
    end

    # Validate banking details
    if attributes[:banking_details].present?
      banking_errors = validate_banking_details(attributes[:banking_details])
      errors.concat(banking_errors)
    end

    if errors.any?
      { success: false, errors: errors }
    else
      { success: true, errors: [] }
    end
  end

  # Validate South African banking details
  # @param banking_details [Hash] Banking details to validate
  # @return [Array<String>] Array of error messages
  def validate_banking_details(banking_details)
    errors = []

    # Check required fields
    required_fields = %w[bank_name account_number branch_code account_type]
    missing_fields = required_fields - banking_details.keys.map(&:to_s)

    if missing_fields.any?
      errors << "Banking details missing required fields: #{missing_fields.join(', ')}"
      return errors
    end

    # Validate account number format (South African standard)
    unless banking_details["account_number"].to_s.match?(SA_BANK_ACCOUNT_PATTERN)
      errors << "Account number must be 9-11 digits"
    end

    # Validate branch code format (South African standard)
    unless banking_details["branch_code"].to_s.match?(SA_BRANCH_CODE_PATTERN)
      errors << "Branch code must be 6 digits"
    end

    # Validate account type
    unless VALID_ACCOUNT_TYPES.include?(banking_details["account_type"].to_s.downcase)
      errors << "Account type must be one of: #{VALID_ACCOUNT_TYPES.join(', ')}"
    end

    # Validate bank name is present
    if banking_details["bank_name"].to_s.strip.empty?
      errors << "Bank name cannot be empty"
    end

    errors
  end

  private

  # Sanitize attributes for assignment
  def sanitize_attributes(attributes)
    allowed_attributes = %i[bio skills banking_details availability_status]
    attributes.slice(*allowed_attributes)
  end

  # Build Airtable fields from consultant data
  def build_airtable_fields(consultant)
    fields = {
      "Name" => consultant.user.email,
      "Email" => consultant.user.email,
      "Bio" => consultant.bio || "",
      "Skills" => consultant.skills || [],
      "Availability Status" => consultant.availability_status&.titleize || "Available",
      "Utilization %" => consultant.utilization_percentage || 0,
      "Onboarding Status" => consultant.onboarding_status&.titleize || "Pending"
    }

    # Add banking details if present (without sensitive data)
    if consultant.banking_details.present?
      fields["Bank Name"] = consultant.banking_details["bank_name"]
      fields["Banking Details Complete"] = true
    else
      fields["Banking Details Complete"] = false
    end

    # Add system IDs
    fields["Harvest ID"] = consultant.harvest_id if consultant.harvest_id.present?
    fields["Xero ID"] = consultant.xero_id if consultant.xero_id.present?

    fields
  end
end
