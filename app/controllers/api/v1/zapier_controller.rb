# frozen_string_literal: true

module Api
  module V1
    class ZapierController < ApplicationController
      # Disable CSRF for API endpoints
      # skip_before_action :verify_authenticity_token (Not needed for ActionController::API)

      before_action :authenticate_zapier!

      # POST /api/v1/zapier/triggers/:event_type
      # Endpoint for Zapier to push data to us (Actions in Zapier terms)
      def receive_event
        event_type = params[:event_type]
        payload = params.except(:controller, :action, :event_type, :format, :zapier)

        begin
          validate_payload!(payload)

          log_workflow(event_type, payload)

          process_event(event_type, payload)
          render json: { success: true, message: "Event processed successfully" }, status: :ok
        rescue => e
          handle_error(e, event_type, payload)
        end
      end

      # GET /api/v1/zapier/ping
      # Health check for Zapier connection
      def ping
        render json: { success: true, message: "Pong" }, status: :ok
      end

      private

      def authenticate_zapier!
        api_key = request.headers["X-Zapier-Api-Key"]

        unless api_key.present? && api_key == ENV["ZAPIER_API_KEY"]
          AuditLogger.log(
            action: :zapier_auth_failed,
            resource_type: "system",
            metadata: { ip: request.remote_ip }
          )
          render json: { success: false, error: "Unauthorized" }, status: :unauthorized
        end
      end

      def validate_payload!(payload)
        if payload.blank? || payload.keys.empty?
          raise ArgumentError, "Payload cannot be empty"
        end

        # Add specific validation logic here based on event types if needed
        # For generic validation, we ensure it responds to key access
        unless payload.respond_to?(:[]) && payload.respond_to?(:keys)
          raise ArgumentError, "Invalid payload format"
        end
      end

      def log_workflow(event_type, payload)
        AuditLogger.log(
          action: :zapier_event_received,
          resource_type: "zapier_integration",
          metadata: {
            event_type: event_type,
            payload_keys: payload.keys,
            timestamp: Time.current
          }
        )

        Rails.logger.info("Zapier Workflow: Received #{event_type}")
      end

      def process_event(event_type, payload)
        case event_type
        when "consultant_update"
          # Example logic: Update consultant
          # Consultant.find(payload[:id]).update!(payload.slice(:...))
          # For now, just logging as processed
          Rails.logger.info("Processing consultant update for Zapier")
        when "project_create"
          # Example logic: Create project
          Rails.logger.info("Processing project creation for Zapier")
        else
          # We allow generic events but log a warning
          Rails.logger.warn("Unknown Zapier event type: #{event_type}")
        end
      end

      def handle_error(exception, event_type, payload)
        Rails.logger.error("Zapier Error (#{event_type}): #{exception.message}")

        AuditLogger.log(
          action: :zapier_event_failed,
          resource_type: "zapier_integration",
          metadata: {
            event_type: event_type,
            error: exception.message,
            timestamp: Time.current
          }
        )

        status = case exception
        when ArgumentError then :unprocessable_content
        when ActiveRecord::RecordNotFound then :not_found
        else :internal_server_error
        end

        render json: {
          success: false,
          error: exception.message
        }, status: status
      end
    end
  end
end
