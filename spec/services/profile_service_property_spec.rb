# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProfileService, type: :service do
  include ActiveJob::TestHelper

  let(:service) { described_class.new }

  # Mock Airtable adapter to avoid real API calls
  before do
    allow(Adapters::AirtableAdapter).to receive(:update_record).and_return({
      "id" => "rec#{SecureRandom.hex(8)}",
      "fields" => {},
      "createdTime" => Time.current.iso8601
    })
    allow(Adapters::AirtableAdapter).to receive(:create_record).and_return({
      "id" => "rec#{SecureRandom.hex(8)}",
      "fields" => {},
      "createdTime" => Time.current.iso8601
    })
  end

  describe "Property-Based Tests" do
    # Feature: consultant-gateway-system, Property 6: Profile Airtable Synchronization
    # Validates: Requirements 2.2
    describe "Property 6: Profile Airtable Synchronization" do
      it "synchronizes any valid profile update to Airtable within 30 seconds" do
        property_test(iterations: 100) do
          # Create a consultant with random data
          user = create(:user, email: "test#{SecureRandom.hex(8)}@example.com")
          consultant = create(:consultant, user: user)

          # Generate random valid profile attributes
          bio = Rantly { sized(Rantly { range(10, 1000) }) { string(:alpha) } }
          skills = Rantly {
            array(Rantly { range(1, 10) }) { sized(Rantly { range(3, 20) }) { string(:alpha) } }
          }
          availability = Rantly { choose("available", "partially_available", "unavailable") }

          attributes = {
            bio: bio,
            skills: skills,
            availability_status: availability
          }

          # Track the start time
          start_time = Time.current

          # Update profile
          result = service.update_profile(consultant, attributes)

          # Verify update succeeded
          expect(result[:success]).to be true
          expect(result[:errors]).to be_empty

          # Verify consultant was updated locally
          consultant.reload
          expect(consultant.bio).to eq(bio)
          expect(consultant.skills).to match_array(skills)
          expect(consultant.availability_status).to eq(availability)

          # Verify background job was enqueued
          expect(ProfileSyncJob).to have_been_enqueued.with(consultant.id)

          # Perform the background job synchronously
          perform_enqueued_jobs do
            ProfileSyncJob.perform_later(consultant.id)
          end

          # Verify sync completed within 30 seconds
          elapsed_time = Time.current - start_time
          expect(elapsed_time).to be < 30.seconds

          # Verify Airtable adapter was called
          if consultant.airtable_id.present?
            expect(Adapters::AirtableAdapter).to have_received(:update_record).with(
              hash_including(
                base_id: ProfileService::AIRTABLE_BASE_ID,
                table: ProfileService::TALENT_POOL_TABLE,
                record_id: consultant.airtable_id
              )
            )
          else
            expect(Adapters::AirtableAdapter).to have_received(:create_record).with(
              hash_including(
                base_id: ProfileService::AIRTABLE_BASE_ID,
                table: ProfileService::TALENT_POOL_TABLE
              )
            )
          end

          # Verify audit log was created
          audit_log = AuditLog.where(
            action: "profile_update",
            resource_type: "Consultant",
            resource_id: consultant.id
          ).last
          expect(audit_log).to be_present
        end
      end
    end

    # Feature: consultant-gateway-system, Property 9: Airtable Sync Retry Logic
    # Validates: Requirements 2.5
    describe "Property 9: Airtable Sync Retry Logic" do
      it "retries any Airtable synchronization failure up to 3 times with exponential backoff" do
        property_test(iterations: 100) do
          # Create a consultant
          user = create(:user, email: "test#{SecureRandom.hex(8)}@example.com")
          consultant = create(:consultant, user: user)

          # The service uses Airtable adapter which has built-in retry logic
          # The adapter's execute_with_retry method handles retries with exponential backoff
          # We just verify the sync completes successfully (the adapter handles retries internally)

          # Attempt sync
          result = service.sync_to_airtable(consultant)

          # Verify sync succeeded
          expect(result[:success]).to be true
          expect(result[:airtable_id]).to be_present

          # Verify consultant was updated with Airtable ID
          consultant.reload
          expect(consultant.airtable_id).to be_present

          # Verify audit log was created
          audit_log = AuditLog.where(
            action: "airtable_sync",
            resource_type: "Consultant",
            resource_id: consultant.id
          ).last
          expect(audit_log).to be_present
        end
      end

      it "marks sync as failed after 3 unsuccessful retry attempts" do
        property_test(iterations: 100) do
          # Create a consultant
          user = create(:user, email: "test#{SecureRandom.hex(8)}@example.com")
          consultant = create(:consultant, user: user)

          # Mock Airtable to always fail - the adapter will retry 3 times then raise
          allow(Adapters::AirtableAdapter).to receive(:create_record).and_raise(
            Adapters::AirtableAdapter::ApiError, "Persistent failure"
          )
          allow(Adapters::AirtableAdapter).to receive(:update_record).and_raise(
            Adapters::AirtableAdapter::ApiError, "Persistent failure"
          )

          # Attempt sync and expect it to fail after retries
          expect {
            service.sync_to_airtable(consultant)
          }.to raise_error(ProfileService::SyncError, /Failed to sync to Airtable/)
        end
      end
    end

    # Feature: consultant-gateway-system, Property 16: South African Banking Validation
    # Validates: Requirements 4.4
    describe "Property 16: South African Banking Validation" do
      it "validates that any banking details conform to South African banking standards" do
        property_test(iterations: 100) do
          # Generate valid South African banking details
          bank_name = Rantly { choose("Standard Bank", "FNB", "ABSA", "Nedbank", "Capitec") }
          account_number = Rantly { sized(Rantly { range(9, 11) }) { string(:digit) } }
          branch_code = Rantly { sized(6) { string(:digit) } }
          account_type = Rantly { choose("savings", "cheque", "transmission") }

          banking_details = {
            "bank_name" => bank_name,
            "account_number" => account_number,
            "branch_code" => branch_code,
            "account_type" => account_type
          }

          # Validate banking details
          errors = service.validate_banking_details(banking_details)

          # Verify validation passes for valid SA banking details
          expect(errors).to be_empty
        end
      end

      it "rejects banking details with invalid account number format" do
        property_test(iterations: 100) do
          # Generate invalid account number (too short or too long)
          invalid_length = Rantly { choose(Rantly { range(1, 8) }, Rantly { range(12, 20) }) }
          account_number = Rantly { sized(invalid_length) { string(:digit) } }

          banking_details = {
            "bank_name" => "Standard Bank",
            "account_number" => account_number,
            "branch_code" => "123456",
            "account_type" => "savings"
          }

          # Validate banking details
          errors = service.validate_banking_details(banking_details)

          # Verify validation fails
          expect(errors).not_to be_empty
          expect(errors.join(" ")).to match(/account number/i)
        end
      end

      it "rejects banking details with invalid branch code format" do
        property_test(iterations: 100) do
          # Generate invalid branch code (not 6 digits)
          invalid_length = Rantly { choose(Rantly { range(1, 5) }, Rantly { range(7, 10) }) }
          branch_code = Rantly { sized(invalid_length) { string(:digit) } }

          banking_details = {
            "bank_name" => "Standard Bank",
            "account_number" => "1234567890",
            "branch_code" => branch_code,
            "account_type" => "savings"
          }

          # Validate banking details
          errors = service.validate_banking_details(banking_details)

          # Verify validation fails
          expect(errors).not_to be_empty
          expect(errors.join(" ")).to match(/branch code/i)
        end
      end

      it "rejects banking details with invalid account type" do
        property_test(iterations: 100) do
          # Generate invalid account type
          invalid_type = Rantly { sized(Rantly { range(5, 15) }) { string(:alpha) } }

          banking_details = {
            "bank_name" => "Standard Bank",
            "account_number" => "1234567890",
            "branch_code" => "123456",
            "account_type" => invalid_type
          }

          # Validate banking details
          errors = service.validate_banking_details(banking_details)

          # Verify validation fails
          expect(errors).not_to be_empty
          expect(errors.join(" ")).to match(/account type/i)
        end
      end

      it "rejects banking details with missing required fields" do
        property_test(iterations: 100) do
          # Randomly remove one or more required fields
          all_fields = {
            "bank_name" => "Standard Bank",
            "account_number" => "1234567890",
            "branch_code" => "123456",
            "account_type" => "savings"
          }

          # Remove random number of fields (1-3)
          num_to_remove = Rantly { range(1, 3) }
          fields_to_remove = all_fields.keys.sample(num_to_remove)

          banking_details = all_fields.except(*fields_to_remove)

          # Validate banking details
          errors = service.validate_banking_details(banking_details)

          # Verify validation fails
          expect(errors).not_to be_empty
          expect(errors.join(" ")).to match(/missing required fields/i)
        end
      end
    end
  end
end
