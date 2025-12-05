# frozen_string_literal: true

# Background job for asynchronous Airtable profile synchronization
# Implements retry logic with exponential backoff
class ProfileSyncJob < ApplicationJob
  queue_as :default

  # Retry configuration
  retry_on ProfileService::SyncError, wait: :exponentially_longer, attempts: 3
  retry_on Adapters::AirtableAdapter::ApiError, wait: :exponentially_longer, attempts: 3
  retry_on Adapters::AirtableAdapter::RateLimitError, wait: 1.minute, attempts: 5

  # Discard on authentication errors (no point retrying)
  discard_on Adapters::AirtableAdapter::AuthenticationError

  # Perform the sync operation
  # @param consultant_id [Integer] ID of the consultant to sync
  def perform(consultant_id)
    consultant = Consultant.find(consultant_id)
    service = ProfileService.new

    Rails.logger.info("Starting Airtable sync for consultant #{consultant_id}")

    result = service.sync_to_airtable(consultant)

    if result[:success]
      Rails.logger.info("Successfully synced consultant #{consultant_id} to Airtable (record: #{result[:airtable_id]})")
    else
      Rails.logger.error("Failed to sync consultant #{consultant_id} to Airtable")
      raise ProfileService::SyncError, "Sync failed"
    end
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error("Consultant #{consultant_id} not found for Airtable sync: #{e.message}")
    # Don't retry if consultant doesn't exist
  rescue StandardError => e
    Rails.logger.error("Unexpected error syncing consultant #{consultant_id}: #{e.class} - #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    raise
  end
end
