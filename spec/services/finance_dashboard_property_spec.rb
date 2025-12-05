# frozen_string_literal: true

require "rails_helper"

RSpec.describe FinanceDashboard, type: :service do
  let(:xero_adapter) { instance_double(Adapters::XeroAdapter) }
  let(:harvest_adapter) { instance_double(Adapters::HarvestAdapter) }
  let(:service) { described_class.new(xero_adapter: xero_adapter, harvest_adapter: harvest_adapter) }

  describe "Property-Based Tests" do
    # Property 53: Consultant Utilization Calculation (Requirement 15.2)
    describe "Property 53: Consultant Utilization Calculation" do
      it "calculates utilization percentage as (billable_hours / available_hours) * 100" do
        property_test(iterations: 100) do
          # Generate random time entries
          start_date = Date.new(2024, 1, 1)
          end_date = Date.new(2024, 1, 31)

          billable_hours = Rantly { range(10.0, 160.0) }.round(2)
          non_billable_hours = Rantly { range(0.0, 40.0) }.round(2)

          time_entries = [
            {
              "user" => { "id" => 1, "name" => "Test Consultant" },
              "hours" => billable_hours,
              "billable" => true,
              "billable_rate" => 100.0,
              "cost_rate" => 50.0
            },
            {
              "user" => { "id" => 1, "name" => "Test Consultant" },
              "hours" => non_billable_hours,
              "billable" => false,
              "billable_rate" => 0.0,
              "cost_rate" => 50.0
            }
          ]

          allow(harvest_adapter).to receive(:get_time_entries).and_return(time_entries)

          result = service.consultant_utilization(start_date: start_date, end_date: end_date)

          expect(result).to be_an(Array)
          expect(result.length).to eq(1)

          consultant = result.first
          working_days = (start_date..end_date).count { |d| d.wday.between?(1, 5) }
          available_hours = working_days * 8.0
          expected_utilization = (billable_hours / available_hours * 100).round(2)

          expect(consultant[:billable_hours]).to eq(billable_hours)
          expect(consultant[:total_hours]).to eq((billable_hours + non_billable_hours).round(2))
          expect(consultant[:available_hours]).to eq(available_hours)
          expect(consultant[:utilization_percentage]).to eq(expected_utilization)

          # Utilization should be between 0 and 100% (or slightly over if overworked)
          expect(consultant[:utilization_percentage]).to be >= 0
        end
      end
    end

    # Property 54: Project Profitability Calculation (Requirement 15.3)
    describe "Property 54: Project Profitability Calculation" do
      it "calculates margin as ((revenue - cost) / revenue) * 100" do
        property_test(iterations: 100) do
          # Generate random billing and cost rates
          billing_rate = Rantly { range(100.0, 300.0) }.round(2)
          cost_rate = Rantly { range(50.0, billing_rate - 10.0) }.round(2)
          hours = Rantly { range(10.0, 100.0) }.round(2)

          time_entries = [
            {
              "project" => { "id" => 1, "name" => "Test Project" },
              "hours" => hours,
              "billable_rate" => billing_rate,
              "cost_rate" => cost_rate
            }
          ]

          allow(harvest_adapter).to receive(:get_time_entries).and_return(time_entries)

          start_date = Date.today.beginning_of_month
          end_date = Date.today.end_of_month

          result = service.project_profitability(start_date: start_date, end_date: end_date)

          expect(result).to be_an(Array)
          expect(result.length).to eq(1)

          project = result.first
          expected_revenue = (billing_rate * hours).round(2)
          expected_cost = (cost_rate * hours).round(2)
          expected_profit = (expected_revenue - expected_cost).round(2)
          expected_margin = ((expected_revenue - expected_cost) / expected_revenue * 100).round(2)

          expect(project[:revenue]).to eq(expected_revenue)
          expect(project[:cost]).to eq(expected_cost)
          expect(project[:profit]).to be_within(0.02).of(expected_profit)
          expect(project[:margin_percentage]).to be_within(0.02).of(expected_margin)

          # Margin should be positive since cost_rate < billing_rate
          expect(project[:margin_percentage]).to be > 0
          expect(project[:margin_percentage]).to be <= 100
        end
      end

      it "calculates margin correctly using the calculate_margin helper" do
        property_test(iterations: 100) do
          billing_rate = Rantly { range(100.0, 300.0) }.round(2)
          cost_rate = Rantly { range(50.0, billing_rate - 10.0) }.round(2)
          hours = Rantly { range(10.0, 100.0) }.round(2)

          margin = service.calculate_margin(billing_rate: billing_rate, cost_rate: cost_rate, hours: hours)

          revenue = billing_rate * hours
          cost = cost_rate * hours
          expected_margin = ((revenue - cost) / revenue * 100).round(2)

          expect(margin).to eq(expected_margin)
          expect(margin).to be > 0
          expect(margin).to be <= 100
        end
      end
    end

    # Property 55: Payment Aging Calculation (Requirement 15.4)
    describe "Property 55: Payment Aging Calculation" do
      it "correctly categorizes invoices by days overdue" do
        property_test(iterations: 100) do
          # Generate invoices with random due dates
          days_overdue = Rantly { range(0, 120) }
          due_date = Date.today - days_overdue.days

          invoice = {
            "invoice_id" => "INV-#{Rantly { range(1000, 9999) }}",
            "invoice_number" => "INV-#{Rantly { range(1000, 9999) }}",
            "contact" => { "name" => "Test Client" },
            "date" => (due_date - 30.days).to_s,
            "due_date" => due_date.to_s,
            "total" => Rantly { range(1000.0, 10000.0) }.round(2),
            "amount_due" => Rantly { range(1000.0, 10000.0) }.round(2),
            "status" => "AUTHORISED"
          }

          allow(xero_adapter).to receive(:get_all_invoices).and_return([ invoice ])

          aging_report = service.invoice_aging_report

          # Verify invoice is in correct aging bucket
          if days_overdue <= 0
            expect(aging_report[:current].length).to eq(1)
          elsif days_overdue.between?(1, 30)
            expect(aging_report[:days_0_30].length).to eq(1)
          elsif days_overdue.between?(31, 60)
            expect(aging_report[:days_31_60].length).to eq(1)
          elsif days_overdue.between?(61, 90)
            expect(aging_report[:days_61_90].length).to eq(1)
          else
            expect(aging_report[:days_90_plus].length).to eq(1)
          end

          # Verify summary amounts are calculated correctly
          total_summary = aging_report[:summary].values.sum
          expect(total_summary).to eq(invoice["amount_due"])
        end
      end
    end

    # Property 56: Financial Data Export (Requirement 15.5)
    describe "Property 56: Financial Data Export" do
      it "exports CSV with all required fields and data" do
        property_test(iterations: 50) do
          start_date = Date.new(2024, 1, 1)
          end_date = Date.new(2024, 1, 31)

          # Mock data
          invoices = [
            {
              "total" => Rantly { range(1000.0, 5000.0) }.round(2),
              "status" => "PAID"
            }
          ]

          time_entries = [
            {
              "user" => { "id" => 1, "name" => "Test Consultant" },
              "project" => { "id" => 1, "name" => "Test Project" },
              "hours" => Rantly { range(10.0, 40.0) }.round(2),
              "billable" => true,
              "billable_rate" => 100.0,
              "cost_rate" => 50.0
            }
          ]

          allow(xero_adapter).to receive(:get_invoices).and_return(invoices)
          allow(xero_adapter).to receive(:get_all_invoices).and_return([])
          allow(xero_adapter).to receive(:get_all_bills).and_return([])
          allow(harvest_adapter).to receive(:get_time_entries).and_return(time_entries)

          csv_content = service.export_financial_summary(start_date: start_date, end_date: end_date)

          # Verify CSV is valid
          expect(csv_content).to be_a(String)
          expect(csv_content).not_to be_empty

          # Parse CSV to verify structure
          rows = CSV.parse(csv_content)

          # Verify header sections exist
          expect(rows.any? { |row| row.include?("Financial Summary Report") }).to be true
          expect(rows.any? { |row| row.include?("Revenue Summary") }).to be true
          expect(rows.any? { |row| row.include?("Consultant Utilization") }).to be true
          expect(rows.any? { |row| row.include?("Project Profitability") }).to be true
          expect(rows.any? { |row| row.include?("Invoice Aging Report") }).to be true

          # Verify period is included
          expect(csv_content).to include(start_date.to_s)
          expect(csv_content).to include(end_date.to_s)
        end
      end
    end
  end

  describe "edge cases" do
    it "handles zero revenue gracefully in margin calculation" do
      margin = service.calculate_margin(billing_rate: 0, cost_rate: 50.0, hours: 10.0)
      expect(margin).to eq(0.0)
    end

    it "handles empty time entries" do
      allow(harvest_adapter).to receive(:get_time_entries).and_return([])

      result = service.consultant_utilization(start_date: Date.today, end_date: Date.today)
      expect(result).to eq([])
    end

    it "handles empty invoices" do
      allow(xero_adapter).to receive(:get_all_invoices).and_return([])

      result = service.outstanding_invoices
      expect(result).to eq([])
    end
  end
end
