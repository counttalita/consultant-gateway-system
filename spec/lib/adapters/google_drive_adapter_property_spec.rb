# frozen_string_literal: true

require "rails_helper"

RSpec.describe Adapters::GoogleDriveAdapter, type: :adapter do
  let(:mock_credentials) do
    {
      "type" => "service_account",
      "project_id" => "test-project",
      "private_key_id" => "test-key-id",
      "private_key" => "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7W8jW6hzFGqVH\n-----END PRIVATE KEY-----\n",
      "client_email" => "test@test-project.iam.gserviceaccount.com",
      "client_id" => "123456789",
      "auth_uri" => "https://accounts.google.com/o/oauth2/auth",
      "token_uri" => "https://oauth2.googleapis.com/token"
    }
  end

  let(:mock_drive_service) { instance_double(Google::Apis::DriveV3::DriveService) }
  let(:mock_authorizer) { instance_double(Google::Auth::ServiceAccountCredentials) }

  before do
    # Mock Google Drive service initialization
    allow(Google::Apis::DriveV3::DriveService).to receive(:new).and_return(mock_drive_service)
    allow(mock_drive_service).to receive(:authorization=)

    # Mock authorization
    allow(Google::Auth::ServiceAccountCredentials).to receive(:make_creds).and_return(mock_authorizer)
    allow(mock_authorizer).to receive(:fetch_access_token!)

    # Mock environment variable
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("GOOGLE_DRIVE_SERVICE_ACCOUNT_CREDENTIALS").and_return(Base64.encode64(mock_credentials.to_json))
  end

  describe "Property-Based Tests" do
    # Feature: consultant-gateway-system, Property 31: Google Drive Folder Creation
    # Validates: Requirements 7.4
    describe "Property 31: Google Drive Folder Creation" do
      it "creates a complete folder structure for any valid project" do
        property_test(iterations: 100) do
          # Generate random client and project names
          client_name = Rantly { sized(20) { string(:alpha) } }
          project_title = Rantly { sized(20) { string(:alpha) } }

          root_folder_name = "#{client_name} - #{project_title}"
          root_folder_id = Rantly { range(100000, 999999).to_s }

          # Mock root folder creation
          root_folder = double(
            "Folder",
            id: root_folder_id,
            name: root_folder_name,
            web_view_link: "https://drive.google.com/drive/folders/#{root_folder_id}"
          )

          # Track subfolder creation calls
          subfolder_calls = []

          allow(mock_drive_service).to receive(:create_file) do |file_metadata, options|
            if file_metadata[:parents].nil?
              # Root folder creation
              expect(file_metadata[:name]).to eq(root_folder_name)
              expect(file_metadata[:mime_type]).to eq("application/vnd.google-apps.folder")
              root_folder
            else
              # Subfolder creation
              subfolder_id = rand(100000..999999).to_s
              subfolder_calls << file_metadata[:name]

              expect(file_metadata[:parents]).to eq([ root_folder_id ])
              expect(file_metadata[:mime_type]).to eq("application/vnd.google-apps.folder")
              expect(Adapters::GoogleDriveAdapter::FOLDER_STRUCTURE).to include(file_metadata[:name])

              double(
                "Subfolder",
                id: subfolder_id,
                name: file_metadata[:name],
                web_view_link: "https://drive.google.com/drive/folders/#{subfolder_id}"
              )
            end
          end

          # Mock audit logging
          allow(AuditLogger).to receive(:log)

          adapter = described_class.new(credentials: mock_credentials)
          result = adapter.create_folder_structure(
            client_name: client_name,
            project_title: project_title
          )

          # Verify root folder was created with correct structure
          expect(result["id"]).to eq(root_folder_id)
          expect(result["name"]).to eq(root_folder_name)
          expect(result["webViewLink"]).to be_present
          expect(result["webViewLink"]).to include(root_folder_id)

          # Verify all subfolders were created
          expect(subfolder_calls.sort).to eq(Adapters::GoogleDriveAdapter::FOLDER_STRUCTURE.sort)

          # Verify audit logging was called
          expect(AuditLogger).to have_received(:log).with(
            hash_including(
              action: :google_drive_folder_created,
              metadata: hash_including(
                folder_name: root_folder_name,
                folder_id: root_folder_id,
                subfolders: Adapters::GoogleDriveAdapter::FOLDER_STRUCTURE
              )
            )
          )
        end
      end

      it "creates folders with proper parent-child relationships" do
        property_test(iterations: 100) do
          client_name = Rantly { sized(15) { string(:alpha) } }
          project_title = Rantly { sized(15) { string(:alpha) } }

          root_folder_id = Rantly { range(100000, 999999).to_s }
          parent_ids_used = []

          allow(mock_drive_service).to receive(:create_file) do |file_metadata, options|
            if file_metadata[:parents].nil?
              # Root folder
              double(
                "Folder",
                id: root_folder_id,
                name: file_metadata[:name],
                web_view_link: "https://drive.google.com/drive/folders/#{root_folder_id}"
              )
            else
              # Subfolder - track parent ID
              parent_ids_used << file_metadata[:parents].first

              double(
                "Subfolder",
                id: rand(100000..999999).to_s,
                name: file_metadata[:name],
                web_view_link: "https://drive.google.com/drive/folders/#{rand(100000..999999)}"
              )
            end
          end

          allow(AuditLogger).to receive(:log)

          adapter = described_class.new(credentials: mock_credentials)
          adapter.create_folder_structure(
            client_name: client_name,
            project_title: project_title
          )

          # All subfolders should have the root folder as parent
          expect(parent_ids_used.uniq).to eq([ root_folder_id ])
          expect(parent_ids_used.length).to eq(Adapters::GoogleDriveAdapter::FOLDER_STRUCTURE.length)
        end
      end

      it "handles folder creation with special characters in names" do
        property_test(iterations: 50) do
          # Generate names with special characters
          client_name = Rantly do
            choose(
              "Client & Co.",
              "Client (Pty) Ltd",
              "Client - Division",
              "Client's Company",
              sized(10) { string(:alpha) }
            )
          end

          project_title = Rantly do
            choose(
              "Project: Phase 1",
              "Project (2024)",
              "Project - Q1",
              sized(10) { string(:alpha) }
            )
          end

          root_folder_id = rand(100000..999999).to_s

          allow(mock_drive_service).to receive(:create_file) do |file_metadata, options|
            if file_metadata[:parents].nil?
              double(
                "Folder",
                id: root_folder_id,
                name: file_metadata[:name],
                web_view_link: "https://drive.google.com/drive/folders/#{root_folder_id}"
              )
            else
              double(
                "Subfolder",
                id: rand(100000..999999).to_s,
                name: file_metadata[:name],
                web_view_link: "https://drive.google.com/drive/folders/#{rand(100000..999999)}"
              )
            end
          end

          allow(AuditLogger).to receive(:log)

          adapter = described_class.new(credentials: mock_credentials)
          result = adapter.create_folder_structure(
            client_name: client_name,
            project_title: project_title
          )

          # Should successfully create folder regardless of special characters
          expect(result["id"]).to be_present
          expect(result["name"]).to include(client_name)
          expect(result["name"]).to include(project_title)
        end
      end
    end
  end
end
