# frozen_string_literal: true

# Service to orchestrate complete project setup workflow
# Coordinates ClickUp project creation, Google Drive folder creation, and Airtable updates
class ProjectService
  class ProjectError < StandardError; end
  class WebhookValidationError < ProjectError; end
  class SetupError < ProjectError; end

  def initialize
    @clickup_adapter = Adapters::ClickUpAdapter.new
    @google_drive_adapter = Adapters::GoogleDriveAdapter.new
  end

  # Process a won deal webhook and create project resources
  # @param webhook_payload [Hash] Webhook data from Airtable
  # @return [Project] Created project
  def process_won_deal_webhook(webhook_payload)
    validate_webhook_payload!(webhook_payload)

    deal_data = extract_deal_data(webhook_payload)

    # Create project record
    project = create_project_from_deal(deal_data)

    # Queue background job for resource creation
    ProjectSetupJob.perform_later(project.id)

    AuditLogger.log(
      action: :won_deal_webhook_received,
      resource: project,
      metadata: {
        deal_id: deal_data[:deal_id],
        client_name: deal_data[:client_name],
        project_title: deal_data[:project_title]
      }
    )

    project
  rescue WebhookValidationError => e
    # Re-raise validation errors without wrapping
    raise
  rescue StandardError => e
    Rails.logger.error("Failed to process won deal webhook: #{e.message}")
    raise ProjectError, "Failed to process won deal: #{e.message}"
  end

  # Complete project setup including ClickUp and Google Drive
  # @param project [Project] Project to set up
  # @return [Hash] Setup results with ClickUp and Drive URLs
  def complete_project_setup(project)
    raise SetupError, "Project already fully set up" if project.fully_setup?

    results = {}

    ActiveRecord::Base.transaction do
      # Create ClickUp project with Change Management template
      if project.clickup_project_id.blank?
        clickup_result = create_clickup_project(project)
        results[:clickup] = clickup_result
      end

      # Create Google Drive folder structure
      if project.drive_folder_id.blank?
        drive_result = create_google_drive_folder(project)
        results[:drive] = drive_result
      end

      # Update Airtable deal with project links
      if project.airtable_deal_id.present?
        update_airtable_deal(project)
        results[:airtable_updated] = true
      end

      # Mark project as active
      project.activate! if project.setup?
    end

    AuditLogger.log(
      action: :project_setup_completed,
      resource: project,
      metadata: {
        clickup_url: project.clickup_url,
        drive_url: project.drive_url,
        airtable_deal_id: project.airtable_deal_id
      }
    )

    results
  rescue StandardError => e
    Rails.logger.error("Failed to complete project setup for project #{project.id}: #{e.message}")
    raise SetupError, "Project setup failed: #{e.message}"
  end

  # Create ClickUp project with Change Management template
  # @param project [Project] Project to create ClickUp project for
  # @return [Hash] ClickUp project data
  def create_clickup_project(project)
    return if project.clickup_project_id.present?

    # Get space ID from environment (should be configured per environment)
    space_id = ENV["CLICKUP_SPACE_ID"]
    raise SetupError, "ClickUp space ID not configured" if space_id.blank?

    # Create list (ClickUp's term for a project)
    list_data = @clickup_adapter.create_list(
      name: "#{project.client_name} - #{project.name}",
      space_id: space_id
    )

    # Apply Change Management template if template ID is configured
    template_id = ENV["CLICKUP_CHANGE_MANAGEMENT_TEMPLATE_ID"]
    if template_id.present?
      @clickup_adapter.apply_template(
        list_id: list_data["id"],
        template_id: template_id
      )
    end

    # Update project with ClickUp details
    clickup_url = "https://app.clickup.com/#{space_id}/v/li/#{list_data['id']}"
    project.update!(
      clickup_project_id: list_data["id"],
      clickup_url: clickup_url
    )

    AuditLogger.log(
      action: :clickup_project_created,
      resource: project,
      metadata: {
        clickup_project_id: list_data["id"],
        clickup_url: clickup_url,
        template_applied: template_id.present?
      }
    )

    list_data
  rescue Adapters::ClickUpAdapter::ApiError => e
    Rails.logger.error("Failed to create ClickUp project for project #{project.id}: #{e.message}")
    raise SetupError, "Failed to create ClickUp project: #{e.message}"
  end

  # Create Google Drive folder structure
  # @param project [Project] Project to create folder for
  # @return [Hash] Folder metadata
  def create_google_drive_folder(project)
    return if project.drive_folder_id.present?

    folder_metadata = @google_drive_adapter.create_folder_structure(
      client_name: project.client_name,
      project_title: project.name
    )

    project.update!(
      drive_folder_id: folder_metadata["id"],
      drive_url: folder_metadata["webViewLink"]
    )

    AuditLogger.log(
      action: :project_drive_folder_created,
      resource: project,
      metadata: {
        folder_id: folder_metadata["id"],
        folder_url: folder_metadata["webViewLink"]
      }
    )

    folder_metadata
  rescue Adapters::GoogleDriveAdapter::ApiError => e
    Rails.logger.error("Failed to create Google Drive folder for project #{project.id}: #{e.message}")
    raise SetupError, "Failed to create Google Drive folder: #{e.message}"
  end

  # Update Airtable deal with project links
  # @param project [Project] Project with ClickUp and Drive URLs
  # @return [Hash] Updated Airtable record
  def update_airtable_deal(project)
    raise SetupError, "Project has no Airtable deal ID" if project.airtable_deal_id.blank?

    # Get base ID from environment
    base_id = ENV["AIRTABLE_BASE_ID"]
    raise SetupError, "Airtable base ID not configured" if base_id.blank?

    update_data = {
      "Status" => "In Delivery"
    }

    update_data["ClickUp Project"] = project.clickup_url if project.clickup_url.present?
    update_data["Google Drive Folder"] = project.drive_url if project.drive_url.present?

    result = Adapters::AirtableAdapter.update_record(
      base_id: base_id,
      table: "Deals",
      record_id: project.airtable_deal_id,
      fields: update_data
    )

    AuditLogger.log(
      action: :airtable_deal_updated,
      resource: project,
      metadata: {
        deal_id: project.airtable_deal_id,
        updates: update_data
      }
    )

    result
  rescue Adapters::AirtableAdapter::ApiError => e
    Rails.logger.error("Failed to update Airtable deal for project #{project.id}: #{e.message}")
    raise SetupError, "Failed to update Airtable deal: #{e.message}"
  end

  private

  # Validate webhook payload structure
  def validate_webhook_payload!(payload)
    required_fields = %w[deal_id client_name project_title]

    missing_fields = required_fields.reject { |field| payload[field].present? || payload[field.to_sym].present? }

    if missing_fields.any?
      raise WebhookValidationError, "Missing required fields: #{missing_fields.join(', ')}"
    end

    true
  end

  # Extract deal data from webhook payload
  def extract_deal_data(payload)
    {
      deal_id: payload["deal_id"] || payload[:deal_id],
      client_name: payload["client_name"] || payload[:client_name],
      project_title: payload["project_title"] || payload[:project_title],
      start_date: payload["start_date"] || payload[:start_date],
      end_date: payload["end_date"] || payload[:end_date],
      description: payload["description"] || payload[:description]
    }
  end

  # Create project record from deal data
  def create_project_from_deal(deal_data)
    Project.create!(
      name: deal_data[:project_title],
      client_name: deal_data[:client_name],
      airtable_deal_id: deal_data[:deal_id],
      status: "setup",
      start_date: deal_data[:start_date],
      end_date: deal_data[:end_date]
    )
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.error("Failed to create project from deal: #{e.message}")
    raise ProjectError, "Failed to create project: #{e.message}"
  end
end
