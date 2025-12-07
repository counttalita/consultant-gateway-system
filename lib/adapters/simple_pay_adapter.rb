# frozen_string_literal: true

require "csv"

module Adapters
  class SimplePayAdapter
    class ValidationError < StandardError; end

    # Required headers for SimplePay bulk import
    CSV_HEADERS = %w[employee_id amount tax_amount description reference].freeze

    def initialize
      # No specific initialization needed for now as we're just generating files
    end

    # Generate SimplePay CSV from Xero bills
    # @param bills [Array<Hash>] List of Xero bills
    # @return [String] CSV content
    def generate_payroll_csv(bills)
      validate_bills!(bills)

      CSV.generate(headers: true) do |csv|
        csv << CSV_HEADERS

        bills.each do |bill|
          csv << format_bill_for_csv(bill)
        end
      end
    end

    # Extract payment data from a Xero bill
    # @param bill [Hash] Xero bill data
    # @return [Hash] Formatted data for SimplePay
    def extract_payment_data(bill)
      # This would look up the employee ID mapping, likely stored in the Consultant model
      # For now, we'll assume the bill has mapping or we pass consultant context
      consultant = Consultant.find_by(xero_id: bill[:contact_id])
      raise ValidationError, "Consultant not found for Xero Contact ID: #{bill[:contact_id]}" unless consultant

      # Check for SimplePay ID (we might need to add this to Consultant model if not present)
      # Assuming we store it or map it. For this task, let's assume we use a field or it's part of the profile.
      # Let's verify if we have simple_pay_id or similar on Consultant.
      # If not, we might need to add it or use a placeholder.
      # Tasks don't explicitly say add simple_pay_id, but "employee ID" is required.
      employee_id = consultant.metadata&.dig("simple_pay_id")
      raise ValidationError, "SimplePay Employee ID missing for consultant #{consultant.id}" if employee_id.blank?

      {
        employee_id: employee_id,
        amount: bill[:total],
        tax_amount: bill[:tax_amount] || 0.0, # Assuming bill hash has this or we calculate it
        description: "Consulting Services - #{bill[:reference]}",
        reference: bill[:invoice_number]
      }
    end

    private

    def validate_bills!(bills)
      raise ValidationError, "Bills list cannot be empty" if bills.empty?

      bills.each do |bill|
        unless bill.is_a?(Hash) && bill[:contact_id].present? && bill[:total].present?
          raise ValidationError, "Invalid bill format"
        end
      end
    end

    def format_bill_for_csv(bill)
      data = extract_payment_data(bill)

      [
        data[:employee_id],
        sprintf("%.2f", data[:amount]),
        sprintf("%.2f", data[:tax_amount]),
        data[:description],
        data[:reference]
      ]
    end
  end
end
