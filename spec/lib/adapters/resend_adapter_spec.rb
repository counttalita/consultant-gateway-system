# frozen_string_literal: true

require "rails_helper"

RSpec.describe Adapters::ResendAdapter, type: :service do
  describe ".send_email" do
    let(:valid_email) { "test@example.com" }
    let(:message_id) { "msg_#{SecureRandom.hex(16)}" }

    before do
      # Mock successful HTTP response
      allow(Net::HTTP).to receive(:new).and_wrap_original do |original_method, *args|
        http = original_method.call(*args)
        allow(http).to receive(:request).and_return(
          double(
            is_a?: true,
            body: { id: message_id }.to_json
          )
        )
        http
      end
    end

    context "with OTP template" do
      it "sends OTP email with correct structure" do
        result = described_class.send_email(
          to: valid_email,
          template: "otp_code",
          variables: { code: "123456", expires_in_minutes: 10 }
        )

        expect(result).to eq(message_id)
      end

      it "includes the OTP code in the email" do
        email_data = described_class.build_email_data(
          to: valid_email,
          template: "otp_code",
          variables: { code: "123456", expires_in_minutes: 10 }
        )

        expect(email_data[:html]).to include("123456")
        expect(email_data[:text]).to include("123456")
        expect(email_data[:subject]).to include("Login Code")
      end
    end

    context "with welcome template" do
      it "sends welcome email with correct structure" do
        result = described_class.send_email(
          to: valid_email,
          template: "welcome",
          variables: { consultant_name: "John Doe", portal_url: "https://portal.example.com" }
        )

        expect(result).to eq(message_id)
      end

      it "includes consultant name and portal URL" do
        email_data = described_class.build_email_data(
          to: valid_email,
          template: "welcome",
          variables: { consultant_name: "John Doe", portal_url: "https://portal.example.com" }
        )

        expect(email_data[:html]).to include("John Doe")
        expect(email_data[:html]).to include("https://portal.example.com")
        expect(email_data[:subject]).to include("Welcome")
      end
    end

    context "with admin notification template" do
      it "sends admin notification with correct structure" do
        result = described_class.send_email(
          to: valid_email,
          template: "admin_notification",
          variables: {
            subject: "Test Alert",
            message: "This is a test",
            priority: "high",
            details: { error: "Test error" }
          }
        )

        expect(result).to eq(message_id)
      end

      it "includes priority in subject line" do
        email_data = described_class.build_email_data(
          to: valid_email,
          template: "admin_notification",
          variables: {
            subject: "Test Alert",
            message: "This is a test",
            priority: "critical"
          }
        )

        expect(email_data[:subject]).to include("[CRITICAL]")
        expect(email_data[:html]).to include("Test Alert")
      end
    end

    context "with invalid email" do
      it "raises InvalidEmailError" do
        expect {
          described_class.send_email(
            to: "invalid-email",
            template: "otp_code",
            variables: { code: "123456" }
          )
        }.to raise_error(Adapters::ResendAdapter::InvalidEmailError)
      end
    end

    context "with unknown template" do
      it "raises ArgumentError" do
        expect {
          described_class.send_email(
            to: valid_email,
            template: "unknown_template",
            variables: {}
          )
        }.to raise_error(ArgumentError, /Unknown template/)
      end
    end
  end

  describe ".calculate_backoff_delay" do
    it "calculates exponential backoff correctly" do
      expect(described_class.calculate_backoff_delay(1)).to eq(2)
      expect(described_class.calculate_backoff_delay(2)).to eq(4)
      expect(described_class.calculate_backoff_delay(3)).to eq(8)
    end
  end

  describe ".validate_email!" do
    it "accepts valid email addresses" do
      expect {
        described_class.validate_email!("test@example.com")
      }.not_to raise_error
    end

    it "rejects invalid email addresses" do
      expect {
        described_class.validate_email!("invalid-email")
      }.to raise_error(Adapters::ResendAdapter::InvalidEmailError)
    end
  end

  describe "error handling" do
    let(:valid_email) { "test@example.com" }

    context "when API returns 429 (rate limit)" do
      before do
        allow(Net::HTTP).to receive(:new).and_wrap_original do |original_method, *args|
          http = original_method.call(*args)
          response = Net::HTTPTooManyRequests.new("1.1", "429", "Too Many Requests")
          allow(response).to receive(:body).and_return('{"message":"Rate limit exceeded"}')
          allow(http).to receive(:request).and_return(response)
          http
        end
        # Mock sleep to avoid delays
        allow_any_instance_of(Object).to receive(:sleep)
      end

      it "retries and raises EmailDeliveryError after exhausting retries" do
        expect {
          described_class.send_email(
            to: valid_email,
            template: "otp_code",
            variables: { code: "123456" }
          )
        }.to raise_error(Adapters::ResendAdapter::EmailDeliveryError, /Failed to send email after 3 attempts/)
      end
    end

    context "when API returns 400 (bad request)" do
      before do
        allow(Net::HTTP).to receive(:new).and_wrap_original do |original_method, *args|
          http = original_method.call(*args)
          response = Net::HTTPBadRequest.new("1.1", "400", "Bad Request")
          allow(response).to receive(:body).and_return('{"message":"Invalid email data"}')
          allow(http).to receive(:request).and_return(response)
          http
        end
      end

      it "raises InvalidEmailError" do
        expect {
          described_class.send_email(
            to: valid_email,
            template: "otp_code",
            variables: { code: "123456" }
          )
        }.to raise_error(Adapters::ResendAdapter::InvalidEmailError)
      end
    end

    context "when API returns 401 (unauthorized)" do
      before do
        allow(Net::HTTP).to receive(:new).and_wrap_original do |original_method, *args|
          http = original_method.call(*args)
          response = Net::HTTPUnauthorized.new("1.1", "401", "Unauthorized")
          allow(response).to receive(:body).and_return('{"message":"Invalid API key"}')
          allow(http).to receive(:request).and_return(response)
          http
        end
      end

      it "raises EmailDeliveryError" do
        expect {
          described_class.send_email(
            to: valid_email,
            template: "otp_code",
            variables: { code: "123456" }
          )
        }.to raise_error(Adapters::ResendAdapter::EmailDeliveryError, /Authentication failed/)
      end
    end
  end

  describe "template rendering" do
    describe "OTP template" do
      it "renders HTML template with branding" do
        html = described_class.render_otp_template(code: "123456", expires_in_minutes: 10)

        expect(html).to include("Up Time Consulting")
        expect(html).to include("123456")
        expect(html).to include("10 minutes")
        expect(html).to include("Security Notice")
      end

      it "renders text template" do
        text = described_class.render_otp_text(code: "123456", expires_in_minutes: 10)

        expect(text).to include("UP TIME CONSULTING")
        expect(text).to include("123456")
        expect(text).to include("10 minutes")
      end
    end

    describe "Welcome template" do
      it "renders HTML template with consultant name" do
        html = described_class.render_welcome_template(
          consultant_name: "John Doe",
          portal_url: "https://portal.example.com"
        )

        expect(html).to include("John Doe")
        expect(html).to include("https://portal.example.com")
        expect(html).to include("Welcome to the Team")
      end

      it "renders text template" do
        text = described_class.render_welcome_text(
          consultant_name: "John Doe",
          portal_url: "https://portal.example.com"
        )

        expect(text).to include("John Doe")
        expect(text).to include("https://portal.example.com")
      end
    end

    describe "Admin notification template" do
      it "renders HTML template with priority color" do
        html = described_class.render_admin_notification_template(
          subject: "Test Alert",
          message: "Test message",
          details: { error: "Test error" },
          priority: "critical"
        )

        expect(html).to include("Test Alert")
        expect(html).to include("Test message")
        expect(html).to include("CRITICAL")
        expect(html).to include("error")
      end

      it "renders text template" do
        text = described_class.render_admin_notification_text(
          subject: "Test Alert",
          message: "Test message",
          details: { error: "Test error" },
          priority: "high"
        )

        expect(text).to include("Test Alert")
        expect(text).to include("Test message")
        expect(text).to include("HIGH")
      end
    end
  end
end
