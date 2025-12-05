# frozen_string_literal: true

# Service to orchestrate project setup including Google Drive folder creation
class ProjectSetupService
  class SetupError < StandardError; end

  def initialize(project)
    @project = project
    @google_drive_adapter = Adapters::GoogleDriveAdapter.new
  end

  # Complete project setup including Google Drive folder creation
  # @return [Boolean] true if setup successful
  def setup!
    return false unless @project.setup?

    ActiveRecord::Base.transaction do
      create_google_drive_folder
      @project.reload
    end

    true
  rescue Adapters::GoogleDriveAdapter::ApiError => e
    Rails.logger.error("Google Drive setup failed for project #{@project.id}: #{e.message}")
    raise SetupError, "Failed to create Google Drive folder: #{e.message}"
  rescue StandardError => e
    Rails.logger.error("Project setup failed for project #{@project.id}: #{e.message}")
    raise SetupError, "Project setup failed: #{e.message}"
  end

  # Create Google Drive folder structure for the project
  # @return [Hash] Folder metadata with id, name, and webViewLink
  def create_google_drive_folder
    return if @project.drive_folder_id.present?

    folder_metadata = @google_drive_adapter.create_folder_structure(
      client_name: @project.client_name,
      project_title: @project.name
    )

    @project.update!(
      drive_folder_id: folder_metadata["id"],
      drive_url: folder_metadata["webViewLink"]
    )

    AuditLogger.log(
      action: :project_drive_folder_created,
      resource: @project,
      metadata: {
        folder_id: folder_metadata["id"],
        folder_url: folder_metadata["webViewLink"]
      }
    )

    folder_metadata
  rescue Adapters::GoogleDriveAdapter::ApiError => e
    Rails.logger.error("Failed to create Google Drive folder for project #{@project.id}: #{e.message}")
    raise SetupError, "Failed to create Google Drive folder: #{e.message}"
  end

  # Share project folder with a user
  # @param email [String] Email address to share with
  # @param role [String] Permission role (reader, writer, commenter, owner)
  # @return [Boolean] true if successful
  def share_folder_with(email:, role: "writer")
    raise SetupError, "Project folder not created yet" if @project.drive_folder_id.blank?

    @google_drive_adapter.share_folder(
      folder_id: @project.drive_folder_id,
      email: email,
      role: role
    )

    AuditLogger.log(
      action: :project_drive_folder_shared,
      resource: @project,
      metadata: {
        email: email,
        role: role,
        folder_id: @project.drive_folder_id
      }
    )

    true
  rescue Adapters::GoogleDriveAdapter::ApiError => e
    Rails.logger.error("Failed to share folder for project #{@project.id}: #{e.message}")
    raise SetupError, "Failed to share folder: #{e.message}"
  end

  # Get folder metadata
  # @return [Hash] Folder metadata
  def folder_metadata
    raise SetupError, "Project folder not created yet" if @project.drive_folder_id.blank?

    @google_drive_adapter.get_folder(folder_id: @project.drive_folder_id)
  rescue Adapters::GoogleDriveAdapter::ApiError => e
    Rails.logger.error("Failed to get folder metadata for project #{@project.id}: #{e.message}")
    raise SetupError, "Failed to get folder metadata: #{e.message}"
  end
end
