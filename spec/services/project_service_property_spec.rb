# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProjectService, type: :service do
  # Set up environment variables for tests
  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("CLICKUP_API_TOKEN").and_return("test_token_123")
    allow(ENV).to receive(:[]).with("CLICKUP_SPACE_ID").and_return("test_space_123")
    allow(ENV).to receive(:[]).with("CLICKUP_CHANGE_MANAGEMENT_TEMPLATE_ID").and_return("template_456")
    allow(ENV).to receive(:[]).with("AIRTABLE_API_KEY").and_return("test_airtable_key")
    allow(ENV).to receive(:[]).with("AIRTABLE_BASE_ID").and_return("test_base_id")
  end

  describe "Property-Based Tests" do
    # Feature: consultant-gateway-system, Property 32: Project Setup Completion
    # Validates: Requirements 7.5
    describe "Property 32: Project Setup Completion" do
      it "updates Airtable deal record with ClickUp and Google Drive links for any successful project setup" do
        property_test(iterations: 100) do
          # Generate random project data
          project_name = Rantly { sized(20) { string(:alpha) } }
          client_name = Rantly { sized(15) { string(:alpha) } }
          deal_id = "deal_#{SecureRandom.hex(8)}"

          # Mock adapter instances
          clickup_adapter = instance_double(Adapters::ClickUpAdapter)
          google_drive_adapter = instance_double(Adapters::GoogleDriveAdapter)

          # Mock ClickUp project creation
          clickup_list_data = {
            "id" => "clickup_#{SecureRandom.hex(8)}",
            "name" => "#{client_name} - #{project_name}"
          }
          allow(clickup_adapter).to receive(:create_list).and_return(clickup_list_data)
          allow(clickup_adapter).to receive(:apply_template).and_return(true)

          # Mock Google Drive folder creation
          drive_folder_data = {
            "id" => "drive_#{SecureRandom.hex(8)}",
            "name" => "#{client_name} - #{project_name}",
            "webViewLink" => "https://drive.google.com/drive/folders/#{SecureRandom.hex(16)}"
          }
          allow(google_drive_adapter).to receive(:create_folder_structure).and_return(drive_folder_data)

          # Mock Airtable update (class method)
          airtable_update_result = {
            "id" => deal_id,
            "fields" => {
              "Status" => "In Delivery",
              "ClickUp Project" => "https://app.clickup.com/test/v/li/#{clickup_list_data['id']}",
              "Google Drive Folder" => drive_folder_data["webViewLink"]
            }
          }
          allow(Adapters::AirtableAdapter).to receive(:update_record).and_return(airtable_update_result)

          # Mock adapter initialization
          allow(Adapters::ClickUpAdapter).to receive(:new).and_return(clickup_adapter)
          allow(Adapters::GoogleDriveAdapter).to receive(:new).and_return(google_drive_adapter)

          # Mock ProjectSetupJob to prevent after_create callback from queuing job
          allow(ProjectSetupJob).to receive(:perform_later)

          # Create project
          project = Project.create!(
            name: project_name,
            client_name: client_name,
            airtable_deal_id: deal_id,
            status: "setup"
          )

          # Create service (will use mocked adapters)
          service = ProjectService.new

          # Execute project setup
          results = service.complete_project_setup(project)

          # Reload project to get updated data
          project.reload

          # Property: After successful setup, Airtable should be updated with project links
          expect(Adapters::AirtableAdapter).to have_received(:update_record).at_least(:once)

          # Verify project has both URLs set
          expect(project.clickup_url).to be_present
          expect(project.drive_url).to be_present
          expect(project.clickup_project_id).to be_present
          expect(project.drive_folder_id).to be_present

          # Verify project is activated
          expect(project.status).to eq("active")

          # Verify results contain expected data
          expect(results[:clickup]).to be_present
          expect(results[:drive]).to be_present
          expect(results[:airtable_updated]).to be true
        end
      end

      it "creates a project and initiates setup for any won deal webhook with valid data" do
        property_test(iterations: 100) do
          # Generate random webhook data
          deal_id = "deal_#{SecureRandom.hex(8)}"
          client_name = Rantly { sized(15) { string(:alpha) } }
          project_title = Rantly { sized(20) { string(:alpha) } }

          webhook_data = {
            "deal_id" => deal_id,
            "client_name" => client_name,
            "project_title" => project_title
          }

          # Mock adapter initialization to avoid external API calls
          clickup_adapter = instance_double(Adapters::ClickUpAdapter)
          google_drive_adapter = instance_double(Adapters::GoogleDriveAdapter)
          allow(Adapters::ClickUpAdapter).to receive(:new).and_return(clickup_adapter)
          allow(Adapters::GoogleDriveAdapter).to receive(:new).and_return(google_drive_adapter)

          # Mock the background job to avoid async execution in tests
          allow(ProjectSetupJob).to receive(:perform_later)

          service = ProjectService.new

          # Process webhook
          project = service.process_won_deal_webhook(webhook_data)

          # Property: Project should be created with correct data
          expect(project).to be_persisted
          expect(project.name).to eq(project_title)
          expect(project.client_name).to eq(client_name)
          expect(project.airtable_deal_id).to eq(deal_id)
          expect(project.status).to eq("setup")

          # Property: Background job should be queued (at least once, may be called by after_create callback too)
          expect(ProjectSetupJob).to have_received(:perform_later).with(project.id).at_least(:once)
        end
      end

      it "raises validation error for any webhook missing required fields" do
        property_test(iterations: 50) do
          # Generate invalid webhook (missing one of the required fields)
          missing_field = Rantly { choose("deal_id", "client_name", "project_title") }

          webhook_data = {
            "deal_id" => "deal_#{SecureRandom.hex(8)}",
            "client_name" => Rantly { sized(15) { string(:alpha) } },
            "project_title" => Rantly { sized(20) { string(:alpha) } }
          }

          # Remove one required field
          webhook_data.delete(missing_field)

          # Mock adapter initialization to avoid external API calls
          clickup_adapter = instance_double(Adapters::ClickUpAdapter)
          google_drive_adapter = instance_double(Adapters::GoogleDriveAdapter)
          allow(Adapters::ClickUpAdapter).to receive(:new).and_return(clickup_adapter)
          allow(Adapters::GoogleDriveAdapter).to receive(:new).and_return(google_drive_adapter)

          service = ProjectService.new

          # Property: Invalid webhooks should raise validation error
          expect {
            service.process_won_deal_webhook(webhook_data)
          }.to raise_error(ProjectService::WebhookValidationError)
        end
      end
    end
  end
end
