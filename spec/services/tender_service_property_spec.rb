# frozen_string_literal: true

require "rails_helper"

RSpec.describe TenderService, type: :service do
  let(:service) { described_class.new }

  # Mock Airtable adapter to avoid real HTTP requests
  before do
    allow(Adapters::AirtableAdapter).to receive(:create_record).and_return({
      "id" => "rec#{SecureRandom.hex(8)}",
      "fields" => {},
      "createdTime" => Time.current.iso8601
    })
    allow(Adapters::AirtableAdapter).to receive(:update_record).and_return({
      "id" => "rec#{SecureRandom.hex(8)}",
      "fields" => {},
      "createdTime" => Time.current.iso8601
    })
  end

  describe "Property-Based Tests" do
    # Feature: consultant-gateway-system, Property 23: Webhook Payload Validation
    # Validates: Requirements 6.1
    describe "Property 23: Webhook Payload Validation" do
      it "validates any valid webhook payload with required fields" do
        property_test(iterations: 100) do
          # Generate valid webhook payload
          payload = generate_valid_webhook_payload

          result = service.validate_webhook_payload(payload)

          expect(result[:success]).to be true
          expect(result[:errors]).to be_empty
        end
      end

      it "rejects webhook payloads missing required fields" do
        property_test(iterations: 100) do
          # Generate invalid webhook payload (missing required field)
          payload = generate_invalid_webhook_payload

          result = service.validate_webhook_payload(payload)

          expect(result[:success]).to be false
          expect(result[:errors]).not_to be_empty
        end
      end
    end

    # Feature: consultant-gateway-system, Property 24: Tender CRM Record Creation
    # Validates: Requirements 6.2
    describe "Property 24: Tender CRM Record Creation" do
      it "creates tender records in database and Airtable for any valid webhook" do
        property_test(iterations: 50) do
          # Generate valid webhook payload
          payload = generate_valid_webhook_payload

          # Ensure Airtable mock is set for this iteration
          allow(Adapters::AirtableAdapter).to receive(:create_record).and_return({
            "id" => "rec#{SecureRandom.hex(8)}",
            "fields" => {},
            "createdTime" => Time.current.iso8601
          })

          result = service.process_webhook(payload)

          expect(result[:success]).to be true
          expect(result[:tender]).to be_a(Tender)
          expect(result[:tender].reference_number).to eq(payload["reference_number"])
          expect(result[:tender].title).to eq(payload["title"])
          expect(result[:tender].source).to eq(payload["source"])
          expect(result[:tender].persisted?).to be true
        end
      end
    end

    # Feature: consultant-gateway-system, Property 26: Tender Deduplication
    # Validates: Requirements 6.4
    describe "Property 26: Tender Deduplication" do
      it "updates existing tender when duplicate reference number is detected" do
        property_test(iterations: 50) do
          # Generate valid webhook payload
          payload = generate_valid_webhook_payload

          # Ensure Airtable mocks are set for this iteration
          allow(Adapters::AirtableAdapter).to receive(:create_record).and_return({
            "id" => "rec#{SecureRandom.hex(8)}",
            "fields" => {},
            "createdTime" => Time.current.iso8601
          })
          allow(Adapters::AirtableAdapter).to receive(:update_record).and_return({
            "id" => "rec#{SecureRandom.hex(8)}",
            "fields" => {},
            "createdTime" => Time.current.iso8601
          })

          # Create first tender
          result1 = service.process_webhook(payload)
          expect(result1[:success]).to be true
          expect(result1[:operation]).to eq("create")

          tender_id = result1[:tender].id

          # Process same reference number again with different data
          updated_payload = payload.merge("title" => "Updated Title #{SecureRandom.hex(4)}")
          result2 = service.process_webhook(updated_payload)

          expect(result2[:success]).to be true
          expect(result2[:operation]).to eq("update")
          expect(result2[:tender].id).to eq(tender_id)
          expect(result2[:tender].title).to eq(updated_payload["title"])

          # Verify only one tender exists with this reference number
          expect(Tender.where(reference_number: payload["reference_number"]).count).to eq(1)
        end
      end
    end

    # Feature: consultant-gateway-system, Property 66: Tender Evaluation
    # Validates: Requirements 20.1
    describe "Property 66: Tender Evaluation" do
      it "evaluates any tender against bid/no-bid criteria" do
        property_test(iterations: 50) do
          # Generate tender
          tender = generate_tender

          result = service.evaluate_tender(tender)

          expect(result).to have_key(:recommendation)
          expect(result).to have_key(:score)
          expect(result).to have_key(:breakdown)
          expect(result).to have_key(:risks)
          expect(result).to have_key(:required_resources)
          expect(result).to have_key(:revenue_potential)

          expect([ "Pursue", "Decline" ]).to include(result[:recommendation])
          expect(result[:score]).to be_a(Numeric)
          expect(result[:score]).to be >= 0
          expect(result[:score]).to be <= 10
        end
      end
    end

    # Feature: consultant-gateway-system, Property 67: Tender Scoring and Flagging
    # Validates: Requirements 20.2
    describe "Property 67: Tender Scoring and Flagging" do
      it "flags tenders meeting threshold for pursuit with correct recommendation" do
        property_test(iterations: 50) do
          # Generate tender
          tender = generate_tender

          result = service.evaluate_tender(tender)

          # Verify score and recommendation alignment
          if result[:score] >= 6.5
            expect(result[:recommendation]).to eq("Pursue")
          else
            expect(result[:recommendation]).to eq("Decline")
          end

          # Verify tender is updated with evaluation results
          tender.reload
          expect(tender.bid_decision).to eq(result[:recommendation].downcase)
          expect(tender.bid_score).to eq(result[:score])
          expect(tender.bid_rationale).to be_present
        end
      end
    end
  end

  # Helper methods for generating test data

  def generate_valid_webhook_payload
    timestamp = (Time.current.to_f * 1000000).to_i
    random_suffix = Rantly { range(1000, 9999) }

    {
      "reference_number" => generate_reference_number(timestamp, random_suffix),
      "title" => generate_title,
      "source" => generate_source,
      "tender_value" => Rantly { range(100_000, 5_000_000) }.to_f,
      "submission_deadline" => generate_future_datetime,
      "required_capabilities" => generate_capabilities
    }
  end

  def generate_invalid_webhook_payload
    # Randomly choose which required field to omit
    case Rantly { range(1, 4) }
    when 1
      # Missing reference_number
      {
        "title" => generate_title,
        "source" => generate_source
      }
    when 2
      # Missing title
      {
        "reference_number" => generate_reference_number,
        "source" => generate_source
      }
    when 3
      # Missing source
      {
        "reference_number" => generate_reference_number,
        "title" => generate_title
      }
    when 4
      # Empty reference_number
      {
        "reference_number" => "",
        "title" => generate_title,
        "source" => generate_source
      }
    end
  end

  def generate_tender
    timestamp = (Time.current.to_f * 1000000).to_i
    random_suffix = Rantly { range(1000, 9999) }

    Tender.create!(
      reference_number: generate_reference_number(timestamp, random_suffix),
      title: generate_title,
      source: generate_source,
      tender_value: Rantly { range(50_000, 5_000_000) }.to_f,
      submission_deadline: generate_future_datetime,
      required_capabilities: generate_capabilities,
      bid_decision: "pending"
    )
  end

  def generate_reference_number(timestamp = nil, suffix = nil)
    timestamp ||= (Time.current.to_f * 1000000).to_i
    suffix ||= Rantly { range(1000, 9999) }

    prefix = Rantly { choose("TND", "RFP", "RFQ", "BID") }
    year = Rantly { range(2024, 2025) }
    number = Rantly { range(1000, 9999) }

    "#{prefix}-#{year}-#{number}-#{timestamp}-#{suffix}"
  end

  def generate_title
    words = Rantly {
      array(range(2, 6)) {
        choose(
          "Change", "Management", "Consulting", "Project",
          "Services", "Implementation", "Support", "Training"
        )
      }
    }
    words.join(" ")
  end

  def generate_source
    Rantly {
      choose(
        "National Treasury Portal",
        "Provincial Tender Board",
        "Municipal Portal",
        "Private Sector RFP",
        "Direct Invitation"
      )
    }
  end

  def generate_future_datetime
    days = Rantly { range(1, 90) }
    (Time.current + days.days).to_datetime
  end

  def generate_capabilities
    count = Rantly { range(1, 5) }
    capabilities = Rantly {
      array(count) {
        choose(
          "Change Management",
          "Organizational Transformation",
          "Stakeholder Engagement",
          "Process Improvement",
          "Training and Development",
          "Project Management",
          "Business Analysis",
          "Risk Management"
        )
      }
    }
    capabilities.uniq
  end
end
