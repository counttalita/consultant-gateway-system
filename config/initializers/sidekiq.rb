# frozen_string_literal: true

# Helper methods for error classification and notification
module SidekiqHelpers
  def self.critical_error?(exception, context)
    # Critical errors that need immediate attention
    critical_job_classes = %w[
      EmailJob
      FinancialOperationJob
      MonthEndJob
    ]

    job_class = context[:job]&.[]("class")
    critical_job_classes.include?(job_class) ||
      exception.is_a?(Adapters::XeroAdapter::ApiError) ||
      exception.is_a?(Adapters::HarvestAdapter::ApiError)
  end

  def self.notify_administrators_of_critical_error(exception, context)
    # Queue email notification for critical errors
    # Use perform_now to avoid infinite loop if EmailJob itself fails
    begin
      EmailJob.perform_now(
        "admin_notification",
        ENV.fetch("ADMIN_EMAIL", "admin@uptimeconsulting.com"),
        {
          subject: "Critical Job Error",
          message: "A critical background job encountered an error",
          details: {
            error: exception.message,
            job_class: context[:job]&.[]("class"),
            job_id: context[:job]&.[]("jid")
          },
          priority: "critical"
        }
      )
    rescue StandardError => e
      Rails.logger.error("Failed to send critical error notification: #{e.message}")
    end
  end

  def self.notify_administrators_of_dead_job(job, exception)
    # Notify administrators when a job dies after all retries
    begin
      EmailJob.perform_now(
        "admin_notification",
        ENV.fetch("ADMIN_EMAIL", "admin@uptimeconsulting.com"),
        {
          subject: "Background Job Failed Permanently",
          message: "A background job has failed after all retry attempts",
          details: {
            job_class: job["class"],
            job_id: job["jid"],
            error: exception.message,
            retry_count: job["retry_count"]
          },
          priority: "high"
        }
      )
    rescue StandardError => e
      Rails.logger.error("Failed to send dead job notification: #{e.message}")
    end
  end
end

Sidekiq.configure_server do |config|
  config.redis = { url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0") }

  # Set up error handlers for monitoring
  config.error_handlers << lambda do |ex, ctx_hash|
    Rails.logger.error("Sidekiq error: #{ex.message}")
    Rails.logger.error("Context: #{ctx_hash}")
    Rails.logger.error("Backtrace: #{ex.backtrace.join("\n")}")

    # Log to audit system for critical errors
    if SidekiqHelpers.critical_error?(ex, ctx_hash)
      AuditLogger.log(
        action: :critical_job_error,
        metadata: {
          error_class: ex.class.name,
          error_message: ex.message,
          job_class: ctx_hash[:job]&.[]("class"),
          job_id: ctx_hash[:job]&.[]("jid"),
          queue: ctx_hash[:job]&.[]("queue"),
          args: ctx_hash[:job]&.[]("args"),
          retry_count: ctx_hash[:job]&.[]("retry_count")
        }
      )

      # Send notification for critical errors
      SidekiqHelpers.notify_administrators_of_critical_error(ex, ctx_hash)
    end
  end

  # Monitor job lifecycle
  config.on(:startup) do
    Rails.logger.info("Sidekiq server started")
  end

  config.on(:quiet) do
    Rails.logger.info("Sidekiq server quieting down")
  end

  config.on(:shutdown) do
    Rails.logger.info("Sidekiq server shutting down")
  end

  # Configure dead job retention and handling
  config.death_handlers << lambda do |job, ex|
    Rails.logger.error("Job #{job['class']} died after all retries: #{ex.message}")

    AuditLogger.log(
      action: :job_died,
      metadata: {
        job_class: job["class"],
        job_id: job["jid"],
        queue: job["queue"],
        error: ex.message,
        args: job["args"],
        retry_count: job["retry_count"],
        failed_at: Time.current
      }
    )

    # Notify administrators of dead jobs
    SidekiqHelpers.notify_administrators_of_dead_job(job, ex)
  end
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0") }
end

# Configure retry and dead job settings
Sidekiq.default_job_options = {
  "backtrace" => true,
  "retry" => 25,
  "dead" => true
}
