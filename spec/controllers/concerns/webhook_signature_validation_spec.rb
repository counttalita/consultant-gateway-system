# frozen_string_literal: true

require "rails_helper"

RSpec.describe WebhookSignatureValidation, type: :controller do
  controller(ApplicationController) do
    include WebhookSignatureValidation

    # Configure for testing
    self.signature_header_name = "X-Test-Signature"
    self.webhook_secret_env_var = "TEST_WEBHOOK_SECRET"

    def create
      return unless validate_webhook_signature!

      render json: { success: true }, status: :ok
    end
  end

  let(:secret) { "test_secret_key_#{SecureRandom.hex(8)}" }
  let(:payload) { { test: "data" }.to_json }

  before do
    routes.draw { post "create" => "anonymous#create" }
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with("TEST_WEBHOOK_SECRET", nil).and_return(secret)
  end

  describe "#validate_webhook_signature!" do
    context "with valid signature" do
      it "allows the request to proceed" do
        signature = OpenSSL::HMAC.hexdigest("SHA256", secret, payload)

        request.headers["X-Test-Signature"] = signature
        post :create, body: payload

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)["success"]).to be true
      end
    end

    context "with invalid signature" do
      it "rejects the request with unauthorized status" do
        invalid_signature = OpenSSL::HMAC.hexdigest("SHA256", "wrong_secret", payload)

        request.headers["X-Test-Signature"] = invalid_signature
        post :create, body: payload

        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)["error"]).to eq("Unauthorized")
        expect(JSON.parse(response.body)["message"]).to eq("Invalid webhook signature")
      end
    end

    context "with missing signature" do
      it "rejects the request with unauthorized status" do
        post :create, body: payload

        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)["error"]).to eq("Unauthorized")
        expect(JSON.parse(response.body)["message"]).to eq("Invalid webhook signature")
      end
    end

    context "with missing webhook secret" do
      before do
        allow(ENV).to receive(:fetch).with("TEST_WEBHOOK_SECRET", nil).and_return(nil)
      end

      it "rejects the request with unauthorized status" do
        signature = OpenSSL::HMAC.hexdigest("SHA256", "any_secret", payload)

        request.headers["X-Test-Signature"] = signature
        post :create, body: payload

        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)["message"]).to eq("Invalid webhook signature")
      end
    end

    context "with tampered payload" do
      it "rejects the request when payload is modified after signing" do
        original_payload = { test: "original" }.to_json
        signature = OpenSSL::HMAC.hexdigest("SHA256", secret, original_payload)

        # Send different payload with original signature
        tampered_payload = { test: "tampered" }.to_json

        request.headers["X-Test-Signature"] = signature
        post :create, body: tampered_payload

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "timing-safe comparison" do
    it "uses secure_compare to prevent timing attacks" do
      signature = OpenSSL::HMAC.hexdigest("SHA256", secret, payload)

      expect(ActiveSupport::SecurityUtils).to receive(:secure_compare).and_call_original

      request.headers["X-Test-Signature"] = signature
      post :create, body: payload
    end
  end

  describe "audit logging" do
    it "logs failed signature validation attempts" do
      invalid_signature = "invalid_signature"

      expect(AuditLogger).to receive(:log).with(
        hash_including(
          action: :webhook_signature_validation_failed,
          metadata: hash_including(
            controller: "AnonymousController",
            reason: "Invalid signature"
          )
        )
      )

      request.headers["X-Test-Signature"] = invalid_signature
      post :create, body: payload
    end
  end
end
