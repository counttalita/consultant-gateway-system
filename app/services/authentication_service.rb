# frozen_string_literal: true

# Service for handling OTP-based authentication
# Manages OTP generation, validation, and session creation
class AuthenticationService
  class RateLimitExceededError < StandardError; end
  class InvalidOtpError < StandardError; end
  class ExpiredOtpError < StandardError; end
  class InvalidSessionError < StandardError; end

  # Generate OTP for a given email address
  # Creates or finds user, generates 6-digit code, sends via email
  # @param email [String] User's email address
  # @param ip_address [String] Optional IP address for audit logging
  # @return [OtpCode] The generated OTP code object
  # @raise [RateLimitExceededError] if rate limit is exceeded
  def generate_otp(email:, ip_address: nil)
    email = email.to_s.downcase.strip

    # Find or create user
    user = User.find_or_initialize_by(email: email)
    if user.new_record?
      user.roles = [ "consultant" ]
      user.active = true
      user.save!
    end

    # Check rate limiting (max 3 OTPs per 15 minutes)
    if OtpCode.rate_limit_exceeded?(user)
      raise RateLimitExceededError, "Too many OTP requests. Please try again in 15 minutes."
    end

    # Generate OTP code
    otp_code = OtpCode.generate_for_user(user, ip_address: ip_address)

    # Send OTP via email (using Resend adapter when implemented)
    send_otp_email(user, otp_code)

    # Log the OTP generation
    AuditLog.create!(
      user: user,
      action: "otp_generated",
      resource_type: "OtpCode",
      resource_id: otp_code.id,
      ip_address: ip_address,
      metadata: { email: email }
    )

    otp_code
  end

  # Validate OTP code and create session if valid
  # @param email [String] User's email address
  # @param code [String] 6-digit OTP code
  # @param ip_address [String] Optional IP address for audit logging
  # @return [Hash] Contains :user and :session if successful
  # @raise [InvalidOtpError] if OTP is invalid or consumed
  # @raise [ExpiredOtpError] if OTP has expired
  def validate_otp(email:, code:, ip_address: nil)
    email = email.to_s.downcase.strip
    code = code.to_s.strip

    # Find user
    user = User.find_by(email: email)
    return nil unless user

    # Find valid OTP code
    otp_code = user.otp_codes.still_valid.find_by(code: code)

    if otp_code.nil?
      # Check if code exists but is expired or consumed
      existing_code = user.otp_codes.find_by(code: code)
      if existing_code
        if existing_code.expired?
          raise ExpiredOtpError, "OTP code has expired. Please request a new code."
        elsif existing_code.consumed?
          raise InvalidOtpError, "OTP code has already been used."
        end
      end
      raise InvalidOtpError, "Invalid OTP code."
    end

    # Mark OTP as consumed
    otp_code.consume!

    # Create session
    session = Session.create_for_user(user, ip_address: ip_address)

    # Log successful authentication
    AuditLog.create!(
      user: user,
      action: "login",
      resource_type: "Session",
      resource_id: session.id,
      ip_address: ip_address,
      metadata: { email: email, otp_code_id: otp_code.id }
    )

    { user: user, session: session }
  end

  # Validate session token and return user
  # @param token [String] Session token
  # @param ip_address [String] Optional IP address for activity tracking
  # @return [User, nil] User if session is valid, nil otherwise
  def validate_session(token:, ip_address: nil)
    return nil if token.blank?

    session = Session.active.find_by(token: token)
    return nil unless session

    # Touch activity timestamp
    session.touch_activity!

    # Extend session if needed (more than half duration has passed)
    session.extend_session! if session.should_extend?

    session.user
  end

  # Invalidate session (logout)
  # @param token [String] Session token
  # @param ip_address [String] Optional IP address for audit logging
  # @return [Boolean] true if session was invalidated
  def invalidate_session(token:, ip_address: nil)
    return false if token.blank?

    session = Session.find_by(token: token)
    return false unless session

    user = session.user

    # Log logout
    AuditLog.create!(
      user: user,
      action: "logout",
      resource_type: "Session",
      resource_id: session.id,
      ip_address: ip_address,
      metadata: { token: token[0..7] + "..." } # Only log first 8 chars for security
    )

    session.destroy
    true
  end

  # Cleanup expired sessions and OTP codes
  # Should be run periodically (e.g., daily cron job)
  def self.cleanup_expired
    Session.cleanup_expired
    OtpCode.expired.where("created_at < ?", 1.day.ago).delete_all
  end

  private

  # Send OTP code via email using Resend adapter
  def send_otp_email(user, otp_code)
    begin
      message_id = Adapters::ResendAdapter.send_email(
        to: user.email,
        template: "otp_code",
        variables: {
          code: otp_code.code,
          expires_in_minutes: (otp_code.time_remaining / 60).ceil
        }
      )

      # Store the Resend message ID for tracking
      otp_code.store_message_id(message_id)

      Rails.logger.info("OTP email sent successfully to #{user.email} with message ID: #{message_id}")
    rescue Adapters::ResendAdapter::EmailDeliveryError => e
      # Log the error but don't fail OTP generation
      # The OTP is still valid even if email fails
      Rails.logger.error("Failed to send OTP email to #{user.email}: #{e.message}")

      # Create audit log for email failure
      AuditLog.create!(
        user: user,
        action: "otp_email_failed",
        resource_type: "OtpCode",
        resource_id: otp_code.id,
        metadata: { error: e.message, email: user.email }
      )

      # Re-raise to allow caller to handle
      raise
    end
  end
end
