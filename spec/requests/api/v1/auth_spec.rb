# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Auth", type: :request do
  # Mock ResendAdapter to avoid real HTTP requests
  before do
    allow(Adapters::ResendAdapter).to receive(:send_email).and_return("msg_#{SecureRandom.hex(16)}")
  end

  describe "POST /api/v1/auth/request-otp" do
    let(:email) { "test@example.com" }

    context "with valid email" do
      it "returns success response" do
        post "/api/v1/auth/request-otp", params: { email: email }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["message"]).to include("OTP code sent")
        expect(json["expires_in"]).to be_present
      end

      it "creates OTP code" do
        expect {
          post "/api/v1/auth/request-otp", params: { email: email }
        }.to change(OtpCode, :count).by(1)
      end
    end

    context "with missing email" do
      it "returns bad request" do
        post "/api/v1/auth/request-otp", params: {}

        expect(response).to have_http_status(:bad_request)
        json = JSON.parse(response.body)
        expect(json["error"]).to eq("Email is required")
      end
    end

    context "with rate limiting" do
      it "returns too many requests error" do
        user = create(:user, email: email)
        3.times { create(:otp_code, user: user) }

        post "/api/v1/auth/request-otp", params: { email: email }

        expect(response).to have_http_status(:too_many_requests)
        json = JSON.parse(response.body)
        expect(json["error"]).to include("Too many OTP requests")
      end
    end
  end

  describe "POST /api/v1/auth/validate-otp" do
    let(:user) { create(:user, email: "test@example.com") }
    let(:otp_code) { create(:otp_code, user: user, code: "123456") }

    context "with valid credentials" do
      it "returns success with session token" do
        post "/api/v1/auth/validate-otp", params: {
          email: user.email,
          code: otp_code.code
        }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["message"]).to eq("Authentication successful")
        expect(json["token"]).to be_present
        expect(json["expires_at"]).to be_present
        expect(json["user"]["email"]).to eq(user.email)
      end

      it "creates a session" do
        expect {
          post "/api/v1/auth/validate-otp", params: {
            email: user.email,
            code: otp_code.code
          }
        }.to change(Session, :count).by(1)
      end
    end

    context "with invalid credentials" do
      it "returns unauthorized for wrong code" do
        post "/api/v1/auth/validate-otp", params: {
          email: user.email,
          code: "999999"
        }

        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json["error"]).to be_present
      end

      it "returns unauthorized for expired code" do
        expired_code = create(:otp_code, user: user, expires_at: 1.minute.ago)

        post "/api/v1/auth/validate-otp", params: {
          email: user.email,
          code: expired_code.code
        }

        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json["error"]).to include("expired")
      end
    end

    context "with missing parameters" do
      it "returns bad request when email is missing" do
        post "/api/v1/auth/validate-otp", params: { code: "123456" }

        expect(response).to have_http_status(:bad_request)
      end

      it "returns bad request when code is missing" do
        post "/api/v1/auth/validate-otp", params: { email: user.email }

        expect(response).to have_http_status(:bad_request)
      end
    end
  end

  describe "DELETE /api/v1/auth/logout" do
    let(:user) { create(:user) }
    let!(:session) { create(:session, user: user) }

    context "with valid session token" do
      it "returns success" do
        delete "/api/v1/auth/logout", headers: {
          "Authorization" => "Bearer #{session.token}"
        }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["message"]).to eq("Logged out successfully")
      end

      it "destroys the session" do
        expect {
          delete "/api/v1/auth/logout", headers: {
            "Authorization" => "Bearer #{session.token}"
          }
        }.to change(Session, :count).by(-1)
      end
    end

    context "without session token" do
      it "returns bad request" do
        delete "/api/v1/auth/logout"

        expect(response).to have_http_status(:bad_request)
        json = JSON.parse(response.body)
        expect(json["error"]).to include("No session token")
      end
    end

    context "with invalid session token" do
      it "returns unauthorized" do
        delete "/api/v1/auth/logout", headers: {
          "Authorization" => "Bearer invalid_token"
        }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/auth/session" do
    let(:user) { create(:user, email: "test@example.com") }
    let(:session) { create(:session, user: user) }

    context "with valid session token" do
      it "returns user information" do
        get "/api/v1/auth/session", headers: {
          "Authorization" => "Bearer #{session.token}"
        }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["user"]["id"]).to eq(user.id)
        expect(json["user"]["email"]).to eq(user.email)
        expect(json["user"]["roles"]).to eq(user.roles)
      end
    end

    context "without session token" do
      it "returns unauthorized" do
        get "/api/v1/auth/session"

        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json["error"]).to include("No session token")
      end
    end

    context "with expired session token" do
      it "returns unauthorized" do
        expired_session = create(:session, user: user, expires_at: 1.hour.ago)

        get "/api/v1/auth/session", headers: {
          "Authorization" => "Bearer #{expired_session.token}"
        }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
