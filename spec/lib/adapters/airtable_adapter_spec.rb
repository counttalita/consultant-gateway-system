# frozen_string_literal: true

require "rails_helper"

RSpec.describe Adapters::AirtableAdapter do
  let(:base_id) { "appABC1234567890" }
  let(:table) { "Consultants" }
  let(:record_id) { "recXYZ1234567890" }
  let(:cache_key) { "#{base_id}/#{table}" }

  describe ".get_record" do
    let(:api_response) do
      {
        "id" => record_id,
        "fields" => { "Name" => "John Doe", "Email" => "john@example.com" },
        "createdTime" => "2024-01-01T00:00:00.000Z"
      }
    end

    context "when cache is fresh" do
      before do
        AirtableCache.store(cache_key, record_id, api_response)
      end

      it "returns data from cache without calling API" do
        expect(described_class).not_to receive(:fetch_record_from_api)

        result = described_class.get_record(
          base_id: base_id,
          table: table,
          record_id: record_id
        )

        expect(result["id"]).to eq(record_id)
        expect(result["fields"]["Name"]).to eq("John Doe")
      end
    end

    context "when cache is stale" do
      before do
        AirtableCache.store(cache_key, record_id, api_response)
        cached = AirtableCache.fetch(cache_key, record_id)
        cached.update_column(:cached_at, 10.minutes.ago)
      end

      it "fetches from API and updates cache" do
        expect(described_class).to receive(:fetch_record_from_api)
          .with(base_id: base_id, table: table, record_id: record_id)
          .and_return(api_response)

        result = described_class.get_record(
          base_id: base_id,
          table: table,
          record_id: record_id
        )

        expect(result["id"]).to eq(record_id)

        # Verify cache was updated
        cached = AirtableCache.fetch(cache_key, record_id)
        expect(cached.fresh?).to be true
      end
    end

    context "when cache is missing" do
      before do
        AirtableCache.invalidate(cache_key, record_id)
      end

      it "fetches from API and stores in cache" do
        expect(described_class).to receive(:fetch_record_from_api)
          .with(base_id: base_id, table: table, record_id: record_id)
          .and_return(api_response)

        result = described_class.get_record(
          base_id: base_id,
          table: table,
          record_id: record_id
        )

        expect(result["id"]).to eq(record_id)

        # Verify data was cached
        cached = AirtableCache.fetch(cache_key, record_id)
        expect(cached).not_to be_nil
        expect(cached.data["id"]).to eq(record_id)
      end
    end

    context "when API fails and stale cache exists" do
      before do
        AirtableCache.store(cache_key, record_id, api_response)
        cached = AirtableCache.fetch(cache_key, record_id)
        cached.update_column(:cached_at, 10.minutes.ago)
      end

      it "falls back to stale cache" do
        allow(described_class).to receive(:fetch_record_from_api)
          .and_raise(Adapters::AirtableAdapter::ApiError, "Service unavailable")

        # Expect both retry warnings and fallback warning
        allow(Rails.logger).to receive(:warn)
        expect(Rails.logger).to receive(:warn).with(/Airtable unavailable/).at_least(:once)

        result = described_class.get_record(
          base_id: base_id,
          table: table,
          record_id: record_id
        )

        expect(result["id"]).to eq(record_id)
      end
    end

    context "when API fails and no cache exists" do
      before do
        AirtableCache.invalidate(cache_key, record_id)
      end

      it "raises the API error" do
        allow(described_class).to receive(:fetch_record_from_api)
          .and_raise(Adapters::AirtableAdapter::ApiError, "Service unavailable")

        expect {
          described_class.get_record(
            base_id: base_id,
            table: table,
            record_id: record_id
          )
        }.to raise_error(Adapters::AirtableAdapter::ApiError, /Service unavailable/)
      end
    end

    context "when use_cache is false" do
      it "bypasses cache and fetches from API" do
        # Store something in cache
        AirtableCache.store(cache_key, record_id, { "id" => record_id, "fields" => { "Old" => "Data" } })

        # Should still call API
        expect(described_class).to receive(:fetch_record_from_api)
          .with(base_id: base_id, table: table, record_id: record_id)
          .and_return(api_response)

        result = described_class.get_record(
          base_id: base_id,
          table: table,
          record_id: record_id,
          use_cache: false
        )

        expect(result["fields"]["Name"]).to eq("John Doe")
      end
    end
  end

  describe ".create_record" do
    let(:fields) { { "Name" => "Jane Doe", "Email" => "jane@example.com" } }
    let(:created_record) do
      {
        "id" => record_id,
        "fields" => fields,
        "createdTime" => Time.current.iso8601
      }
    end

    it "creates record via API and stores in cache" do
      expect(described_class).to receive(:create_record_in_api)
        .with(base_id: base_id, table: table, fields: fields)
        .and_return(created_record)

      result = described_class.create_record(
        base_id: base_id,
        table: table,
        fields: fields
      )

      expect(result["id"]).to eq(record_id)
      expect(result["fields"]).to eq(fields)

      # Verify cached
      cached = AirtableCache.fetch(cache_key, record_id)
      expect(cached).not_to be_nil
      expect(cached.data["id"]).to eq(record_id)
    end
  end

  describe ".update_record" do
    let(:updated_fields) { { "Name" => "John Updated" } }
    let(:updated_record) do
      {
        "id" => record_id,
        "fields" => updated_fields,
        "createdTime" => Time.current.iso8601
      }
    end

    before do
      # Store old data in cache
      AirtableCache.store(cache_key, record_id, {
        "id" => record_id,
        "fields" => { "Name" => "John Old" }
      })
    end

    it "updates record via API and refreshes cache" do
      expect(described_class).to receive(:update_record_in_api)
        .with(base_id: base_id, table: table, record_id: record_id, fields: updated_fields)
        .and_return(updated_record)

      result = described_class.update_record(
        base_id: base_id,
        table: table,
        record_id: record_id,
        fields: updated_fields
      )

      expect(result["fields"]).to eq(updated_fields)

      # Verify cache was updated
      cached = AirtableCache.fetch(cache_key, record_id)
      expect(cached.data["fields"]).to eq(updated_fields)
    end
  end

  describe ".delete_record" do
    before do
      AirtableCache.store(cache_key, record_id, {
        "id" => record_id,
        "fields" => { "Name" => "To Delete" }
      })
    end

    it "deletes record via API and invalidates cache" do
      expect(described_class).to receive(:delete_record_from_api)
        .with(base_id: base_id, table: table, record_id: record_id)
        .and_return(true)

      result = described_class.delete_record(
        base_id: base_id,
        table: table,
        record_id: record_id
      )

      expect(result).to be true

      # Verify cache was invalidated
      cached = AirtableCache.fetch(cache_key, record_id)
      expect(cached).to be_nil
    end
  end

  describe ".execute_with_retry" do
    it "retries on ApiError up to MAX_RETRIES times" do
      attempt_count = 0

      expect {
        described_class.execute_with_retry do
          attempt_count += 1
          raise Adapters::AirtableAdapter::ApiError, "Temporary failure"
        end
      }.to raise_error(Adapters::AirtableAdapter::ApiError)

      # Should be 1 initial attempt + MAX_RETRIES retries
      expect(attempt_count).to eq(Adapters::AirtableAdapter::MAX_RETRIES + 1)
    end

    it "succeeds on retry" do
      attempt_count = 0

      result = described_class.execute_with_retry do
        attempt_count += 1
        raise Adapters::AirtableAdapter::ApiError, "Fail" if attempt_count < 2
        "success"
      end

      expect(result).to eq("success")
      expect(attempt_count).to eq(2)
    end

    it "retries on StandardError" do
      attempt_count = 0

      expect {
        described_class.execute_with_retry do
          attempt_count += 1
          raise StandardError, "Retryable error"
        end
      }.to raise_error(Adapters::AirtableAdapter::ApiError)

      # Should be 1 initial attempt + MAX_RETRIES retries
      expect(attempt_count).to eq(Adapters::AirtableAdapter::MAX_RETRIES + 1)
    end
  end

  describe ".calculate_backoff_delay" do
    it "calculates exponential backoff" do
      expect(described_class.calculate_backoff_delay(1)).to eq(2)
      expect(described_class.calculate_backoff_delay(2)).to eq(4)
      expect(described_class.calculate_backoff_delay(3)).to eq(8)
    end
  end

  describe ".encode_table_name" do
    it "encodes table names with spaces" do
      expect(described_class.encode_table_name("My Table")).to eq("My+Table")
    end

    it "encodes special characters" do
      expect(described_class.encode_table_name("Table & More")).to eq("Table+%26+More")
    end
  end

  describe ".airtable_api_key" do
    context "when AIRTABLE_API_KEY is set" do
      before do
        allow(ENV).to receive(:fetch).with("AIRTABLE_API_KEY").and_return("test_key_123")
      end

      it "returns the API key" do
        expect(described_class.airtable_api_key).to eq("test_key_123")
      end
    end

    context "when AIRTABLE_API_KEY is not set" do
      before do
        allow(ENV).to receive(:fetch).with("AIRTABLE_API_KEY").and_yield
      end

      it "raises AuthenticationError" do
        expect {
          described_class.airtable_api_key
        }.to raise_error(Adapters::AirtableAdapter::AuthenticationError, /not set/)
      end
    end
  end
end
