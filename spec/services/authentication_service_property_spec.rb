# frozen_string_literal: true

require "rails_helper"

RSpec.describe AuthenticationService, type: :service do
  include ActiveSupport::Testing::TimeHelpers
  
  let(:service) { described_class.new }

  describe "Property-Based Tests" do
    # Feature: consultant-gateway-system, Property 1: OTP Generation and Delivery
    # Validates: Requirements 1.1, 13.1
    describe "Property 1: OTP Generation and Delivery" do
      it "generates a 6-digit numeric code and sends it for any valid email address" do
        property_test(iterations: 100) do
          # Generate random valid email
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}@#{domain}.com"
          }

          # Generate OTP
          otp_code = service.generate_otp(email: email, ip_address: "127.0.0.1")

          # Verify OTP is 6-digit numeric code
          expect(otp_code).to be_a(OtpCode)
          expect(otp_code.code).to match(/\A\d{6}\z/)
          expect(otp_code.code.length).to eq(6)

          # Verify OTP is associated with a user
          expect(otp_code.user).to be_present
          expect(otp_code.user.email).to eq(email.downcase.strip)

          # Verify OTP has expiration set
          expect(otp_code.expires_at).to be_present
          expect(otp_code.expires_at).to be > Time.current

          # Verify OTP is not consumed
          expect(otp_code.consumed?).to be false

          # Verify audit log was created
          audit_log = AuditLog.where(
            action: "otp_generated",
            resource_type: "OtpCode",
            resource_id: otp_code.id
          ).last
          expect(audit_log).to be_present
        end
      end
    end

    # Feature: consultant-gateway-system, Property 2: OTP Validation Within Time Window
    # Validates: Requirements 1.2
    describe "Property 2: OTP Validation Within Time Window" do
      it "validates any valid OTP code less than 10 minutes old and establishes a session" do
        property_test(iterations: 100) do
          # Generate random valid email (unique per iteration)
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          # Create user and OTP code with unique code
          user = create(:user, email: email)
          code = format("%06d", Rantly { range(100000, 999999) })
          
          # Create OTP that's still valid (random time between 1 and 9 minutes from now)
          minutes_until_expiry = Rantly { range(1, 9) }
          otp_code = create(:otp_code, 
            user: user, 
            code: code,
            expires_at: minutes_until_expiry.minutes.from_now,
            created_at: Time.current
          )

          # Validate OTP
          result = service.validate_otp(
            email: email,
            code: code,
            ip_address: "127.0.0.1"
          )

          # Verify session was created
          expect(result).to be_a(Hash)
          expect(result[:user]).to eq(user)
          expect(result[:session]).to be_a(Session)
          expect(result[:session].user).to eq(user)
          expect(result[:session].active?).to be true

          # Verify OTP was consumed
          otp_code.reload
          expect(otp_code.consumed?).to be true

          # Verify audit log was created
          audit_log = AuditLog.where(
            action: "login",
            user: user
          ).last
          expect(audit_log).to be_present
        end
      end
    end

    # Feature: consultant-gateway-system, Property 3: OTP Single-Use Enforcement
    # Validates: Requirements 1.4
    describe "Property 3: OTP Single-Use Enforcement" do
      it "rejects any OTP code that has been successfully used once" do
        property_test(iterations: 100) do
          # Generate random valid email (unique per iteration)
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          # Create user and OTP code with sufficient expiration time and unique code
          user = create(:user, email: email)
          code = format("%06d", Rantly { range(100000, 999999) })
          otp_code = create(:otp_code, 
            user: user, 
            code: code,
            expires_at: 10.minutes.from_now,
            created_at: Time.current
          )

          # First validation should succeed
          result = service.validate_otp(
            email: email,
            code: code,
            ip_address: "127.0.0.1"
          )
          expect(result).to be_a(Hash)
          expect(result[:session]).to be_a(Session)

          # Second validation should fail
          expect {
            service.validate_otp(
              email: email,
              code: code,
              ip_address: "127.0.0.1"
            )
          }.to raise_error(AuthenticationService::InvalidOtpError, /already been used/)

          # Verify OTP is marked as consumed
          otp_code.reload
          expect(otp_code.consumed?).to be true
          expect(otp_code.consumed_at).to be_present
        end
      end
    end

    # Feature: consultant-gateway-system, Property 4: Session Persistence
    # Validates: Requirements 1.5
    describe "Property 4: Session Persistence" do
      it "maintains any authenticated user session for 24 hours without re-authentication" do
        property_test(iterations: 100) do
          # Generate random valid email (unique per iteration)
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          # Create user and session
          user = create(:user, email: email)
          session = create(:session, user: user)

          # Test session validity at random times within 24 hours
          # Generate random time between 1 minute and 23 hours 59 minutes
          minutes_elapsed = Rantly { range(1, 1439) } # 1439 minutes = 23 hours 59 minutes

          travel minutes_elapsed.minutes do
            # Validate session
            validated_user = service.validate_session(
              token: session.token,
              ip_address: "127.0.0.1"
            )

            # Verify session is still valid
            expect(validated_user).to eq(user)
            
            # Verify session hasn't expired
            session.reload
            expect(session.active?).to be true
            expect(session.expired?).to be false
          end
        end
      end

      it "invalidates sessions after 24 hours" do
        property_test(iterations: 100) do
          # Generate random valid email (unique per iteration)
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          # Create user and session
          user = create(:user, email: email)
          session = create(:session, user: user)

          # Test session expiration at random times after 24 hours
          # Generate random time between 24 hours 1 minute and 48 hours
          minutes_elapsed = Rantly { range(1441, 2880) } # 1441+ minutes = 24+ hours

          travel minutes_elapsed.minutes do
            # Validate session
            validated_user = service.validate_session(
              token: session.token,
              ip_address: "127.0.0.1"
            )

            # Verify session is expired
            expect(validated_user).to be_nil
            
            session.reload
            expect(session.expired?).to be true
          end
        end
      end
    end
  end
end
