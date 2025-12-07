class ApplicationJob < ActiveJob::Base
  # Automatically retry jobs that encountered a deadlock
  retry_on ActiveRecord::Deadlocked, wait: :exponentially_longer, attempts: 5

  # Most jobs are safe to ignore if the underlying records are no longer available
  discard_on ActiveJob::DeserializationError do |job, error|
    Rails.logger.warn("Job #{job.class.name} discarded due to deserialization error: #{error.message}")
  end

  # Add job lifecycle callbacks for monitoring
  before_perform do |job|
    Rails.logger.info("Starting job: #{job.class.name} (#{job.job_id}) with args: #{job.arguments.inspect}")
    @job_start_time = Time.current
  end

  after_perform do |job|
    duration = Time.current - @job_start_time
    Rails.logger.info("Completed job: #{job.class.name} (#{job.job_id}) in #{duration.round(2)}s")

    # Log performance metrics for monitoring
    log_job_performance(job, duration)
  end

  rescue_from(StandardError) do |exception|
    Rails.logger.error("Job #{self.class.name} (#{job_id}) failed: #{exception.message}")
    Rails.logger.error("Backtrace: #{exception.backtrace.join("\n")}")

    # Re-raise to trigger retry logic
    raise exception
  end

  private

  def log_job_performance(job, duration)
    # Log slow jobs for performance monitoring
    if duration > 30.seconds
      Rails.logger.warn("Slow job detected: #{job.class.name} took #{duration.round(2)}s")

      AuditLogger.log(
        action: :slow_job_detected,
        metadata: {
          job_class: job.class.name,
          job_id: job.job_id,
          duration: duration.round(2),
          args: job.arguments
        }
      )
    end
  end
end
