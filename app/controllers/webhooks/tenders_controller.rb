# frozen_string_literal: true

module Webhooks
  # Controller for handling tender webhook notifications
  class TendersController < ApplicationController
    include WebhookSignatureValidation

    # Configure signature validation
    self.signature_header_name = "X-Webhook-Signature"
    self.webhook_secret_env_var = "TENDERS_WEBHOOK_SECRET"

    before_action :validate_webhook_signature!, only: [ :create ]

    # POST /webhooks/tenders
    # Receive tender opportunity webhooks from external portals
    def create
      service = TenderService.new
      result = service.process_webhook(webhook_params)

      if result[:success]
        render json: {
          success: true,
          tender_id: result[:tender].id,
          operation: result[:operation]
        }, status: :ok
      else
        render json: {
          success: false,
          errors: result[:errors]
        }, status: :unprocessable_content
      end
    rescue StandardError => e
      Rails.logger.error("Tender webhook error: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))

      # Queue for retry
      queue_webhook_for_retry(request.body.read, e.message)

      render json: {
        success: false,
        errors: [ "Internal server error processing webhook" ]
      }, status: :internal_server_error
    end

    private

    # Extract webhook parameters
    def webhook_params
      params.permit(
        :reference_number,
        :title,
        :source,
        :tender_value,
        :submission_deadline,
        required_capabilities: []
      ).to_h
    end


    # Queue webhook for retry after failure
    def queue_webhook_for_retry(payload, error_message)
      # Store failed webhook for retry
      # In production, this would use a background job with retry logic
      Rails.logger.error("Queueing webhook for retry. Error: #{error_message}")
      Rails.logger.error("Payload: #{payload}")

      # TODO: Implement retry queue with TenderWebhookRetryJob
      # TenderWebhookRetryJob.set(wait: 5.minutes).perform_later(payload)
    end
  end
end
