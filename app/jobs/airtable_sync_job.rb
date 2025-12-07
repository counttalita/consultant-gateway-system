# frozen_string_literal: true

# Job for asynchronous Airtable synchronization
class AirtableSyncJob < ApplicationJob
  queue_as :integrations

  retry_on Adapters::AirtableAdapter::ApiError, wait: :exponentially_longer, attempts: 5
  retry_on Adapters::AirtableAdapter::RateLimitError, wait: 1.minute, attempts: 3

  # Sync consultant profile to Airtable
  # @param consultant_id [Integer] The consultant ID to sync
  # @param operation [String] The operation type ('create', 'update', 'delete')
  def perform(consultant_id, operation = "update")
    consultant = Consultant.find(consultant_id)
    adapter = Adapters::AirtableAdapter.new

    case operation
    when "create"
      sync_create(consultant, adapter)
    when "update"
      sync_update(consultant, adapter)
    when "delete"
      sync_delete(consultant, adapter)
    else
      raise ArgumentError, "Invalid operation: #{operation}"
    end

    AuditLogger.log(
      action: :airtable_sync_completed,
      resource: consultant,
      metadata: {
        operation: operation,
        airtable_id: consultant.airtable_id
      }
    )
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error("AirtableSyncJob: Consultant not found: #{e.message}")
    # Don't retry if record doesn't exist
  rescue StandardError => e
    Rails.logger.error("AirtableSyncJob failed: #{e.message}")
    AuditLogger.log(
      action: :airtable_sync_failed,
      metadata: {
        consultant_id: consultant_id,
        operation: operation,
        error: e.message
      }
    )
    raise
  end

  private

  def sync_create(consultant, adapter)
    base_id = ENV.fetch("AIRTABLE_BASE_ID")
    table = ENV.fetch("AIRTABLE_CONSULTANTS_TABLE", "Consultants")

    fields = {
      "Name" => consultant.user.email,
      "Email" => consultant.user.email,
      "Status" => consultant.onboarding_completed? ? "Active" : "Onboarding"
    }

    result = adapter.create_record(base_id: base_id, table: table, fields: fields)
    consultant.update!(airtable_id: result[:id])
  end

  def sync_update(consultant, adapter)
    if consultant.airtable_id.present?
      base_id = ENV.fetch("AIRTABLE_BASE_ID")
      table = ENV.fetch("AIRTABLE_CONSULTANTS_TABLE", "Consultants")

      fields = {
        "Name" => consultant.user.email,
        "Email" => consultant.user.email,
        "Status" => consultant.onboarding_completed? ? "Active" : "Onboarding"
      }

      adapter.update_record(base_id: base_id, table: table, record_id: consultant.airtable_id, fields: fields)
    else
      sync_create(consultant, adapter)
    end
  end

  def sync_delete(consultant, adapter)
    return unless consultant.airtable_id.present?

    base_id = ENV.fetch("AIRTABLE_BASE_ID")
    table = ENV.fetch("AIRTABLE_CONSULTANTS_TABLE", "Consultants")

    adapter.delete_record(base_id: base_id, table: table, record_id: consultant.airtable_id)
    consultant.update!(airtable_id: nil)
  end
end
