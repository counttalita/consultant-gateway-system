# frozen_string_literal: true

# Service for monitoring background job health and performance
class JobMonitor
  # Get statistics about job queues
  # @return [Hash] Queue statistics including size, latency, and processed counts
  def self.queue_stats
    return {} unless sidekiq_available?

    stats = Sidekiq::Stats.new

    {
      processed: stats.processed,
      failed: stats.failed,
      scheduled_size: stats.scheduled_size,
      retry_size: stats.retry_size,
      dead_size: stats.dead_size,
      enqueued: stats.enqueued,
      queues: queue_details
    }
  end

  # Get details about each queue
  # @return [Hash] Details for each queue including size and latency
  def self.queue_details
    return {} unless sidekiq_available?

    Sidekiq::Queue.all.each_with_object({}) do |queue, hash|
      hash[queue.name] = {
        size: queue.size,
        latency: queue.latency.round(2)
      }
    end
  end

  # Get recent failed jobs
  # @param limit [Integer] Maximum number of failed jobs to return
  # @return [Array<Hash>] Array of failed job details
  def self.recent_failures(limit: 10)
    return [] unless sidekiq_available?

    retry_set = Sidekiq::RetrySet.new
    retry_set.take(limit).map do |job|
      {
        job_class: job.klass,
        queue: job.queue,
        error_message: job.item["error_message"],
        error_class: job.item["error_class"],
        failed_at: Time.at(job.item["failed_at"]),
        retry_count: job.item["retry_count"],
        args: job.args
      }
    end
  end

  # Get dead jobs (jobs that failed all retries)
  # @param limit [Integer] Maximum number of dead jobs to return
  # @return [Array<Hash>] Array of dead job details
  def self.dead_jobs(limit: 10)
    return [] unless sidekiq_available?

    dead_set = Sidekiq::DeadSet.new
    dead_set.take(limit).map do |job|
      {
        job_class: job.klass,
        queue: job.queue,
        error_message: job.item["error_message"],
        error_class: job.item["error_class"],
        failed_at: Time.at(job.item["failed_at"]),
        retry_count: job.item["retry_count"],
        args: job.args
      }
    end
  end

  # Get currently processing jobs
  # @return [Array<Hash>] Array of currently running jobs
  def self.processing_jobs
    return [] unless sidekiq_available?

    workers = Sidekiq::Workers.new
    workers.map do |process_id, thread_id, work|
      {
        job_class: work["payload"]["class"],
        queue: work["queue"],
        run_at: Time.at(work["run_at"]),
        args: work["payload"]["args"]
      }
    end
  end

  # Get job health status
  # @return [Hash] Overall health status of the job system
  def self.health_status
    return { status: "unavailable", message: "Sidekiq not available" } unless sidekiq_available?

    stats = Sidekiq::Stats.new
    retry_set = Sidekiq::RetrySet.new
    dead_set = Sidekiq::DeadSet.new

    # Determine health based on various metrics
    status = if dead_set.size > 10
      "critical"
    elsif retry_set.size > 50
      "warning"
    elsif stats.enqueued > 1000
      "warning"
    else
      "healthy"
    end

    {
      status: status,
      processed_total: stats.processed,
      failed_total: stats.failed,
      enqueued: stats.enqueued,
      retry_count: retry_set.size,
      dead_count: dead_set.size,
      failure_rate: calculate_failure_rate(stats),
      last_checked: Time.current
    }
  end

  # Clear dead jobs
  # @return [Integer] Number of jobs cleared
  def self.clear_dead_jobs
    return 0 unless sidekiq_available?

    dead_set = Sidekiq::DeadSet.new
    count = dead_set.size
    dead_set.clear
    count
  end

  # Retry all failed jobs
  # @return [Integer] Number of jobs retried
  def self.retry_all_failed
    return 0 unless sidekiq_available?

    retry_set = Sidekiq::RetrySet.new
    count = retry_set.size
    retry_set.each(&:retry)
    count
  end

  # Get job performance metrics
  # @param job_class [String] Job class name
  # @param period [ActiveSupport::Duration] Time period to analyze
  # @return [Hash] Performance metrics for the job class
  def self.job_performance_metrics(job_class, period: 24.hours)
    # Query audit logs for job performance data
    logs = AuditLog.where(
      action: :slow_job_detected,
      created_at: period.ago..Time.current
    ).where("metadata->>'job_class' = ?", job_class)

    return { job_class: job_class, metrics: "No data available" } if logs.empty?

    durations = logs.pluck("(metadata->>'duration')::float")

    {
      job_class: job_class,
      total_slow_jobs: logs.count,
      average_duration: (durations.sum / durations.size).round(2),
      max_duration: durations.max.round(2),
      min_duration: durations.min.round(2),
      period: period
    }
  end

  # Private helper methods
  class << self
    private

    def sidekiq_available?
      defined?(Sidekiq) && Sidekiq.redis { |conn| conn.ping == "PONG" }
    rescue StandardError => e
      Rails.logger.error("Sidekiq unavailable: #{e.message}")
      false
    end

    def calculate_failure_rate(stats)
      total = stats.processed + stats.failed
      return 0.0 if total.zero?

      ((stats.failed.to_f / total) * 100).round(2)
    end
  end
end
