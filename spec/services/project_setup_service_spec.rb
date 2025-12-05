# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProjectSetupService do
  let(:project) { create(:project, status: "setup") }
  let(:service) { described_class.new(project) }
  let(:google_drive_adapter) { instance_double(Adapters::GoogleDriveAdapter) }

  before do
    allow(Adapters::GoogleDriveAdapter).to receive(:new).and_return(google_drive_adapter)
  end

  describe "#create_google_drive_folder" do
    let(:folder_metadata) do
      {
        "id" => "folder_123",
        "name" => "Client - Project",
        "webViewLink" => "https://drive.google.com/drive/folders/folder_123"
      }
    end

    context "when folder does not exist" do
      before do
        allow(google_drive_adapter).to receive(:create_folder_structure)
          .with(client_name: project.client_name, project_title: project.name)
          .and_return(folder_metadata)
        allow(AuditLogger).to receive(:log)
      end

      it "creates a Google Drive folder structure" do
        result = service.create_google_drive_folder

        expect(google_drive_adapter).to have_received(:create_folder_structure)
          .with(client_name: project.client_name, project_title: project.name)
        expect(result).to eq(folder_metadata)
      end

      it "updates project with folder metadata" do
        service.create_google_drive_folder
        project.reload

        expect(project.drive_folder_id).to eq("folder_123")
        expect(project.drive_url).to eq("https://drive.google.com/drive/folders/folder_123")
      end

      it "logs the folder creation" do
        service.create_google_drive_folder

        expect(AuditLogger).to have_received(:log).with(
          action: :project_drive_folder_created,
          resource: project,
          metadata: hash_including(folder_id: "folder_123")
        )
      end
    end

    context "when folder already exists" do
      before do
        project.update!(
          drive_folder_id: "existing_folder",
          drive_url: "https://drive.google.com/drive/folders/existing_folder"
        )
        allow(google_drive_adapter).to receive(:create_folder_structure)
      end

      it "does not create a new folder" do
        service.create_google_drive_folder

        expect(google_drive_adapter).not_to have_received(:create_folder_structure)
      end
    end

    context "when API error occurs" do
      before do
        allow(google_drive_adapter).to receive(:create_folder_structure)
          .and_raise(Adapters::GoogleDriveAdapter::ApiError, "API error")
      end

      it "raises SetupError" do
        expect { service.create_google_drive_folder }
          .to raise_error(ProjectSetupService::SetupError, /Failed to create Google Drive folder/)
      end
    end
  end

  describe "#share_folder_with" do
    let(:email) { "user@example.com" }
    let(:role) { "writer" }

    before do
      project.update!(drive_folder_id: "folder_123")
      allow(AuditLogger).to receive(:log)
    end

    context "when folder exists" do
      before do
        allow(google_drive_adapter).to receive(:share_folder)
          .with(folder_id: "folder_123", email: email, role: role)
          .and_return(true)
      end

      it "shares the folder" do
        result = service.share_folder_with(email: email, role: role)

        expect(google_drive_adapter).to have_received(:share_folder)
        expect(result).to be true
      end

      it "logs the sharing action" do
        service.share_folder_with(email: email, role: role)

        expect(AuditLogger).to have_received(:log).with(
          action: :project_drive_folder_shared,
          resource: project,
          metadata: hash_including(email: email, role: role)
        )
      end
    end

    context "when folder does not exist" do
      before do
        project.update!(drive_folder_id: nil)
      end

      it "raises SetupError" do
        expect { service.share_folder_with(email: email) }
          .to raise_error(ProjectSetupService::SetupError, /Project folder not created yet/)
      end
    end

    context "when API error occurs" do
      before do
        allow(google_drive_adapter).to receive(:share_folder)
          .and_raise(Adapters::GoogleDriveAdapter::ApiError, "API error")
      end

      it "raises SetupError" do
        expect { service.share_folder_with(email: email) }
          .to raise_error(ProjectSetupService::SetupError, /Failed to share folder/)
      end
    end
  end

  describe "#folder_metadata" do
    let(:metadata) do
      {
        "id" => "folder_123",
        "name" => "Client - Project",
        "webViewLink" => "https://drive.google.com/drive/folders/folder_123",
        "parents" => []
      }
    end

    before do
      project.update!(drive_folder_id: "folder_123")
    end

    context "when folder exists" do
      before do
        allow(google_drive_adapter).to receive(:get_folder)
          .with(folder_id: "folder_123")
          .and_return(metadata)
      end

      it "returns folder metadata" do
        result = service.folder_metadata

        expect(result).to eq(metadata)
      end
    end

    context "when folder does not exist" do
      before do
        project.update!(drive_folder_id: nil)
      end

      it "raises SetupError" do
        expect { service.folder_metadata }
          .to raise_error(ProjectSetupService::SetupError, /Project folder not created yet/)
      end
    end
  end

  describe "#setup!" do
    let(:folder_metadata) do
      {
        "id" => "folder_123",
        "name" => "Client - Project",
        "webViewLink" => "https://drive.google.com/drive/folders/folder_123"
      }
    end

    before do
      allow(google_drive_adapter).to receive(:create_folder_structure)
        .and_return(folder_metadata)
      allow(AuditLogger).to receive(:log)
    end

    context "when project is in setup status" do
      it "creates Google Drive folder" do
        service.setup!

        expect(google_drive_adapter).to have_received(:create_folder_structure)
      end

      it "returns true" do
        expect(service.setup!).to be true
      end
    end

    context "when project is not in setup status" do
      before do
        project.update!(status: "active")
      end

      it "does not create folder" do
        service.setup!

        expect(google_drive_adapter).not_to have_received(:create_folder_structure)
      end

      it "returns false" do
        expect(service.setup!).to be false
      end
    end

    context "when error occurs" do
      before do
        allow(google_drive_adapter).to receive(:create_folder_structure)
          .and_raise(StandardError, "Unexpected error")
      end

      it "raises SetupError" do
        expect { service.setup! }
          .to raise_error(ProjectSetupService::SetupError, /Project setup failed/)
      end
    end
  end
end
