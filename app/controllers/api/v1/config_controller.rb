# frozen_string_literal: true

module Api
  module V1
    # Controller for configuration management
    # Allows administrators to reload configuration without restarting the application
    class ConfigController < ApplicationController
      include Authorizable

      before_action :require_authentication
      before_action :require_admin

      # POST /api/v1/config/reload
      # Reload configuration from environment variables
      def reload
        begin
          old_config = AppConfig.instance.to_h
          AppConfig.reload!
          new_config = AppConfig.instance.to_h

          # Log the reload action
          AuditLogger.log(
            :config_reload,
            Current.user,
            {
              old_environment: old_config[:environment],
              new_environment: new_config[:environment],
              reloaded_at: Time.current
            }
          )

          render json: {
            success: true,
            message: "Configuration reloaded successfully",
            environment: AppConfig.environment,
            reloaded_at: Time.current
          }, status: :ok
        rescue AppConfig::ConfigurationError => e
          render json: {
            success: false,
            error: "Configuration validation failed",
            details: e.message
          }, status: :unprocessable_entity
        rescue StandardError => e
          ErrorService.handle_error(
            e,
            context: "config_reload",
            severity: :high,
            user: Current.user
          )

          render json: {
            success: false,
            error: "Failed to reload configuration",
            details: e.message
          }, status: :internal_server_error
        end
      end

      # GET /api/v1/config
      # Get current configuration (with secrets redacted)
      def show
        config = AppConfig.instance.to_h

        render json: {
          success: true,
          config: config,
          environment: AppConfig.environment
        }, status: :ok
      rescue StandardError => e
        ErrorService.handle_error(
          e,
          context: "config_show",
          severity: :medium,
          user: Current.user
        )

        render json: {
          success: false,
          error: "Failed to retrieve configuration"
        }, status: :internal_server_error
      end

      private

      def require_admin
        unless Current.user&.has_role?("admin")
          render json: {
            error: "Unauthorized",
            message: "Admin role required to manage configuration"
          }, status: :forbidden
        end
      end
    end
  end
end
