# frozen_string_literal: true

# Concern for validating webhook signatures using HMAC-SHA256
module WebhookSignatureValidation
  extend ActiveSupport::Concern

  class SignatureValidationError < StandardError; end

  included do
    # Override this in the controller to specify the signature header name
    class_attribute :signature_header_name, default: "X-Webhook-Signature"
    class_attribute :webhook_secret_env_var, default: "WEBHOOK_SECRET"
  end

  # Validate webhook signature before processing
  # Raises SignatureValidationError if signature is invalid
  def validate_webhook_signature!
    signature = extract_signature
    payload = extract_payload
    secret = fetch_webhook_secret

    unless signature.present?
      Rails.logger.warn("Webhook received without signature")
      return handle_invalid_signature("Missing signature")
    end

    unless secret.present?
      Rails.logger.error("Webhook secret not configured for #{self.class.name}")
      return handle_invalid_signature("Webhook secret not configured")
    end

    unless verify_signature(payload, signature, secret)
      Rails.logger.warn("Invalid webhook signature received")
      Rails.logger.debug("Expected signature for payload: #{compute_signature(payload, secret)}")
      Rails.logger.debug("Received signature: #{signature}")
      return handle_invalid_signature("Invalid signature")
    end

    Rails.logger.info("Webhook signature validated successfully")
  end

  private

  # Extract signature from request headers
  def extract_signature
    request.headers[self.class.signature_header_name]
  end

  # Extract raw payload from request body
  def extract_payload
    # Read the raw body for signature verification
    request.body.rewind
    request.body.read
  ensure
    # Rewind so the body can be read again by Rails
    request.body.rewind
  end

  # Fetch webhook secret from environment
  def fetch_webhook_secret
    ENV.fetch(self.class.webhook_secret_env_var, nil)
  end

  # Verify HMAC-SHA256 signature
  # Uses timing-safe comparison to prevent timing attacks
  # @param payload [String] Raw request body
  # @param signature [String] Signature from request header
  # @param secret [String] Webhook secret
  # @return [Boolean] True if signature is valid
  def verify_signature(payload, signature, secret)
    expected_signature = compute_signature(payload, secret)

    # Timing-safe comparison to prevent timing attacks
    ActiveSupport::SecurityUtils.secure_compare(signature, expected_signature)
  rescue StandardError => e
    Rails.logger.error("Signature verification error: #{e.message}")
    false
  end

  # Compute HMAC-SHA256 signature
  # @param payload [String] Raw request body
  # @param secret [String] Webhook secret
  # @return [String] Hex-encoded HMAC-SHA256 signature
  def compute_signature(payload, secret)
    OpenSSL::HMAC.hexdigest("SHA256", secret, payload)
  end

  # Handle invalid signature by rendering error response
  def handle_invalid_signature(reason)
    AuditLogger.log(
      action: :webhook_signature_validation_failed,
      metadata: {
        controller: self.class.name,
        reason: reason,
        ip_address: request.remote_ip
      }
    )

    render json: {
      success: false,
      error: "Unauthorized",
      message: "Invalid webhook signature"
    }, status: :unauthorized

    # Return false to halt the filter chain
    false
  end
end
