# frozen_string_literal: true

module Api
  module V1
    # Authentication controller for OTP-based login
    class AuthController < ApplicationController
      # POST /api/v1/auth/request-otp
      # Request OTP code for email address
      def request_otp
        email = params[:email]

        if email.blank?
          return render json: { error: "Email is required" }, status: :bad_request
        end

        auth_service = AuthenticationService.new
        otp_code = auth_service.generate_otp(
          email: email,
          ip_address: request.remote_ip
        )

        render json: {
          message: "OTP code sent to #{email}",
          expires_in: otp_code.time_remaining
        }, status: :ok
      rescue AuthenticationService::RateLimitExceededError => e
        render json: { error: e.message }, status: :too_many_requests
      rescue StandardError => e
        Rails.logger.error("OTP generation failed: #{e.message}")
        Rails.logger.error(e.backtrace.join("\n"))
        render json: { error: "Failed to generate OTP code" }, status: :internal_server_error
      end

      # POST /api/v1/auth/validate-otp
      # Validate OTP code and create session
      def validate_otp
        email = params[:email]
        code = params[:code]

        if email.blank? || code.blank?
          return render json: { error: "Email and code are required" }, status: :bad_request
        end

        auth_service = AuthenticationService.new
        result = auth_service.validate_otp(
          email: email,
          code: code,
          ip_address: request.remote_ip
        )

        if result
          render json: {
            message: "Authentication successful",
            token: result[:session].token,
            expires_at: result[:session].expires_at,
            user: {
              id: result[:user].id,
              email: result[:user].email,
              roles: result[:user].roles
            }
          }, status: :ok
        else
          render json: { error: "Invalid credentials" }, status: :unauthorized
        end
      rescue AuthenticationService::ExpiredOtpError => e
        render json: { error: e.message }, status: :unauthorized
      rescue AuthenticationService::InvalidOtpError => e
        render json: { error: e.message }, status: :unauthorized
      rescue StandardError => e
        Rails.logger.error("OTP validation failed: #{e.message}")
        Rails.logger.error(e.backtrace.join("\n"))
        render json: { error: "Authentication failed" }, status: :internal_server_error
      end

      # DELETE /api/v1/auth/logout
      # Invalidate current session
      def logout
        token = request.headers["Authorization"]&.gsub(/^Bearer /, "")

        if token.blank?
          return render json: { error: "No session token provided" }, status: :bad_request
        end

        auth_service = AuthenticationService.new
        if auth_service.invalidate_session(token: token, ip_address: request.remote_ip)
          render json: { message: "Logged out successfully" }, status: :ok
        else
          render json: { error: "Invalid session" }, status: :unauthorized
        end
      rescue StandardError => e
        Rails.logger.error("Logout failed: #{e.message}")
        Rails.logger.error(e.backtrace.join("\n"))
        render json: { error: "Logout failed" }, status: :internal_server_error
      end

      # GET /api/v1/auth/session
      # Validate current session and return user info
      def session
        token = request.headers["Authorization"]&.gsub(/^Bearer /, "")

        if token.blank?
          return render json: { error: "No session token provided" }, status: :unauthorized
        end

        auth_service = AuthenticationService.new
        user = auth_service.validate_session(token: token, ip_address: request.remote_ip)

        if user
          render json: {
            user: {
              id: user.id,
              email: user.email,
              roles: user.roles,
              active: user.active
            }
          }, status: :ok
        else
          render json: { error: "Invalid or expired session" }, status: :unauthorized
        end
      rescue StandardError => e
        Rails.logger.error("Session validation failed: #{e.message}")
        Rails.logger.error(e.backtrace.join("\n"))
        render json: { error: "Session validation failed" }, status: :internal_server_error
      end
    end
  end
end
