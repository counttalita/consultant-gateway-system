# frozen_string_literal: true

# Service for calculating financial analytics and metrics
# Provides comprehensive financial insights for the finance dashboard
class FinanceDashboard
  class CalculationError < StandardError; end

  def initialize(xero_adapter: nil, harvest_adapter: nil)
    @xero_adapter = xero_adapter || Adapters::XeroAdapter.new
    @harvest_adapter = harvest_adapter || Adapters::HarvestAdapter.new
  end

  # Calculate current month revenue from invoices
  # @return [Hash] Revenue metrics with :total, :paid, :outstanding
  def current_month_revenue
    start_date = Date.current.beginning_of_month
    end_date = Date.current.end_of_month

    invoices = @xero_adapter.get_invoices(start_date: start_date, end_date: end_date)

    total = invoices.sum { |inv| inv[:total] }
    paid = invoices.select { |inv| inv[:status] == "PAID" }.sum { |inv| inv[:total] }
    outstanding = invoices.select { |inv| inv[:status] != "PAID" }.sum { |inv| inv[:amount_due] }

    {
      total: total.round(2),
      paid: paid.round(2),
      outstanding: outstanding.round(2),
      invoice_count: invoices.count,
      period: {
        start_date: start_date,
        end_date: end_date
      }
    }
  rescue => e
    Rails.logger.error("Error calculating current month revenue: #{e.message}")
    raise CalculationError, "Failed to calculate current month revenue: #{e.message}"
  end

  # Get outstanding invoices with aging breakdown
  # @return [Hash] Outstanding invoice metrics with aging buckets
  def outstanding_invoices
    invoices = @xero_adapter.get_all_invoices
    outstanding = invoices.select { |inv| inv[:status] != "PAID" && inv[:amount_due] > 0 }

    aging_buckets = {
      current: [],      # 0-30 days
      days_30: [],      # 31-60 days
      days_60: [],      # 61-90 days
      days_90_plus: []  # 90+ days
    }

    outstanding.each do |invoice|
      days_overdue = calculate_days_overdue(invoice[:due_date])

      if days_overdue <= 30
        aging_buckets[:current] << invoice
      elsif days_overdue <= 60
        aging_buckets[:days_30] << invoice
      elsif days_overdue <= 90
        aging_buckets[:days_60] << invoice
      else
        aging_buckets[:days_90_plus] << invoice
      end
    end

    {
      total_outstanding: outstanding.sum { |inv| inv[:amount_due] }.round(2),
      invoice_count: outstanding.count,
      aging: {
        current: {
          amount: aging_buckets[:current].sum { |inv| inv[:amount_due] }.round(2),
          count: aging_buckets[:current].count
        },
        days_30_60: {
          amount: aging_buckets[:days_30].sum { |inv| inv[:amount_due] }.round(2),
          count: aging_buckets[:days_30].count
        },
        days_60_90: {
          amount: aging_buckets[:days_60].sum { |inv| inv[:amount_due] }.round(2),
          count: aging_buckets[:days_60].count
        },
        days_90_plus: {
          amount: aging_buckets[:days_90_plus].sum { |inv| inv[:amount_due] }.round(2),
          count: aging_buckets[:days_90_plus].count
        }
      },
      invoices: outstanding
    }
  rescue => e
    Rails.logger.error("Error calculating outstanding invoices: #{e.message}")
    raise CalculationError, "Failed to calculate outstanding invoices: #{e.message}"
  end

  # Calculate consultant utilization for a given period
  # @param start_date [Date] Start of period
  # @param end_date [Date] End of period
  # @return [Array<Hash>] Utilization metrics per consultant
  def consultant_utilization(start_date:, end_date:)
    time_entries = @harvest_adapter.get_time_entries(start_date: start_date, end_date: end_date)

    # Group time entries by consultant
    entries_by_consultant = time_entries.group_by { |entry| entry["user"]["id"] }

    # Calculate available hours for the period
    working_days = calculate_working_days(start_date, end_date)
    available_hours_per_day = 8
    total_available_hours = working_days * available_hours_per_day

    consultants_data = entries_by_consultant.map do |harvest_user_id, entries|
      billable_hours = entries.sum { |entry| entry["hours"].to_f }
      utilization_percentage = (billable_hours / total_available_hours * 100).round(2)

      # Calculate revenue (assuming hourly rate from entries)
      revenue = entries.sum { |entry| (entry["hours"].to_f * (entry["billable_rate"]&.to_f || 0)) }

      # Find consultant by harvest_id
      consultant = Consultant.find_by(harvest_id: harvest_user_id.to_s)

      {
        harvest_user_id: harvest_user_id,
        consultant_id: consultant&.id,
        consultant_name: entries.first["user"]["name"],
        billable_hours: billable_hours.round(2),
        available_hours: total_available_hours,
        utilization_percentage: utilization_percentage,
        revenue: revenue.round(2),
        entry_count: entries.count
      }
    end

    consultants_data.sort_by { |c| -c[:utilization_percentage] }
  rescue => e
    Rails.logger.error("Error calculating consultant utilization: #{e.message}")
    raise CalculationError, "Failed to calculate consultant utilization: #{e.message}"
  end

  # Calculate project profitability
  # @param project_id [Integer] Optional project ID to filter by
  # @return [Array<Hash>] Profitability metrics per project
  def project_profitability(project_id: nil)
    projects = project_id ? [ Project.find(project_id) ] : Project.active.or(Project.completed)

    projects.map do |project|
      # Get invoices for this project
      invoices = @xero_adapter.get_all_invoices.select do |inv|
        inv[:reference]&.include?(project.name)
      end

      client_revenue = invoices.sum { |inv| inv[:total] }

      # Get bills (consultant costs) for this project
      # We need to match bills to project assignments
      consultant_ids = project.consultants.pluck(:xero_id).compact
      bills = @xero_adapter.get_all_bills.select do |bill|
        consultant_ids.include?(bill[:contact_id])
      end

      consultant_costs = bills.sum { |bill| bill[:total] }

      # Calculate margin
      margin = client_revenue - consultant_costs
      margin_percentage = client_revenue > 0 ? (margin / client_revenue * 100).round(2) : 0

      {
        project_id: project.id,
        project_name: project.name,
        client_name: project.client_name,
        client_revenue: client_revenue.round(2),
        consultant_costs: consultant_costs.round(2),
        margin: margin.round(2),
        margin_percentage: margin_percentage,
        status: project.status,
        invoice_count: invoices.count,
        bill_count: bills.count
      }
    end.sort_by { |p| -p[:margin] }
  rescue => e
    Rails.logger.error("Error calculating project profitability: #{e.message}")
    raise CalculationError, "Failed to calculate project profitability: #{e.message}"
  end

  # Generate payment aging report
  # @return [Hash] Payment aging metrics
  def payment_aging_report
    bills = @xero_adapter.get_all_bills
    unpaid_bills = bills.select { |bill| bill[:status] != "PAID" && bill[:amount_due] > 0 }

    aging_buckets = {
      current: [],      # Not yet due
      overdue_7: [],    # 1-7 days overdue
      overdue_14: [],   # 8-14 days overdue
      overdue_30: [],   # 15-30 days overdue
      overdue_30_plus: [] # 30+ days overdue
    }

    unpaid_bills.each do |bill|
      days_overdue = calculate_days_overdue(bill[:due_date])

      if days_overdue < 0
        aging_buckets[:current] << bill
      elsif days_overdue <= 7
        aging_buckets[:overdue_7] << bill
      elsif days_overdue <= 14
        aging_buckets[:overdue_14] << bill
      elsif days_overdue <= 30
        aging_buckets[:overdue_30] << bill
      else
        aging_buckets[:overdue_30_plus] << bill
      end
    end

    {
      total_unpaid: unpaid_bills.sum { |bill| bill[:amount_due] }.round(2),
      bill_count: unpaid_bills.count,
      aging: {
        current: {
          amount: aging_buckets[:current].sum { |bill| bill[:amount_due] }.round(2),
          count: aging_buckets[:current].count
        },
        overdue_1_7_days: {
          amount: aging_buckets[:overdue_7].sum { |bill| bill[:amount_due] }.round(2),
          count: aging_buckets[:overdue_7].count
        },
        overdue_8_14_days: {
          amount: aging_buckets[:overdue_14].sum { |bill| bill[:amount_due] }.round(2),
          count: aging_buckets[:overdue_14].count
        },
        overdue_15_30_days: {
          amount: aging_buckets[:overdue_30].sum { |bill| bill[:amount_due] }.round(2),
          count: aging_buckets[:overdue_30].count
        },
        overdue_30_plus_days: {
          amount: aging_buckets[:overdue_30_plus].sum { |bill| bill[:amount_due] }.round(2),
          count: aging_buckets[:overdue_30_plus].count
        }
      },
      bills: unpaid_bills
    }
  rescue => e
    Rails.logger.error("Error generating payment aging report: #{e.message}")
    raise CalculationError, "Failed to generate payment aging report: #{e.message}"
  end

  # Export financial data to CSV format
  # @param type [Symbol] Type of export (:revenue, :invoices, :bills, :utilization, :profitability)
  # @param start_date [Date] Optional start date for filtering
  # @param end_date [Date] Optional end date for filtering
  # @return [String] CSV formatted data
  def export_to_csv(type:, start_date: nil, end_date: nil)
    require "csv"

    case type
    when :revenue
      export_revenue_csv(start_date, end_date)
    when :invoices
      export_invoices_csv(start_date, end_date)
    when :bills
      export_bills_csv(start_date, end_date)
    when :utilization
      export_utilization_csv(start_date, end_date)
    when :profitability
      export_profitability_csv
    else
      raise ArgumentError, "Invalid export type: #{type}"
    end
  rescue => e
    Rails.logger.error("Error exporting financial data to CSV: #{e.message}")
    raise CalculationError, "Failed to export financial data: #{e.message}"
  end

  private

  # Calculate days overdue from due date
  def calculate_days_overdue(due_date_str)
    return -999 if due_date_str.nil? # Treat nil as "not yet due" (far in future)

    due_date = Date.parse(due_date_str.to_s)
    (Date.current - due_date).to_i
  rescue ArgumentError
    -999 # Treat invalid dates as "not yet due"
  end

  # Calculate working days between two dates (excluding weekends)
  def calculate_working_days(start_date, end_date)
    days = 0
    current_date = start_date

    while current_date <= end_date
      days += 1 unless current_date.saturday? || current_date.sunday?
      current_date += 1.day
    end

    days
  end

  # Export revenue data to CSV
  def export_revenue_csv(start_date, end_date)
    start_date ||= Date.current.beginning_of_month
    end_date ||= Date.current.end_of_month

    invoices = @xero_adapter.get_invoices(start_date: start_date, end_date: end_date)

    CSV.generate(headers: true) do |csv|
      csv << [ "Invoice Number", "Client", "Date", "Due Date", "Total", "Amount Due", "Status" ]

      invoices.each do |invoice|
        csv << [
          invoice[:invoice_number],
          invoice[:contact_name],
          invoice[:date],
          invoice[:due_date],
          invoice[:total],
          invoice[:amount_due],
          invoice[:status]
        ]
      end

      # Add summary row
      csv << []
      csv << [ "TOTAL", "", "", "", invoices.sum { |i| i[:total] }.round(2), invoices.sum { |i| i[:amount_due] }.round(2), "" ]
    end
  end

  # Export invoices to CSV
  def export_invoices_csv(start_date, end_date)
    if start_date && end_date
      invoices = @xero_adapter.get_invoices(start_date: start_date, end_date: end_date)
    else
      invoices = @xero_adapter.get_all_invoices
    end

    CSV.generate(headers: true) do |csv|
      csv << [ "Invoice Number", "Client", "Date", "Due Date", "Total", "Amount Due", "Status", "Reference" ]

      invoices.each do |invoice|
        csv << [
          invoice[:invoice_number],
          invoice[:contact_name],
          invoice[:date],
          invoice[:due_date],
          invoice[:total],
          invoice[:amount_due],
          invoice[:status],
          invoice[:reference]
        ]
      end
    end
  end

  # Export bills to CSV
  def export_bills_csv(start_date, end_date)
    bills = @xero_adapter.get_all_bills

    if start_date && end_date
      bills = bills.select do |bill|
        bill_date = Date.parse(bill[:date].to_s)
        bill_date >= start_date && bill_date <= end_date
      end
    end

    CSV.generate(headers: true) do |csv|
      csv << [ "Invoice Number", "Supplier", "Date", "Due Date", "Total", "Amount Due", "Status", "Reference" ]

      bills.each do |bill|
        csv << [
          bill[:invoice_number],
          bill[:contact_name],
          bill[:date],
          bill[:due_date],
          bill[:total],
          bill[:amount_due],
          bill[:status],
          bill[:reference]
        ]
      end
    end
  end

  # Export utilization data to CSV
  def export_utilization_csv(start_date, end_date)
    start_date ||= Date.current.beginning_of_month
    end_date ||= Date.current.end_of_month

    utilization_data = consultant_utilization(start_date: start_date, end_date: end_date)

    CSV.generate(headers: true) do |csv|
      csv << [ "Consultant Name", "Billable Hours", "Available Hours", "Utilization %", "Revenue", "Entry Count" ]

      utilization_data.each do |data|
        csv << [
          data[:consultant_name],
          data[:billable_hours],
          data[:available_hours],
          data[:utilization_percentage],
          data[:revenue],
          data[:entry_count]
        ]
      end
    end
  end

  # Export profitability data to CSV
  def export_profitability_csv
    profitability_data = project_profitability

    CSV.generate(headers: true) do |csv|
      csv << [ "Project Name", "Client", "Revenue", "Costs", "Margin", "Margin %", "Status" ]

      profitability_data.each do |data|
        csv << [
          data[:project_name],
          data[:client_name],
          data[:client_revenue],
          data[:consultant_costs],
          data[:margin],
          data[:margin_percentage],
          data[:status]
        ]
      end
    end
  end
end
