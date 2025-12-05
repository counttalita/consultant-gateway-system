# frozen_string_literal: true

class ErrorService
  LEVELS = %i[low medium high critical].freeze

  class << self
    def report(error, context: {}, level: :medium, user: nil)
      unless LEVELS.include?(level)
        level = :medium
      end

      # Capture stack trace
      stack_trace = error.backtrace&.first(10) || []

      # Log to Rails logger
      Rails.logger.error("[#{level.upcase}] #{error.class}: #{error.message}")
      Rails.logger.error(stack_trace.join("\n"))

      # Create audit log
      AuditLogger.log(
        action: "error_reported",
        user: user,
        resource_type: "SystemError",
        change_data: {
          error_class: error.class.name,
          message: error.message,
          level: level
        },
        metadata: context.merge(stack_trace: stack_trace)
      )

      # Send notifications for high/critical errors
      if level == :high || level == :critical
        notify_admins(error, level, context)
      end
    end

    private

    def notify_admins(error, level, context)
      # Find admins
      admins = User.with_role(:admin) # Assuming scope exists or use where

      admins.each do |admin|
        # Use a background job for email to avoid blocking
        EmailJob.perform_later(
          to: admin.email,
          template: "admin_notification",
          variables: {
            subject: "[#{level.upcase}] System Error: #{error.class}",
            message: error.message,
            priority: level.to_s,
            details: context
          }
        )
      end
    rescue StandardError => e
      Rails.logger.error("Failed to send error notification: #{e.message}")
    end
  end
end
