# frozen_string_literal: true

require "google/apis/drive_v3"
require "googleauth"
require "ostruct"

module Adapters
  class GoogleDriveAdapter
    class ApiError < StandardError; end
    class AuthenticationError < ApiError; end
    class ResourceNotFoundError < ApiError; end

    # Standard folder structure for projects
    FOLDER_STRUCTURE = [
      "01_Project_Planning",
      "02_Requirements",
      "03_Design",
      "04_Implementation",
      "05_Testing",
      "06_Deployment",
      "07_Documentation"
    ].freeze

    def initialize(credentials: nil)
      @credentials = credentials || load_credentials_from_env
      @drive_service = Google::Apis::DriveV3::DriveService.new
      @drive_service.authorization = authorize
    rescue StandardError => e
      raise AuthenticationError, "Failed to initialize Google Drive adapter: #{e.message}"
    end

    # Create a complete folder structure for a project
    # @param client_name [String] Name of the client
    # @param project_title [String] Title of the project
    # @return [Hash] Root folder metadata with id, name, and webViewLink
    def create_folder_structure(client_name:, project_title:)
      root_folder_name = "#{client_name} - #{project_title}"

      # Create root folder
      root_folder = create_folder(name: root_folder_name)

      # Create subfolders
      FOLDER_STRUCTURE.each do |subfolder_name|
        create_folder(name: subfolder_name, parent_id: root_folder["id"])
      end

      # Log the operation
      AuditLogger.log(
        action: :google_drive_folder_created,
        resource: OpenStruct.new(id: root_folder["id"], class: OpenStruct.new(name: "GoogleDriveFolder")),
        metadata: {
          folder_name: root_folder_name,
          folder_id: root_folder["id"],
          subfolders: FOLDER_STRUCTURE
        }
      )

      root_folder
    rescue Google::Apis::Error => e
      handle_api_error(e)
    end

    # Create a single folder
    # @param name [String] Folder name
    # @param parent_id [String, nil] Parent folder ID (optional)
    # @return [Hash] Folder metadata with id, name, and webViewLink
    def create_folder(name:, parent_id: nil)
      file_metadata = {
        name: name,
        mime_type: "application/vnd.google-apps.folder"
      }

      file_metadata[:parents] = [ parent_id ] if parent_id.present?

      folder = retry_with_backoff do
        @drive_service.create_file(
          file_metadata,
          fields: "id, name, webViewLink"
        )
      end

      {
        "id" => folder.id,
        "name" => folder.name,
        "webViewLink" => folder.web_view_link
      }
    rescue Google::Apis::Error => e
      handle_api_error(e)
    end

    # Share a folder with a user or group
    # @param folder_id [String] Folder ID to share
    # @param email [String] Email address to share with
    # @param role [String] Permission role (reader, writer, commenter, owner)
    # @return [Boolean] True if successful
    def share_folder(folder_id:, email:, role: "writer")
      permission = {
        type: "user",
        role: role,
        email_address: email
      }

      retry_with_backoff do
        @drive_service.create_permission(
          folder_id,
          permission,
          fields: "id"
        )
      end

      true
    rescue Google::Apis::Error => e
      handle_api_error(e)
    end

    # Get folder metadata
    # @param folder_id [String] Folder ID
    # @return [Hash] Folder metadata
    def get_folder(folder_id:)
      folder = retry_with_backoff do
        @drive_service.get_file(
          folder_id,
          fields: "id, name, webViewLink, parents"
        )
      end

      {
        "id" => folder.id,
        "name" => folder.name,
        "webViewLink" => folder.web_view_link,
        "parents" => folder.parents
      }
    rescue Google::Apis::Error => e
      handle_api_error(e)
    end

    private

    def load_credentials_from_env
      credentials_json = ENV["GOOGLE_DRIVE_SERVICE_ACCOUNT_CREDENTIALS"]
      credentials_path = ENV["GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON"]

      if credentials_json.present?
        # Decode base64-encoded JSON if provided
        begin
          JSON.parse(Base64.decode64(credentials_json))
        rescue StandardError
          # If not base64, try parsing as-is
          JSON.parse(credentials_json)
        end
      elsif credentials_path.present? && File.exist?(credentials_path)
        JSON.parse(File.read(credentials_path))
      else
        raise AuthenticationError, "Google Drive credentials not found. Set GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON or GOOGLE_DRIVE_SERVICE_ACCOUNT_CREDENTIALS"
      end
    end

    def authorize
      scope = Google::Apis::DriveV3::AUTH_DRIVE

      authorizer = Google::Auth::ServiceAccountCredentials.make_creds(
        json_key_io: StringIO.new(@credentials.to_json),
        scope: scope
      )

      authorizer.fetch_access_token!
      authorizer
    rescue StandardError => e
      raise AuthenticationError, "Failed to authorize with Google Drive: #{e.message}"
    end

    def retry_with_backoff(max_retries: 3, initial_delay: 1)
      retries = 0

      begin
        yield
      rescue Google::Apis::ServerError, Google::Apis::RateLimitError => e
        retries += 1
        if retries <= max_retries
          delay = initial_delay * (2**(retries - 1))
          Rails.logger.warn("Google Drive API error, retrying in #{delay}s: #{e.message}")
          sleep(delay)
          retry
        else
          raise
        end
      end
    end

    def handle_api_error(error)
      case error
      when Google::Apis::AuthorizationError
        raise AuthenticationError, "Google Drive authentication failed: #{error.message}"
      when Google::Apis::ClientError
        if error.status_code == 404
          raise ResourceNotFoundError, "Google Drive resource not found: #{error.message}"
        else
          raise ApiError, "Google Drive API error (#{error.status_code}): #{error.message}"
        end
      when Google::Apis::ServerError
        raise ApiError, "Google Drive server error: #{error.message}"
      else
        raise ApiError, "Google Drive API error: #{error.message}"
      end
    end
  end
end
