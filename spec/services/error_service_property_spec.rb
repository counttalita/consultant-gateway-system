# frozen_string_literal: true

require "rails_helper"

RSpec.describe ErrorService, type: :service do
  describe "Property-Based Tests" do
    # Feature: consultant-gateway-system, Property 33: API Integration Logging
    # Validates: Requirements 8.1
    describe "Property 33: API Integration Logging" do
      it "logs every error with classification and context" do
        property_test(iterations: 50) do
          # Generate random error
          error_message = Rantly { string(:alpha) }
          error = StandardError.new(error_message)

          # Generate random context
          context = {
            request_id: Rantly { string(:alnum) },
            service: Rantly { choose("xero", "harvest", "clickup") }
          }

          # Generate random level
          level = Rantly { choose(:low, :medium, :high, :critical) }

          # Mock EmailJob
          allow(EmailJob).to receive(:perform_later)

          # Expect AuditLogger to receive log
          expect(AuditLogger).to receive(:log).with(
            hash_including(
              action: "error_reported",
              resource_type: "SystemError",
              change_data: hash_including(
                message: error_message,
                level: level
              ),
              metadata: hash_including(context)
            )
          )

          # Call service
          ErrorService.report(error, context: context, level: level)
        end
      end
    end

    # Feature: consultant-gateway-system, Property 34: Error Context Capture
    # Validates: Requirements 8.2
    describe "Property 34: Error Context Capture" do
      it "captures stack traces and metadata for all errors" do
        property_test(iterations: 50) do
          begin
            # Raise an error to generate stack trace
            raise ArgumentError, "Test error"
          rescue ArgumentError => e
            # Mock EmailJob
            allow(EmailJob).to receive(:perform_later)

            # Expect AuditLogger to receive log with stack trace
            expect(AuditLogger).to receive(:log) do |args|
              expect(args[:metadata]).to have_key(:stack_trace)
              expect(args[:metadata][:stack_trace]).to be_an(Array)
              expect(args[:metadata][:stack_trace]).not_to be_empty
            end

            ErrorService.report(e)
          end
        end
      end
    end

    # Feature: consultant-gateway-system, Property 35: Critical Error Notifications
    # Validates: Requirements 8.3
    describe "Property 35: Critical Error Notifications" do
      it "sends email notifications for high and critical errors" do
        property_test(iterations: 50) do
          # Mock User and EmailJob
          allow(User).to receive(:with_role).with(:admin).and_return([ double(email: "admin@example.com") ])
          allow(EmailJob).to receive(:perform_later)
          allow(AuditLogger).to receive(:log)

          # Generate error
          error = StandardError.new("Test error")

          # Choose high/critical level
          level = Rantly { choose(:high, :critical) }

          # Expect EmailJob to be called
          expect(EmailJob).to receive(:perform_later)

          ErrorService.report(error, level: level)
        end
      end

      it "does not send email notifications for low and medium errors" do
        property_test(iterations: 50) do
          # Mock User and EmailJob
          allow(User).to receive(:with_role).with(:admin).and_return([ double(email: "admin@example.com") ])
          allow(EmailJob).to receive(:perform_later)
          allow(AuditLogger).to receive(:log)

          # Generate error
          error = StandardError.new("Test error")

          # Choose low/medium level
          level = Rantly { choose(:low, :medium) }

          # Expect EmailJob NOT to be called
          expect(EmailJob).not_to receive(:perform_later)

          ErrorService.report(error, level: level)
        end
      end
    end
  end
end
