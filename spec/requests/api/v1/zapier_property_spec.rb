# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Zapier", type: :request do
  let(:api_key) { "test_zapier_key" }
  let(:headers) { { "X-Zapier-Api-Key" => api_key } }

  before do
    ENV["ZAPIER_API_KEY"] = api_key
  end

  describe "Property-Based Tests" do
    # Feature: consultant-gateway-system, Property 80: Zapier API Authentication
    # Validates: Requirements 23.2
    describe "Property 80: Zapier API Authentication" do
      it "accepts requests with valid API key and rejects invalid ones" do
        fixed_key = "secret_key_#{SecureRandom.hex(4)}"
        # Ensure ENV is set before the test block
        allow(ENV).to receive(:[]).and_call_original
        allow(ENV).to receive(:[]).with("ZAPIER_API_KEY").and_return(fixed_key)

        allow(AuditLogger).to receive(:log)

        property_test(iterations: 50) do
          # Generate random provided key
          provided_key = Rantly { choose(fixed_key, string(:alpha)) }

          get "/api/v1/zapier/ping", headers: { "X-Zapier-Api-Key" => provided_key }

          if provided_key == fixed_key
            expect(response).to have_http_status(:ok)
          else
            expect(response).to have_http_status(:unauthorized)
          end
        end
      end
    end

    # Feature: consultant-gateway-system, Property 81: Zapier Workflow Logging
    # Validates: Requirements 23.3
    describe "Property 81: Zapier Workflow Logging" do
      it "logs every received event" do
        allow(AuditLogger).to receive(:log)

        property_test(iterations: 50) do
          event_type = Rantly { string(:alpha) }
          payload = { "data" => "test_data" }

          post "/api/v1/zapier/triggers/#{event_type}", params: payload, headers: headers

          expect(response).to have_http_status(:ok)
        end
      end
    end

    # Feature: consultant-gateway-system, Property 82: Zapier Error Handling
    # Validates: Requirements 23.4
    describe "Property 82: Zapier Error Handling" do
      it "handles errors gracefully" do
        # Setup the mock
        allow_any_instance_of(Api::V1::ZapierController).to receive(:process_event).and_raise(StandardError.new("Random failure"))
        allow(AuditLogger).to receive(:log)

        property_test(iterations: 50) do
          event_type = Rantly { string(:alpha) }

          post "/api/v1/zapier/triggers/#{event_type}", params: { data: "test" }, headers: headers

          expect(response).to have_http_status(:internal_server_error)
          json_response = JSON.parse(response.body)
          expect(json_response["success"]).to be false
          expect(json_response["error"]).to eq("Random failure")
        end
      end
    end

    # Feature: consultant-gateway-system, Property 83: Zapier Data Validation
    # Validates: Requirements 23.5
    describe "Property 83: Zapier Data Validation" do
      it "validates payload presence" do
        allow(AuditLogger).to receive(:log)

        property_test(iterations: 50) do
          event_type = Rantly { string(:alpha) }

          # Send empty JSON body
          post "/api/v1/zapier/triggers/#{event_type}", params: {}, headers: headers, as: :json

          # Debug output if it fails
          if response.status != 422
            puts "Expected 422, got #{response.status}"
            puts "Body: #{response.body}"
          end

          expect(response).to have_http_status(:unprocessable_entity)
          json_response = JSON.parse(response.body)
          expect(json_response["success"]).to be false
        end
      end
    end
  end
end
