# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Consultant Profile and Onboarding", type: :request do
  let(:user) { create(:user) }
  let(:token) { AuthenticationService.new.create_session(user: user, ip_address: "127.0.0.1").token }
  let(:headers) { { "Authorization" => "Bearer #{token}" } }

  before do
    # Ensure consultant exists and force status to pending
    c = create(:consultant, user: user)
    c.update_columns(onboarding_status: "pending")
    # Clear any existing steps
    c.onboarding_steps.destroy_all
    user.reload
  end

  describe "GET /api/v1/consultants/profile" do
    it "returns the consultant profile" do
      get "/api/v1/consultants/profile", headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_response).to have_key("bio")
      expect(json_response).to have_key("onboarding_status")
    end
  end

  describe "PATCH /api/v1/consultants/profile" do
    it "updates the consultant profile" do
      patch "/api/v1/consultants/profile",
            params: { consultant: { bio: "Updated Bio", skills: [ "Ruby", "Rails" ] } },
            headers: headers

      expect(response).to have_http_status(:ok)
      expect(user.consultant.reload.bio).to eq("Updated Bio")
      expect(user.consultant.skills).to include("Ruby")
    end
  end

  describe "POST /api/v1/onboarding/initialize" do
    it "initializes onboarding" do
      post "/api/v1/onboarding/initialize", headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_response["status"]["status"]).to eq("in_progress")
    end
  end

  describe "POST /api/v1/onboarding/steps/:step_name" do
    before { post "/api/v1/onboarding/initialize", headers: headers }

    it "completes a step" do
      post "/api/v1/onboarding/steps/personal_info",
           params: { data: { bio: "My Bio", phone: "1234567890" } },
           headers: headers

      expect(response).to have_http_status(:ok)
      expect(json_response["status"]["steps"].find { |s| s["name"] == "personal_info" }["status"]).to eq("completed")
    end

    it "validates step data" do
      post "/api/v1/onboarding/steps/personal_info",
           params: { data: { bio: "" } },
           headers: headers

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  def json_response
    JSON.parse(response.body)
  end
end
