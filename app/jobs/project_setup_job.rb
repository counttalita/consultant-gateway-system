# frozen_string_literal: true

# Background job to set up project resources (ClickUp, Google Drive, Airtable)
class ProjectSetupJob < ApplicationJob
  queue_as :default

  retry_on Adapters::GoogleDriveAdapter::ApiError, wait: :exponentially_longer, attempts: 5
  retry_on Adapters::ClickUpAdapter::ApiError, wait: :exponentially_longer, attempts: 5
  retry_on Adapters::AirtableAdapter::ApiError, wait: :exponentially_longer, attempts: 5
  retry_on ProjectService::SetupError, wait: :exponentially_longer, attempts: 3

  def perform(project_id)
    project = Project.find(project_id)

    # Skip if already fully set up
    return if project.fully_setup?

    project_service = ProjectService.new
    results = project_service.complete_project_setup(project)

    Rails.logger.info("Successfully completed project setup for project #{project.id}: #{results.inspect}")
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error("Project #{project_id} not found: #{e.message}")
  rescue StandardError => e
    Rails.logger.error("Failed to setup project #{project_id}: #{e.message}")
    raise
  end
end
