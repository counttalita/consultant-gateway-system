# frozen_string_literal: true

require "rails_helper"

RSpec.describe Adapters::ClickUpAdapter, type: :adapter do
  let(:adapter) { described_class.new(api_token: "test_token") }

  # Mock HTTParty responses
  before do
    allow(described_class).to receive(:post).and_return(
      double(
        "Response",
        code: 200,
        parsed_response: { "id" => "list_123" },
        body: "{}"
      )
    )
  end

  describe "Property-Based Tests" do
    # Feature: consultant-gateway-system, Property 29: ClickUp Project Creation
    # Validates: Requirements 7.2
    describe "Property 29: ClickUp Project Creation" do
      it "creates a new list in ClickUp for any valid project setup request" do
        property_test(iterations: 100) do
          project_name = Rantly { sized(20) { string(:alpha) } }
          space_id = Rantly { range(10000, 99999).to_s }
          folder_id = Rantly { choose(nil, range(10000, 99999).to_s) }

          # Mock response
          expected_response = {
            "id" => rand(100000..999999).to_s,
            "name" => project_name,
            "content" => "Project created via Consultant Gateway"
          }

          allow(described_class).to receive(:post) do |url, options|
            # Verify URL format
            if folder_id
              expect(url).to include("/folder/#{folder_id}/list")
            else
              expect(url).to include("/space/#{space_id}/list")
            end

            # Verify body
            body = JSON.parse(options[:body])
            expect(body["name"]).to eq(project_name)

            double("Response", code: 200, parsed_response: expected_response, body: "{}")
          end

          result = adapter.create_list(name: project_name, folder_id: folder_id, space_id: space_id)

          expect(result["name"]).to eq(project_name)
          expect(result["id"]).to be_present
        end
      end
    end

    # Feature: consultant-gateway-system, Property 30: Change Management Template Application
    # Validates: Requirements 7.3
    describe "Property 30: Change Management Template Application" do
      it "successfully applies the Change Management template to any newly created list" do
        property_test(iterations: 100) do
          list_id = Rantly { range(100000, 999999).to_s }
          template_id = Rantly { range(1000000, 9999999).to_s }

          allow(described_class).to receive(:post) do |url, options|
            expect(url).to include("/list/#{list_id}/taskTemplate/#{template_id}")
            double("Response", code: 200, parsed_response: {}, body: "{}")
          end

          result = adapter.apply_template(list_id: list_id, template_id: template_id)

          expect(result).to be true
        end
      end
    end

    # Feature: consultant-gateway-system, Property 69: Bid Decision Task Creation
    # Validates: Requirements 20.4
    describe "Property 69: Bid Decision Task Creation" do
      it "creates a task for bid decision tracking with correct details" do
        property_test(iterations: 100) do
          list_id = Rantly { range(100000, 999999).to_s }
          task_name = Rantly { "Bid Decision: #{sized(10) { string(:alpha) }}" }
          description = Rantly { sized(50) { string(:alpha) } }
          priority = Rantly { range(1, 4) }

          expected_response = {
            "id" => rand(100000..999999).to_s,
            "name" => task_name,
            "description" => description,
            "priority" => { "id" => priority.to_s }
          }

          allow(described_class).to receive(:post) do |url, options|
            expect(url).to include("/list/#{list_id}/task")

            body = JSON.parse(options[:body])
            expect(body["name"]).to eq(task_name)
            expect(body["description"]).to eq(description)
            expect(body["priority"]).to eq(priority)

            double("Response", code: 200, parsed_response: expected_response, body: "{}")
          end

          result = adapter.create_task(
            list_id: list_id,
            name: task_name,
            description: description,
            priority: priority
          )

          expect(result["name"]).to eq(task_name)
          expect(result["id"]).to be_present
        end
      end
    end
  end
end
