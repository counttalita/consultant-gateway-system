# frozen_string_literal: true

require "rails_helper"

RSpec.describe Adapters::SimplePayAdapter, type: :adapter do
  let(:adapter) { described_class.new }

  describe "Property-Based Tests" do
    # Feature: consultant-gateway-system, Property 75: SimplePay Data Extraction
    # Validates: Requirements 22.1
    describe "Property 75: SimplePay Data Extraction" do
      it "correctly extracts payment data from any valid Xero bill for a known consultant" do
        property_test(iterations: 100) do
          # Create consultant with SimplePay ID and Xero ID
          simple_pay_id = Rantly { sized(5) { string(:alpha) } }
          consultant = create(:consultant,
            metadata: { "simple_pay_id" => simple_pay_id },
            xero_id: "CON-#{SecureRandom.hex(8)}"
          )

          # Generate random bill data
          bill_data = {
            contact_id: consultant.xero_id,
            total: Rantly { range(1000, 50000).to_f },
            invoice_number: Rantly { "INV-#{range(1000, 9999)}" },
            reference: Rantly { sized(10) { string(:alpha) } },
            tax_amount: Rantly { range(0, 500).to_f }
          }

          # Extract data
          result = adapter.extract_payment_data(bill_data)

          # Verify extraction
          expect(result[:employee_id]).to eq(simple_pay_id)
          expect(result[:amount]).to eq(bill_data[:total])
          expect(result[:reference]).to eq(bill_data[:invoice_number])
          expect(result[:description]).to include(bill_data[:reference])
        end
      end
    end

    # Feature: consultant-gateway-system, Property 76: SimplePay Field Validation
    # Validates: Requirements 22.2
    describe "Property 76: SimplePay Field Validation" do
      it "raises ValidationError if consultant is missing SimplePay ID" do
        property_test(iterations: 50) do
          # Create consultant WITHOUT SimplePay ID but WITH Xero ID
          consultant = create(:consultant,
            metadata: {},
            xero_id: "CON-#{SecureRandom.hex(8)}"
          )

          bill_data = {
            contact_id: consultant.xero_id,
            total: 1000.0,
            invoice_number: "INV-123",
            reference: "Ref"
          }

          expect {
            adapter.extract_payment_data(bill_data)
          }.to raise_error(Adapters::SimplePayAdapter::ValidationError, /SimplePay Employee ID missing/)
        end
      end

      it "raises ValidationError if bill data is invalid/incomplete" do
        property_test(iterations: 50) do
          # Generate invalid bill data (missing contact_id or total)
          invalid_bill = Rantly {
            {
              contact_id: choose(nil, ""),
              total: 100.0
            }
          }

          expect {
            adapter.generate_payroll_csv([ invalid_bill ])
          }.to raise_error(Adapters::SimplePayAdapter::ValidationError)
        end
      end
    end

    # Feature: consultant-gateway-system, Property 77: SimplePay CSV Generation
    # Validates: Requirements 22.3
    describe "Property 77: SimplePay CSV Generation" do
      it "generates a valid CSV string matching the required format" do
        property_test(iterations: 50) do
          # Create multiple consultants and bills
          consultants = Array.new(3) {
            create(:consultant,
              metadata: { "simple_pay_id" => "SP#{SecureRandom.hex(4)}" },
              xero_id: "CON-#{SecureRandom.hex(8)}"
            )
          }

          bills = consultants.map do |c|
            {
              contact_id: c.xero_id,
              total: Rantly { range(1000, 5000).to_f },
              invoice_number: "INV-#{SecureRandom.hex(4)}",
              reference: "Month Work",
              tax_amount: 0.0
            }
          end

          csv_content = adapter.generate_payroll_csv(bills)

          # Parse generated CSV
          parsed_csv = CSV.parse(csv_content, headers: true)

          # Verify CSV structure
          expect(parsed_csv.headers).to eq(Adapters::SimplePayAdapter::CSV_HEADERS)
          expect(parsed_csv.length).to eq(bills.length)

          # Verify content matches bills
          bills.each_with_index do |bill, index|
            row = parsed_csv[index]
            consultant = Consultant.find_by(xero_id: bill[:contact_id])

            expect(row["employee_id"]).to eq(consultant.metadata["simple_pay_id"])
            expect(row["amount"]).to eq(sprintf("%.2f", bill[:total]))
            expect(row["reference"]).to eq(bill[:invoice_number])
          end
        end
      end
    end
  end
end
