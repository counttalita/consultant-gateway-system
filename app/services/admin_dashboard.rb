# frozen_string_literal: true

# Service for calculating admin analytics and system metrics
# Provides comprehensive system insights for the admin dashboard
class AdminDashboard
  class CalculationError < StandardError; end

  # Get active user count and recent login metrics
  # @param period [ActiveSupport::Duration] Time period to consider (default: 24 hours)
  # @return [Hash] Active user metrics
  def active_users(period: 24.hours)
    cutoff_time = period.ago

    active_sessions = Session.where("last_activity_at > ?", cutoff_time)
    recent_logins = AuditLog.where(action: "login")
                            .where("created_at > ?", cutoff_time)

    {
      active_count: active_sessions.distinct.count(:user_id),
      total_users: User.active.count,
      recent_logins: recent_logins.count,
      unique_login_users: recent_logins.distinct.count(:user_id),
      sessions: active_sessions.count,
      period_hours: (period / 1.hour).to_i
    }
  rescue => e
    Rails.logger.error("Error calculating active users: #{e.message}")
    raise CalculationError, "Failed to calculate active users: #{e.message}"
  end

  # Get integration health status for all external services
  # @return [Hash] Health status for each integration
  def integration_health
    integrations = {
      airtable: check_airtable_health,
      xero: check_xero_health,
      harvest: check_harvest_health,
      clickup: check_clickup_health
    }

    {
      integrations: integrations,
      overall_status: calculate_overall_status(integrations),
      last_checked: Time.current
    }
  rescue => e
    Rails.logger.error("Error checking integration health: #{e.message}")
    raise CalculationError, "Failed to check integration health: #{e.message}"
  end

  # Get activity trends over time
  # @param start_date [Date, Time] Start of period
  # @param end_date [Date, Time] End of period
  # @param granularity [Symbol] :day, :week, or :month
  # @return [Hash] Activity metrics with trends
  def activity_trends(start_date:, end_date:, granularity: :day)
    start_date = start_date.to_date
    end_date = end_date.to_date

    login_data = calculate_login_trends(start_date, end_date, granularity)
    profile_update_data = calculate_profile_update_trends(start_date, end_date, granularity)
    onboarding_data = calculate_onboarding_trends(start_date, end_date, granularity)

    {
      period: {
        start_date: start_date,
        end_date: end_date,
        granularity: granularity
      },
      logins: login_data,
      profile_updates: profile_update_data,
      onboarding_completions: onboarding_data,
      summary: {
        total_logins: login_data[:total],
        total_profile_updates: profile_update_data[:total],
        total_onboarding_completions: onboarding_data[:total]
      }
    }
  rescue => e
    Rails.logger.error("Error calculating activity trends: #{e.message}")
    raise CalculationError, "Failed to calculate activity trends: #{e.message}"
  end

  # Get error aggregation with drill-down capability
  # @param start_date [Date, Time] Start of period (default: 7 days ago)
  # @param end_date [Date, Time] End of period (default: now)
  # @param limit [Integer] Maximum number of errors per type to return
  # @return [Hash] Error metrics grouped by type
  def error_aggregation(start_date: 7.days.ago, end_date: Time.current, limit: 10)
    start_date = start_date.to_time
    end_date = end_date.to_time

    # Get error audit logs
    error_logs = AuditLog.where("action LIKE ?", "%error%")
                         .where(created_at: start_date..end_date)
                         .order(created_at: :desc)

    # Group by error type (extracted from action or metadata)
    errors_by_type = group_errors_by_type(error_logs)

    # Calculate error rates
    total_errors = error_logs.count
    period_hours = ((end_date - start_date) / 1.hour).round(2)
    error_rate = period_hours > 0 ? (total_errors.to_f / period_hours).round(2) : 0

    {
      total_errors: total_errors,
      error_rate_per_hour: error_rate,
      period: {
        start_date: start_date,
        end_date: end_date,
        hours: period_hours
      },
      errors_by_type: errors_by_type.map do |type, logs|
        {
          type: type,
          count: logs.count,
          percentage: total_errors > 0 ? ((logs.count.to_f / total_errors) * 100).round(2) : 0,
          recent_errors: logs.first(limit).map { |log| format_error_log(log) },
          first_occurrence: logs.map(&:created_at).min,
          last_occurrence: logs.map(&:created_at).max
        }
      end.sort_by { |e| -e[:count] }
    }
  rescue => e
    Rails.logger.error("Error aggregating errors: #{e.message}")
    raise CalculationError, "Failed to aggregate errors: #{e.message}"
  end

  # Get data quality assessment
  # @return [Hash] Data quality metrics and issues
  def data_quality_assessment
    incomplete_profiles = assess_incomplete_profiles
    pending_onboarding = assess_pending_onboarding
    missing_integrations = assess_missing_integrations
    stale_data = assess_stale_data

    total_issues = incomplete_profiles[:count] +
                   pending_onboarding[:count] +
                   missing_integrations[:count] +
                   stale_data[:count]

    {
      total_issues: total_issues,
      incomplete_profiles: incomplete_profiles,
      pending_onboarding: pending_onboarding,
      missing_integrations: missing_integrations,
      stale_data: stale_data,
      overall_score: calculate_data_quality_score(
        incomplete_profiles[:count],
        pending_onboarding[:count],
        missing_integrations[:count],
        stale_data[:count]
      )
    }
  rescue => e
    Rails.logger.error("Error assessing data quality: #{e.message}")
    raise CalculationError, "Failed to assess data quality: #{e.message}"
  end

  private

  # Check Airtable integration health
  def check_airtable_health
    last_sync = AuditLog.where("metadata->>'external_system' = ?", "airtable")
                        .where("action LIKE ?", "%sync%")
                        .order(created_at: :desc)
                        .first

    last_error = AuditLog.where("metadata->>'external_system' = ?", "airtable")
                         .where("action LIKE ?", "%error%")
                         .order(created_at: :desc)
                         .first

    status = determine_integration_status(last_sync, last_error)

    {
      status: status,
      last_successful_sync: last_sync&.created_at,
      last_error: last_error&.created_at,
      error_message: last_error&.metadata&.dig("error_message"),
      cached_records: AirtableCache.count
    }
  end

  # Check Xero integration health
  def check_xero_health
    last_operation = AuditLog.where("metadata->>'external_system' = ?", "xero")
                             .where("action IN (?)", %w[invoice_created bill_created supplier_created])
                             .order(created_at: :desc)
                             .first

    last_error = AuditLog.where("metadata->>'external_system' = ?", "xero")
                         .where("action LIKE ?", "%error%")
                         .order(created_at: :desc)
                         .first

    status = determine_integration_status(last_operation, last_error)

    {
      status: status,
      last_successful_operation: last_operation&.created_at,
      last_error: last_error&.created_at,
      error_message: last_error&.metadata&.dig("error_message"),
      synced_consultants: Consultant.synced_to_xero.count
    }
  end

  # Check Harvest integration health
  def check_harvest_health
    last_operation = AuditLog.where("metadata->>'external_system' = ?", "harvest")
                             .where("action IN (?)", %w[harvest_user_created hours_retrieved])
                             .order(created_at: :desc)
                             .first

    last_error = AuditLog.where("metadata->>'external_system' = ?", "harvest")
                         .where("action LIKE ?", "%error%")
                         .order(created_at: :desc)
                         .first

    status = determine_integration_status(last_operation, last_error)

    {
      status: status,
      last_successful_operation: last_operation&.created_at,
      last_error: last_error&.created_at,
      error_message: last_error&.metadata&.dig("error_message"),
      synced_consultants: Consultant.synced_to_harvest.count
    }
  end

  # Check ClickUp integration health
  def check_clickup_health
    last_operation = AuditLog.where("metadata->>'external_system' = ?", "clickup")
                             .where("action IN (?)", %w[project_created task_created])
                             .order(created_at: :desc)
                             .first

    last_error = AuditLog.where("metadata->>'external_system' = ?", "clickup")
                         .where("action LIKE ?", "%error%")
                         .order(created_at: :desc)
                         .first

    status = determine_integration_status(last_operation, last_error)

    {
      status: status,
      last_successful_operation: last_operation&.created_at,
      last_error: last_error&.created_at,
      error_message: last_error&.metadata&.dig("error_message"),
      projects_created: Project.where.not(clickup_project_id: nil).count
    }
  end

  # Determine integration status based on last sync and error
  def determine_integration_status(last_success, last_error)
    return "unknown" if last_success.nil? && last_error.nil?
    return "error" if last_error && (last_success.nil? || last_error.created_at > last_success.created_at)
    return "warning" if last_success && last_success.created_at < 24.hours.ago
    "healthy"
  end

  # Calculate overall integration status
  def calculate_overall_status(integrations)
    statuses = integrations.values.map { |i| i[:status] }
    return "error" if statuses.include?("error")
    return "warning" if statuses.include?("warning")
    return "unknown" if statuses.include?("unknown")
    "healthy"
  end

  # Calculate login trends
  def calculate_login_trends(start_date, end_date, granularity)
    login_logs = AuditLog.where(action: "login")
                         .where(created_at: start_date.beginning_of_day..end_date.end_of_day)

    data_points = group_by_period(login_logs, start_date, end_date, granularity)

    {
      total: login_logs.count,
      data_points: data_points,
      average_per_period: data_points.any? ? (login_logs.count.to_f / data_points.length).round(2) : 0
    }
  end

  # Calculate profile update trends
  def calculate_profile_update_trends(start_date, end_date, granularity)
    profile_logs = AuditLog.where(action: "profile_updated")
                           .where(created_at: start_date.beginning_of_day..end_date.end_of_day)

    data_points = group_by_period(profile_logs, start_date, end_date, granularity)

    {
      total: profile_logs.count,
      data_points: data_points,
      average_per_period: data_points.any? ? (profile_logs.count.to_f / data_points.length).round(2) : 0
    }
  end

  # Calculate onboarding completion trends
  def calculate_onboarding_trends(start_date, end_date, granularity)
    onboarding_logs = AuditLog.where(action: "onboarding_completed")
                              .where(created_at: start_date.beginning_of_day..end_date.end_of_day)

    data_points = group_by_period(onboarding_logs, start_date, end_date, granularity)

    {
      total: onboarding_logs.count,
      data_points: data_points,
      average_per_period: data_points.any? ? (onboarding_logs.count.to_f / data_points.length).round(2) : 0
    }
  end

  # Group audit logs by time period
  def group_by_period(logs, start_date, end_date, granularity)
    periods = generate_periods(start_date, end_date, granularity)

    periods.map do |period_start|
      period_end = case granularity
      when :day then period_start.end_of_day
      when :week then period_start.end_of_week
      when :month then period_start.end_of_month
      else period_start.end_of_day
      end

      count = logs.where(created_at: period_start..period_end).count

      {
        period: period_start.to_date,
        count: count
      }
    end
  end

  # Generate time periods for grouping
  def generate_periods(start_date, end_date, granularity)
    periods = []
    current = start_date.to_date

    while current <= end_date.to_date
      periods << current
      current = case granularity
      when :day then current + 1.day
      when :week then current + 1.week
      when :month then current + 1.month
      else current + 1.day
      end
    end

    periods
  end

  # Group errors by type
  def group_errors_by_type(error_logs)
    error_logs.group_by do |log|
      # Extract error type from action or metadata
      if log.action.include?("_error")
        log.action.gsub("_error", "")
      elsif log.metadata && log.metadata["error_type"]
        log.metadata["error_type"]
      else
        "unknown"
      end
    end
  end

  # Format error log for display
  def format_error_log(log)
    {
      id: log.id,
      timestamp: log.created_at,
      action: log.action,
      user: log.user_email,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      error_message: log.metadata&.dig("error_message") || "No error message",
      ip_address: log.ip_address
    }
  end

  # Assess incomplete consultant profiles
  def assess_incomplete_profiles
    consultants = Consultant.active

    incomplete = consultants.select do |c|
      c.bio.blank? || c.skills.empty? || c.banking_details.blank?
    end

    {
      count: incomplete.count,
      percentage: consultants.any? ? ((incomplete.count.to_f / consultants.count) * 100).round(2) : 0,
      consultants: incomplete.map do |c|
        {
          id: c.id,
          email: c.user.email,
          missing_fields: [
            ("bio" if c.bio.blank?),
            ("skills" if c.skills.empty?),
            ("banking_details" if c.banking_details.blank?)
          ].compact
        }
      end
    }
  end

  # Assess pending onboarding tasks
  def assess_pending_onboarding
    pending = Consultant.where(onboarding_status: %w[pending in_progress])

    {
      count: pending.count,
      consultants: pending.map do |c|
        completed_steps = c.onboarding_steps.where(status: "completed").count
        total_steps = 5 # As defined in onboarding workflow

        {
          id: c.id,
          email: c.user.email,
          status: c.onboarding_status,
          progress: "#{completed_steps}/#{total_steps}",
          progress_percentage: ((completed_steps.to_f / total_steps) * 100).round(2)
        }
      end
    }
  end

  # Assess missing integration syncs
  def assess_missing_integrations
    consultants = Consultant.onboarding_completed

    missing_airtable = consultants.where(airtable_id: nil)
    missing_harvest = consultants.where(harvest_id: nil)
    missing_xero = consultants.where(xero_id: nil)

    {
      count: missing_airtable.count + missing_harvest.count + missing_xero.count,
      missing_airtable: {
        count: missing_airtable.count,
        consultant_ids: missing_airtable.pluck(:id)
      },
      missing_harvest: {
        count: missing_harvest.count,
        consultant_ids: missing_harvest.pluck(:id)
      },
      missing_xero: {
        count: missing_xero.count,
        consultant_ids: missing_xero.pluck(:id)
      }
    }
  end

  # Assess stale cached data
  def assess_stale_data
    stale_threshold = 24.hours.ago
    stale_caches = AirtableCache.where("cached_at < ?", stale_threshold)

    {
      count: stale_caches.count,
      oldest_cache: stale_caches.minimum(:cached_at),
      tables_affected: stale_caches.distinct.pluck(:table)
    }
  end

  # Calculate overall data quality score (0-100)
  def calculate_data_quality_score(incomplete_profiles, pending_onboarding, missing_integrations, stale_data)
    total_consultants = Consultant.count
    return 100 if total_consultants.zero?

    # Weight different issues
    profile_penalty = (incomplete_profiles.to_f / total_consultants) * 30
    onboarding_penalty = (pending_onboarding.to_f / total_consultants) * 25
    integration_penalty = (missing_integrations.to_f / (total_consultants * 3)) * 30 # 3 integrations per consultant
    stale_penalty = [ stale_data * 0.01, 15 ].min # Cap at 15 points

    score = 100 - profile_penalty - onboarding_penalty - integration_penalty - stale_penalty
    [ score.round(2), 0 ].max # Ensure non-negative
  end
end
