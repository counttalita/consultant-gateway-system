# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Authorization Enforcement", type: :request do
  # Property 60: Authorization Enforcement (Requirement 16.4)
  describe "Property 60: Authorization Enforcement" do
    let(:consultant_user) { create(:user, email: "consultant@example.com", roles: [ "consultant" ]) }
    let(:admin_user) { create(:user, email: "admin@example.com", roles: [ "admin" ]) }
    let(:finance_user) { create(:user, email: "finance@example.com", roles: [ "finance" ]) }
    let(:regular_user) { create(:user, email: "user@example.com", roles: [ "user" ]) }

    before do
      # Create consultant profile for consultant user
      consultant_user.ensure_consultant_record
    end

    it "denies access when user lacks required permissions" do
      property_test(iterations: 50) do
        # Generate different user types and protected endpoints
        user_type = Rantly { choose(:consultant, :finance, :regular_user) }

        user = case user_type
        when :consultant
          consultant_user
        when :finance
          finance_user
        when :regular_user
          regular_user
        end

        # Create a session for the user
        session = user.sessions.create!(
          token: SecureRandom.hex(32),
          expires_at: 24.hours.from_now
        )

        # Test access to admin-only endpoint (user management)
        get "/api/v1/users", headers: { "Authorization" => "Bearer #{session.token}" }

        if user.has_role?("admin")
          # Admin should have access
          expect(response).to have_http_status(:success)
        else
          # Non-admin should be denied
          expect(response).to have_http_status(:forbidden)
          json = JSON.parse(response.body)
          expect(json["success"]).to be false
          expect(json["error"]).to be_present
        end
      end
    end

    it "allows access when user has required permissions" do
      # Admin should be able to access user management
      session = admin_user.sessions.create!(
        token: SecureRandom.hex(32),
        expires_at: 24.hours.from_now
      )

      get "/api/v1/users", headers: { "Authorization" => "Bearer #{session.token}" }
      expect(response).to have_http_status(:success)
    end

    it "consultants can only access their own profile" do
      other_consultant = create(:user, email: "other@example.com", roles: [ "consultant" ])
      other_consultant.ensure_consultant_record

      session = consultant_user.sessions.create!(
        token: SecureRandom.hex(32),
        expires_at: 24.hours.from_now
      )

      # Should be able to access own profile
      get "/api/v1/consultants/profile",
          headers: { "Authorization" => "Bearer #{session.token}" }
      expect(response).to have_http_status(:success)

      # Consultants can only access their own profile (the route always returns current user's profile)
      # So we verify that the returned profile belongs to the authenticated user
      json = JSON.parse(response.body)
      expect(json["id"]).to eq(consultant_user.consultant.id)
      expect(json["id"]).not_to eq(other_consultant.consultant.id)
    end

    it "enforces authorization on all protected endpoints" do
      # Test without authentication
      protected_endpoints = [
        { method: :get, path: "/api/v1/users" },
        { method: :get, path: "/api/v1/users/me" },
        { method: :get, path: "/api/v1/onboarding" }
      ]

      protected_endpoints.each do |endpoint|
        send(endpoint[:method], endpoint[:path])
        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json["error"]).to be_present
      end
    end
  end

  describe "Authorizable concern" do
    let(:admin) { create(:user, email: "admin_auth@example.com", roles: [ "admin" ]) }
    let(:consultant) { create(:user, email: "consultant_auth@example.com", roles: [ "consultant" ]) }
    let(:admin_session) { create(:session, user: admin) }
    let(:consultant_session) { create(:session, user: consultant) }

    it "authorize! allows access with correct permission" do
      # Admin has manage_users permission
      get "/api/v1/users", headers: { "Authorization" => "Bearer #{admin_session.token}" }
      expect(response).to have_http_status(:success)
    end

    it "authorize! denies access without permission" do
      # Consultant doesn't have manage_users permission
      get "/api/v1/users", headers: { "Authorization" => "Bearer #{consultant_session.token}" }
      expect(response).to have_http_status(:forbidden)
      json = JSON.parse(response.body)
      expect(json["success"]).to be false
    end

    it "verifies permission checking works correctly" do
      # Admin should have manage_users permission
      expect(admin.permissions).to include("manage_users")

      # Consultant should not have manage_users permission
      expect(consultant.permissions).not_to include("manage_users")
    end

    it "verifies role checking works correctly" do
      # Admin should have admin role
      expect(admin.has_role?("admin")).to be true

      # Consultant should not have admin role
      expect(consultant.has_role?("admin")).to be false
    end
  end
end
