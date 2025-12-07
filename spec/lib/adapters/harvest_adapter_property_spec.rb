# frozen_string_literal: true

require "rails_helper"

RSpec.describe Adapters::HarvestAdapter, type: :adapter do
  let(:adapter) { described_class.new(access_token: "test_token", account_id: "test_account") }

  # Mock HTTParty responses
  before do
    allow(described_class).to receive(:post).and_return(
      double(
        "Response",
        code: 201,
        parsed_response: {
          "id" => 12345,
          "first_name" => "Test",
          "last_name" => "User",
          "email" => "test@example.com",
          "is_contractor" => true,
          "is_active" => true
        },
        body: "{}"
      )
    )

    allow(described_class).to receive(:get).and_return(
      double(
        "Response",
        code: 200,
        parsed_response: {
          "time_entries" => [],
          "links" => { "next" => nil }
        },
        body: "{}"
      )
    )
  end

  describe "Property-Based Tests" do
    # Feature: consultant-gateway-system, Property 13: Harvest User Creation
    # Validates: Requirements 4.1
    describe "Property 13: Harvest User Creation" do
      it "creates a corresponding Harvest user record for any consultant who completes onboarding" do
        property_test(iterations: 100) do
          # Generate random consultant data
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }

          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          first_name = Rantly { sized(6) { string(:alpha) } }
          last_name = Rantly { sized(6) { string(:alpha) } }

          # Mock behavior to return data matching the request
          allow(described_class).to receive(:post).with(
            "/users",
            anything
          ) do |_url, options|
            body = JSON.parse(options[:body])

            double(
              "Response",
              code: 201,
              parsed_response: {
                "id" => rand(10000..99999),
                "first_name" => body["first_name"],
                "last_name" => body["last_name"],
                "email" => body["email"],
                "is_contractor" => body["is_contractor"],
                "is_active" => body["is_active"]
              },
              body: "{}"
            )
          end

          # Call adapter with primitives
          result = adapter.create_user(
            first_name: first_name,
            last_name: last_name,
            email: email
          )

          # Verify result
          expect(result).to be_a(Hash)
          expect(result["id"]).to be_present
          expect(result["email"]).to eq(email)
          expect(result["first_name"]).to eq(first_name)
          expect(result["last_name"]).to eq(last_name)
        end
      end
    end

    # Feature: consultant-gateway-system, Property 18: Month-End Hours Retrieval
    # Validates: Requirements 5.1
    describe "Property 18: Month-End Hours Retrieval" do
      it "retrieves approved hours for any valid date range" do
        property_test(iterations: 50) do
          start_date = Date.current.beginning_of_month
          end_date = Date.current.end_of_month

          # Generate random time entries
          entries_count = Rantly { range(0, 5) }
          generated_entries = Array.new(entries_count) do
            {
              "id" => Rantly { range(100000, 999999) },
              "hours" => Rantly { range(1.0, 8.0) },
              "spent_date" => Rantly { range(start_date, end_date).to_s },
              "is_billed" => false
            }
          end

          allow(described_class).to receive(:get).with(
            "/time_entries",
            hash_including(
              query: hash_including(
                from: start_date.to_s,
                to: end_date.to_s
              )
            )
          ).and_return(
            double(
              "Response",
              code: 200,
              parsed_response: {
                "time_entries" => generated_entries,
                "links" => { "next" => nil }
              },
              body: "{}"
            )
          )

          result = adapter.get_approved_hours(
            start_date: start_date,
            end_date: end_date
          )

          expect(result).to be_an(Array)
          expect(result.length).to eq(entries_count)
          if entries_count > 0
            expect(result.first["hours"]).to be_present
            expect(result.first["spent_date"]).to be_present
          end
        end
      end

      it "handles pagination correctly for large datasets" do
        # Setup pagination mock
        page1_entries = [ { "id" => 1 }, { "id" => 2 } ]
        page2_entries = [ { "id" => 3 } ]

        # Page 1 response
        allow(described_class).to receive(:get).with(
          "/time_entries",
          hash_including(query: hash_including(page: 1))
        ).and_return(
          double(
            "Response",
            code: 200,
            parsed_response: {
              "time_entries" => page1_entries,
              "links" => { "next" => "http://api.harvestapp.com/v2/time_entries?page=2" }
            },
            body: "{}"
          )
        )

        # Page 2 response
        allow(described_class).to receive(:get).with(
          "/time_entries",
          hash_including(query: hash_including(page: 2))
        ).and_return(
          double(
            "Response",
            code: 200,
            parsed_response: {
              "time_entries" => page2_entries,
              "links" => { "next" => nil }
            },
            body: "{}"
          )
        )

        result = adapter.get_approved_hours(
          start_date: Date.current,
          end_date: Date.current
        )

        expect(result.length).to eq(3)
        expect(result.map { |e| e["id"] }).to contain_exactly(1, 2, 3)
      end
    end
  end
end
