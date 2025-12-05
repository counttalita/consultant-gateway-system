# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Webhook Signature Validation", type: :request do
  # Using TendersController as the test subject since it includes the concern
  let(:secret) { "test_secret_#{SecureRandom.hex(8)}" }
  let(:header_name) { "X-Webhook-Signature" }
  let(:endpoint) { "/webhooks/tenders" }

  before do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with("TENDERS_WEBHOOK_SECRET", nil).and_return(secret)

    # Mock TenderService to avoid actual processing logic failures
    allow_any_instance_of(TenderService).to receive(:process_webhook).and_return({ success: true, tender: double(id: 1), operation: "created" })
  end

  describe "Property 65: Webhook Signature Validation" do
    it "accepts requests with valid signatures" do
      property_test(iterations: 50) do
        payload = {
          title: Rantly { string(:alpha) },
          reference_number: Rantly { string(:alnum) },
          source: "Test Portal"
        }.to_json

        signature = OpenSSL::HMAC.hexdigest("SHA256", secret, payload)

        post endpoint, params: payload, headers: {
          header_name => signature,
          "Content-Type" => "application/json"
        }

        expect(response).to have_http_status(:ok)
      end
    end

    it "rejects requests with invalid signatures" do
      property_test(iterations: 50) do
        payload = {
          title: Rantly { string(:alpha) }
        }.to_json

        # Generate signature with WRONG secret
        wrong_secret = "wrong_secret_#{SecureRandom.hex(8)}"
        invalid_signature = OpenSSL::HMAC.hexdigest("SHA256", wrong_secret, payload)

        post endpoint, params: payload, headers: {
          header_name => invalid_signature,
          "Content-Type" => "application/json"
        }

        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)["message"]).to eq("Invalid webhook signature")
      end
    end

    it "rejects requests with missing signatures" do
      property_test(iterations: 50) do
        payload = {
          title: Rantly { string(:alpha) }
        }.to_json

        post endpoint, params: payload, headers: {
          "Content-Type" => "application/json"
        }

        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)["error"]).to eq("Unauthorized")
      end
    end
  end
end
