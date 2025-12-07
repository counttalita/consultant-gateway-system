# frozen_string_literal: true

require "rails_helper"

RSpec.describe AuditLogger, type: :service do
  describe "Property-Based Tests" do
    # Feature: consultant-gateway-system, Property 43: Login Audit Logging
    # Validates: Requirements 12.1
    describe "Property 43: Login Audit Logging" do
      it "creates an audit log entry recording consultant identity, timestamp, and IP address for any consultant login" do
        property_test(iterations: 100) do
          # Generate random valid email (unique per iteration)
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          # Generate random IP address
          ip_address = Rantly {
            octets = 4.times.map { range(1, 254) }
            octets.join(".")
          }

          # Create user
          user = create(:user, email: email)

          # Create a session (simulating login)
          session = create(:session, user: user)

          # Log authentication event
          audit_log = AuditLogger.log_authentication(
            action: "login",
            user: user,
            resource: session,
            ip_address: ip_address,
            metadata: { email: email }
          )

          # Verify audit log was created
          expect(audit_log).to be_persisted
          expect(audit_log).to be_a(AuditLog)

          # Verify consultant identity is recorded
          expect(audit_log.user).to eq(user)
          expect(audit_log.user_email).to eq(email.downcase.strip)

          # Verify timestamp is recorded
          expect(audit_log.created_at).to be_present
          expect(audit_log.created_at).to be_within(1.second).of(Time.current)

          # Verify IP address is recorded
          expect(audit_log.ip_address).to eq(ip_address)

          # Verify action is recorded
          expect(audit_log.action).to eq("login")

          # Verify resource is recorded
          expect(audit_log.resource_type).to eq("Session")
          expect(audit_log.resource_id).to eq(session.id)

          # Verify metadata contains email
          expect(audit_log.metadata).to include("email" => email)
        end
      end

      it "creates audit log entries for various authentication events" do
        property_test(iterations: 100) do
          # Generate random valid email (unique per iteration)
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          # Generate random IP address
          ip_address = Rantly {
            octets = 4.times.map { range(1, 254) }
            octets.join(".")
          }

          # Create user
          user = create(:user, email: email)

          # Test different authentication actions
          actions = %w[login logout otp_generated otp_validated]
          action = Rantly { choose(*actions) }

          # Log authentication event
          audit_log = AuditLogger.log_authentication(
            action: action,
            user: user,
            ip_address: ip_address,
            metadata: { email: email }
          )

          # Verify audit log was created with correct action
          expect(audit_log).to be_persisted
          expect(audit_log.action).to eq(action)
          expect(audit_log.user).to eq(user)
          expect(audit_log.ip_address).to eq(ip_address)

          # Verify it can be queried as an authentication event
          auth_events = AuditLog.authentication_events.for_user(user)
          expect(auth_events).to include(audit_log)
        end
      end
    end

    # Feature: consultant-gateway-system, Property 44: Profile Change Audit Logging
    # Validates: Requirements 12.2
    describe "Property 44: Profile Change Audit Logging" do
      it "captures field changed, old value, new value, and user who made the change for any profile modification" do
        property_test(iterations: 100) do
          # Generate random valid email (unique per iteration)
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          # Generate random IP address
          ip_address = Rantly {
            octets = 4.times.map { range(1, 254) }
            octets.join(".")
          }

          # Create user and consultant
          user = create(:user, email: email)
          consultant = create(:consultant, user: user)

          # Generate random profile changes
          old_bio = Rantly { sized(50) { string(:alpha) } }
          new_bio = Rantly { sized(50) { string(:alpha) } }

          old_skills = Rantly { array(range(1, 5)) { sized(10) { string(:alpha) } } }
          new_skills = Rantly { array(range(1, 5)) { sized(10) { string(:alpha) } } }

          old_status = Rantly { choose("available", "partially_available", "unavailable") }
          new_status = Rantly { choose("available", "partially_available", "unavailable") }

          # Create changes hash
          changes = {
            "bio" => { "old" => old_bio, "new" => new_bio },
            "skills" => { "old" => old_skills, "new" => new_skills },
            "availability_status" => { "old" => old_status, "new" => new_status }
          }

          # Log profile change
          audit_log = AuditLogger.log_profile_change(
            user: user,
            consultant: consultant,
            changes: changes,
            ip_address: ip_address,
            metadata: { source: "profile_update_form" }
          )

          # Verify audit log was created
          expect(audit_log).to be_persisted
          expect(audit_log).to be_a(AuditLog)

          # Verify action is profile_updated
          expect(audit_log.action).to eq("profile_updated")

          # Verify user who made the change is recorded
          expect(audit_log.user).to eq(user)

          # Verify resource is the consultant
          expect(audit_log.resource_type).to eq("Consultant")
          expect(audit_log.resource_id).to eq(consultant.id)

          # Verify changes are captured with old and new values
          expect(audit_log.change_data).to be_a(Hash)
          expect(audit_log.change_data["bio"]).to eq({ "old" => old_bio, "new" => new_bio })
          expect(audit_log.change_data["skills"]).to eq({ "old" => old_skills, "new" => new_skills })
          expect(audit_log.change_data["availability_status"]).to eq({ "old" => old_status, "new" => new_status })

          # Verify IP address is recorded
          expect(audit_log.ip_address).to eq(ip_address)

          # Verify it can be queried as a profile change
          profile_changes = AuditLog.profile_changes.for_resource(consultant)
          expect(profile_changes).to include(audit_log)
        end
      end

      it "handles ActiveModel::Dirty format changes" do
        property_test(iterations: 100) do
          # Generate random valid email (unique per iteration)
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          # Create user and consultant
          user = create(:user, email: email)
          consultant = create(:consultant, user: user)

          # Generate random changes in ActiveModel::Dirty format [old, new]
          old_bio = Rantly { sized(50) { string(:alpha) } }
          new_bio = Rantly { sized(50) { string(:alpha) } }

          changes = {
            "bio" => [ old_bio, new_bio ]
          }

          # Log profile change
          audit_log = AuditLogger.log_profile_change(
            user: user,
            consultant: consultant,
            changes: changes,
            ip_address: "127.0.0.1"
          )

          # Verify changes are converted to our format
          expect(audit_log.change_data["bio"]).to eq({ "old" => old_bio, "new" => new_bio })
        end
      end
    end

    # Feature: consultant-gateway-system, Property 36: Sensitive Data Redaction
    # Validates: Requirements 8.4
    describe "Property 36: Sensitive Data Redaction" do
      it "redacts personally identifiable information and banking details from any log entry containing sensitive data" do
        property_test(iterations: 100) do
          # Generate random valid email (unique per iteration)
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          # Create user and consultant
          user = create(:user, email: email)
          consultant = create(:consultant, user: user)

          # Generate random sensitive data
          account_number = 10.times.map { Rantly { range(0, 9) } }.join
          branch_code = 6.times.map { Rantly { range(0, 9) } }.join
          password = Rantly { sized(16) { string(:alnum) } }
          token = Rantly { sized(32) { string(:alnum) } }
          otp_code = 6.times.map { Rantly { range(0, 9) } }.join

          # Create changes with sensitive data
          changes = {
            "bio" => { "old" => "Old bio", "new" => "New bio" },
            "banking_details" => {
              "old" => {
                "account_number" => account_number,
                "branch_code" => branch_code
              },
              "new" => {
                "account_number" => "#{account_number}999",
                "branch_code" => "#{branch_code}111"
              }
            }
          }

          # Create metadata with sensitive data
          metadata = {
            "password" => password,
            "token" => token,
            "otp_code" => otp_code,
            "safe_field" => "This is safe"
          }

          # Log profile change
          audit_log = AuditLogger.log_profile_change(
            user: user,
            consultant: consultant,
            changes: changes,
            ip_address: "127.0.0.1",
            metadata: metadata
          )

          # Verify sensitive data in changes is redacted
          expect(audit_log.change_data["banking_details"]).to eq("[REDACTED]")

          # Verify non-sensitive data is preserved
          expect(audit_log.change_data["bio"]).to eq({ "old" => "Old bio", "new" => "New bio" })

          # Verify sensitive data in metadata is redacted
          expect(audit_log.metadata["password"]).to eq("[REDACTED]")
          expect(audit_log.metadata["token"]).to eq("[REDACTED]")
          expect(audit_log.metadata["otp_code"]).to eq("[REDACTED]")

          # Verify non-sensitive metadata is preserved
          expect(audit_log.metadata["safe_field"]).to eq("This is safe")
        end
      end

      it "redacts nested sensitive data structures" do
        property_test(iterations: 100) do
          # Generate random valid email (unique per iteration)
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          # Create user
          user = create(:user, email: email)

          # Generate random sensitive data
          secret_key = Rantly { sized(32) { string(:alnum) } }
          api_token = Rantly { sized(40) { string(:alnum) } }

          # Create nested metadata with sensitive data
          metadata = {
            "config" => {
              "api_key" => secret_key,
              "settings" => {
                "access_token" => api_token,
                "timeout" => 30
              }
            },
            "user_info" => {
              "name" => "John Doe",
              "id_number" => "1234567890"
            }
          }

          # Log action with nested sensitive data
          audit_log = AuditLogger.log(
            action: "config_updated",
            user: user,
            metadata: metadata
          )

          # Verify nested sensitive data is redacted
          expect(audit_log.metadata["config"]["api_key"]).to eq("[REDACTED]")
          expect(audit_log.metadata["config"]["settings"]["access_token"]).to eq("[REDACTED]")
          expect(audit_log.metadata["user_info"]["id_number"]).to eq("[REDACTED]")

          # Verify non-sensitive nested data is preserved
          expect(audit_log.metadata["config"]["settings"]["timeout"]).to eq(30)
          expect(audit_log.metadata["user_info"]["name"]).to eq("John Doe")
        end
      end

      it "redacts various sensitive field patterns" do
        property_test(iterations: 100) do
          # Test various sensitive field names
          sensitive_fields = %w[
            password
            banking_details
            account_number
            branch_code
            code
            token
            secret
            api_key
            access_token
            refresh_token
            otp
            pin
            ssn
            id_number
            tax_number
          ]

          # Pick a random sensitive field
          field_name = Rantly { choose(*sensitive_fields) }

          # Generate random sensitive value
          sensitive_value = Rantly { sized(20) { string(:alnum) } }

          # Create user
          user = create(:user)

          # Create metadata with the sensitive field
          metadata = {
            field_name => sensitive_value,
            "safe_field" => "safe_value"
          }

          # Log action
          audit_log = AuditLogger.log(
            action: "test_action",
            user: user,
            metadata: metadata
          )

          # Verify sensitive field is redacted
          expect(audit_log.metadata[field_name]).to eq("[REDACTED]")

          # Verify safe field is preserved
          expect(audit_log.metadata["safe_field"]).to eq("safe_value")
        end
      end
    end
  end
end
