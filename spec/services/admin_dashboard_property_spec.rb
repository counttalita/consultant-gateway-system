# frozen_string_literal: true

require "rails_helper"

RSpec.describe AdminDashboard, type: :service do
  include PropertyTestHelpers

  let(:dashboard) { described_class.new }

  describe "Property 61: Integration Health Monitoring" do
    # Feature: consultant-gateway-system, Property 61: Integration Health Monitoring
    # Validates: Requirements 17.2

    it "shows connection status and last successful sync time for all integrations" do
      property_test(iterations: 100) do
        # Generate random integration audit logs
        num_logs = Rantly { range(0, 20) }

        num_logs.times do
          system = Rantly { choose("airtable", "xero", "harvest", "clickup") }
          action = Rantly { choose("#{system}_sync", "invoice_created", "bill_created", "harvest_user_created", "hours_retrieved", "project_created", "#{system}_error") }
          has_error = action.include?("error")

          days_back = Rantly { range(0, 7) }
          seconds_offset = Rantly { range(0, 86400) }

          AuditLog.create!(
            action: action,
            metadata: {
              external_system: system,
              error_message: has_error ? Rantly { string } : nil
            }.compact,
            created_at: days_back.days.ago + seconds_offset.seconds,
            user: nil
          )
        end

        health = dashboard.integration_health

        # Property: Should return health status for all integrations
        expect(health[:integrations]).to have_key(:airtable)
        expect(health[:integrations]).to have_key(:xero)
        expect(health[:integrations]).to have_key(:harvest)
        expect(health[:integrations]).to have_key(:clickup)

        # Property: Each integration should have a status
        %i[airtable xero harvest clickup].each do |integration|
          expect(health[:integrations][integration]).to have_key(:status)
          expect(%w[healthy warning error unknown]).to include(health[:integrations][integration][:status])
        end

        # Property: Should have overall status
        expect(health).to have_key(:overall_status)
        expect(%w[healthy warning error unknown]).to include(health[:overall_status])

        # Property: Should have last_checked timestamp
        expect(health).to have_key(:last_checked)
        expect(health[:last_checked]).to be_a(Time)

        # Cleanup
        AuditLog.delete_all
      end
    end
  end

  describe "Property 62: Activity Metrics Calculation" do
    # Feature: consultant-gateway-system, Property 62: Activity Metrics Calculation
    # Validates: Requirements 17.3

    it "displays charts showing login trends, profile updates, and onboarding completion rates over time" do
      property_test(iterations: 100) do
        # Generate random time period (1-30 days ago to today)
        days_ago = Rantly { range(1, 30) }
        start_date = days_ago.days.ago.to_date
        end_date = Date.current

        # Generate random activity logs
        num_logs = Rantly { range(0, 50) }

        num_logs.times do
          action = Rantly { choose("login", "profile_updated", "onboarding_completed") }
          user = User.create!(
            email: "user_#{SecureRandom.hex(4)}@example.com",
            roles: [ "consultant" ],
            active: true
          )

          # Random timestamp within the period
          timestamp = start_date.to_time + Rantly { range(0, (end_date.to_time - start_date.to_time).to_i) }.seconds

          AuditLog.create!(
            action: action,
            user: user,
            created_at: timestamp
          )
        end

        trends = dashboard.activity_trends(
          start_date: start_date,
          end_date: end_date,
          granularity: :day
        )

        # Property: Should return data for all activity types
        expect(trends).to have_key(:logins)
        expect(trends).to have_key(:profile_updates)
        expect(trends).to have_key(:onboarding_completions)

        # Property: Each activity type should have total and data_points
        %i[logins profile_updates onboarding_completions].each do |activity|
          expect(trends[activity]).to have_key(:total)
          expect(trends[activity]).to have_key(:data_points)
          expect(trends[activity][:total]).to be >= 0
          expect(trends[activity][:data_points]).to be_an(Array)
        end

        # Property: Should have summary with totals
        expect(trends).to have_key(:summary)
        expect(trends[:summary][:total_logins]).to eq(trends[:logins][:total])
        expect(trends[:summary][:total_profile_updates]).to eq(trends[:profile_updates][:total])
        expect(trends[:summary][:total_onboarding_completions]).to eq(trends[:onboarding_completions][:total])

        # Property: Data points should be within the specified period
        trends[:logins][:data_points].each do |point|
          expect(point[:period]).to be >= start_date
          expect(point[:period]).to be <= end_date
        end

        # Cleanup
        AuditLog.delete_all
        User.delete_all
      end
    end
  end

  describe "Property 63: Error Aggregation and Drill-Down" do
    # Feature: consultant-gateway-system, Property 63: Error Aggregation and Drill-Down
    # Validates: Requirements 17.4

    it "shows recent error counts by type with drill-down capability to view detailed error logs" do
      property_test(iterations: 100) do
        # Generate random error logs
        num_errors = Rantly { range(0, 30) }

        num_errors.times do
          error_type = Rantly { choose("airtable", "xero", "harvest", "authentication", "validation") }
          action = "#{error_type}_error"

          days_back = Rantly { range(0, 7) }
          seconds_offset = Rantly { range(0, 86400) }

          AuditLog.create!(
            action: action,
            metadata: {
              error_type: error_type,
              error_message: Rantly { string }
            },
            created_at: days_back.days.ago + seconds_offset.seconds,
            user: nil
          )
        end

        start_date = 7.days.ago
        end_date = Time.current
        errors = dashboard.error_aggregation(start_date: start_date, end_date: end_date, limit: 10)

        # Property: Should return total error count
        expect(errors).to have_key(:total_errors)
        expect(errors[:total_errors]).to be >= 0

        # Property: Should return error rate per hour
        expect(errors).to have_key(:error_rate_per_hour)
        expect(errors[:error_rate_per_hour]).to be >= 0

        # Property: Should group errors by type
        expect(errors).to have_key(:errors_by_type)
        expect(errors[:errors_by_type]).to be_an(Array)

        # Property: Each error type should have required fields
        errors[:errors_by_type].each do |error_type|
          expect(error_type).to have_key(:type)
          expect(error_type).to have_key(:count)
          expect(error_type).to have_key(:percentage)
          expect(error_type).to have_key(:recent_errors)

          # Property: Count should be positive
          expect(error_type[:count]).to be > 0

          # Property: Percentage should be between 0 and 100
          expect(error_type[:percentage]).to be >= 0
          expect(error_type[:percentage]).to be <= 100

          # Property: Recent errors should be limited
          expect(error_type[:recent_errors].length).to be <= 10
        end

        # Property: Sum of all error type counts should equal total errors
        if errors[:errors_by_type].any?
          sum_of_counts = errors[:errors_by_type].sum { |e| e[:count] }
          expect(sum_of_counts).to eq(errors[:total_errors])
        end

        # Cleanup
        AuditLog.delete_all
      end
    end
  end

  describe "Property 64: Data Quality Assessment" do
    # Feature: consultant-gateway-system, Property 64: Data Quality Assessment
    # Validates: Requirements 17.5

    it "highlights incomplete consultant profiles and pending onboarding tasks requiring attention" do
      property_test(iterations: 100) do
        # Generate random consultants with varying data quality
        num_consultants = Rantly { range(1, 10) }

        num_consultants.times do
          user = User.create!(
            email: "consultant_#{SecureRandom.hex(4)}@example.com",
            roles: [ "consultant" ],
            active: true
          )

          # Randomly decide if profile is complete (2/3 chance of true)
          has_bio = Rantly { range(1, 3) } <= 2
          has_skills = Rantly { range(1, 3) } <= 2
          has_banking = Rantly { range(1, 3) } <= 2

          # Randomly decide onboarding status
          onboarding_status = Rantly { choose("pending", "in_progress", "completed") }

          # Randomly decide if synced to external systems (2/3 chance of true)
          has_airtable = Rantly { range(1, 3) } <= 2
          has_harvest = Rantly { range(1, 3) } <= 2
          has_xero = Rantly { range(1, 3) } <= 2

          Consultant.create!(
            user: user,
            bio: has_bio ? Rantly { string } : nil,
            skills: has_skills ? [ Rantly { string } ] : [],
            banking_details: has_banking ? {
              bank_name: "Test Bank",
              account_number: Rantly { string },
              branch_code: Rantly { string },
              account_type: "checking"
            } : nil,
            onboarding_status: onboarding_status,
            airtable_id: has_airtable ? Rantly { string } : nil,
            harvest_id: has_harvest ? Rantly { string } : nil,
            xero_id: has_xero ? Rantly { string } : nil,
            availability_status: "available"
          )
        end

        quality = dashboard.data_quality_assessment

        # Property: Should return total issues count
        expect(quality).to have_key(:total_issues)
        expect(quality[:total_issues]).to be >= 0

        # Property: Should assess incomplete profiles
        expect(quality).to have_key(:incomplete_profiles)
        expect(quality[:incomplete_profiles]).to have_key(:count)
        expect(quality[:incomplete_profiles]).to have_key(:percentage)
        expect(quality[:incomplete_profiles][:count]).to be >= 0

        # Property: Should assess pending onboarding
        expect(quality).to have_key(:pending_onboarding)
        expect(quality[:pending_onboarding]).to have_key(:count)
        expect(quality[:pending_onboarding][:count]).to be >= 0

        # Property: Should assess missing integrations
        expect(quality).to have_key(:missing_integrations)
        expect(quality[:missing_integrations]).to have_key(:count)
        expect(quality[:missing_integrations][:count]).to be >= 0

        # Property: Should have overall quality score between 0 and 100
        expect(quality).to have_key(:overall_score)
        expect(quality[:overall_score]).to be >= 0
        expect(quality[:overall_score]).to be <= 100

        # Property: Total issues should be sum of all issue types
        expected_total = quality[:incomplete_profiles][:count] +
                        quality[:pending_onboarding][:count] +
                        quality[:missing_integrations][:count] +
                        quality[:stale_data][:count]
        expect(quality[:total_issues]).to eq(expected_total)

        # Cleanup
        Consultant.delete_all
        User.delete_all
      end
    end
  end
end
