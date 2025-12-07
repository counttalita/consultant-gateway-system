# frozen_string_literal: true

require 'rails_helper'

RSpec.describe FinanceDashboard, type: :service do
  include PropertyTestHelpers

  let(:xero_adapter) { instance_double(Adapters::XeroAdapter) }
  let(:harvest_adapter) { instance_double(Adapters::HarvestAdapter) }
  let(:dashboard) { described_class.new(xero_adapter: xero_adapter, harvest_adapter: harvest_adapter) }

  describe "Property 53: Consultant Utilization Calculation" do
    # Feature: consultant-gateway-system, Property 53: Consultant Utilization Calculation
    # Validates: Requirements 15.2

    it "calculates utilization percentage correctly for any time period and billable hours" do
      property_test(iterations: 100) do
        # Generate random date range (1-90 days)
        days_in_period = Rantly { range(1, 90) }
        start_date = Date.current - days_in_period.days
        end_date = Date.current

        # Generate random number of consultants (1-10)
        num_consultants = Rantly { range(1, 10) }

        # Generate time entries for each consultant
        time_entries = []
        num_consultants.times do |i|
          user_id = i + 1
          user_name = "Consultant #{i + 1}"

          # Generate random number of time entries (0-50)
          num_entries = Rantly { range(0, 50) }

          num_entries.times do
            # Random hours between 0.5 and 8
            hours = Rantly { range(0.5, 8.0) }
            billable_rate = Rantly { range(500, 2000) }

            time_entries << {
              "user" => {
                "id" => user_id,
                "name" => user_name
              },
              "hours" => hours,
              "billable_rate" => billable_rate
            }
          end
        end

        # Mock Harvest adapter
        allow(harvest_adapter).to receive(:get_time_entries)
          .with(start_date: start_date, end_date: end_date)
          .and_return(time_entries)

        # Calculate utilization
        result = dashboard.consultant_utilization(start_date: start_date, end_date: end_date)

        # Property: For any time period, utilization should be calculated as:
        # (billable_hours / available_hours) * 100
        # where available_hours = working_days * 8

        # Calculate expected working days
        working_days = 0
        current_date = start_date
        while current_date <= end_date
          working_days += 1 unless current_date.saturday? || current_date.sunday?
          current_date += 1.day
        end
        expected_available_hours = working_days * 8

        # Verify each consultant's utilization
        result.each do |consultant_data|
          billable_hours = consultant_data[:billable_hours]
          utilization = consultant_data[:utilization_percentage]
          available_hours = consultant_data[:available_hours]

          # Property 1: Available hours should match calculated working days * 8
          expect(available_hours).to eq(expected_available_hours)

          # Property 2: Billable hours should match sum of time entries for this consultant (rounded)
          consultant_entries = time_entries.select { |e| e["user"]["id"] == consultant_data[:harvest_user_id] }
          unrounded_billable_hours = consultant_entries.sum { |e| e["hours"].to_f }
          expected_billable_hours = unrounded_billable_hours.round(2)
          expect(billable_hours).to eq(expected_billable_hours)

          # Property 3: Utilization should be (unrounded_billable_hours / available_hours) * 100, then rounded
          # Note: The service calculates utilization from unrounded sum, then rounds the result
          expected_utilization = (unrounded_billable_hours / available_hours * 100).round(2)
          expect(utilization).to eq(expected_utilization)

          # Property 4: Utilization should be non-negative
          expect(utilization).to be >= 0

          # Property 5: Revenue should match sum of (hours * billable_rate)
          expected_revenue = consultant_entries.sum { |e| e["hours"].to_f * e["billable_rate"].to_f }.round(2)
          expect(consultant_data[:revenue]).to eq(expected_revenue)
        end

        # Property 6: Number of consultants in result should match unique users in time entries
        unique_users = time_entries.map { |e| e["user"]["id"] }.uniq
        expect(result.length).to eq(unique_users.length)
      end
    end

    it "handles edge case of zero billable hours correctly" do
      start_date = Date.current.beginning_of_month
      end_date = Date.current.end_of_month

      # Time entries with zero hours
      time_entries = [
        {
          "user" => { "id" => 1, "name" => "Consultant 1" },
          "hours" => 0,
          "billable_rate" => 1000
        }
      ]

      allow(harvest_adapter).to receive(:get_time_entries)
        .with(start_date: start_date, end_date: end_date)
        .and_return(time_entries)

      result = dashboard.consultant_utilization(start_date: start_date, end_date: end_date)

      expect(result.first[:billable_hours]).to eq(0)
      expect(result.first[:utilization_percentage]).to eq(0)
      expect(result.first[:revenue]).to eq(0)
    end

    it "handles weekend-only periods correctly" do
      # Find a Saturday
      start_date = Date.current.beginning_of_week + 5.days # Saturday
      end_date = start_date + 1.day # Sunday

      time_entries = [
        {
          "user" => { "id" => 1, "name" => "Consultant 1" },
          "hours" => 8,
          "billable_rate" => 1000
        }
      ]

      allow(harvest_adapter).to receive(:get_time_entries)
        .with(start_date: start_date, end_date: end_date)
        .and_return(time_entries)

      result = dashboard.consultant_utilization(start_date: start_date, end_date: end_date)

      # Weekend has 0 working days, so available hours should be 0
      # This would cause division by zero, so we need to handle this edge case
      # For now, we expect the service to handle this gracefully
      expect(result.first[:available_hours]).to eq(0)
    end
  end

  describe "Property 54: Project Profitability Calculation" do
    # Feature: consultant-gateway-system, Property 54: Project Profitability Calculation
    # Validates: Requirements 15.3

    it "calculates margin correctly as client_revenue - consultant_costs for any project" do
      property_test(iterations: 100) do
        # Create random projects
        num_projects = Rantly { range(1, 5) }
        projects = []

        num_projects.times do |i|
          project = create(:project, name: "Project #{i}", status: "active")
          projects << project

          # Create consultants for this project
          num_consultants = Rantly { range(1, 3) }
          num_consultants.times do
            consultant = create(:consultant)
            consultant.update(xero_id: "XERO-#{consultant.id}")
            project.add_consultant(consultant)
          end
        end

        # Generate random invoices and bills
        all_invoices = []
        all_bills = []

        projects.each do |project|
          # Generate invoices for this project
          num_invoices = Rantly { range(0, 3) }
          project_invoices = []

          num_invoices.times do
            invoice_total = Rantly { range(10000, 100000) }
            project_invoices << {
              id: SecureRandom.uuid,
              invoice_number: "INV-#{SecureRandom.hex(4)}",
              contact_name: project.client_name,
              total: invoice_total,
              amount_due: invoice_total,
              status: "AUTHORISED",
              reference: "Project: #{project.name}",
              date: Date.current.to_s,
              due_date: (Date.current + 30.days).to_s
            }
          end

          all_invoices.concat(project_invoices)

          # Generate bills for consultants on this project
          project.consultants.each do |consultant|
            num_bills = Rantly { range(0, 2) }

            num_bills.times do
              bill_total = Rantly { range(5000, 50000) }
              all_bills << {
                id: SecureRandom.uuid,
                invoice_number: "BILL-#{SecureRandom.hex(4)}",
                contact_id: consultant.xero_id,
                contact_name: consultant.user.email,
                total: bill_total,
                amount_due: bill_total,
                status: "AUTHORISED",
                reference: "Consultant Payment",
                date: Date.current.to_s,
                due_date: (Date.current + 7.days).to_s
              }
            end
          end
        end

        # Mock Xero adapter
        allow(xero_adapter).to receive(:get_all_invoices).and_return(all_invoices)
        allow(xero_adapter).to receive(:get_all_bills).and_return(all_bills)

        # Calculate profitability
        result = dashboard.project_profitability

        # Verify each project's profitability
        result.each do |project_data|
          project = projects.find { |p| p.id == project_data[:project_id] }
          next unless project # Skip if project not found (shouldn't happen but be safe)

          # Calculate expected values
          project_invoices = all_invoices.select { |inv| inv[:reference]&.include?(project.name) }
          expected_revenue = project_invoices.sum { |inv| inv[:total] }

          consultant_xero_ids = project.consultants.pluck(:xero_id).compact
          project_bills = all_bills.select { |bill| consultant_xero_ids.include?(bill[:contact_id]) }
          expected_costs = project_bills.sum { |bill| bill[:total] }

          expected_margin = expected_revenue - expected_costs
          expected_margin_percentage = expected_revenue > 0 ? (expected_margin / expected_revenue * 100).round(2) : 0

          # Property 1: Revenue should match sum of invoice totals
          expect(project_data[:client_revenue]).to eq(expected_revenue.round(2))

          # Property 2: Costs should match sum of bill totals
          expect(project_data[:consultant_costs]).to eq(expected_costs.round(2))

          # Property 3: Margin should equal revenue - costs
          expect(project_data[:margin]).to eq(expected_margin.round(2))

          # Property 4: Margin percentage should be (margin / revenue) * 100
          expect(project_data[:margin_percentage]).to eq(expected_margin_percentage)

          # Property 5: If revenue is zero, margin percentage should be zero
          if expected_revenue == 0
            expect(project_data[:margin_percentage]).to eq(0)
          end
        end

        # Property 6: Results should be sorted by margin (descending)
        margins = result.map { |p| p[:margin] }
        expect(margins).to eq(margins.sort.reverse)
      end
    end

    it "handles projects with no invoices or bills correctly" do
      project = create(:project, name: "Empty Project", status: "active")

      allow(xero_adapter).to receive(:get_all_invoices).and_return([])
      allow(xero_adapter).to receive(:get_all_bills).and_return([])

      result = dashboard.project_profitability(project_id: project.id)

      expect(result.first[:client_revenue]).to eq(0)
      expect(result.first[:consultant_costs]).to eq(0)
      expect(result.first[:margin]).to eq(0)
      expect(result.first[:margin_percentage]).to eq(0)
    end
  end

  describe "Property 55: Payment Aging Calculation" do
    # Feature: consultant-gateway-system, Property 55: Payment Aging Calculation
    # Validates: Requirements 15.4

    it "correctly categorizes bills into aging buckets based on due date" do
      property_test(iterations: 100) do
        # Generate random bills with various due dates
        num_bills = Rantly { range(5, 20) }
        bills = []

        num_bills.times do |i|
          # Random days overdue: -30 to 90 (negative means not yet due)
          days_offset = Rantly { range(-30, 90) }
          due_date = Date.current - days_offset.days

          bill_amount = Rantly { range(1000, 50000) }

          bills << {
            id: "BILL-#{i}",
            invoice_number: "INV-#{i}",
            contact_id: "CONTACT-#{i}",
            contact_name: "Supplier #{i}",
            total: bill_amount,
            amount_due: bill_amount,
            status: "AUTHORISED", # Unpaid
            reference: "Payment",
            date: (due_date - 30.days).to_s,
            due_date: due_date.to_s
          }
        end

        # Mock Xero adapter
        allow(xero_adapter).to receive(:get_all_bills).and_return(bills)

        # Calculate payment aging
        result = dashboard.payment_aging_report

        # Manually categorize bills into expected buckets
        expected_buckets = {
          current: [],
          overdue_7: [],
          overdue_14: [],
          overdue_30: [],
          overdue_30_plus: []
        }

        bills.each do |bill|
          due_date = Date.parse(bill[:due_date])
          days_overdue = (Date.current - due_date).to_i

          if days_overdue < 0
            expected_buckets[:current] << bill
          elsif days_overdue <= 7
            expected_buckets[:overdue_7] << bill
          elsif days_overdue <= 14
            expected_buckets[:overdue_14] << bill
          elsif days_overdue <= 30
            expected_buckets[:overdue_30] << bill
          else
            expected_buckets[:overdue_30_plus] << bill
          end
        end

        # Property 1: Total unpaid should match sum of all bill amounts
        expected_total = bills.sum { |b| b[:amount_due] }.round(2)
        expect(result[:total_unpaid]).to eq(expected_total)

        # Property 2: Bill count should match number of bills
        expect(result[:bill_count]).to eq(bills.length)

        # Property 3: Each aging bucket should have correct amount and count
        expect(result[:aging][:current][:count]).to eq(expected_buckets[:current].length)
        expect(result[:aging][:current][:amount]).to eq(expected_buckets[:current].sum { |b| b[:amount_due] }.round(2))

        expect(result[:aging][:overdue_1_7_days][:count]).to eq(expected_buckets[:overdue_7].length)
        expect(result[:aging][:overdue_1_7_days][:amount]).to eq(expected_buckets[:overdue_7].sum { |b| b[:amount_due] }.round(2))

        expect(result[:aging][:overdue_8_14_days][:count]).to eq(expected_buckets[:overdue_14].length)
        expect(result[:aging][:overdue_8_14_days][:amount]).to eq(expected_buckets[:overdue_14].sum { |b| b[:amount_due] }.round(2))

        expect(result[:aging][:overdue_15_30_days][:count]).to eq(expected_buckets[:overdue_30].length)
        expect(result[:aging][:overdue_15_30_days][:amount]).to eq(expected_buckets[:overdue_30].sum { |b| b[:amount_due] }.round(2))

        expect(result[:aging][:overdue_30_plus_days][:count]).to eq(expected_buckets[:overdue_30_plus].length)
        expect(result[:aging][:overdue_30_plus_days][:amount]).to eq(expected_buckets[:overdue_30_plus].sum { |b| b[:amount_due] }.round(2))

        # Property 4: Sum of all bucket amounts should equal total unpaid
        total_from_buckets = result[:aging].values.sum { |bucket| bucket[:amount] }
        expect(total_from_buckets).to eq(result[:total_unpaid])

        # Property 5: Sum of all bucket counts should equal bill count
        total_count_from_buckets = result[:aging].values.sum { |bucket| bucket[:count] }
        expect(total_count_from_buckets).to eq(result[:bill_count])
      end
    end

    it "handles bills with no due date gracefully" do
      bills = [
        {
          id: "BILL-1",
          invoice_number: "INV-1",
          contact_id: "CONTACT-1",
          contact_name: "Supplier 1",
          total: 10000,
          amount_due: 10000,
          status: "AUTHORISED",
          reference: "Payment",
          date: Date.current.to_s,
          due_date: nil
        }
      ]

      allow(xero_adapter).to receive(:get_all_bills).and_return(bills)

      result = dashboard.payment_aging_report

      # Bills with no due date should be treated as 0 days overdue (current)
      expect(result[:aging][:current][:count]).to eq(1)
    end
  end

  describe "Property 56: Financial Data Export" do
    # Feature: consultant-gateway-system, Property 56: Financial Data Export
    # Validates: Requirements 15.5

    it "exports revenue data to valid CSV format with all required fields" do
      property_test(iterations: 50) do
        # Generate random invoices
        num_invoices = Rantly { range(1, 10) }
        invoices = []

        num_invoices.times do |i|
          invoices << {
            id: "INV-#{i}",
            invoice_number: "INV-#{SecureRandom.hex(4)}",
            contact_name: "Client #{i}",
            total: Rantly { range(10000, 100000) },
            amount_due: Rantly { range(0, 100000) },
            status: [ "PAID", "AUTHORISED", "DRAFT" ].sample,
            reference: "Project #{i}",
            date: Date.current.to_s,
            due_date: (Date.current + 30.days).to_s
          }
        end

        start_date = Date.current.beginning_of_month
        end_date = Date.current.end_of_month

        allow(xero_adapter).to receive(:get_invoices)
          .with(start_date: start_date, end_date: end_date)
          .and_return(invoices)

        # Export to CSV
        csv_data = dashboard.export_to_csv(type: :revenue, start_date: start_date, end_date: end_date)

        # Property 1: Result should be a valid CSV string
        expect(csv_data).to be_a(String)
        expect(csv_data).not_to be_empty

        # Property 2: CSV should have header row
        lines = csv_data.split("\n")
        expect(lines.first).to include("Invoice Number", "Client", "Date", "Due Date", "Total", "Amount Due", "Status")

        # Property 3: CSV should have one row per invoice (plus header and summary)
        # Expected: 1 header + num_invoices data rows + 1 blank + 1 summary = num_invoices + 3
        expect(lines.length).to eq(num_invoices + 3)

        # Property 4: Each invoice should appear in the CSV
        invoices.each do |invoice|
          expect(csv_data).to include(invoice[:invoice_number])
          expect(csv_data).to include(invoice[:contact_name])
        end

        # Property 5: Summary row should contain total
        summary_line = lines.last
        expected_total = invoices.sum { |i| i[:total] }.round(2)
        expect(summary_line).to include(expected_total.to_s)
      end
    end

    it "exports utilization data to valid CSV format" do
      start_date = Date.current.beginning_of_month
      end_date = Date.current.end_of_month

      time_entries = [
        {
          "user" => { "id" => 1, "name" => "Consultant 1" },
          "hours" => 80,
          "billable_rate" => 1000
        },
        {
          "user" => { "id" => 2, "name" => "Consultant 2" },
          "hours" => 120,
          "billable_rate" => 1500
        }
      ]

      allow(harvest_adapter).to receive(:get_time_entries)
        .with(start_date: start_date, end_date: end_date)
        .and_return(time_entries)

      csv_data = dashboard.export_to_csv(type: :utilization, start_date: start_date, end_date: end_date)

      # Property 1: CSV should contain consultant names
      expect(csv_data).to include("Consultant 1")
      expect(csv_data).to include("Consultant 2")

      # Property 2: CSV should have required columns
      expect(csv_data).to include("Consultant Name", "Billable Hours", "Available Hours", "Utilization %", "Revenue")

      # Property 3: CSV should have correct number of rows (header + 2 consultants)
      lines = csv_data.split("\n")
      expect(lines.length).to eq(3)
    end

    it "exports profitability data to valid CSV format" do
      project = create(:project, name: "Test Project", status: "active")

      invoices = [
        {
          id: "INV-1",
          invoice_number: "INV-001",
          contact_name: project.client_name,
          total: 100000,
          amount_due: 100000,
          status: "PAID",
          reference: "Project: #{project.name}",
          date: Date.current.to_s,
          due_date: (Date.current + 30.days).to_s
        }
      ]

      allow(xero_adapter).to receive(:get_all_invoices).and_return(invoices)
      allow(xero_adapter).to receive(:get_all_bills).and_return([])

      csv_data = dashboard.export_to_csv(type: :profitability)

      # Property 1: CSV should contain project name
      expect(csv_data).to include(project.name)

      # Property 2: CSV should have required columns
      expect(csv_data).to include("Project Name", "Client", "Revenue", "Costs", "Margin", "Margin %")

      # Property 3: CSV should be valid
      expect(csv_data).to be_a(String)
      expect(csv_data).not_to be_empty
    end

    it "raises error for invalid export type" do
      expect {
        dashboard.export_to_csv(type: :invalid_type)
      }.to raise_error(FinanceDashboard::CalculationError, /Invalid export type/)
    end
  end
end
