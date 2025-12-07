# frozen_string_literal: true

require "rails_helper"

RSpec.describe AuditLogger, type: :service do
  include ActiveSupport::Testing::TimeHelpers

  let(:user) { create(:user) }
  let(:consultant) { create(:consultant, user: user) }
  let(:ip_address) { "192.168.1.1" }

  describe ".log_authentication" do
    it "creates an audit log for login action" do
      session = create(:session, user: user)

      audit_log = described_class.log_authentication(
        action: "login",
        user: user,
        resource: session,
        ip_address: ip_address,
        metadata: { email: user.email }
      )

      expect(audit_log).to be_persisted
      expect(audit_log.action).to eq("login")
      expect(audit_log.user).to eq(user)
      expect(audit_log.resource_type).to eq("Session")
      expect(audit_log.resource_id).to eq(session.id)
      expect(audit_log.ip_address).to eq(ip_address)
      expect(audit_log.metadata["email"]).to eq(user.email)
    end

    it "creates an audit log for logout action" do
      session = create(:session, user: user)

      audit_log = described_class.log_authentication(
        action: "logout",
        user: user,
        resource: session,
        ip_address: ip_address
      )

      expect(audit_log).to be_persisted
      expect(audit_log.action).to eq("logout")
      expect(audit_log.user).to eq(user)
    end

    it "creates an audit log for OTP generation" do
      otp_code = create(:otp_code, user: user)

      audit_log = described_class.log_authentication(
        action: "otp_generated",
        user: user,
        resource: otp_code,
        ip_address: ip_address
      )

      expect(audit_log).to be_persisted
      expect(audit_log.action).to eq("otp_generated")
      expect(audit_log.resource_type).to eq("OtpCode")
    end
  end

  describe ".log_profile_change" do
    it "creates an audit log with formatted changes" do
      changes = {
        "bio" => { "old" => "Old bio", "new" => "New bio" },
        "skills" => { "old" => [ "Ruby" ], "new" => [ "Ruby", "Rails" ] }
      }

      audit_log = described_class.log_profile_change(
        user: user,
        consultant: consultant,
        changes: changes,
        ip_address: ip_address
      )

      expect(audit_log).to be_persisted
      expect(audit_log.action).to eq("profile_updated")
      expect(audit_log.user).to eq(user)
      expect(audit_log.resource_type).to eq("Consultant")
      expect(audit_log.resource_id).to eq(consultant.id)
      expect(audit_log.change_data["bio"]).to eq({ "old" => "Old bio", "new" => "New bio" })
      expect(audit_log.change_data["skills"]).to eq({ "old" => [ "Ruby" ], "new" => [ "Ruby", "Rails" ] })
    end

    it "converts ActiveModel::Dirty format changes" do
      changes = {
        "bio" => [ "Old bio", "New bio" ]
      }

      audit_log = described_class.log_profile_change(
        user: user,
        consultant: consultant,
        changes: changes,
        ip_address: ip_address
      )

      expect(audit_log.change_data["bio"]).to eq({ "old" => "Old bio", "new" => "New bio" })
    end

    it "redacts sensitive data in changes" do
      changes = {
        "bio" => { "old" => "Old bio", "new" => "New bio" },
        "banking_details" => {
          "old" => { "account_number" => "1234567890" },
          "new" => { "account_number" => "0987654321" }
        }
      }

      audit_log = described_class.log_profile_change(
        user: user,
        consultant: consultant,
        changes: changes,
        ip_address: ip_address
      )

      expect(audit_log.change_data["banking_details"]).to eq("[REDACTED]")
      expect(audit_log.change_data["bio"]).to eq({ "old" => "Old bio", "new" => "New bio" })
    end
  end

  describe ".log_financial_operation" do
    it "creates an audit log for invoice creation" do
      audit_log = described_class.log_financial_operation(
        action: "invoice_created",
        user: user,
        external_system: "xero",
        external_id: "INV-12345",
        ip_address: ip_address,
        metadata: { amount: 1000.00, client: "Acme Corp" }
      )

      expect(audit_log).to be_persisted
      expect(audit_log.action).to eq("invoice_created")
      expect(audit_log.user).to eq(user)
      expect(audit_log.metadata["external_system"]).to eq("xero")
      expect(audit_log.metadata["external_id"]).to eq("INV-12345")
      expect(audit_log.metadata["amount"]).to eq(1000.00)
    end

    it "creates an audit log for bill creation" do
      audit_log = described_class.log_financial_operation(
        action: "bill_created",
        user: user,
        external_system: "xero",
        external_id: "BILL-67890",
        ip_address: ip_address
      )

      expect(audit_log).to be_persisted
      expect(audit_log.action).to eq("bill_created")
      expect(audit_log.metadata["external_system"]).to eq("xero")
    end

    it "allows nil user for system actions" do
      audit_log = described_class.log_financial_operation(
        action: "payment_processed",
        user: nil,
        external_system: "xero",
        external_id: "PAY-11111",
        ip_address: nil
      )

      expect(audit_log).to be_persisted
      expect(audit_log.user).to be_nil
      expect(audit_log.user_email).to eq("System")
    end
  end

  describe ".log_admin_action" do
    let(:admin_user) { create(:user, roles: [ "admin" ]) }

    it "creates an audit log with admin context" do
      audit_log = described_class.log_admin_action(
        action: "user_role_changed",
        admin_user: admin_user,
        resource: user,
        changes: { "roles" => { "old" => [ "consultant" ], "new" => [ "consultant", "user" ] } },
        justification: "Promoted to internal staff",
        ip_address: ip_address
      )

      expect(audit_log).to be_persisted
      expect(audit_log.action).to eq("user_role_changed")
      expect(audit_log.user).to eq(admin_user)
      expect(audit_log.resource_type).to eq("User")
      expect(audit_log.metadata["admin_roles"]).to eq([ "admin" ])
      expect(audit_log.metadata["justification"]).to eq("Promoted to internal staff")
      expect(audit_log.change_data["roles"]).to eq({ "old" => [ "consultant" ], "new" => [ "consultant", "user" ] })
    end

    it "works without justification" do
      audit_log = described_class.log_admin_action(
        action: "consultant_deactivated",
        admin_user: admin_user,
        resource: consultant,
        ip_address: ip_address
      )

      expect(audit_log).to be_persisted
      expect(audit_log.metadata).not_to have_key("justification")
    end
  end

  describe ".log" do
    it "creates a generic audit log" do
      audit_log = described_class.log(
        action: "custom_action",
        user: user,
        resource: consultant,
        change_data: { "field" => "value" },
        ip_address: ip_address,
        metadata: { "context" => "test" }
      )

      expect(audit_log).to be_persisted
      expect(audit_log.action).to eq("custom_action")
      expect(audit_log.user).to eq(user)
      expect(audit_log.resource_type).to eq("Consultant")
      expect(audit_log.change_data["field"]).to eq("value")
      expect(audit_log.metadata["context"]).to eq("test")
    end

    it "handles errors gracefully" do
      allow(AuditLog).to receive(:create!).and_raise(StandardError.new("Database error"))
      allow(Rails.logger).to receive(:error)

      result = described_class.log(
        action: "test_action",
        user: user
      )

      expect(result).to be_nil
      expect(Rails.logger).to have_received(:error).with(/Failed to create audit log/)
    end
  end

  describe ".query" do
    before do
      # Create various audit logs
      described_class.log_authentication(action: "login", user: user, ip_address: ip_address)
      described_class.log_profile_change(user: user, consultant: consultant, changes: {}, ip_address: ip_address)
      described_class.log_financial_operation(action: "invoice_created", user: user, external_system: "xero", external_id: "INV-1")
    end

    it "filters by user" do
      other_user = create(:user)
      described_class.log_authentication(action: "login", user: other_user, ip_address: ip_address)

      results = described_class.query(user: user)
      expect(results.count).to eq(3)
      expect(results.pluck(:user_id).uniq).to eq([ user.id ])
    end

    it "filters by action" do
      results = described_class.query(action: "login")
      expect(results.count).to eq(1)
      expect(results.first.action).to eq("login")
    end

    it "filters by resource" do
      results = described_class.query(resource: consultant)
      expect(results.count).to eq(1)
      expect(results.first.resource_type).to eq("Consultant")
    end

    it "filters by date range" do
      travel 2.days do
        described_class.log_authentication(action: "login", user: user, ip_address: ip_address)
      end

      results = described_class.query(
        start_date: 1.day.ago,
        end_date: Time.current
      )
      expect(results.count).to eq(3)
    end

    it "limits results" do
      results = described_class.query(limit: 2)
      expect(results.count).to eq(2)
    end
  end

  describe ".authentication_events" do
    before do
      described_class.log_authentication(action: "login", user: user, ip_address: ip_address)
      described_class.log_authentication(action: "logout", user: user, ip_address: ip_address)
      described_class.log_profile_change(user: user, consultant: consultant, changes: {}, ip_address: ip_address)
    end

    it "returns only authentication events" do
      events = described_class.authentication_events(user: user)
      expect(events.count).to eq(2)
      expect(events.pluck(:action)).to match_array([ "login", "logout" ])
    end
  end

  describe ".profile_changes" do
    before do
      described_class.log_profile_change(user: user, consultant: consultant, changes: { "bio" => { "old" => "a", "new" => "b" } }, ip_address: ip_address)
      described_class.log_profile_change(user: user, consultant: consultant, changes: { "skills" => { "old" => [], "new" => [ "Ruby" ] } }, ip_address: ip_address)
      described_class.log_authentication(action: "login", user: user, ip_address: ip_address)
    end

    it "returns only profile changes" do
      changes = described_class.profile_changes(consultant: consultant)
      expect(changes.count).to eq(2)
      expect(changes.pluck(:action).uniq).to eq([ "profile_updated" ])
    end
  end

  describe ".financial_operations" do
    before do
      described_class.log_financial_operation(action: "invoice_created", user: user, external_system: "xero", external_id: "INV-1")
      described_class.log_financial_operation(action: "bill_created", user: user, external_system: "xero", external_id: "BILL-1")
      described_class.log_authentication(action: "login", user: user, ip_address: ip_address)
    end

    it "returns only financial operations" do
      operations = described_class.financial_operations
      expect(operations.count).to eq(2)
      expect(operations.pluck(:action)).to match_array([ "invoice_created", "bill_created" ])
    end

    it "filters by user" do
      other_user = create(:user)
      described_class.log_financial_operation(action: "invoice_created", user: other_user, external_system: "xero", external_id: "INV-2")

      operations = described_class.financial_operations(user: user)
      expect(operations.count).to eq(2)
    end
  end

  describe ".admin_actions" do
    let(:admin_user) { create(:user, roles: [ "admin" ]) }

    before do
      described_class.log_admin_action(action: "user_created", admin_user: admin_user, resource: user, ip_address: ip_address)
      described_class.log_admin_action(action: "user_deactivated", admin_user: admin_user, resource: user, ip_address: ip_address)
      described_class.log_authentication(action: "login", user: user, ip_address: ip_address)
    end

    it "returns only admin actions" do
      actions = described_class.admin_actions
      expect(actions.count).to eq(2)
      expect(actions.pluck(:action)).to match_array([ "user_created", "user_deactivated" ])
    end

    it "filters by admin user" do
      other_admin = create(:user, roles: [ "admin" ])
      described_class.log_admin_action(action: "system_config_changed", admin_user: other_admin, ip_address: ip_address)

      actions = described_class.admin_actions(admin_user: admin_user)
      expect(actions.count).to eq(2)
    end
  end

  describe "sensitive data redaction" do
    it "redacts password fields" do
      audit_log = described_class.log(
        action: "test",
        user: user,
        metadata: { "password" => "secret123" }
      )

      expect(audit_log.metadata["password"]).to eq("[REDACTED]")
    end

    it "redacts token fields" do
      audit_log = described_class.log(
        action: "test",
        user: user,
        metadata: { "access_token" => "abc123xyz" }
      )

      expect(audit_log.metadata["access_token"]).to eq("[REDACTED]")
    end

    it "redacts banking details" do
      audit_log = described_class.log(
        action: "test",
        user: user,
        change_data: {
          "banking_details" => {
            "account_number" => "1234567890",
            "branch_code" => "051001"
          }
        }
      )

      expect(audit_log.change_data["banking_details"]).to eq("[REDACTED]")
    end

    it "preserves non-sensitive data" do
      audit_log = described_class.log(
        action: "test",
        user: user,
        metadata: {
          "email" => "test@example.com",
          "name" => "John Doe",
          "password" => "secret"
        }
      )

      expect(audit_log.metadata["email"]).to eq("test@example.com")
      expect(audit_log.metadata["name"]).to eq("John Doe")
      expect(audit_log.metadata["password"]).to eq("[REDACTED]")
    end
  end
end
