# frozen_string_literal: true

require "rails_helper"

RSpec.describe AdminDashboard, type: :service do
  let(:dashboard) { described_class.new }

  describe "#active_users" do
    it "returns active user metrics" do
      # Create some test data
      user = User.create!(email: "test@example.com", roles: [ "consultant" ], active: true)
      Session.create!(user: user, token: SecureRandom.hex(32), expires_at: 1.hour.from_now, last_activity_at: 10.minutes.ago)
      AuditLog.create!(action: "login", user: user, created_at: 1.hour.ago)

      result = dashboard.active_users

      expect(result).to have_key(:active_count)
      expect(result).to have_key(:total_users)
      expect(result).to have_key(:recent_logins)
      expect(result[:active_count]).to be >= 0
      expect(result[:total_users]).to be >= 0
    end
  end

  describe "#integration_health" do
    it "returns health status for all integrations" do
      result = dashboard.integration_health

      expect(result).to have_key(:integrations)
      expect(result[:integrations]).to have_key(:airtable)
      expect(result[:integrations]).to have_key(:xero)
      expect(result[:integrations]).to have_key(:harvest)
      expect(result[:integrations]).to have_key(:clickup)
      expect(result).to have_key(:overall_status)
    end
  end

  describe "#activity_trends" do
    it "returns activity metrics for a given period" do
      start_date = 7.days.ago.to_date
      end_date = Date.current

      result = dashboard.activity_trends(start_date: start_date, end_date: end_date, granularity: :day)

      expect(result).to have_key(:logins)
      expect(result).to have_key(:profile_updates)
      expect(result).to have_key(:onboarding_completions)
      expect(result).to have_key(:summary)
    end
  end

  describe "#error_aggregation" do
    it "returns error metrics grouped by type" do
      result = dashboard.error_aggregation

      expect(result).to have_key(:total_errors)
      expect(result).to have_key(:error_rate_per_hour)
      expect(result).to have_key(:errors_by_type)
      expect(result[:errors_by_type]).to be_an(Array)
    end
  end

  describe "#data_quality_assessment" do
    it "returns data quality metrics" do
      result = dashboard.data_quality_assessment

      expect(result).to have_key(:total_issues)
      expect(result).to have_key(:incomplete_profiles)
      expect(result).to have_key(:pending_onboarding)
      expect(result).to have_key(:missing_integrations)
      expect(result).to have_key(:overall_score)
      expect(result[:overall_score]).to be >= 0
      expect(result[:overall_score]).to be <= 100
    end
  end
end
