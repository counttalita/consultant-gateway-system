# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Webhook Signature Validation", type: :request do
  # Property 65: Webhook Signature Validation (Requirement 18.5)
  describe "Property 65: Webhook Signature Validation" do
    let(:secret) { "test_webhook_secret_#{SecureRandom.hex(16)}" }

    def compute_signature(payload, secret)
      OpenSSL::HMAC.hexdigest('SHA256', secret, payload)
    end

    it "validates webhook signatures using HMAC-SHA256" do
      # Mock ProjectService to avoid service-level errors
      project_service = instance_double(ProjectService)
      allow(ProjectService).to receive(:new).and_return(project_service)
      allow(project_service).to receive(:process_won_deal_webhook).and_return(double(id: 1))

      property_test(iterations: 100) do
        # Generate random webhook payload
        payload = {
          id: Rantly { range(1000, 9999) },
          event: Rantly { choose('created', 'updated', 'deleted') },
          data: {
            name: Rantly { string },
            value: Rantly { range(100, 1000) }
          }
        }.to_json

        # Compute valid signature
        valid_signature = compute_signature(payload, secret)

        # Test with valid signature
        allow(ENV).to receive(:fetch).with('DEALS_WEBHOOK_SECRET', nil).and_return(secret)

        # Test with valid signature
        allow(ENV).to receive(:fetch).with('DEALS_WEBHOOK_SECRET', nil).and_return(secret)

        # Send raw payload directly to ensure exact match for signature verification
        post '/webhooks/deals',
             params: payload,
             headers: {
               'Content-Type' => 'application/json',
               'X-Deal-Signature' => valid_signature
             }

        # Should accept valid signature (may fail for other reasons, but not signature)
        expect(response.status).not_to eq(401)
      end
    end

    it "rejects webhooks with invalid signatures" do
      property_test(iterations: 100) do
        # Generate random webhook payload
        payload = {
          id: Rantly { range(1000, 9999) },
          event: Rantly { choose('created', 'updated', 'deleted') },
          data: {
            name: Rantly { string },
            value: Rantly { range(100, 1000) }
          }
        }.to_json

        # Generate invalid signature (using wrong secret)
        wrong_secret = "wrong_secret_#{SecureRandom.hex(16)}"
        invalid_signature = compute_signature(payload, wrong_secret)

        # Configure correct secret
        allow(ENV).to receive(:fetch).with('DEALS_WEBHOOK_SECRET', nil).and_return(secret)

        post '/webhooks/deals',
             params: payload,
             headers: {
               'Content-Type' => 'application/json',
               'X-Deal-Signature' => invalid_signature
             }

        # Should reject invalid signature with 401
        expect(response.status).to eq(401)
        expect(JSON.parse(response.body)['error']).to eq('Unauthorized')
      end
    end

    it "rejects webhooks without signatures" do
      property_test(iterations: 50) do
        # Generate random webhook payload
        payload = {
          id: Rantly { range(1000, 9999) },
          event: Rantly { choose('created', 'updated', 'deleted') }
        }.to_json

        allow(ENV).to receive(:fetch).with('DEALS_WEBHOOK_SECRET', nil).and_return(secret)

        post '/webhooks/deals',
             params: payload,
             headers: { 'Content-Type' => 'application/json' }

        # Should reject missing signature with 401
        expect(response.status).to eq(401)
        expect(JSON.parse(response.body)['error']).to eq('Unauthorized')
      end
    end

    it "detects payload tampering" do
      property_test(iterations: 50) do
        # Generate original payload
        original_payload = {
          id: Rantly { range(1000, 9999) },
          amount: Rantly { range(100, 1000) }
        }.to_json

        # Compute signature for original payload
        valid_signature = compute_signature(original_payload, secret)

        # Tamper with payload
        tampered_payload = {
          id: JSON.parse(original_payload)['id'],
          amount: JSON.parse(original_payload)['amount'] + 1000  # Increase amount
        }.to_json

        allow(ENV).to receive(:fetch).with('DEALS_WEBHOOK_SECRET', nil).and_return(secret)

        # Send tampered payload with original signature
        post '/webhooks/deals',
             params: tampered_payload,
             headers: {
               'Content-Type' => 'application/json',
               'X-Deal-Signature' => valid_signature
             }

        # Should reject tampered payload with 401
        expect(response.status).to eq(401)
        expect(JSON.parse(response.body)['error']).to eq('Unauthorized')
      end
    end
  end

  describe "Tender webhook signature validation" do
    let(:secret) { "tender_secret_#{SecureRandom.hex(16)}" }

    def compute_signature(payload, secret)
      OpenSSL::HMAC.hexdigest('SHA256', secret, payload)
    end

    it "validates tender webhook signatures" do
      # Mock TenderService to avoid service-level errors
      tender_service = instance_double(TenderService)
      allow(TenderService).to receive(:new).and_return(tender_service)
      allow(tender_service).to receive(:process_webhook).and_return({ success: true, tender: double(id: 1), operation: 'created' })

      property_test(iterations: 50) do
        # Generate random tender payload
        payload = {
          reference_number: "REF-#{Rantly { range(1000, 9999) }}",
          title: Rantly { string },
          source: Rantly { choose('portal_a', 'portal_b', 'portal_c') },
          tender_value: Rantly { range(10000, 100000) }
        }.to_json

        # Compute valid signature
        valid_signature = compute_signature(payload, secret)

        allow(ENV).to receive(:fetch).with('TENDERS_WEBHOOK_SECRET', nil).and_return(secret)

        post '/webhooks/tenders',
             params: payload,
             headers: {
               'Content-Type' => 'application/json',
               'X-Webhook-Signature' => valid_signature
             }

        # Should accept valid signature
        expect(response.status).not_to eq(401)
      end
    end

    it "rejects tender webhooks with invalid signatures" do
      property_test(iterations: 50) do
        # Generate random tender payload
        payload = {
          reference_number: "REF-#{Rantly { range(1000, 9999) }}",
          title: Rantly { string }
        }.to_json

        # Invalid signature
        invalid_signature = SecureRandom.hex(32)

        allow(ENV).to receive(:fetch).with('TENDERS_WEBHOOK_SECRET', nil).and_return(secret)

        post '/webhooks/tenders',
             params: payload,
             headers: {
               'Content-Type' => 'application/json',
               'X-Webhook-Signature' => invalid_signature
             }

        # Should reject invalid signature with 401
        expect(response.status).to eq(401)
        expect(JSON.parse(response.body)['error']).to eq('Unauthorized')
      end
    end
  end
end
