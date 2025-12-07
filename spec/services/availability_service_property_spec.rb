# frozen_string_literal: true

require "rails_helper"

RSpec.describe AvailabilityService, type: :service do
  let(:service) { described_class.new }

  # Mock Airtable adapter to avoid real API calls
  before do
    allow(Adapters::AirtableAdapter).to receive(:update_record).and_return({
      "id" => "rec#{SecureRandom.hex(8)}",
      "fields" => {},
      "createdTime" => Time.current.iso8601
    })
    allow(Adapters::ResendAdapter).to receive(:send_email).and_return({
      "id" => "msg_#{SecureRandom.hex(8)}"
    })
  end

  describe "Property-Based Tests" do
    # Feature: consultant-gateway-system, Property 71: Availability Synchronization
    # Validates: Requirements 21.1
    describe "Property 71: Availability Synchronization" do
      it "synchronizes any consultant availability status update to Airtable talent pool records" do
        property_test(iterations: 100) do
          # Create a consultant with Airtable ID
          user = create(:user, email: "test#{SecureRandom.hex(8)}@example.com")
          consultant = create(:consultant, user: user, airtable_id: "rec#{SecureRandom.hex(8)}")

          # Generate random availability status
          availability_status = Rantly { choose("available", "partially_available", "unavailable") }

          # Update availability
          result = service.update_availability(consultant, availability_status)

          # Verify update succeeded
          expect(result[:success]).to be true
          expect(result[:errors]).to be_empty

          # Verify consultant was updated locally
          consultant.reload
          expect(consultant.availability_status).to eq(availability_status)

          # Verify Airtable adapter was called with correct parameters
          expect(Adapters::AirtableAdapter).to have_received(:update_record).with(
            hash_including(
              base_id: AvailabilityService::AIRTABLE_BASE_ID,
              table: AvailabilityService::TALENT_POOL_TABLE,
              record_id: consultant.airtable_id,
              fields: hash_including(
                "Availability Status" => availability_status.titleize
              )
            )
          )

          # Verify audit log was created
          audit_log = AuditLog.where(
            action: "availability_update",
            resource_type: "Consultant",
            resource_id: consultant.id
          ).last
          expect(audit_log).to be_present
          expect(audit_log.change_data["availability_status"]).to eq(availability_status)
        end
      end

      it "handles availability sync even when Airtable ID is not present" do
        property_test(iterations: 100) do
          # Create a consultant without Airtable ID
          user = create(:user, email: "test#{SecureRandom.hex(8)}@example.com")
          consultant = create(:consultant, user: user, airtable_id: nil)

          # Generate random availability status
          availability_status = Rantly { choose("available", "partially_available", "unavailable") }

          # Update availability
          result = service.update_availability(consultant, availability_status)

          # Verify update succeeded locally even without Airtable sync
          expect(result[:success]).to be true
          expect(result[:errors]).to be_empty

          # Verify consultant was updated
          consultant.reload
          expect(consultant.availability_status).to eq(availability_status)

          # Verify Airtable adapter was NOT called (no airtable_id)
          expect(Adapters::AirtableAdapter).not_to have_received(:update_record)
        end
      end

      it "rejects invalid availability status values" do
        property_test(iterations: 100) do
          # Create a consultant
          user = create(:user, email: "test#{SecureRandom.hex(8)}@example.com")
          consultant = create(:consultant, user: user)

          # Generate invalid availability status
          invalid_status = Rantly { sized(Rantly { range(5, 20) }) { string(:alpha) } }

          # Attempt to update with invalid status
          result = service.update_availability(consultant, invalid_status)

          # Verify update failed
          expect(result[:success]).to be false
          expect(result[:errors]).not_to be_empty
          expect(result[:errors].join(" ")).to match(/invalid availability status/i)
        end
      end
    end

    # Feature: consultant-gateway-system, Property 72: Skills-Based Consultant Filtering
    # Validates: Requirements 21.3
    describe "Property 72: Skills-Based Consultant Filtering" do
      it "provides a filtered view of available consultants matching any required capabilities" do
        property_test(iterations: 100) do
          # Generate random skills
          all_skills = [ "Ruby", "Rails", "JavaScript", "React", "Python", "Django", "Java", "Spring" ]
          num_required_skills = Rantly { range(1, 3) }
          required_skills = all_skills.sample(num_required_skills)

          # Create consultants with various skill combinations
          consultants_with_skills = []
          consultants_without_skills = []

          # Create 3-5 consultants that have ALL required skills
          Rantly { range(3, 5) }.times do
            user = create(:user, email: "match#{SecureRandom.hex(8)}@example.com", active: true)
            # Add required skills plus some random additional skills
            all_consultant_skills = required_skills + all_skills.sample(Rantly { range(1, 3) })
            consultant = create(:consultant,
              user: user,
              skills: all_consultant_skills.uniq,
              availability_status: "available"
            )
            consultants_with_skills << consultant
          end

          # Create 2-4 consultants that DON'T have all required skills
          Rantly { range(2, 4) }.times do
            user = create(:user, email: "nomatch#{SecureRandom.hex(8)}@example.com", active: true)
            # Give them some skills but not all required ones
            partial_skills = (all_skills - required_skills).sample(Rantly { range(1, 3) })
            consultant = create(:consultant,
              user: user,
              skills: partial_skills,
              availability_status: "available"
            )
            consultants_without_skills << consultant
          end

          # Filter by required skills
          result = service.filter_by_skills(required_skills, availability_filter: "available")

          # Verify all returned consultants have ALL required skills
          result.each do |consultant|
            required_skills.each do |skill|
              expect(consultant.skills).to include(skill),
                "Expected consultant #{consultant.id} to have skill '#{skill}', but skills were: #{consultant.skills}"
            end
          end

          # Verify consultants with all skills are included
          consultants_with_skills.each do |consultant|
            expect(result.map(&:id)).to include(consultant.id),
              "Expected consultant #{consultant.id} with skills #{consultant.skills} to be in results"
          end

          # Verify consultants without all skills are excluded
          consultants_without_skills.each do |consultant|
            expect(result.map(&:id)).not_to include(consultant.id),
              "Expected consultant #{consultant.id} with skills #{consultant.skills} to NOT be in results"
          end

          # Verify results are sorted by utilization (ascending)
          utilizations = result.map { |c| c.utilization_percentage || 0 }
          expect(utilizations).to eq(utilizations.sort)
        end
      end

      it "filters by availability status when specified" do
        property_test(iterations: 100) do
          # Generate random skills
          required_skills = [ "Ruby", "Rails" ]

          # Create consultants with different availability statuses
          available_consultant = create(:consultant,
            user: create(:user, email: "available#{SecureRandom.hex(8)}@example.com", active: true),
            skills: required_skills,
            availability_status: "available"
          )

          partially_available_consultant = create(:consultant,
            user: create(:user, email: "partial#{SecureRandom.hex(8)}@example.com", active: true),
            skills: required_skills,
            availability_status: "partially_available"
          )

          unavailable_consultant = create(:consultant,
            user: create(:user, email: "unavailable#{SecureRandom.hex(8)}@example.com", active: true),
            skills: required_skills,
            availability_status: "unavailable"
          )

          # Filter for only available consultants
          result = service.filter_by_skills(required_skills, availability_filter: "available")

          # Verify only available consultants are returned
          expect(result.map(&:id)).to include(available_consultant.id)
          expect(result.map(&:id)).not_to include(partially_available_consultant.id)
          expect(result.map(&:id)).not_to include(unavailable_consultant.id)
        end
      end

      it "returns empty array when no required skills are provided" do
        property_test(iterations: 100) do
          # Create some consultants
          create(:consultant,
            user: create(:user, email: "test#{SecureRandom.hex(8)}@example.com", active: true),
            skills: [ "Ruby", "Rails" ]
          )

          # Filter with empty skills
          result = service.filter_by_skills([])

          # Verify empty result
          expect(result).to eq([])
        end
      end
    end

    # Feature: consultant-gateway-system, Property 73: Automatic Availability Updates
    # Validates: Requirements 21.4
    describe "Property 73: Automatic Availability Updates" do
      it "automatically updates availability status and calculates projected utilization for any consultant assigned to a project" do
        property_test(iterations: 100) do
          # Create a consultant
          user = create(:user, email: "test#{SecureRandom.hex(8)}@example.com", active: true)
          consultant = create(:consultant,
            user: user,
            availability_status: "available",
            utilization_percentage: 0,
            airtable_id: "rec#{SecureRandom.hex(8)}"
          )

          # Create a project
          project = create(:project, name: "Test Project #{SecureRandom.hex(4)}")

          # Generate random allocated hours
          allocated_hours = Rantly { range(20, 180) }

          # Store initial availability status
          initial_status = consultant.availability_status

          # Reset mock to track calls for this iteration
          allow(Adapters::AirtableAdapter).to receive(:update_record).and_return({
            "id" => "rec#{SecureRandom.hex(8)}",
            "fields" => {},
            "createdTime" => Time.current.iso8601
          })

          # Create project assignment without triggering callbacks
          assignment = nil
          ProjectAssignment.skip_callback(:create, :after, :update_consultant_availability)
          ProjectAssignment.skip_callback(:update, :after, :update_consultant_availability)
          ProjectAssignment.skip_callback(:destroy, :after, :update_consultant_availability)

          assignment = create(:project_assignment,
            consultant: consultant,
            project: project,
            allocated_hours: allocated_hours,
            start_date: Date.current,
            end_date: Date.current + 30.days
          )

          ProjectAssignment.set_callback(:create, :after, :update_consultant_availability)
          ProjectAssignment.set_callback(:update, :after, :update_consultant_availability)
          ProjectAssignment.set_callback(:destroy, :after, :update_consultant_availability)

          # Update availability based on assignment
          result = service.update_on_project_assignment(consultant, assignment)

          # Verify update succeeded
          expect(result[:success]).to be(true), "Expected success but got: #{result.inspect}"

          # Verify utilization was calculated
          consultant.reload
          expected_utilization = (allocated_hours.to_f / AvailabilityService::STANDARD_MONTHLY_HOURS * 100).round(2)
          expect(consultant.utilization_percentage).to eq(expected_utilization)

          # Verify availability status was updated based on utilization
          expected_status = if expected_utilization >= AvailabilityService::OVERUTILIZATION_THRESHOLD
            "unavailable"
          elsif expected_utilization >= AvailabilityService::HIGH_UTILIZATION_THRESHOLD
            "partially_available"
          else
            "available"
          end

          # Debug output
          if consultant.availability_status != expected_status
            puts "DEBUG: allocated_hours=#{allocated_hours}, expected_utilization=#{expected_utilization}, expected_status=#{expected_status}, actual_status=#{consultant.availability_status}"
            puts "DEBUG: result=#{result.inspect}"
          end

          expect(consultant.availability_status).to eq(expected_status)

          # Verify Airtable sync was called only if status changed
          if initial_status != expected_status
            expect(Adapters::AirtableAdapter).to have_received(:update_record).with(
              hash_including(
                base_id: AvailabilityService::AIRTABLE_BASE_ID,
                table: AvailabilityService::TALENT_POOL_TABLE,
                record_id: consultant.airtable_id
              )
            )

            # Verify audit log was created for status change
            audit_log = AuditLog.where(
              action: "automatic_availability_update",
              resource_type: "Consultant",
              resource_id: consultant.id
            ).last
            expect(audit_log).to be_present
          end
        end
      end

      it "calculates utilization correctly with multiple project assignments" do
        property_test(iterations: 100) do
          # Create a consultant
          user = create(:user, email: "test#{SecureRandom.hex(8)}@example.com", active: true)
          consultant = create(:consultant,
            user: user,
            availability_status: "available",
            utilization_percentage: 0
          )

          # Create multiple projects with random allocated hours
          total_hours = 0
          num_projects = Rantly { range(2, 4) }

          num_projects.times do
            project = create(:project, name: "Project #{SecureRandom.hex(4)}")
            hours = Rantly { range(10, 60) }
            total_hours += hours

            create(:project_assignment,
              consultant: consultant,
              project: project,
              allocated_hours: hours,
              start_date: Date.current,
              end_date: Date.current + 30.days
            )
          end

          # Calculate utilization
          utilization = service.calculate_utilization(consultant)

          # Verify utilization is correct
          expected_utilization = (total_hours.to_f / AvailabilityService::STANDARD_MONTHLY_HOURS * 100).round(2)
          expect(utilization).to eq(expected_utilization)

          consultant.reload
          expect(consultant.utilization_percentage).to eq(expected_utilization)
        end
      end
    end

    # Feature: consultant-gateway-system, Property 74: Utilization Threshold Alerts
    # Validates: Requirements 21.5
    describe "Property 74: Utilization Threshold Alerts" do
      it "alerts resource managers when any utilization threshold is exceeded" do
        property_test(iterations: 100) do
          # Create resource managers (admin and user roles)
          admin = create(:user, email: "admin#{SecureRandom.hex(8)}@example.com", roles: [ "admin" ], active: true)
          manager = create(:user, email: "manager#{SecureRandom.hex(8)}@example.com", roles: [ "user" ], active: true)

          # Create a consultant
          user = create(:user, email: "consultant#{SecureRandom.hex(8)}@example.com", active: true)
          consultant = create(:consultant, user: user)

          # Generate utilization that exceeds threshold
          threshold_type = Rantly { choose(:high, :critical) }

          if threshold_type == :high
            # High utilization (80-99%)
            utilization = Rantly { range(80, 99) }.to_f
          else
            # Critical utilization (100%+)
            utilization = Rantly { range(100, 150) }.to_f
          end

          consultant.update_column(:utilization_percentage, utilization)

          # Check thresholds
          result = service.check_utilization_thresholds(consultant)

          # Verify alert was sent
          expect(result[:alert_sent]).to be true
          expect(result[:utilization]).to eq(utilization)

          if threshold_type == :critical
            expect(result[:level]).to eq(:critical)
            expect(result[:threshold]).to eq(AvailabilityService::OVERUTILIZATION_THRESHOLD)
          else
            expect(result[:level]).to eq(:warning)
            expect(result[:threshold]).to eq(AvailabilityService::HIGH_UTILIZATION_THRESHOLD)
          end

          # Verify email was sent to resource managers
          expect(Adapters::ResendAdapter).to have_received(:send_email).at_least(:once)

          # Verify audit log was created
          audit_log = AuditLog.where(
            action: "utilization_alert",
            resource_type: "Consultant",
            resource_id: consultant.id
          ).last
          expect(audit_log).to be_present
          expect(audit_log.metadata["level"]).to eq(result[:level].to_s)
        end
      end

      it "does not send alerts when utilization is below thresholds" do
        property_test(iterations: 100) do
          # Create a consultant with low utilization
          user = create(:user, email: "test#{SecureRandom.hex(8)}@example.com", active: true)
          consultant = create(:consultant, user: user)

          # Generate utilization below threshold (0-79%)
          utilization = Rantly { range(0, 79) }.to_f
          consultant.update_column(:utilization_percentage, utilization)

          # Reset mock to track calls
          allow(Adapters::ResendAdapter).to receive(:send_email).and_return({
            "id" => "msg_#{SecureRandom.hex(8)}"
          })

          # Check thresholds
          result = service.check_utilization_thresholds(consultant)

          # Verify no alert was sent
          expect(result[:alert_sent]).to be false
          expect(result[:utilization]).to eq(utilization)

          # Verify no email was sent
          expect(Adapters::ResendAdapter).not_to have_received(:send_email)
        end
      end

      it "sends critical alerts for overutilization (100%+)" do
        property_test(iterations: 100) do
          # Create resource manager
          create(:user, email: "admin#{SecureRandom.hex(8)}@example.com", roles: [ "admin" ], active: true)

          # Create a consultant with overutilization
          user = create(:user, email: "test#{SecureRandom.hex(8)}@example.com", active: true)
          consultant = create(:consultant, user: user)

          # Set overutilization (100-200%)
          utilization = Rantly { range(100, 200) }.to_f
          consultant.update_column(:utilization_percentage, utilization)

          # Check thresholds
          result = service.check_utilization_thresholds(consultant)

          # Verify critical alert was sent
          expect(result[:alert_sent]).to be true
          expect(result[:level]).to eq(:critical)
          expect(result[:threshold]).to eq(AvailabilityService::OVERUTILIZATION_THRESHOLD)
        end
      end
    end
  end
end
