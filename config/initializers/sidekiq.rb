# frozen_string_literal: true

Sidekiq.configure_server do |config|
  config.redis = { url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0") }

  # Set up error handlers
  config.error_handlers << lambda { |ex, ctx_hash|
    Rails.logger.error("Sidekiq error: #{ex.message}")
    Rails.logger.error("Context: #{ctx_hash}")
  }
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

# Configure dead job retention
Sidekiq.configure_server do |config|
  config.death_handlers << lambda { |job, ex|
    Rails.logger.error("Job #{job['class']} died: #{ex.message}")
    AuditLogger.log(
      action: :job_died,
      metadata: {
        job_class: job["class"],
        job_id: job["jid"],
        error: ex.message,
        args: job["args"]
      }
    )
  }
end
