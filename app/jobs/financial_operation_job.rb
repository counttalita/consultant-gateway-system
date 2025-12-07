# frozen_string_literal: true

# Job for asynchronous financial operations
class FinancialOperationJob < ApplicationJob
  queue_as :default

  retry_on Adapters::XeroAdapter::ApiError, wait: :exponentially_longer, attempts: 5
  retry_on Adapters::XeroAdapter::RateLimitError, wait: 1.minute, attempts: 3

  # Process financial operation asynchronously
  # @param operation_type [String] Type of operation ('create_invoice', 'create_bill', 'sync_financial_data')
  # @param params [Hash] Operation parameters
  def perform(operation_type, params = {})
    xero_adapter = Adapters::XeroAdapter.new

    case operation_type
    when "create_invoice"
      create_invoice(xero_adapter, params)
    when "create_bill"
      create_bill(xero_adapter, params)
    when "sync_financial_data"
      sync_financial_data(xero_adapter, params)
    else
      raise ArgumentError, "Invalid operation type: #{operation_type}"
    end

    AuditLogger.log(
      action: :financial_operation_completed,
      metadata: {
        operation_type: operation_type,
        params: params.except(:line_items) # Don't log full line items
      }
    )
  rescue StandardError => e
    Rails.logger.error("FinancialOperationJob failed: #{e.message}")
    AuditLogger.log(
      action: :financial_operation_failed,
      metadata: {
        operation_type: operation_type,
        error: e.message
      }
    )
    raise
  end

  private

  def create_invoice(adapter, params)
    project = Project.find(params[:project_id])
    line_items = params[:line_items]
    contact_id = params[:contact_id]

    raise ArgumentError, "Line items are required" if line_items.blank?
    raise ArgumentError, "Contact ID is required" if contact_id.blank?

    result = adapter.create_draft_invoice(
      project: project,
      line_items: line_items,
      contact_id: contact_id
    )

    Rails.logger.info("Invoice created: #{result[:invoice_number]}")
  end

  def create_bill(adapter, params)
    consultant = Consultant.find(params[:consultant_id])
    line_items = params[:line_items]
    reference = params[:reference]

    raise ArgumentError, "Line items are required" if line_items.blank?

    result = adapter.create_draft_bill(
      consultant: consultant,
      line_items: line_items,
      reference: reference
    )

    Rails.logger.info("Bill created: #{result[:invoice_number]}")
  end

  def sync_financial_data(adapter, params)
    start_date = Date.parse(params[:start_date])
    end_date = Date.parse(params[:end_date])

    # Sync invoices
    invoices = adapter.get_invoices(start_date: start_date, end_date: end_date)
    Rails.logger.info("Synced #{invoices.length} invoices")

    # Sync bills
    bills = adapter.get_all_bills
    Rails.logger.info("Synced #{bills.length} bills")
  end
end
