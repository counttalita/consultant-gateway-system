# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Users", type: :request do
  let(:admin_user) { create(:user, email: "admin@example.com", roles: [ "admin" ]) }
  let(:finance_user) { create(:user, email: "finance@example.com", roles: [ "finance" ]) }
  let(:consultant_user) { create(:user, email: "consultant@example.com", roles: [ "consultant" ]) }
  let(:regular_user) { create(:user, email: "user@example.com", roles: [ "user" ]) }

  let(:admin_session) { create(:session, user: admin_user) }
  let(:finance_session) { create(:session, user: finance_user) }
  let(:consultant_session) { create(:session, user: consultant_user) }

  describe "GET /api/v1/users" do
    it "allows admin to list users" do
      get "/api/v1/users", headers: { "Authorization" => "Bearer #{admin_session.token}" }

      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json["success"]).to be true
      expect(json["users"]).to be_an(Array)
    end

    it "denies access to non-admin users" do
      get "/api/v1/users", headers: { "Authorization" => "Bearer #{finance_session.token}" }

      expect(response).to have_http_status(:forbidden)
      json = JSON.parse(response.body)
      expect(json["success"]).to be false
    end

    it "requires authentication" do
      get "/api/v1/users"

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/users/me" do
    it "returns current user information" do
      get "/api/v1/users/me", headers: { "Authorization" => "Bearer #{admin_session.token}" }

      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json["success"]).to be true
      expect(json["user"]["id"]).to eq(admin_user.id)
      expect(json["user"]["email"]).to eq(admin_user.email)
      expect(json["user"]["roles"]).to eq(admin_user.roles)
      expect(json["user"]["permissions"]).to eq(admin_user.permissions)
    end

    it "requires authentication" do
      get "/api/v1/users/me"

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/users/:id" do
    it "allows admin to view user details" do
      get "/api/v1/users/#{finance_user.id}", headers: { "Authorization" => "Bearer #{admin_session.token}" }

      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json["success"]).to be true
      expect(json["user"]["id"]).to eq(finance_user.id)
      expect(json["user"]["email"]).to eq(finance_user.email)
    end

    it "denies access to non-admin users" do
      get "/api/v1/users/#{admin_user.id}", headers: { "Authorization" => "Bearer #{finance_session.token}" }

      expect(response).to have_http_status(:forbidden)
    end

    it "returns 404 for non-existent user" do
      get "/api/v1/users/99999", headers: { "Authorization" => "Bearer #{admin_session.token}" }

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "PATCH /api/v1/users/:id/roles" do
    it "allows admin to update internal staff roles" do
      patch "/api/v1/users/#{regular_user.id}/roles",
            params: { roles: [ "user", "finance" ] },
            headers: { "Authorization" => "Bearer #{admin_session.token}" }

      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json["success"]).to be true
      expect(json["user"]["roles"]).to match_array([ "user", "finance" ])

      regular_user.reload
      expect(regular_user.roles).to match_array([ "user", "finance" ])
    end

    it "prevents modifying consultant roles" do
      patch "/api/v1/users/#{consultant_user.id}/roles",
            params: { roles: [ "consultant", "admin" ] },
            headers: { "Authorization" => "Bearer #{admin_session.token}" }

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["success"]).to be false
      expect(json["error"]).to include("Cannot modify consultant roles")
    end

    it "prevents admin from modifying their own roles" do
      patch "/api/v1/users/#{admin_user.id}/roles",
            params: { roles: [ "user" ] },
            headers: { "Authorization" => "Bearer #{admin_session.token}" }

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["success"]).to be false
      expect(json["error"]).to include("Cannot modify your own roles")
    end

    it "validates role values" do
      patch "/api/v1/users/#{regular_user.id}/roles",
            params: { roles: [ "invalid_role" ] },
            headers: { "Authorization" => "Bearer #{admin_session.token}" }

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["success"]).to be false
    end

    it "denies access to non-admin users" do
      patch "/api/v1/users/#{regular_user.id}/roles",
            params: { roles: [ "admin" ] },
            headers: { "Authorization" => "Bearer #{finance_session.token}" }

      expect(response).to have_http_status(:forbidden)
    end

    it "requires roles parameter" do
      patch "/api/v1/users/#{regular_user.id}/roles",
            params: {},
            headers: { "Authorization" => "Bearer #{admin_session.token}" }

      expect(response).to have_http_status(:bad_request)
    end
  end

  describe "role management integration" do
    it "creates audit log when roles are updated" do
      expect {
        patch "/api/v1/users/#{regular_user.id}/roles",
              params: { roles: [ "user", "finance" ] },
              headers: { "Authorization" => "Bearer #{admin_session.token}" }
      }.to change { AuditLog.count }.by(1)

      audit_log = AuditLog.last
      expect(audit_log.action).to eq("user_roles_updated")
      expect(audit_log.user).to eq(admin_user)
      expect(audit_log.resource).to eq(regular_user)
    end

    it "enforces permission union for multi-role users" do
      # Update user to have multiple roles
      patch "/api/v1/users/#{regular_user.id}/roles",
            params: { roles: [ "user", "finance" ] },
            headers: { "Authorization" => "Bearer #{admin_session.token}" }

      regular_user.reload

      # Verify permissions include union of both roles
      expect(regular_user.permissions).to include("view_consultants", "view_projects") # from user role
      expect(regular_user.permissions).to include("view_financial_data", "manage_invoices") # from finance role
    end
  end
end
