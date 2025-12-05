# frozen_string_literal: true

# Service for calculating financial metrics and analytics
class FinanceDashboard
  class CalculationError < StandardError; end

  def initialize(xero_adapter: nil, harvest_adapter: nil)
    @xero_adapter = xero_adapter || Adapters::XeroAdapter.new
    @harvest_adapter = harvest_adapter || Adapters::HarvestAdapter.new
  end

  # Dashboard Overview (Requirement 15.1)

  # Calculate revenue for a specific month
  # @param month [Integer] Month (1-12)
  # @param year [Integer] Year
  # @return [Hash] Revenue metrics
  def current_month_revenue(month:, year:)
    start_date = Date.new(year, month, 1)
    end_date = start_date.end_of_month

    invoices = fetch_invoices(start_date: start_date, end_date: end_date)

    total_revenue = invoices.sum { |inv| inv["total"]&.to_f || 0 }
    paid_revenue = invoices.select { |inv| inv["status"] == "PAID" }.sum { |inv| inv["total"]&.to_f || 0 }
    pending_revenue = total_revenue - paid_revenue

    {
      month: month,
      year: year,
      total_revenue: total_revenue.round(2),
      paid_revenue: paid_revenue.round(2),
      pending_revenue: pending_revenue.round(2),
      invoice_count: invoices.length
    }
  end

  # Get outstanding (unpaid) invoices
  # @return [Array<Hash>] List of outstanding invoices
  def outstanding_invoices
    invoices = fetch_all_invoices
    outstanding = invoices.select { |inv| inv["status"] != "PAID" && inv["status"] != "VOIDED" }

    outstanding.map do |inv|
      {
        invoice_id: inv["invoice_id"] || inv["id"],
        invoice_number: inv["invoice_number"],
        contact_name: inv["contact"]&.dig("name"),
        date: inv["date"],
        due_date: inv["due_date"],
        total: inv["total"]&.to_f || 0,
        amount_due: inv["amount_due"]&.to_f || 0,
        status: inv["status"],
        days_overdue: calculate_days_overdue(inv["due_date"])
      }
    end
  end

  # Get pending consultant payments (bills)
  # @return [Array<Hash>] List of pending bills
  def pending_consultant_payments
    bills = fetch_all_bills
    pending = bills.select { |bill| bill["status"] == "DRAFT" || bill["status"] == "SUBMITTED" }

    pending.map do |bill|
      {
        bill_id: bill["bill_id"] || bill["id"],
        bill_number: bill["bill_number"],
        contact_name: bill["contact"]&.dig("name"),
        date: bill["date"],
        due_date: bill["due_date"],
        total: bill["total"]&.to_f || 0,
        status: bill["status"]
      }
    end
  end

  # Utilization Metrics (Requirement 15.2)

  # Calculate consultant utilization for a time period
  # @param start_date [Date] Start date
  # @param end_date [Date] End date
  # @return [Array<Hash>] Utilization metrics per consultant
  def consultant_utilization(start_date:, end_date:)
    time_entries = fetch_time_entries(start_date: start_date, end_date: end_date)

    # Group by consultant
    by_consultant = time_entries.group_by { |entry| entry["user"]&.dig("id") }

    by_consultant.map do |user_id, entries|
      billable_hours = entries.select { |e| e["billable"] }.sum { |e| e["hours"]&.to_f || 0 }
      total_hours = entries.sum { |e| e["hours"]&.to_f || 0 }

      # Calculate available hours (working days * 8 hours)
      working_days = calculate_working_days(start_date, end_date)
      available_hours = working_days * 8.0

      utilization_percentage = available_hours > 0 ? (billable_hours / available_hours * 100).round(2) : 0

      {
        consultant_id: user_id,
        consultant_name: entries.first["user"]&.dig("name"),
        billable_hours: billable_hours.round(2),
        total_hours: total_hours.round(2),
        available_hours: available_hours.round(2),
        utilization_percentage: utilization_percentage,
        revenue: calculate_revenue_for_entries(entries)
      }
    end
  end

  # Calculate billable hours by consultant
  # @param start_date [Date] Start date
  # @param end_date [Date] End date
  # @return [Hash] Billable hours per consultant
  def billable_hours_by_consultant(start_date:, end_date:)
    time_entries = fetch_time_entries(start_date: start_date, end_date: end_date)

    by_consultant = time_entries.group_by { |entry| entry["user"]&.dig("id") }

    by_consultant.transform_values do |entries|
      entries.select { |e| e["billable"] }.sum { |e| e["hours"]&.to_f || 0 }.round(2)
    end
  end

  # Calculate revenue per consultant
  # @param start_date [Date] Start date
  # @param end_date [Date] End date
  # @return [Hash] Revenue per consultant
  def revenue_per_consultant(start_date:, end_date:)
    time_entries = fetch_time_entries(start_date: start_date, end_date: end_date)

    by_consultant = time_entries.group_by { |entry| entry["user"]&.dig("id") }

    by_consultant.transform_values do |entries|
      calculate_revenue_for_entries(entries).round(2)
    end
  end

  # Profitability Analysis (Requirement 15.3)

  # Calculate project profitability
  # @param start_date [Date] Start date
  # @param end_date [Date] End date
  # @return [Array<Hash>] Profitability metrics per project
  def project_profitability(start_date:, end_date:)
    time_entries = fetch_time_entries(start_date: start_date, end_date: end_date)

    by_project = time_entries.group_by { |entry| entry["project"]&.dig("id") }

    by_project.map do |project_id, entries|
      revenue = calculate_revenue_for_entries(entries)
      cost = calculate_cost_for_entries(entries)
      margin = revenue > 0 ? ((revenue - cost) / revenue * 100).round(2) : 0

      {
        project_id: project_id,
        project_name: entries.first["project"]&.dig("name"),
        revenue: revenue.round(2),
        cost: cost.round(2),
        profit: (revenue - cost).round(2),
        margin_percentage: margin,
        hours: entries.sum { |e| e["hours"]&.to_f || 0 }.round(2)
      }
    end
  end

  # Calculate margin for given rates and hours
  # @param billing_rate [Float] Client billing rate
  # @param cost_rate [Float] Consultant cost rate
  # @param hours [Float] Number of hours
  # @return [Float] Margin percentage
  def calculate_margin(billing_rate:, cost_rate:, hours:)
    revenue = billing_rate * hours
    cost = cost_rate * hours

    return 0.0 if revenue.zero?

    ((revenue - cost) / revenue * 100).round(2)
  end

  # Payment Aging (Requirement 15.4)

  # Generate invoice aging report
  # @return [Hash] Invoices categorized by age
  def invoice_aging_report
    invoices = outstanding_invoices

    {
      current: invoices.select { |inv| inv[:days_overdue] <= 0 },
      days_0_30: invoices.select { |inv| inv[:days_overdue].between?(1, 30) },
      days_31_60: invoices.select { |inv| inv[:days_overdue].between?(31, 60) },
      days_61_90: invoices.select { |inv| inv[:days_overdue].between?(61, 90) },
      days_90_plus: invoices.select { |inv| inv[:days_overdue] > 90 },
      summary: {
        current_amount: invoices.select { |inv| inv[:days_overdue] <= 0 }.sum { |inv| inv[:amount_due] }.round(2),
        days_0_30_amount: invoices.select { |inv| inv[:days_overdue].between?(1, 30) }.sum { |inv| inv[:amount_due] }.round(2),
        days_31_60_amount: invoices.select { |inv| inv[:days_overdue].between?(31, 60) }.sum { |inv| inv[:amount_due] }.round(2),
        days_61_90_amount: invoices.select { |inv| inv[:days_overdue].between?(61, 90) }.sum { |inv| inv[:amount_due] }.round(2),
        days_90_plus_amount: invoices.select { |inv| inv[:days_overdue] > 90 }.sum { |inv| inv[:amount_due] }.round(2)
      }
    }
  end

  # Get upcoming payment obligations
  # @param days_ahead [Integer] Number of days to look ahead
  # @return [Array<Hash>] Bills due in next N days
  def upcoming_payment_obligations(days_ahead: 30)
    bills = pending_consultant_payments
    cutoff_date = Date.today + days_ahead.days

    bills.select do |bill|
      due_date = Date.parse(bill[:due_date]) rescue nil
      due_date && due_date <= cutoff_date
    end.sort_by { |bill| bill[:due_date] }
  end

  # Data Export (Requirement 15.5)

  # Export financial data to CSV
  # @param start_date [Date] Start date
  # @param end_date [Date] End date
  # @return [String] CSV content
  def export_financial_summary(start_date:, end_date:)
    require "csv"

    CSV.generate do |csv|
      # Header
      csv << [ "Financial Summary Report" ]
      csv << [ "Period: #{start_date} to #{end_date}" ]
      csv << []

      # Revenue Summary
      csv << [ "Revenue Summary" ]
      csv << [ "Month", "Year", "Total Revenue", "Paid Revenue", "Pending Revenue" ]

      months_in_range(start_date, end_date).each do |date|
        revenue = current_month_revenue(month: date.month, year: date.year)
        csv << [ revenue[:month], revenue[:year], revenue[:total_revenue], revenue[:paid_revenue], revenue[:pending_revenue] ]
      end

      csv << []

      # Consultant Utilization
      csv << [ "Consultant Utilization" ]
      csv << [ "Consultant Name", "Billable Hours", "Total Hours", "Available Hours", "Utilization %", "Revenue" ]

      consultant_utilization(start_date: start_date, end_date: end_date).each do |util|
        csv << [ util[:consultant_name], util[:billable_hours], util[:total_hours], util[:available_hours], util[:utilization_percentage], util[:revenue] ]
      end

      csv << []

      # Project Profitability
      csv << [ "Project Profitability" ]
      csv << [ "Project Name", "Revenue", "Cost", "Profit", "Margin %", "Hours" ]

      project_profitability(start_date: start_date, end_date: end_date).each do |proj|
        csv << [ proj[:project_name], proj[:revenue], proj[:cost], proj[:profit], proj[:margin_percentage], proj[:hours] ]
      end

      csv << []

      # Aging Report
      csv << [ "Invoice Aging Report" ]
      csv << [ "Category", "Amount" ]
      aging = invoice_aging_report
      csv << [ "Current", aging[:summary][:current_amount] ]
      csv << [ "0-30 Days", aging[:summary][:days_0_30_amount] ]
      csv << [ "31-60 Days", aging[:summary][:days_31_60_amount] ]
      csv << [ "61-90 Days", aging[:summary][:days_61_90_amount] ]
      csv << [ "90+ Days", aging[:summary][:days_90_plus_amount] ]
    end
  end

  private

  # Fetch invoices from Xero
  def fetch_invoices(start_date:, end_date:)
    @xero_adapter.get_invoices(start_date: start_date, end_date: end_date)
  rescue StandardError => e
    Rails.logger.error("Failed to fetch invoices: #{e.message}")
    []
  end

  # Fetch all invoices from Xero
  def fetch_all_invoices
    @xero_adapter.get_all_invoices
  rescue StandardError => e
    Rails.logger.error("Failed to fetch all invoices: #{e.message}")
    []
  end

  # Fetch bills from Xero
  def fetch_all_bills
    @xero_adapter.get_all_bills
  rescue StandardError => e
    Rails.logger.error("Failed to fetch bills: #{e.message}")
    []
  end

  # Fetch time entries from Harvest
  def fetch_time_entries(start_date:, end_date:)
    @harvest_adapter.get_time_entries(start_date: start_date, end_date: end_date)
  rescue StandardError => e
    Rails.logger.error("Failed to fetch time entries: #{e.message}")
    []
  end

  # Calculate days overdue for an invoice
  def calculate_days_overdue(due_date_str)
    return 0 unless due_date_str

    due_date = Date.parse(due_date_str) rescue nil
    return 0 unless due_date

    (Date.today - due_date).to_i
  end

  # Calculate working days between two dates
  def calculate_working_days(start_date, end_date)
    (start_date..end_date).count { |date| date.wday.between?(1, 5) }
  end

  # Calculate revenue for time entries
  def calculate_revenue_for_entries(entries)
    entries.sum { |e| (e["billable_rate"]&.to_f || 0) * (e["hours"]&.to_f || 0) }
  end

  # Calculate cost for time entries
  def calculate_cost_for_entries(entries)
    entries.sum { |e| (e["cost_rate"]&.to_f || 0) * (e["hours"]&.to_f || 0) }
  end

  # Get list of months in date range
  def months_in_range(start_date, end_date)
    months = []
    current = start_date.beginning_of_month

    while current <= end_date
      months << current
      current = current.next_month
    end

    months
  end
end
