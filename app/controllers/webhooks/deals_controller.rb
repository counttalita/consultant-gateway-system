module Webhooks
  class DealsController < ApplicationController
    include WebhookSignatureValidation

    # Configure signature validation
    self.signature_header_name = "X-Deal-Signature"
    self.webhook_secret_env_var = "DEALS_WEBHOOK_SECRET"

    before_action :validate_webhook_signature!, only: [ :create ]

    def create
      payload = webhook_params.to_h
      Rails.logger.info("Received deal webhook: #{payload.inspect}")

      # Process won deal webhook
      project_service = ProjectService.new
      project = project_service.process_won_deal_webhook(payload)

      render json: {
        status: "success",
        project_id: project.id,
        message: "Project setup initiated"
      }, status: :created
    rescue ProjectService::WebhookValidationError => e
      Rails.logger.error("Invalid webhook payload: #{e.message}")
      render json: {
        status: "error",
        message: "Invalid webhook payload: #{e.message}"
      }, status: :unprocessable_entity
    rescue ProjectService::ProjectError => e
      Rails.logger.error("Failed to process deal webhook: #{e.message}")
      render json: {
        status: "error",
        message: "Failed to process deal: #{e.message}"
      }, status: :internal_server_error
    rescue StandardError => e
      Rails.logger.error("Unexpected error processing deal webhook: #{e.message}")
      render json: {
        status: "error",
        message: "Internal server error"
      }, status: :internal_server_error
    end

    private

    def webhook_params
      params.permit(:deal_id, :client_name, :project_title, :start_date, :end_date, :description)
    end
  end
end
