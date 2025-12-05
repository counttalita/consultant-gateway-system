# frozen_string_literal: true

# Job for asynchronous email sending
class EmailJob < ApplicationJob
  queue_as :critical

  retry_on Adapters::ResendAdapter::EmailDeliveryError, wait: :exponentially_longer, attempts: 5
  retry_on Adapters::ResendAdapter::RateLimitError, wait: 1.minute, attempts: 3

  # Send email asynchronously
  # @param email_type [String] Type of email ('otp_code', 'welcome', 'admin_notification')
  # @param recipient [String] Email address of recipient
  # @param variables [Hash] Template variables
  def perform(email_type, recipient, variables = {})
    adapter = Adapters::ResendAdapter.new

    message_id = adapter.send_email(
      to: recipient,
      template: email_type,
      variables: variables
    )

    AuditLogger.log(
      action: :email_sent,
      metadata: {
        email_type: email_type,
        recipient: recipient,
        message_id: message_id
      }
    )
  rescue StandardError => e
    Rails.logger.error("EmailJob failed: #{e.message}")
    AuditLogger.log(
      action: :email_failed,
      metadata: {
        email_type: email_type,
        recipient: recipient,
        error: e.message
      }
    )
    raise
  end
end
