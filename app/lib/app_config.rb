# frozen_string_literal: true

# Central configuration management for the Consultant Gateway System
# Provides environment-specific settings with reload capability
class AppConfig
  class ConfigurationError < StandardError; end

  # Singleton instance
  @instance = nil
  @mutex = Mutex.new

  class << self
    # Get the singleton instance
    def instance
      return @instance if @instance

      @mutex.synchronize do
        @instance ||= new
      end
    end

    # Reload configuration from environment variables
    # This allows configuration changes without code deployment
    def reload!
      @mutex.synchronize do
        @instance = new
      end
      Rails.logger.info("AppConfig reloaded successfully")
      @instance
    end

    # Delegate all method calls to the instance
    def method_missing(method, *args, &block)
      instance.public_send(method, *args, &block)
    end

    def respond_to_missing?(method, include_private = false)
      instance.respond_to?(method, include_private) || super
    end
  end

  # Initialize configuration from environment variables
  def initialize
    load_configuration
    validate_required_config
  end

  # Airtable Configuration
  def airtable_api_key
    @airtable_api_key
  end

  def airtable_base_id
    @airtable_base_id
  end

  def airtable_timeout
    @airtable_timeout
  end

  # Xero Configuration
  def xero_client_id
    @xero_client_id
  end

  def xero_client_secret
    @xero_client_secret
  end

  def xero_tenant_id
    @xero_tenant_id
  end

  def xero_redirect_uri
    @xero_redirect_uri
  end

  # Harvest Configuration
  def harvest_access_token
    @harvest_access_token
  end

  def harvest_account_id
    @harvest_account_id
  end

  def harvest_timeout
    @harvest_timeout
  end

  # ClickUp Configuration
  def clickup_api_token
    @clickup_api_token
  end

  def clickup_team_id
    @clickup_team_id
  end

  def clickup_timeout
    @clickup_timeout
  end

  # Google Drive Configuration
  def google_drive_credentials
    @google_drive_credentials
  end

  def google_drive_folder_id
    @google_drive_folder_id
  end

  # Resend Configuration
  def resend_api_key
    @resend_api_key
  end

  def resend_from_email
    @resend_from_email
  end

  def resend_from_name
    @resend_from_name
  end

  # SimplePay Configuration
  def simplepay_api_key
    @simplepay_api_key
  end

  def simplepay_company_id
    @simplepay_company_id
  end

  # Application Configuration
  def app_host
    @app_host
  end

  def app_protocol
    @app_protocol
  end

  def frontend_url
    @frontend_url
  end

  # OTP Configuration
  def otp_expiry_minutes
    @otp_expiry_minutes
  end

  def otp_max_attempts
    @otp_max_attempts
  end

  def otp_rate_limit_per_hour
    @otp_rate_limit_per_hour
  end

  # Session Configuration
  def session_expiry_hours
    @session_expiry_hours
  end

  # Cache Configuration
  def cache_ttl_minutes
    @cache_ttl_minutes
  end

  def cache_stale_serve_enabled
    @cache_stale_serve_enabled
  end

  # Retry Configuration
  def max_retries
    @max_retries
  end

  def base_retry_delay_seconds
    @base_retry_delay_seconds
  end

  # Circuit Breaker Configuration
  def circuit_breaker_failure_threshold
    @circuit_breaker_failure_threshold
  end

  def circuit_breaker_timeout_seconds
    @circuit_breaker_timeout_seconds
  end

  # Error Notification Configuration
  def admin_notification_emails
    @admin_notification_emails
  end

  def finance_notification_emails
    @finance_notification_emails
  end

  # Environment Information
  def environment
    @environment
  end

  def production?
    @environment == "production"
  end

  def staging?
    @environment == "staging"
  end

  def qa?
    @environment == "qa"
  end

  def development?
    @environment == "development"
  end

  def test?
    @environment == "test"
  end

  # Feature Flags
  def feature_enabled?(feature_name)
    @feature_flags[feature_name.to_s] || false
  end

  # Get all configuration as a hash (for debugging, with secrets redacted)
  def to_h
    {
      environment: @environment,
      airtable: {
        base_id: @airtable_base_id,
        timeout: @airtable_timeout
      },
      xero: {
        client_id: @xero_client_id,
        tenant_id: @xero_tenant_id,
        redirect_uri: @xero_redirect_uri
      },
      harvest: {
        account_id: @harvest_account_id,
        timeout: @harvest_timeout
      },
      clickup: {
        team_id: @clickup_team_id,
        timeout: @clickup_timeout
      },
      google_drive: {
        folder_id: @google_drive_folder_id
      },
      resend: {
        from_email: @resend_from_email,
        from_name: @resend_from_name
      },
      simplepay: {
        company_id: @simplepay_company_id
      },
      application: {
        host: @app_host,
        protocol: @app_protocol,
        frontend_url: @frontend_url
      },
      otp: {
        expiry_minutes: @otp_expiry_minutes,
        max_attempts: @otp_max_attempts,
        rate_limit_per_hour: @otp_rate_limit_per_hour
      },
      session: {
        expiry_hours: @session_expiry_hours
      },
      cache: {
        ttl_minutes: @cache_ttl_minutes,
        stale_serve_enabled: @cache_stale_serve_enabled
      },
      retry: {
        max_retries: @max_retries,
        base_delay_seconds: @base_retry_delay_seconds
      },
      circuit_breaker: {
        failure_threshold: @circuit_breaker_failure_threshold,
        timeout_seconds: @circuit_breaker_timeout_seconds
      },
      notifications: {
        admin_emails: @admin_notification_emails,
        finance_emails: @finance_notification_emails
      },
      feature_flags: @feature_flags
    }
  end

  private

  # Load configuration from environment variables
  def load_configuration
    # Environment
    @environment = ENV.fetch("RAILS_ENV", "development")

    # Airtable
    @airtable_api_key = ENV["AIRTABLE_API_KEY"]
    @airtable_base_id = ENV.fetch("AIRTABLE_BASE_ID", "")
    @airtable_timeout = ENV.fetch("AIRTABLE_TIMEOUT", "30").to_i

    # Xero
    @xero_client_id = ENV["XERO_CLIENT_ID"]
    @xero_client_secret = ENV["XERO_CLIENT_SECRET"]
    @xero_tenant_id = ENV["XERO_TENANT_ID"]
    @xero_redirect_uri = ENV.fetch("XERO_REDIRECT_URI", "")

    # Harvest
    @harvest_access_token = ENV["HARVEST_ACCESS_TOKEN"]
    @harvest_account_id = ENV["HARVEST_ACCOUNT_ID"]
    @harvest_timeout = ENV.fetch("HARVEST_TIMEOUT", "30").to_i

    # ClickUp
    @clickup_api_token = ENV["CLICKUP_API_TOKEN"]
    @clickup_team_id = ENV["CLICKUP_TEAM_ID"]
    @clickup_timeout = ENV.fetch("CLICKUP_TIMEOUT", "30").to_i

    # Google Drive
    @google_drive_credentials = ENV["GOOGLE_DRIVE_CREDENTIALS"]
    @google_drive_folder_id = ENV["GOOGLE_DRIVE_FOLDER_ID"]

    # Resend
    @resend_api_key = ENV["RESEND_API_KEY"]
    @resend_from_email = ENV.fetch("RESEND_FROM_EMAIL", "noreply@uptimeconsulting.co.za")
    @resend_from_name = ENV.fetch("RESEND_FROM_NAME", "Up Time Consulting")

    # SimplePay
    @simplepay_api_key = ENV["SIMPLEPAY_API_KEY"]
    @simplepay_company_id = ENV["SIMPLEPAY_COMPANY_ID"]

    # Application
    @app_host = ENV.fetch("APP_HOST", "localhost:3000")
    @app_protocol = ENV.fetch("APP_PROTOCOL", "http")
    @frontend_url = ENV.fetch("FRONTEND_URL", "http://localhost:5173")

    # OTP
    @otp_expiry_minutes = ENV.fetch("OTP_EXPIRY_MINUTES", "10").to_i
    @otp_max_attempts = ENV.fetch("OTP_MAX_ATTEMPTS", "3").to_i
    @otp_rate_limit_per_hour = ENV.fetch("OTP_RATE_LIMIT_PER_HOUR", "3").to_i

    # Session
    @session_expiry_hours = ENV.fetch("SESSION_EXPIRY_HOURS", "24").to_i

    # Cache
    @cache_ttl_minutes = ENV.fetch("CACHE_TTL_MINUTES", "5").to_i
    @cache_stale_serve_enabled = ENV.fetch("CACHE_STALE_SERVE_ENABLED", "true") == "true"

    # Retry
    @max_retries = ENV.fetch("MAX_RETRIES", "3").to_i
    @base_retry_delay_seconds = ENV.fetch("BASE_RETRY_DELAY_SECONDS", "1").to_i

    # Circuit Breaker
    @circuit_breaker_failure_threshold = ENV.fetch("CIRCUIT_BREAKER_FAILURE_THRESHOLD", "5").to_i
    @circuit_breaker_timeout_seconds = ENV.fetch("CIRCUIT_BREAKER_TIMEOUT_SECONDS", "60").to_i

    # Notifications
    @admin_notification_emails = parse_email_list(ENV.fetch("ADMIN_NOTIFICATION_EMAILS", ""))
    @finance_notification_emails = parse_email_list(ENV.fetch("FINANCE_NOTIFICATION_EMAILS", ""))

    # Feature Flags
    @feature_flags = parse_feature_flags(ENV.fetch("FEATURE_FLAGS", ""))
  end

  # Validate that required configuration is present
  def validate_required_config
    return if test?

    errors = []

    # Only validate in non-development environments
    unless development?
      errors << "AIRTABLE_API_KEY is required" if @airtable_api_key.blank?
      errors << "RESEND_API_KEY is required" if @resend_api_key.blank?
    end

    if production?
      errors << "XERO_CLIENT_ID is required" if @xero_client_id.blank?
      errors << "XERO_CLIENT_SECRET is required" if @xero_client_secret.blank?
      errors << "HARVEST_ACCESS_TOKEN is required" if @harvest_access_token.blank?
      errors << "CLICKUP_API_TOKEN is required" if @clickup_api_token.blank?
      errors << "ADMIN_NOTIFICATION_EMAILS is required" if @admin_notification_emails.empty?
    end

    return if errors.empty?

    raise ConfigurationError, "Configuration validation failed:\n#{errors.join("\n")}"
  end

  # Parse comma-separated email list
  def parse_email_list(value)
    return [] if value.blank?

    value.split(",").map(&:strip).reject(&:blank?)
  end

  # Parse feature flags from environment variable
  # Format: "feature1:true,feature2:false,feature3:true"
  def parse_feature_flags(value)
    return {} if value.blank?

    flags = {}
    value.split(",").each do |flag|
      name, enabled = flag.split(":")
      flags[name.strip] = enabled&.strip == "true"
    end
    flags
  end
end
