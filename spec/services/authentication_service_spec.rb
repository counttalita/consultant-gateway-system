# frozen_string_literal: true

require "rails_helper"

RSpec.describe AuthenticationService do
  include ActiveSupport::Testing::TimeHelpers

  let(:service) { described_class.new }
  let(:email) { "test@example.com" }
  let(:ip_address) { "127.0.0.1" }

  describe "#generate_otp" do
    context "with valid email" do
      it "creates a new user if one doesn't exist" do
        expect {
          service.generate_otp(email: email, ip_address: ip_address)
        }.to change(User, :count).by(1)

        user = User.find_by(email: email)
        expect(user).to be_present
        expect(user.roles).to eq([ "consultant" ])
        expect(user.active).to be true
      end

      it "uses existing user if one exists" do
        user = create(:user, email: email)

        expect {
          service.generate_otp(email: email, ip_address: ip_address)
        }.not_to change(User, :count)
      end

      it "generates a 6-digit OTP code" do
        otp_code = service.generate_otp(email: email, ip_address: ip_address)

        expect(otp_code.code).to match(/^\d{6}$/)
      end

      it "creates an audit log entry" do
        expect {
          service.generate_otp(email: email, ip_address: ip_address)
        }.to change(AuditLog, :count).by(1)

        audit_log = AuditLog.last
        expect(audit_log.action).to eq("otp_generated")
        expect(audit_log.ip_address).to eq(ip_address)
      end

      it "normalizes email to lowercase" do
        otp_code = service.generate_otp(email: "TEST@EXAMPLE.COM", ip_address: ip_address)
        user = otp_code.user

        expect(user.email).to eq("test@example.com")
      end
    end

    context "with rate limiting" do
      it "raises error when rate limit is exceeded" do
        user = create(:user, email: email)

        # Create 3 OTP codes within 15 minutes
        3.times { create(:otp_code, user: user) }

        expect {
          service.generate_otp(email: email, ip_address: ip_address)
        }.to raise_error(AuthenticationService::RateLimitExceededError)
      end

      it "allows OTP generation after rate limit window expires" do
        user = create(:user, email: email)

        # Create 3 OTP codes more than 15 minutes ago
        3.times do
          create(:otp_code, user: user, created_at: 16.minutes.ago)
        end

        expect {
          service.generate_otp(email: email, ip_address: ip_address)
        }.not_to raise_error
      end
    end
  end

  describe "#validate_otp" do
    let(:user) { create(:user, email: email) }
    let(:otp_code) { create(:otp_code, user: user, code: "123456") }

    context "with valid OTP" do
      it "returns user and session" do
        result = service.validate_otp(
          email: email,
          code: otp_code.code,
          ip_address: ip_address
        )

        expect(result).to be_a(Hash)
        expect(result[:user]).to eq(user)
        expect(result[:session]).to be_a(Session)
        expect(result[:session].user).to eq(user)
      end

      it "marks OTP as consumed" do
        service.validate_otp(
          email: email,
          code: otp_code.code,
          ip_address: ip_address
        )

        otp_code.reload
        expect(otp_code.consumed?).to be true
      end

      it "creates an audit log entry" do
        expect {
          service.validate_otp(
            email: email,
            code: otp_code.code,
            ip_address: ip_address
          )
        }.to change(AuditLog, :count).by(1)

        audit_log = AuditLog.last
        expect(audit_log.action).to eq("login")
        expect(audit_log.user).to eq(user)
      end
    end

    context "with invalid OTP" do
      it "returns nil for non-existent user with code" do
        result = service.validate_otp(
          email: "nonexistent@example.com",
          code: "999999",
          ip_address: ip_address
        )
        expect(result).to be_nil
      end

      it "raises error for non-existent code with existing user" do
        user # Force user creation
        expect {
          service.validate_otp(
            email: email,
            code: "999999",
            ip_address: ip_address
          )
        }.to raise_error(AuthenticationService::InvalidOtpError)
      end

      it "raises error for expired code" do
        expired_code = create(:otp_code, user: user, expires_at: 1.minute.ago)

        expect {
          service.validate_otp(
            email: email,
            code: expired_code.code,
            ip_address: ip_address
          )
        }.to raise_error(AuthenticationService::ExpiredOtpError)
      end

      it "raises error for already consumed code" do
        otp_code.consume!

        expect {
          service.validate_otp(
            email: email,
            code: otp_code.code,
            ip_address: ip_address
          )
        }.to raise_error(AuthenticationService::InvalidOtpError)
      end

      it "returns nil for non-existent user" do
        result = service.validate_otp(
          email: "nonexistent@example.com",
          code: "123456",
          ip_address: ip_address
        )

        expect(result).to be_nil
      end
    end
  end

  describe "#validate_session" do
    let(:user) { create(:user, email: email) }
    let(:session) { create(:session, user: user) }

    context "with valid session" do
      it "returns the user" do
        result = service.validate_session(
          token: session.token,
          ip_address: ip_address
        )

        expect(result).to eq(user)
      end

      it "updates last activity timestamp" do
        original_activity = session.last_activity_at

        travel_to 5.minutes.from_now do
          service.validate_session(
            token: session.token,
            ip_address: ip_address
          )

          session.reload
          expect(session.last_activity_at).to be > original_activity
        end
      end

      it "extends session when more than half duration has passed" do
        # Create session that's 13 hours old (more than half of 24 hours)
        old_session = create(:session, user: user, created_at: 13.hours.ago, expires_at: 11.hours.from_now)
        original_expiry = old_session.expires_at

        service.validate_session(
          token: old_session.token,
          ip_address: ip_address
        )

        old_session.reload
        expect(old_session.expires_at).to be > original_expiry
      end
    end

    context "with invalid session" do
      it "returns nil for blank token" do
        result = service.validate_session(token: "", ip_address: ip_address)
        expect(result).to be_nil
      end

      it "returns nil for non-existent token" do
        result = service.validate_session(
          token: "invalid_token",
          ip_address: ip_address
        )
        expect(result).to be_nil
      end

      it "returns nil for expired session" do
        expired_session = create(:session, user: user, expires_at: 1.hour.ago)

        result = service.validate_session(
          token: expired_session.token,
          ip_address: ip_address
        )

        expect(result).to be_nil
      end
    end
  end

  describe "#invalidate_session" do
    let(:user) { create(:user, email: email) }
    let!(:session) { create(:session, user: user) }

    it "destroys the session" do
      expect {
        service.invalidate_session(
          token: session.token,
          ip_address: ip_address
        )
      }.to change(Session, :count).by(-1)
    end

    it "creates an audit log entry" do
      expect {
        service.invalidate_session(
          token: session.token,
          ip_address: ip_address
        )
      }.to change(AuditLog, :count).by(1)

      audit_log = AuditLog.last
      expect(audit_log.action).to eq("logout")
      expect(audit_log.user).to eq(user)
    end

    it "returns true on success" do
      result = service.invalidate_session(
        token: session.token,
        ip_address: ip_address
      )

      expect(result).to be true
    end

    it "returns false for blank token" do
      result = service.invalidate_session(token: "", ip_address: ip_address)
      expect(result).to be false
    end

    it "returns false for non-existent token" do
      result = service.invalidate_session(
        token: "invalid_token",
        ip_address: ip_address
      )

      expect(result).to be false
    end
  end

  describe ".cleanup_expired" do
    it "removes expired sessions" do
      create(:session, expires_at: 1.hour.ago)
      create(:session, expires_at: 1.day.from_now)

      expect {
        described_class.cleanup_expired
      }.to change(Session, :count).by(-1)
    end

    it "removes old expired OTP codes" do
      create(:otp_code, expires_at: 2.days.ago, created_at: 2.days.ago)
      create(:otp_code, expires_at: 1.hour.ago, created_at: 1.hour.ago)
      create(:otp_code, expires_at: 1.hour.from_now)

      expect {
        described_class.cleanup_expired
      }.to change(OtpCode, :count).by(-1)
    end
  end
end
