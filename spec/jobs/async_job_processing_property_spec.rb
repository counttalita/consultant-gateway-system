# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Asynchronous Job Processing", type: :job do
  # Property 37: Asynchronous Job Processing (Requirement 10.4)
  describe "Property 37: Asynchronous Job Processing" do
    it "processes jobs asynchronously without blocking the main thread" do
      property_test(iterations: 100) do
        # Clear any existing jobs before each iteration
        ActiveJob::Base.queue_adapter.enqueued_jobs.clear

        # Generate random job parameters
        job_type = Rantly { choose('airtable_sync', 'email', 'financial_operation') }

        start_time = Time.current

        case job_type
        when 'airtable_sync'
          # Create a consultant for testing
          consultant = create(:consultant)
          operation = Rantly { choose('create', 'update') }

          # Enqueue job
          job = AirtableSyncJob.perform_later(consultant.id, operation)

          # Verify job was enqueued (not executed synchronously)
          expect(job).to be_a(ActiveJob::Base)

        when 'email'
          email_type = Rantly { choose('otp_code', 'welcome', 'admin_notification') }
          recipient = "test@example.com"
          variables = case email_type
          when 'otp_code'
                        { code: Rantly { string.upcase }, expires_in_minutes: 10 }
          when 'welcome'
                        { consultant_name: "Test", portal_url: "https://example.com" }
          when 'admin_notification'
                        { subject: "Test", message: "Test message", details: {}, priority: "normal" }
          end

          # Enqueue job
          job = EmailJob.perform_later(email_type, recipient, variables)

          # Verify job was enqueued
          expect(job).to be_a(ActiveJob::Base)

        when 'financial_operation'
          operation_type = 'sync_financial_data'
          params = {
            start_date: "2024-01-01",
            end_date: "2024-01-31"
          }

          # Enqueue job
          job = FinancialOperationJob.perform_later(operation_type, params)

          # Verify job was enqueued
          expect(job).to be_a(ActiveJob::Base)
        end

        end_time = Time.current
        elapsed_time = end_time - start_time

        # Verify job enqueuing was fast (< 500ms) - proves it's async
        expect(elapsed_time).to be < 0.5

        # Verify exactly one job was enqueued
        expect(ActiveJob::Base.queue_adapter.enqueued_jobs.size).to eq(1)
      end
    end

    it "validates that jobs don't execute synchronously in test mode" do
      property_test(iterations: 50) do
        consultant = create(:consultant)

        # Clear any existing jobs
        ActiveJob::Base.queue_adapter.enqueued_jobs.clear

        # Enqueue job
        AirtableSyncJob.perform_later(consultant.id, 'update')

        # Verify job is enqueued but not executed
        expect(ActiveJob::Base.queue_adapter.enqueued_jobs.size).to eq(1)

        # Verify the job has correct parameters
        enqueued_job = ActiveJob::Base.queue_adapter.enqueued_jobs.first
        expect(enqueued_job[:job]).to eq(AirtableSyncJob)
        expect(enqueued_job[:args]).to include(consultant.id, 'update')
        expect(enqueued_job[:queue]).to eq('integrations')
      end
    end

    it "verifies jobs are assigned to correct queues" do
      property_test(iterations: 50) do
        consultant = create(:consultant)

        # Clear jobs
        ActiveJob::Base.queue_adapter.enqueued_jobs.clear

        # Enqueue different job types
        AirtableSyncJob.perform_later(consultant.id, 'update')
        EmailJob.perform_later('otp_code', 'test@example.com', { code: '123456', expires_in_minutes: 10 })
        FinancialOperationJob.perform_later('sync_financial_data', { start_date: '2024-01-01', end_date: '2024-01-31' })

        jobs = ActiveJob::Base.queue_adapter.enqueued_jobs

        # Verify queue assignments
        airtable_job = jobs.find { |j| j[:job] == AirtableSyncJob }
        email_job = jobs.find { |j| j[:job] == EmailJob }
        financial_job = jobs.find { |j| j[:job] == FinancialOperationJob }

        expect(airtable_job[:queue]).to eq('integrations')
        expect(email_job[:queue]).to eq('critical')
        expect(financial_job[:queue]).to eq('default')
      end
    end
  end
end
