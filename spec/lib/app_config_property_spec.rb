# frozen_string_literal: true

require "rails_helper"

# Feature: consultant-gateway-system, Property 52: Environment Configuration Reload
# Validates: Requirements 14.3
RSpec.describe AppConfig do
  describe "Property 52: Environment Configuration Reload" do
    it "reloads configuration from environment variables without requiring code changes" do
      property_test(iterations: 100) do
        # Generate random configuration changes
        config_key = Rantly {
          choose(
            "OTP_EXPIRY_MINUTES",
            "SESSION_EXPIRY_HOURS",
            "CACHE_TTL_MINUTES",
            "MAX_RETRIES",
            "CIRCUIT_BREAKER_FAILURE_THRESHOLD",
            "RESEND_FROM_EMAIL",
            "APP_HOST",
            "CACHE_STALE_SERVE_ENABLED"
          )
        }

        config_value = case config_key
        when "OTP_EXPIRY_MINUTES", "SESSION_EXPIRY_HOURS", "CACHE_TTL_MINUTES", "MAX_RETRIES", "CIRCUIT_BREAKER_FAILURE_THRESHOLD"
                         Rantly { range(1, 100).to_s }
        when "RESEND_FROM_EMAIL"
                         Rantly {
                           choose(
                             "test@example.com",
                             "admin@uptimeconsulting.co.za",
                             "noreply@uptimeconsulting.co.za",
                             "finance@company.com"
                           )
                         }
        when "APP_HOST"
                         Rantly {
                           choose(
                             "localhost:3000",
                             "app.example.com",
                             "staging.uptimeconsulting.co.za",
                             "api.company.com:8080"
                           )
                         }
        when "CACHE_STALE_SERVE_ENABLED"
                         Rantly { choose("true", "false") }
        end

        # Store original environment value
        original_value = ENV[config_key]

        begin
          # Get initial configuration value
          initial_value = case config_key
          when "OTP_EXPIRY_MINUTES"
                            AppConfig.otp_expiry_minutes
          when "SESSION_EXPIRY_HOURS"
                            AppConfig.session_expiry_hours
          when "CACHE_TTL_MINUTES"
                            AppConfig.cache_ttl_minutes
          when "MAX_RETRIES"
                            AppConfig.max_retries
          when "CIRCUIT_BREAKER_FAILURE_THRESHOLD"
                            AppConfig.circuit_breaker_failure_threshold
          when "RESEND_FROM_EMAIL"
                            AppConfig.resend_from_email
          when "APP_HOST"
                            AppConfig.app_host
          when "CACHE_STALE_SERVE_ENABLED"
                            AppConfig.cache_stale_serve_enabled
          end

          # Apply configuration change to environment
          ENV[config_key] = config_value

          # Reload configuration
          AppConfig.reload!

          # Get reloaded configuration value
          reloaded_value = case config_key
          when "OTP_EXPIRY_MINUTES"
                             AppConfig.otp_expiry_minutes
          when "SESSION_EXPIRY_HOURS"
                             AppConfig.session_expiry_hours
          when "CACHE_TTL_MINUTES"
                             AppConfig.cache_ttl_minutes
          when "MAX_RETRIES"
                             AppConfig.max_retries
          when "CIRCUIT_BREAKER_FAILURE_THRESHOLD"
                             AppConfig.circuit_breaker_failure_threshold
          when "RESEND_FROM_EMAIL"
                             AppConfig.resend_from_email
          when "APP_HOST"
                             AppConfig.app_host
          when "CACHE_STALE_SERVE_ENABLED"
                             AppConfig.cache_stale_serve_enabled
          end

          # Verify that configuration was reloaded
          expect(AppConfig.instance).not_to be_nil

          # Verify the specific change was applied
          expected_value = case config_key
          when "OTP_EXPIRY_MINUTES", "SESSION_EXPIRY_HOURS", "CACHE_TTL_MINUTES", "MAX_RETRIES", "CIRCUIT_BREAKER_FAILURE_THRESHOLD"
                             config_value.to_i
          when "CACHE_STALE_SERVE_ENABLED"
                             config_value == "true"
          else
                             config_value
          end

          expect(reloaded_value).to eq(expected_value)
        ensure
          # Restore original environment value
          if original_value.nil?
            ENV.delete(config_key)
          else
            ENV[config_key] = original_value
          end

          # Reload configuration to restore original state
          AppConfig.reload!
        end
      end
    end

    it "maintains valid state after configuration reload" do
      property_test(iterations: 100) do
        # Generate random valid configuration changes
        num_changes = Rantly { range(1, 5) }
        config_changes = {}

        num_changes.times do
          config_key = Rantly {
            choose(
              "OTP_EXPIRY_MINUTES",
              "SESSION_EXPIRY_HOURS",
              "CACHE_TTL_MINUTES",
              "MAX_RETRIES",
              "CIRCUIT_BREAKER_FAILURE_THRESHOLD"
            )
          }

          config_changes[config_key] = Rantly { range(1, 100).to_s }
        end

        # Store original environment values
        original_values = {}
        config_changes.each_key do |key|
          original_values[key] = ENV[key]
        end

        begin
          # Apply configuration changes
          config_changes.each do |key, value|
            ENV[key] = value
          end

          # Reload configuration
          AppConfig.reload!

          # Verify configuration is valid
          config = AppConfig.instance

          # All numeric values should be positive
          expect(config.otp_expiry_minutes).to be > 0
          expect(config.session_expiry_hours).to be > 0
          expect(config.cache_ttl_minutes).to be > 0
          expect(config.max_retries).to be > 0
          expect(config.circuit_breaker_failure_threshold).to be > 0

          # Email should be valid format
          expect(config.resend_from_email).to match(URI::MailTo::EMAIL_REGEXP)

          # Host should not be empty
          expect(config.app_host).not_to be_empty

          # Boolean values should be boolean
          expect([ true, false ]).to include(config.cache_stale_serve_enabled)
        ensure
          # Restore original environment values
          original_values.each do |key, value|
            if value.nil?
              ENV.delete(key)
            else
              ENV[key] = value
            end
          end

          # Reload configuration to restore original state
          AppConfig.reload!
        end
      end
    end

    it "handles multiple consecutive reloads correctly" do
      property_test(iterations: 50) do
        # Generate random number of reload cycles
        num_reloads = Rantly { range(2, 5) }

        # Store original environment values
        original_values = {
          "OTP_EXPIRY_MINUTES" => ENV["OTP_EXPIRY_MINUTES"],
          "SESSION_EXPIRY_HOURS" => ENV["SESSION_EXPIRY_HOURS"]
        }

        begin
          # Track all values to ensure reload works
          all_values = []

          num_reloads.times do |i|
            # Generate new configuration value (ensure it's different from previous)
            new_otp_expiry = Rantly { range(5, 60).to_s }

            # Apply configuration change
            ENV["OTP_EXPIRY_MINUTES"] = new_otp_expiry

            # Reload configuration
            AppConfig.reload!

            # Get current configuration
            current_otp_expiry = AppConfig.otp_expiry_minutes

            # Verify configuration matches environment variable
            expect(current_otp_expiry).to eq(new_otp_expiry.to_i)

            # Track the value
            all_values << current_otp_expiry
          end

          # Verify final configuration is valid
          expect(AppConfig.instance).not_to be_nil
          expect(AppConfig.otp_expiry_minutes).to be > 0

          # Verify we successfully reloaded multiple times
          expect(all_values.length).to eq(num_reloads)
        ensure
          # Restore original environment values
          original_values.each do |key, value|
            if value.nil?
              ENV.delete(key)
            else
              ENV[key] = value
            end
          end

          # Reload configuration to restore original state
          AppConfig.reload!
        end
      end
    end
  end
end
