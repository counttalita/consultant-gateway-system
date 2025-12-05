# frozen_string_literal: true

# Service to orchestrate financial operations between Harvest and Xero
# Handles consultant financial setup and month-end processing
class FinancialService
  class FinancialSetupError < StandardError; end
  class MonthEndProcessingError < StandardError; end

  # Setup consultant in financial systems (Harvest and Xero)
  # @param consultant [Consultant] The consultant to setup
  # @return [Hash] Result with :success, :harvest_id, :xero_id, :errors
  def setup_consultant_in_systems(consultant)
    errors = []
    harvest_id = nil
    xero_id = nil

    begin
      # Step 1: Create Harvest user
      Rails.logger.info("Creating Harvest user for consultant #{consultant.id}")
      harvest_result = create_harvest_user(consultant)
      harvest_id = harvest_result["id"]

      # Update consultant with Harvest ID
      consultant.update!(harvest_id: harvest_id.to_s)

      # Log success
      AuditLogger.log(
        :harvest_user_created,
        consultant,
        { harvest_id: harvest_id },
        { service: "FinancialService" }
      )

      # Step 2: Create Xero supplier (only if Harvest succeeded)
      Rails.logger.info("Creating Xero supplier for consultant #{consultant.id}")
      xero_result = create_xero_supplier(consultant)
      xero_id = xero_result[:id]

      # Update consultant with Xero ID
      consultant.update!(xero_id: xero_id)

      # Log success
      AuditLogger.log(
        :xero_supplier_created,
        consultant,
        { xero_id: xero_id },
        { service: "FinancialService" }
      )

      {
        success: true,
        harvest_id: harvest_id,
        xero_id: xero_id,
        errors: []
      }
    rescue Adapters::HarvestAdapter::ApiError => e
      error_msg = "Harvest user creation failed: #{e.message}"
      errors << error_msg
      Rails.logger.error(error_msg)

      # Mark consultant for manual review
      consultant.update(needs_manual_review: true, manual_review_reason: error_msg)

      # Notify administrators
      notify_administrators(:harvest_error, consultant, e)

      {
        success: false,
        harvest_id: harvest_id,
        xero_id: nil,
        errors: errors
      }
    rescue Adapters::XeroAdapter::ApiError => e
      error_msg = "Xero supplier creation failed: #{e.message}"
      errors << error_msg
      Rails.logger.error(error_msg)

      # Mark consultant for manual review
      consultant.update(needs_manual_review: true, manual_review_reason: error_msg)

      # Notify administrators
      notify_administrators(:xero_error, consultant, e)

      {
        success: false,
        harvest_id: harvest_id,
        xero_id: nil,
        errors: errors
      }
    rescue => e
      error_msg = "Unexpected error during financial setup: #{e.message}"
      errors << error_msg
      Rails.logger.error("#{error_msg}\n#{e.backtrace.join("\n")}")

      # Mark consultant for manual review
      consultant.update(needs_manual_review: true, manual_review_reason: error_msg)

      # Notify administrators
      notify_administrators(:unexpected_error, consultant, e)

      {
        success: false,
        harvest_id: harvest_id,
        xero_id: xero_id,
        errors: errors
      }
    end
  end

  # Process month-end financial operations
  # @param month [Integer] Month number (1-12)
  # @param year [Integer] Year (e.g., 2024)
  # @return [Hash] Summary with :invoices_created, :bills_created, :failures
  def process_month_end(month, year)
    start_date = Date.new(year, month, 1)
    end_date = start_date.end_of_month

    Rails.logger.info("Starting month-end processing for #{month}/#{year}")

    # Initialize counters
    invoices_created = 0
    bills_created = 0
    failures = []

    begin
      # Step 1: Retrieve approved hours from Harvest
      approved_hours = retrieve_approved_hours(start_date, end_date)
      Rails.logger.info("Retrieved #{approved_hours.length} approved time entries")

      # Step 2: Group hours by project for client invoices
      project_hours = group_hours_by_project(approved_hours)

      # Step 3: Create draft invoices in Xero (with resilience)
      project_hours.each do |project_data|
        begin
          invoice = create_client_invoice(project_data)
          invoices_created += 1

          AuditLogger.log(
            :invoice_created,
            nil,
            invoice,
            { service: "FinancialService", month: month, year: year }
          )
        rescue => e
          error_msg = "Failed to create invoice for project #{project_data[:project_name]}: #{e.message}"
          Rails.logger.error(error_msg)
          failures << { type: :invoice, project: project_data[:project_name], error: error_msg }
          # Continue processing other invoices
        end
      end

      # Step 4: Group hours by consultant for bills
      consultant_hours = group_hours_by_consultant(approved_hours)

      # Step 5: Create consultant bills in Xero (with resilience)
      consultant_hours.each do |consultant_data|
        begin
          bill = create_consultant_bill(consultant_data, month, year)
          bills_created += 1

          AuditLogger.log(
            :bill_created,
            nil,
            bill,
            { service: "FinancialService", month: month, year: year }
          )
        rescue => e
          error_msg = "Failed to create bill for consultant #{consultant_data[:consultant_name]}: #{e.message}"
          Rails.logger.error(error_msg)
          failures << { type: :bill, consultant: consultant_data[:consultant_name], error: error_msg }
          # Continue processing other bills
        end
      end

      # Step 6: Send summary notification to finance team
      send_month_end_summary(month, year, invoices_created, bills_created, failures)

      Rails.logger.info("Month-end processing complete: #{invoices_created} invoices, #{bills_created} bills, #{failures.length} failures")

      {
        success: true,
        invoices_created: invoices_created,
        bills_created: bills_created,
        failures: failures,
        month: month,
        year: year
      }
    rescue => e
      error_msg = "Critical error during month-end processing: #{e.message}"
      Rails.logger.error("#{error_msg}\n#{e.backtrace.join("\n")}")

      # Notify administrators of critical failure
      notify_administrators(:month_end_critical_error, nil, e, { month: month, year: year })

      raise MonthEndProcessingError, error_msg
    end
  end

  private

  # Create Harvest user for consultant
  def create_harvest_user(consultant)
    harvest_adapter = Adapters::HarvestAdapter.new

    # Extract names from email or use defaults
    user = consultant.user
    first_name, last_name = extract_names_from_email(user.email)

    harvest_adapter.create_user(
      first_name: first_name,
      last_name: last_name,
      email: user.email
    )
  end

  # Create Xero supplier for consultant
  def create_xero_supplier(consultant)
    xero_adapter = Adapters::XeroAdapter.new
    xero_adapter.create_supplier(consultant)
  end

  # Retrieve approved hours from Harvest
  def retrieve_approved_hours(start_date, end_date)
    harvest_adapter = Adapters::HarvestAdapter.new
    harvest_adapter.get_approved_hours(start_date: start_date, end_date: end_date)
  end

  # Group hours by project for client invoicing
  def group_hours_by_project(approved_hours)
    grouped = approved_hours.group_by do |entry|
      entry["project"]["id"] rescue "unknown"
    end

    grouped.map do |project_id, entries|
      project_name = entries.first.dig("project", "name") || "Unknown Project"
      client_name = entries.first.dig("client", "name") || "Unknown Client"
      total_hours = entries.sum { |e| e["hours"].to_f }

      # Calculate line items
      line_items = entries.group_by { |e| e.dig("task", "name") || "Consulting Services" }.map do |task_name, task_entries|
        hours = task_entries.sum { |e| e["hours"].to_f }
        rate = task_entries.first.dig("billable_rate") || 1500.0 # Default rate

        {
          description: "#{task_name} - #{project_name}",
          quantity: hours,
          unit_amount: rate,
          account_code: "200" # Revenue account
        }
      end

      {
        project_id: project_id,
        project_name: project_name,
        client_name: client_name,
        total_hours: total_hours,
        line_items: line_items
      }
    end
  end

  # Group hours by consultant for billing
  def group_hours_by_consultant(approved_hours)
    grouped = approved_hours.group_by do |entry|
      entry["user"]["id"] rescue "unknown"
    end

    grouped.map do |user_id, entries|
      consultant_name = entries.first.dig("user", "name") || "Unknown Consultant"
      total_hours = entries.sum { |e| e["hours"].to_f }

      # Calculate line items
      line_items = entries.group_by { |e| e.dig("project", "name") || "Project Work" }.map do |project_name, project_entries|
        hours = project_entries.sum { |e| e["hours"].to_f }
        rate = project_entries.first.dig("cost_rate") || 1000.0 # Default cost rate

        {
          description: "#{project_name} - Consulting Services",
          quantity: hours,
          unit_amount: rate,
          account_code: "400" # Expense account
        }
      end

      # Find consultant by Harvest ID
      harvest_id = user_id.to_s
      consultant = Consultant.find_by(harvest_id: harvest_id)

      {
        user_id: user_id,
        consultant: consultant,
        consultant_name: consultant_name,
        total_hours: total_hours,
        line_items: line_items
      }
    end
  end

  # Create client invoice in Xero
  def create_client_invoice(project_data)
    xero_adapter = Adapters::XeroAdapter.new

    # Find or create project
    project = Project.find_or_create_by!(name: project_data[:project_name]) do |p|
      p.client_name = project_data[:client_name]
      p.status = "active"
    end

    # For now, use a default contact ID (in production, this would be looked up)
    contact_id = ENV["XERO_DEFAULT_CLIENT_CONTACT_ID"] || "default-contact-id"

    xero_adapter.create_draft_invoice(
      project: project,
      line_items: project_data[:line_items],
      contact_id: contact_id
    )
  end

  # Create consultant bill in Xero
  def create_consultant_bill(consultant_data, month, year)
    return nil unless consultant_data[:consultant]&.xero_id.present?

    xero_adapter = Adapters::XeroAdapter.new

    reference = "Month: #{Date::MONTHNAMES[month]} #{year}"

    xero_adapter.create_draft_bill(
      consultant: consultant_data[:consultant],
      line_items: consultant_data[:line_items],
      reference: reference
    )
  end

  # Send month-end summary notification
  def send_month_end_summary(month, year, invoices_created, bills_created, failures)
    begin
      finance_emails = ENV["FINANCE_TEAM_EMAILS"]&.split(",") || []
      return if finance_emails.empty?

      month_name = Date::MONTHNAMES[month]

      Adapters::ResendAdapter.send_email(
        to: finance_emails.first, # Resend expects a single email, not array
        template: "admin_notification",
        variables: {
          subject: "Month-End Processing Complete: #{month_name} #{year}",
          message: "Month-end processing has completed successfully.",
          priority: "medium",
          details: {
            "Month" => month_name,
            "Year" => year,
            "Invoices Created" => invoices_created,
            "Bills Created" => bills_created,
            "Failures" => failures.length
          }
        }
      )
    rescue => e
      Rails.logger.error("Failed to send month-end summary: #{e.message}")
      # Don't fail the entire process if email fails
    end
  end

  # Notify administrators of errors
  def notify_administrators(error_type, consultant, exception, metadata = {})
    begin
      admin_emails = ENV["ADMIN_EMAILS"]&.split(",") || []
      return if admin_emails.empty?

      Adapters::ResendAdapter.send_email(
        to: admin_emails.first, # Resend expects a single email, not array
        template: "admin_notification",
        variables: {
          subject: "Financial System Error: #{error_type}",
          message: exception.message,
          priority: "critical",
          details: {
            "Error Type" => error_type,
            "Consultant ID" => consultant&.id,
            "Consultant Email" => consultant&.user&.email,
            "Timestamp" => Time.current.to_s
          }.merge(metadata.transform_keys(&:to_s).transform_keys(&:titleize))
        }
      )
    rescue => e
      Rails.logger.error("Failed to send administrator notification: #{e.message}")
      # Don't fail the entire process if email fails
    end
  end

  # Extract names from email address
  def extract_names_from_email(email)
    username = email.split("@").first
    parts = username.split(/[._-]/)

    if parts.length >= 2
      [ parts.first.capitalize, parts.last.capitalize ]
    else
      [ parts.first.capitalize, "Consultant" ]
    end
  end
end
