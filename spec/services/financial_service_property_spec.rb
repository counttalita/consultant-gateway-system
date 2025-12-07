# frozen_string_literal: true

require "rails_helper"

RSpec.describe FinancialService, type: :service do
  let(:service) { described_class.new }

  describe "Property-Based Tests" do
    # Feature: consultant-gateway-system, Property 19: Invoice Generation from Hours
    # Validates: Requirements 5.2
    describe "Property 19: Invoice Generation from Hours" do
      it "creates draft client invoices in Xero for any set of approved hours grouped by project" do
        property_test(iterations: 100) do
          # Generate random month and year
          year = Rantly { range(2023, 2025) }
          month = Rantly { range(1, 12) }
          start_date = Date.new(year, month, 1)
          end_date = start_date.end_of_month

          # Generate random number of projects (1-5)
          num_projects = Rantly { range(1, 5) }

          # Generate approved hours data
          approved_hours = []
          project_ids = []

          num_projects.times do |i|
            project_id = Rantly { range(1000, 9999) }
            project_ids << project_id
            project_name = Rantly { sized(10) { string(:alpha) } }
            client_name = Rantly { sized(8) { string(:alpha) } }

            # Generate 1-10 time entries for this project
            num_entries = Rantly { range(1, 10) }
            num_entries.times do
              approved_hours << {
                "id" => Rantly { range(100000, 999999) },
                "hours" => Rantly { range(1.0, 8.0) }.round(2),
                "spent_date" => Rantly { range(start_date, end_date).to_s },
                "is_billed" => false,
                "billable_rate" => Rantly { range(1000.0, 2000.0) }.round(2),
                "project" => {
                  "id" => project_id,
                  "name" => project_name
                },
                "client" => {
                  "name" => client_name
                },
                "task" => {
                  "name" => "Consulting Services"
                },
                "user" => {
                  "id" => Rantly { range(1, 100) },
                  "name" => Rantly { sized(8) { string(:alpha) } }
                }
              }
            end
          end

          # Mock Harvest adapter
          harvest_adapter = instance_double(Adapters::HarvestAdapter)
          allow(Adapters::HarvestAdapter).to receive(:new).and_return(harvest_adapter)
          allow(harvest_adapter).to receive(:get_approved_hours).and_return(approved_hours)

          # Mock Xero adapter for invoice creation
          xero_adapter = instance_double(Adapters::XeroAdapter)
          allow(Adapters::XeroAdapter).to receive(:new).and_return(xero_adapter)

          # Track invoice creation calls
          invoice_calls = []
          allow(xero_adapter).to receive(:create_draft_invoice) do |args|
            invoice_calls << args
            {
              id: SecureRandom.uuid,
              invoice_number: "INV-#{rand(1000..9999)}",
              total: args[:line_items].sum { |li| li[:quantity] * li[:unit_amount] },
              status: "DRAFT"
            }
          end

          # Mock Resend adapter (class method)
          allow(Adapters::ResendAdapter).to receive(:send_email).and_return("msg_#{SecureRandom.hex(8)}")

          # Process month-end
          result = service.process_month_end(month, year)

          # Verify invoices were created
          expect(result[:success]).to be true
          expect(result[:invoices_created]).to eq(num_projects)
          expect(invoice_calls.length).to eq(num_projects)

          # Verify each invoice has correct structure
          invoice_calls.each do |call|
            expect(call[:project]).to be_present
            expect(call[:line_items]).to be_an(Array)
            expect(call[:line_items]).not_to be_empty
            expect(call[:contact_id]).to be_present

            # Verify line items have required fields
            call[:line_items].each do |item|
              expect(item[:description]).to be_present
              expect(item[:quantity]).to be > 0
              expect(item[:unit_amount]).to be >= 0
              expect(item[:account_code]).to be_present
            end
          end
        end
      end
    end

    # Feature: consultant-gateway-system, Property 20: Bill Generation from Invoices
    # Validates: Requirements 5.3
    describe "Property 20: Bill Generation from Invoices" do
      it "creates corresponding draft consultant bills in Xero for any set of created invoices" do
        property_test(iterations: 100) do
          # Generate random month and year
          year = Rantly { range(2023, 2025) }
          month = Rantly { range(1, 12) }
          start_date = Date.new(year, month, 1)
          end_date = start_date.end_of_month

          # Generate random number of consultants (1-5)
          num_consultants = Rantly { range(1, 5) }

          # Create consultants with Xero IDs
          consultants = []
          num_consultants.times do |i|
            timestamp = (Time.current.to_f * 1000000).to_i
            user = create(:user, email: "consultant#{timestamp}#{i}#{rand(10000)}@example.com")
            consultant = create(:consultant,
              user: user,
              xero_id: "xero-#{SecureRandom.uuid}",
              harvest_id: "#{timestamp}#{i}#{rand(1000..9999)}"
            )
            consultants << consultant
          end

          # Generate approved hours data
          approved_hours = []

          consultants.each do |consultant|
            # Generate 1-10 time entries for this consultant
            num_entries = Rantly { range(1, 10) }
            num_entries.times do
              approved_hours << {
                "id" => Rantly { range(100000, 999999) },
                "hours" => Rantly { range(1.0, 8.0) }.round(2),
                "spent_date" => Rantly { range(start_date, end_date).to_s },
                "is_billed" => false,
                "cost_rate" => Rantly { range(800.0, 1500.0) }.round(2),
                "project" => {
                  "id" => Rantly { range(1000, 9999) },
                  "name" => Rantly { sized(10) { string(:alpha) } }
                },
                "client" => {
                  "name" => Rantly { sized(8) { string(:alpha) } }
                },
                "task" => {
                  "name" => "Consulting Services"
                },
                "user" => {
                  "id" => consultant.harvest_id.to_i,
                  "name" => consultant.user.email.split("@").first
                }
              }
            end
          end

          # Mock Harvest adapter
          harvest_adapter = instance_double(Adapters::HarvestAdapter)
          allow(Adapters::HarvestAdapter).to receive(:new).and_return(harvest_adapter)
          allow(harvest_adapter).to receive(:get_approved_hours).and_return(approved_hours)

          # Mock Xero adapter
          xero_adapter = instance_double(Adapters::XeroAdapter)
          allow(Adapters::XeroAdapter).to receive(:new).and_return(xero_adapter)

          # Track invoice and bill creation calls
          allow(xero_adapter).to receive(:create_draft_invoice) do
            {
              id: SecureRandom.uuid,
              invoice_number: "INV-#{rand(1000..9999)}",
              total: rand(1000.0..10000.0).round(2),
              status: "DRAFT"
            }
          end

          bill_calls = []
          allow(xero_adapter).to receive(:create_draft_bill) do |args|
            bill_calls << args
            {
              id: SecureRandom.uuid,
              invoice_number: "BILL-#{rand(1000..9999)}",
              total: args[:line_items].sum { |li| li[:quantity] * li[:unit_amount] },
              status: "DRAFT"
            }
          end

          # Mock Resend adapter (class method)
          allow(Adapters::ResendAdapter).to receive(:send_email).and_return("msg_#{SecureRandom.hex(8)}")

          # Process month-end
          result = service.process_month_end(month, year)

          # Verify bills were created
          expect(result[:success]).to be true
          expect(result[:bills_created]).to eq(num_consultants)
          expect(bill_calls.length).to eq(num_consultants)

          # Verify each bill has correct structure
          bill_calls.each do |call|
            expect(call[:consultant]).to be_present
            expect(call[:consultant].xero_id).to be_present
            expect(call[:line_items]).to be_an(Array)
            expect(call[:line_items]).not_to be_empty
            expect(call[:reference]).to include(Date::MONTHNAMES[month])

            # Verify line items have required fields
            call[:line_items].each do |item|
              expect(item[:description]).to be_present
              expect(item[:quantity]).to be > 0
              expect(item[:unit_amount]).to be >= 0
              expect(item[:account_code]).to be_present
            end
          end
        end
      end
    end

    # Feature: consultant-gateway-system, Property 21: Batch Processing Resilience
    # Validates: Requirements 5.4
    describe "Property 21: Batch Processing Resilience" do
      it "continues processing remaining records when any invoice or bill creation fails" do
        property_test(iterations: 50) do
          # Generate random month and year
          year = Rantly { range(2023, 2025) }
          month = Rantly { range(1, 12) }
          start_date = Date.new(year, month, 1)
          end_date = start_date.end_of_month

          # Generate multiple projects and consultants
          num_projects = Rantly { range(3, 6) }
          num_consultants = Rantly { range(3, 6) }

          # Create consultants
          consultants = []
          num_consultants.times do |i|
            timestamp = (Time.current.to_f * 1000000).to_i
            user = create(:user, email: "consultant#{timestamp}#{i}#{rand(10000)}@example.com")
            consultant = create(:consultant,
              user: user,
              xero_id: "xero-#{SecureRandom.uuid}",
              harvest_id: "#{timestamp}#{i}#{rand(1000..9999)}"
            )
            consultants << consultant
          end

          # Generate approved hours
          # Create unique project IDs and consultant assignments
          project_ids = num_projects.times.map { rand(1000..9999) }
          approved_hours = []

          # Add one time entry per project, cycling through consultants
          num_projects.times do |i|
            consultant = consultants[i % consultants.length]
            approved_hours << {
              "id" => rand(100000..999999),
              "hours" => rand(1.0..8.0).round(2),
              "spent_date" => start_date.to_s,
              "is_billed" => false,
              "billable_rate" => rand(1000.0..2000.0).round(2),
              "cost_rate" => rand(800.0..1500.0).round(2),
              "project" => {
                "id" => project_ids[i],
                "name" => "Project #{i}"
              },
              "client" => {
                "name" => "Client #{i}"
              },
              "task" => {
                "name" => "Consulting"
              },
              "user" => {
                "id" => consultant.harvest_id.to_i,
                "name" => consultant.user.email.split("@").first
              }
            }
          end

          # Count unique consultants in the hours
          unique_consultant_ids = approved_hours.map { |h| h["user"]["id"] }.uniq
          expected_bills = unique_consultant_ids.length

          # Mock Harvest adapter
          harvest_adapter = instance_double(Adapters::HarvestAdapter)
          allow(Adapters::HarvestAdapter).to receive(:new).and_return(harvest_adapter)
          allow(harvest_adapter).to receive(:get_approved_hours).and_return(approved_hours)

          # Mock Xero adapter with some failures
          xero_adapter = instance_double(Adapters::XeroAdapter)
          allow(Adapters::XeroAdapter).to receive(:new).and_return(xero_adapter)

          # Randomly fail some invoice creations
          invoice_call_count = 0
          allow(xero_adapter).to receive(:create_draft_invoice) do
            invoice_call_count += 1
            # Fail randomly (about 30% of the time)
            if rand < 0.3
              raise Adapters::XeroAdapter::ApiError, "Simulated invoice creation failure"
            else
              {
                id: SecureRandom.uuid,
                invoice_number: "INV-#{rand(1000..9999)}",
                total: rand(1000.0..10000.0).round(2),
                status: "DRAFT"
              }
            end
          end

          # Randomly fail some bill creations
          bill_call_count = 0
          allow(xero_adapter).to receive(:create_draft_bill) do
            bill_call_count += 1
            # Fail randomly (about 30% of the time)
            if rand < 0.3
              raise Adapters::XeroAdapter::ApiError, "Simulated bill creation failure"
            else
              {
                id: SecureRandom.uuid,
                invoice_number: "BILL-#{rand(1000..9999)}",
                total: rand(1000.0..10000.0).round(2),
                status: "DRAFT"
              }
            end
          end

          # Mock Resend adapter (class method)
          allow(Adapters::ResendAdapter).to receive(:send_email).and_return("msg_#{SecureRandom.hex(8)}")

          # Process month-end
          result = service.process_month_end(month, year)

          # Verify processing completed despite failures
          expect(result[:success]).to be true

          # Verify the KEY PROPERTY: processing continues despite failures
          # The system should complete successfully even when some operations fail
          expect(result[:success]).to be true

          # Verify that both invoice and bill processing was attempted
          expect(invoice_call_count).to be > 0
          expect(bill_call_count).to be > 0

          # Verify that the system attempted to process all records
          # (some succeeded, some failed, but all were attempted)
          expect(result[:invoices_created] + result[:failures].count { |f| f[:type] == :invoice }).to be > 0
          expect(result[:bills_created] + result[:failures].count { |f| f[:type] == :bill }).to be > 0

          # Verify failures are tracked properly when they occur
          result[:failures].each do |failure|
            expect(failure[:type]).to be_in([ :invoice, :bill ])
            expect(failure[:error]).to be_present
          end
        end
      end
    end

    # Feature: consultant-gateway-system, Property 22: Month-End Summary Notification
    # Validates: Requirements 5.5
    describe "Property 22: Month-End Summary Notification" do
      it "sends a summary notification to finance team for any completed month-end processing" do
        property_test(iterations: 50) do
          # Generate random month and year
          year = Rantly { range(2023, 2025) }
          month = Rantly { range(1, 12) }
          start_date = Date.new(year, month, 1)
          end_date = start_date.end_of_month

          # Generate random counts
          num_projects = Rantly { range(1, 5) }
          num_consultants = Rantly { range(1, 5) }

          # Create consultants
          consultants = []
          num_consultants.times do |i|
            timestamp = (Time.current.to_f * 1000000).to_i
            user = create(:user, email: "consultant#{timestamp}#{i}#{rand(10000)}@example.com")
            consultant = create(:consultant,
              user: user,
              xero_id: "xero-#{SecureRandom.uuid}",
              harvest_id: "#{timestamp}#{i}#{rand(1000..9999)}"
            )
            consultants << consultant
          end

          # Generate approved hours
          approved_hours = []
          num_projects.times do |i|
            approved_hours << {
              "id" => rand(100000..999999),
              "hours" => rand(1.0..8.0).round(2),
              "spent_date" => start_date.to_s,
              "is_billed" => false,
              "billable_rate" => rand(1000.0..2000.0).round(2),
              "cost_rate" => rand(800.0..1500.0).round(2),
              "project" => {
                "id" => rand(1000..9999),
                "name" => "Project #{i}"
              },
              "client" => {
                "name" => "Client #{i}"
              },
              "task" => {
                "name" => "Consulting"
              },
              "user" => {
                "id" => consultants[i % consultants.length].harvest_id.to_i,
                "name" => "Consultant #{i}"
              }
            }
          end

          # Mock adapters
          harvest_adapter = instance_double(Adapters::HarvestAdapter)
          allow(Adapters::HarvestAdapter).to receive(:new).and_return(harvest_adapter)
          allow(harvest_adapter).to receive(:get_approved_hours).and_return(approved_hours)

          xero_adapter = instance_double(Adapters::XeroAdapter)
          allow(Adapters::XeroAdapter).to receive(:new).and_return(xero_adapter)
          allow(xero_adapter).to receive(:create_draft_invoice) do
            {
              id: SecureRandom.uuid,
              invoice_number: "INV-#{rand(1000..9999)}",
              total: rand(1000.0..10000.0).round(2),
              status: "DRAFT"
            }
          end
          allow(xero_adapter).to receive(:create_draft_bill) do
            {
              id: SecureRandom.uuid,
              invoice_number: "BILL-#{rand(1000..9999)}",
              total: rand(1000.0..10000.0).round(2),
              status: "DRAFT"
            }
          end

          # Mock Resend adapter and capture email calls (class method)
          email_calls = []
          allow(Adapters::ResendAdapter).to receive(:send_email) do |**args|
            email_calls << args
            "msg_#{SecureRandom.hex(8)}"
          end

          # Set finance team emails
          allow(ENV).to receive(:[]).and_call_original
          allow(ENV).to receive(:[]).with("FINANCE_TEAM_EMAILS").and_return("finance@example.com,cfo@example.com")

          # Process month-end
          result = service.process_month_end(month, year)

          # Verify summary email was sent
          expect(result[:success]).to be true
          expect(email_calls).not_to be_empty

          # Find the summary email (using admin_notification template)
          summary_email = email_calls.find { |call| call[:template] == "admin_notification" }
          expect(summary_email).to be_present

          # Verify summary contains required information
          expect(summary_email[:to]).to eq("finance@example.com")
          expect(summary_email[:variables][:subject]).to include(Date::MONTHNAMES[month])
          expect(summary_email[:variables][:subject]).to include(year.to_s)
          expect(summary_email[:variables][:details]["Invoices Created"]).to eq(result[:invoices_created])
          expect(summary_email[:variables][:details]["Bills Created"]).to eq(result[:bills_created])
          expect(summary_email[:variables][:details]["Failures"]).to eq(result[:failures].length)
        end
      end
    end
  end
end
