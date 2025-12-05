# frozen_string_literal: true

require "rails_helper"

RSpec.describe OnboardingService, type: :service do
  include ActiveSupport::Testing::TimeHelpers

  let(:service) { described_class.new }

  # Mock external adapters to avoid real HTTP requests
  before do
    allow(Adapters::ResendAdapter).to receive(:send_email).and_return("msg_#{SecureRandom.hex(16)}")
    allow(ProfileSyncJob).to receive(:perform_later).and_return(true)
  end

  describe "Property-Based Tests" do
    # Feature: consultant-gateway-system, Property 10: Onboarding Step Validation
    # Validates: Requirements 3.2
    describe "Property 10: Onboarding Step Validation" do
      it "validates any onboarding step submission before allowing progression" do
        property_test(iterations: 100) do
          # Create consultant with onboarding steps
          user = create(:user, roles: ["consultant"])
          consultant = create(:consultant, user: user, onboarding_status: "in_progress")
          service.initialize_onboarding(consultant)

          # Test each step with valid and invalid data
          OnboardingStep::STEP_ORDER.each do |step_name|
            step = consultant.onboarding_steps.find_by(step_name: step_name)

            # Generate valid data for this step
            valid_data = case step_name
            when "personal_info"
              {
                first_name: Rantly { sized(10) { string(:alpha) } },
                last_name: Rantly { sized(10) { string(:alpha) } },
                phone_number: "0#{Rantly { range(10, 99) }}#{Rantly { range(1000000, 9999999) }}",
                id_number: "#{Rantly { range(1000000000000, 9999999999999) }}"
              }
            when "banking"
              {
                bank_name: ["FNB", "Standard Bank", "ABSA", "Nedbank", "Capitec"].sample,
                account_number: "#{Rantly { range(100000000, 99999999999) }}",
                branch_code: "#{Rantly { range(100000, 999999) }}",
                account_type: ["current", "savings", "transmission"].sample
              }
            when "skills"
              {
                skills: Rantly { array(range(1, 10)) { sized(10) { string(:alpha) } } },
                bio: Rantly { sized(range(50, 500)) { string(:alpha) } }
              }
            when "contract"
              {
                contract_accepted: true,
                signature: Rantly { sized(20) { string(:alpha) } },
                signed_at: Time.current.iso8601
              }
            when "welcome"
              {}
            end

            # Complete step with valid data
            result = service.complete_step(
              consultant: consultant,
              step_name: step_name,
              data: valid_data,
              ip_address: "127.0.0.1"
            )

            # Verify step was validated and completed
            expect(result[:success]).to be true
            expect(result[:step].completed?).to be true

            # Verify audit log was created
            audit_log = AuditLog.where(
              action: "onboarding_step_completed",
              resource_type: "Consultant",
              resource_id: consultant.id
            ).last
            expect(audit_log).to be_present
            expect(audit_log.change_data["step_name"]).to eq(step_name)
          end

          # Verify all steps are completed
          expect(consultant.onboarding_steps.all?(&:completed?)).to be true
        end
      end

      it "rejects invalid data for any onboarding step" do
        property_test(iterations: 100) do
          # Create consultant with onboarding steps
          user = create(:user, roles: ["consultant"])
          consultant = create(:consultant, user: user, onboarding_status: "in_progress")
          service.initialize_onboarding(consultant)

          # Test personal_info step with invalid data
          step = consultant.onboarding_steps.find_by(step_name: "personal_info")

          # Generate invalid data (missing required fields)
          invalid_data = {
            first_name: "", # Empty first name
            last_name: Rantly { sized(10) { string(:alpha) } },
            phone_number: "invalid", # Invalid phone format
            id_number: "123" # Invalid ID format
          }

          result = service.complete_step(
            consultant: consultant,
            step_name: "personal_info",
            data: invalid_data,
            ip_address: "127.0.0.1"
          )

          # Verify validation failed
          expect(result[:success]).to be false
          expect(result[:errors]).to be_present
          expect(result[:errors].length).to be > 0

          # Verify step was not completed
          step.reload
          expect(step.completed?).to be false
        end
      end

      it "prevents progression to next step if previous step is not completed" do
        property_test(iterations: 100) do
          # Create consultant with onboarding steps
          user = create(:user, roles: ["consultant"])
          consultant = create(:consultant, user: user, onboarding_status: "in_progress")
          service.initialize_onboarding(consultant)

          # Try to complete second step without completing first
          second_step = consultant.onboarding_steps.find_by(step_name: "banking")

          banking_data = {
            bank_name: "FNB",
            account_number: "#{Rantly { range(100000000, 99999999999) }}",
            branch_code: "#{Rantly { range(100000, 999999) }}",
            account_type: "current"
          }

          # Should raise error because previous step is not completed
          expect {
            service.complete_step(
              consultant: consultant,
              step_name: "banking",
              data: banking_data,
              ip_address: "127.0.0.1"
            )
          }.to raise_error(OnboardingService::StepNotReadyError, /Previous step must be completed first/)

          # Verify step was not completed
          second_step.reload
          expect(second_step.completed?).to be false
        end
      end
    end

    # Feature: consultant-gateway-system, Property 11: Onboarding Completion Triggers
    # Validates: Requirements 3.4
    describe "Property 11: Onboarding Completion Triggers" do
      it "marks consultant as Active in Airtable and triggers welcome pack for any completed onboarding" do
        property_test(iterations: 100) do
          # Create consultant with onboarding steps
          user = create(:user, roles: ["consultant"])
          consultant = create(:consultant, user: user, onboarding_status: "in_progress")
          service.initialize_onboarding(consultant)

          # Complete all steps
          OnboardingStep::STEP_ORDER.each do |step_name|
            valid_data = case step_name
            when "personal_info"
              {
                first_name: Rantly { sized(10) { string(:alpha) } },
                last_name: Rantly { sized(10) { string(:alpha) } },
                phone_number: "0#{Rantly { range(10, 99) }}#{Rantly { range(1000000, 9999999) }}",
                id_number: "#{Rantly { range(1000000000000, 9999999999999) }}"
              }
            when "banking"
              {
                bank_name: ["FNB", "Standard Bank", "ABSA", "Nedbank", "Capitec"].sample,
                account_number: "#{Rantly { range(100000000, 99999999999) }}",
                branch_code: "#{Rantly { range(100000, 999999) }}",
                account_type: ["current", "savings", "transmission"].sample
              }
            when "skills"
              {
                skills: Rantly { array(range(1, 10)) { sized(10) { string(:alpha) } } },
                bio: Rantly { sized(range(50, 500)) { string(:alpha) } }
              }
            when "contract"
              {
                contract_accepted: true,
                signature: Rantly { sized(20) { string(:alpha) } },
                signed_at: Time.current.iso8601
              }
            when "welcome"
              {}
            end

            service.complete_step(
              consultant: consultant,
              step_name: step_name,
              data: valid_data,
              ip_address: "127.0.0.1"
            )
          end

          # Verify consultant status is updated
          consultant.reload
          expect(consultant.onboarding_status).to eq("completed")

          # Verify Airtable sync was queued
          expect(ProfileSyncJob).to have_received(:perform_later).with(
            consultant.id,
            hash_including(status: "Active")
          )

          # Verify welcome email was sent
          expect(Adapters::ResendAdapter).to have_received(:send_email).with(
            hash_including(
              to: user.email,
              template: "welcome_pack"
            )
          )

          # Verify audit log was created
          audit_log = AuditLog.where(
            action: "onboarding_completed",
            resource_type: "Consultant",
            resource_id: consultant.id
          ).last
          expect(audit_log).to be_present
        end
      end
    end

    # Feature: consultant-gateway-system, Property 12: Onboarding Progress Persistence
    # Validates: Requirements 3.5
    describe "Property 12: Onboarding Progress Persistence" do
      it "saves progress and allows resumption from last completed step for any consultant" do
        property_test(iterations: 100) do
          # Create consultant with onboarding steps
          user = create(:user, roles: ["consultant"])
          consultant = create(:consultant, user: user, onboarding_status: "in_progress")
          service.initialize_onboarding(consultant)

          # Complete a random number of steps (1 to 3)
          steps_to_complete = Rantly { range(1, 3) }

          completed_steps = []
          steps_to_complete.times do |i|
            step_name = OnboardingStep::STEP_ORDER[i]
            completed_steps << step_name

            valid_data = case step_name
            when "personal_info"
              {
                first_name: Rantly { sized(10) { string(:alpha) } },
                last_name: Rantly { sized(10) { string(:alpha) } },
                phone_number: "0#{Rantly { range(10, 99) }}#{Rantly { range(1000000, 9999999) }}",
                id_number: "#{Rantly { range(1000000000000, 9999999999999) }}"
              }
            when "banking"
              {
                bank_name: ["FNB", "Standard Bank", "ABSA", "Nedbank", "Capitec"].sample,
                account_number: "#{Rantly { range(100000000, 99999999999) }}",
                branch_code: "#{Rantly { range(100000, 999999) }}",
                account_type: ["current", "savings", "transmission"].sample
              }
            when "skills"
              {
                skills: Rantly { array(range(1, 10)) { sized(10) { string(:alpha) } } },
                bio: Rantly { sized(range(50, 500)) { string(:alpha) } }
              }
            end

            service.complete_step(
              consultant: consultant,
              step_name: step_name,
              data: valid_data,
              ip_address: "127.0.0.1"
            )
          end

          # Simulate consultant leaving and returning
          # Resume onboarding
          progress = service.resume_onboarding(consultant)

          # Verify progress was saved
          expect(progress[:completed_steps]).to eq(steps_to_complete)
          expect(progress[:total_steps]).to eq(OnboardingStep::STEP_ORDER.length)

          # Verify current step is the next incomplete step
          current_step = progress[:current_step]
          expect(current_step).to be_present
          expect(current_step.step_name).to eq(OnboardingStep::STEP_ORDER[steps_to_complete])
          expect(current_step.completed?).to be false

          # Verify all completed steps are marked as completed
          completed_steps.each do |step_name|
            step = consultant.onboarding_steps.find_by(step_name: step_name)
            expect(step.completed?).to be true
            expect(step.completed_at).to be_present
          end

          # Verify audit log was created for resumption
          audit_log = AuditLog.where(
            action: "onboarding_resumed",
            resource_type: "Consultant",
            resource_id: consultant.id
          ).last
          expect(audit_log).to be_present
        end
      end

      it "initializes steps if consultant returns with no existing steps" do
        property_test(iterations: 100) do
          # Create consultant without onboarding steps
          user = create(:user, roles: ["consultant"])
          consultant = create(:consultant, user: user, onboarding_status: "pending")

          # Resume onboarding (should initialize steps)
          progress = service.resume_onboarding(consultant)

          # Verify steps were initialized
          expect(consultant.onboarding_steps.count).to eq(OnboardingStep::STEP_ORDER.length)
          expect(progress[:total_steps]).to eq(OnboardingStep::STEP_ORDER.length)
          expect(progress[:completed_steps]).to eq(0)

          # Verify first step is in progress
          first_step = consultant.onboarding_steps.ordered.first
          expect(first_step.in_progress?).to be true

          # Verify remaining steps are pending
          remaining_steps = consultant.onboarding_steps.ordered[1..-1]
          remaining_steps.each do |step|
            expect(step.pending?).to be true
          end
        end
      end
    end
  end
end
