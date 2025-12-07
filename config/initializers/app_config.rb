# frozen_string_literal: true

# Initialize application configuration
# This loads configuration from environment variables on application startup
Rails.application.config.to_prepare do
  # Initialize the configuration singleton
  AppConfig.instance

  # Log configuration load (without secrets)
  Rails.logger.info("Application configuration loaded for environment: #{AppConfig.environment}")
end
