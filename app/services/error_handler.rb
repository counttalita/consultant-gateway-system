class ErrorHandler
  class << self
    def handle(error, context: {}, severity: :medium)
      # Capture error context
      error_info = {
        error_class: error.class.name,
        message: error.message,
        backtrace: error.backtrace&.first(10),
        context: context,
        severity: severity,
        timestamp: Time.current
      }

      # Log the error with structured data
      log_error(error_info)

      # Notify if critical
      notify_critical(error_info) if severity == :critical

      # Return a user-friendly message or code if needed
      error_info
    end

    private

    def log_error(info)
      Rails.logger.error(info.to_json)
    end

    def notify_critical(info)
      # In a real app, this would send an email or Slack notification
      # For now, we'll just log a special alert
      Rails.logger.fatal("CRITICAL ERROR ALERT: #{info[:message]}")

      # Placeholder for email notification
      # ErrorMailer.critical_alert(info).deliver_later
    end
  end
end
