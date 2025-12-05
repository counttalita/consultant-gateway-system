# frozen_string_literal: true

require "rails_helper"

RSpec.describe Adapters::ResendAdapter, type: :service do
  describe "Property-Based Tests" do
    # Feature: consultant-gateway-system, Property 50: Email Retry Logic
    # Validates: Requirements 13.4
    describe "Property 50: Email Retry Logic" do
      it "retries email delivery up to 3 times with exponential backoff for any email failure" do
        property_test(iterations: 100) do
          # Mock API key before anything else
          allow(ENV).to receive(:[]).and_call_original
          allow(ENV).to receive(:[]).with("RESEND_API_KEY").and_return("re_123456789")

          # Generate random valid email
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}@#{domain}.com"
          }

          # Generate random template variables
          code = format("%06d", Rantly { range(100000, 999999) })
          expires_in_minutes = Rantly { range(5, 15) }

          # Track retry attempts
          attempt_count = 0
          retry_delays = []

          # Mock the HTTP request to fail initially, then succeed
          allow(Net::HTTP).to receive(:new).and_wrap_original do |original_method, *args|
            http = original_method.call(*args)

            allow(http).to receive(:request).and_wrap_original do |original_request, *request_args|
              attempt_count += 1

              # Fail the first 1-2 attempts randomly
              max_failures = Rantly { range(1, 2) }

              if attempt_count <= max_failures
                # Simulate a retryable error
                response = Net::HTTPServiceUnavailable.new("1.1", "503", "Service Unavailable")
                allow(response).to receive(:body).and_return('{"message":"Service temporarily unavailable"}')
                response
              else
                # Succeed on the final attempt
                response = Net::HTTPSuccess.new("1.1", "200", "OK")
                message_id = "msg_#{SecureRandom.hex(16)}"
                allow(response).to receive(:body).and_return({ id: message_id }.to_json)
                response
              end
            end

            http
          end

          # Mock sleep to track delays without actually sleeping
          allow_any_instance_of(Object).to receive(:sleep) do |_, delay|
            retry_delays << delay
          end

          # Send email (should succeed after retries)
          message_id = described_class.send_email(
            to: email,
            template: "otp_code",
            variables: { code: code, expires_in_minutes: expires_in_minutes }
          )

          # Verify message ID was returned
          expect(message_id).to be_present
          expect(message_id).to start_with("msg_")

          # Verify retries occurred
          expect(attempt_count).to be > 1
          expect(attempt_count).to be <= 3

          # Verify exponential backoff delays
          if retry_delays.any?
            retry_delays.each_with_index do |delay, index|
              expected_delay = 1 * (2 ** (index + 1))
              expect(delay).to eq(expected_delay)
            end
          end
        end
      end

      it "raises EmailDeliveryError after 3 failed attempts for any email" do
        property_test(iterations: 100) do
          # Mock API key before anything else
          allow(ENV).to receive(:[]).and_call_original
          allow(ENV).to receive(:[]).with("RESEND_API_KEY").and_return("re_123456789")

          # Generate random valid email
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}@#{domain}.com"
          }

          # Generate random template variables
          code = format("%06d", Rantly { range(100000, 999999) })

          # Track retry attempts
          attempt_count = 0

          # Mock the HTTP request to always fail
          allow(Net::HTTP).to receive(:new).and_wrap_original do |original_method, *args|
            http = original_method.call(*args)

            allow(http).to receive(:request).and_wrap_original do |original_request, *request_args|
              attempt_count += 1

              # Always fail
              response = Net::HTTPServiceUnavailable.new("1.1", "503", "Service Unavailable")
              allow(response).to receive(:body).and_return('{"message":"Service temporarily unavailable"}')
              response
            end

            http
          end

          # Mock sleep to avoid delays
          allow_any_instance_of(Object).to receive(:sleep)

          # Attempt to send email (should fail after 3 retries)
          expect {
            described_class.send_email(
              to: email,
              template: "otp_code",
              variables: { code: code, expires_in_minutes: 10 }
            )
          }.to raise_error(Adapters::ResendAdapter::EmailDeliveryError, /Failed to send email after 3 attempts/)

          # Verify exactly 3 attempts were made
          expect(attempt_count).to eq(3)
        end
      end
    end

    # Feature: consultant-gateway-system, Property 51: Email Message ID Storage
    # Validates: Requirements 13.5
    describe "Property 51: Email Message ID Storage" do
      it "stores the Resend message ID for any successfully sent email" do
        property_test(iterations: 100) do
          # Mock API key before anything else
          allow(ENV).to receive(:[]).and_call_original
          allow(ENV).to receive(:[]).with("RESEND_API_KEY").and_return("re_123456789")

          # Generate random valid email (unique per iteration)
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          # Create user and OTP code
          user = create(:user, email: email)
          code = format("%06d", Rantly { range(100000, 999999) })
          otp_code = create(:otp_code,
            user: user,
            code: code,
            expires_at: 10.minutes.from_now
          )

          # Generate random message ID
          message_id = "msg_#{SecureRandom.hex(16)}"

          # Mock the HTTP request to succeed
          allow(Net::HTTP).to receive(:new).and_wrap_original do |original_method, *args|
            http = original_method.call(*args)

            allow(http).to receive(:request).and_wrap_original do |original_request, *request_args|
              response = Net::HTTPSuccess.new("1.1", "200", "OK")
              allow(response).to receive(:body).and_return({ id: message_id }.to_json)
              response
            end

            http
          end

          # Send email via AuthenticationService (which uses ResendAdapter)
          service = AuthenticationService.new
          allow(service).to receive(:send_otp_email).and_call_original

          # Generate OTP (which sends email)
          returned_otp = service.generate_otp(email: email, ip_address: "127.0.0.1")

          # Verify message ID was stored
          returned_otp.reload
          expect(returned_otp.resend_message_id).to eq(message_id)
          expect(returned_otp.email_sent?).to be true

          # Verify we can retrieve the OTP by message ID
          found_otp = OtpCode.find_by(resend_message_id: message_id)
          expect(found_otp).to eq(returned_otp)
        end
      end

      it "does not store message ID when email delivery fails for any email" do
        property_test(iterations: 100) do
          # Mock API key before anything else
          allow(ENV).to receive(:[]).and_call_original
          allow(ENV).to receive(:[]).with("RESEND_API_KEY").and_return("re_123456789")

          # Generate random valid email (unique per iteration)
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          # Mock the HTTP request to always fail
          allow(Net::HTTP).to receive(:new).and_wrap_original do |original_method, *args|
            http = original_method.call(*args)

            allow(http).to receive(:request).and_wrap_original do |original_request, *request_args|
              response = Net::HTTPServiceUnavailable.new("1.1", "503", "Service Unavailable")
              allow(response).to receive(:body).and_return('{"message":"Service temporarily unavailable"}')
              response
            end

            http
          end

          # Mock sleep to avoid delays
          allow_any_instance_of(Object).to receive(:sleep)

          # Attempt to generate OTP (which tries to send email)
          service = AuthenticationService.new

          expect {
            service.generate_otp(email: email, ip_address: "127.0.0.1")
          }.to raise_error(Adapters::ResendAdapter::EmailDeliveryError)

          # Verify OTP was created but has no message ID
          user = User.find_by(email: email.downcase.strip)
          if user
            otp_codes = user.otp_codes.order(created_at: :desc)
            if otp_codes.any?
              latest_otp = otp_codes.first
              expect(latest_otp.resend_message_id).to be_nil
              expect(latest_otp.email_sent?).to be false
            end
          end
        end
      end
    end
  end
end
