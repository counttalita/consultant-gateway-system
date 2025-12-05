# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProjectSetupJob, type: :job do
  let(:project) { create(:project, status: "setup", client_name: "Test Client", name: "Test Project") }
  let(:google_drive_adapter) { instance_double(Adapters::GoogleDriveAdapter) }
  let(:clickup_adapter) { instance_double(Adapters::ClickUpAdapter) }
  let(:folder_metadata) do
    {
      "id" => "folder_123",
      "name" => "Test Client - Test Project",
      "webViewLink" => "https://drive.google.com/drive/folders/folder_123"
    }
  end

  before do
    # Skip the after_create callback for these tests
    allow_any_instance_of(Project).to receive(:create_drive_folder_async)
    allow(Adapters::GoogleDriveAdapter).to receive(:new).and_return(google_drive_adapter)
    allow(Adapters::ClickUpAdapter).to receive(:new).and_return(clickup_adapter)
    allow(AuditLogger).to receive(:log)

    # Set required environment variables
    stub_const("ENV", ENV.to_hash.merge(
      "CLICKUP_SPACE_ID" => "test_space_123",
      "AIRTABLE_BASE_ID" => "test_base_123"
    ))
  end

  describe "#perform" do
    context "when project exists and has no folder" do
      before do
        project.update_columns(drive_folder_id: nil, drive_url: nil, clickup_project_id: nil, clickup_url: nil)

        # Mock ClickUp adapter methods
        allow(clickup_adapter).to receive(:create_list).and_return({ "id" => "list_123" })
        allow(clickup_adapter).to receive(:apply_template)

        # Mock Google Drive adapter methods
        allow(google_drive_adapter).to receive(:create_folder_structure)
          .with(client_name: project.client_name, project_title: project.name)
          .and_return(folder_metadata)
      end

      it "creates Google Drive folder" do
        described_class.new.perform(project.id)

        expect(google_drive_adapter).to have_received(:create_folder_structure)
      end

      it "updates project with folder metadata" do
        described_class.new.perform(project.id)
        project.reload

        expect(project.drive_folder_id).to eq("folder_123")
        expect(project.drive_url).to eq("https://drive.google.com/drive/folders/folder_123")
      end

      it "logs success" do
        allow(Rails.logger).to receive(:info)

        described_class.new.perform(project.id)

        expect(Rails.logger).to have_received(:info)
          .with(/Successfully completed project setup for project #{project.id}/)
      end
    end

    context "when project already has a folder" do
      before do
        project.update_columns(
          drive_folder_id: "existing_folder_123",
          drive_url: "https://drive.google.com/existing",
          clickup_project_id: "existing_list_123",
          clickup_url: "https://app.clickup.com/test_space_123/v/li/existing_list_123"
        )
      end

      it "skips folder creation" do
        described_class.new.perform(project.id)

        # Verify the adapter was never called
        expect(Adapters::GoogleDriveAdapter).not_to have_received(:new)
      end
    end

    context "when project does not exist" do
      it "logs error and does not raise" do
        allow(Rails.logger).to receive(:error)

        described_class.new.perform(999_999)

        expect(Rails.logger).to have_received(:error)
          .with(/Project 999999 not found/)
      end
    end

    context "when API error occurs" do
      before do
        project.update_columns(drive_folder_id: nil, drive_url: nil, clickup_project_id: nil, clickup_url: nil)

        # Mock ClickUp to succeed
        allow(clickup_adapter).to receive(:create_list).and_return({ "id" => "list_123" })
        allow(clickup_adapter).to receive(:apply_template)

        # Mock Google Drive to fail
        allow(google_drive_adapter).to receive(:create_folder_structure)
          .and_raise(Adapters::GoogleDriveAdapter::ApiError, "API error")
      end

      it "logs error and re-raises as SetupError" do
        allow(Rails.logger).to receive(:error)

        expect { described_class.new.perform(project.id) }
          .to raise_error(ProjectService::SetupError, /Failed to create Google Drive folder/)

        expect(Rails.logger).to have_received(:error).at_least(:once)
      end
    end
  end
end
