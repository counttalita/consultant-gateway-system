# frozen_string_literal: true

# Background job for scheduled month-end financial processing
# Retrieves approved hours from Harvest and creates invoices/bills in Xero
class MonthEndJob < ApplicationJob
  queue_as :default

  # Process month-end for a specific month and year
  # @param month [Integer] Month number (1-12)
  # @param year [Integer] Year (e.g., 2024)
  def perform(month, year)
    Rails.logger.info("MonthEndJob started for #{month}/#{year}")

    financial_service = FinancialService.new
    result = financial_service.process_month_end(month, year)

    if result[:success]
      Rails.logger.info("MonthEndJob completed successfully: #{result[:invoices_created]} invoices, #{result[:bills_created]} bills")

      if result[:failures].any?
        Rails.logger.warn("MonthEndJob had #{result[:failures].length} failures")
      end
    else
      Rails.logger.error("MonthEndJob failed")
    end

    result
  rescue => e
    Rails.logger.error("MonthEndJob encountered critical error: #{e.message}\n#{e.backtrace.join("\n")}")

    # Re-raise to trigger Sidekiq retry logic
    raise
  end

  # Process month-end for the previous month
  def self.process_previous_month
    today = Date.current
    previous_month = today.prev_month

    perform_later(previous_month.month, previous_month.year)
  end

  # Process month-end for current month (useful for testing)
  def self.process_current_month
    today = Date.current
    perform_later(today.month, today.year)
  end
end
