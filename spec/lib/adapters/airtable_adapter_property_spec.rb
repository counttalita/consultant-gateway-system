# frozen_string_literal: true

require "rails_helper"

RSpec.describe Adapters::AirtableAdapter do
  include PropertyTestHelpers

  # Feature: consultant-gateway-system, Property 38: Airtable Data Caching
  # Validates: Requirements 11.1
  describe "Property 38: Airtable Data Caching" do
    it "stores a copy of Airtable data in PostgreSQL with timestamp metadata" do
      # Run property test with 100 iterations
      100.times do
        # Generate random test data
        base_id = Rantly { string(/[a-z]{3}[0-9]{10}/) }
        table = Rantly { string(/[A-Z][a-z]+/) }
        record_id = Rantly { string(/rec[a-zA-Z0-9]{14}/) }
        cache_key = "#{base_id}/#{table}"

        # Clean up any existing cache for this key
        AirtableCache.invalidate(cache_key, record_id)

        fields = {
          "Name" => Rantly { string },
          "Email" => "#{Rantly { string(/[a-z]{5}/) }}@example.com",
          "Status" => Rantly { choose("Active", "Inactive", "Pending") }
        }

        # Mock the Airtable API response
        api_response = {
          "id" => record_id,
          "fields" => fields,
          "createdTime" => Time.current.iso8601
        }

        # Stub the API call to return this specific response with exact parameter matching
        allow(described_class).to receive(:fetch_record_from_api)
          .with(base_id: base_id, table: table, record_id: record_id)
          .and_return(api_response)

        # Call get_record which should cache the data
        result = described_class.get_record(
          base_id: base_id,
          table: table,
          record_id: record_id,
          use_cache: true
        )

        # Verify the data was returned correctly
        expect(result["id"]).to eq(record_id)
        expect(result["fields"]).to eq(fields)

        # Verify the data was stored in PostgreSQL cache
        cached_record = AirtableCache.fetch(cache_key, record_id)

        expect(cached_record).not_to be_nil
        expect(cached_record.table).to eq(cache_key)
        expect(cached_record.record_id).to eq(record_id)
        expect(cached_record.data["id"]).to eq(record_id)
        expect(cached_record.data["fields"]).to eq(fields)

        # Verify timestamp metadata exists
        expect(cached_record.cached_at).to be_present
        expect(cached_record.cached_at).to be_within(5.seconds).of(Time.current)

        # Clean up for next iteration
        AirtableCache.invalidate(cache_key, record_id)
        RSpec::Mocks.space.proxy_for(described_class).reset
      end
    end
  end

  # Feature: consultant-gateway-system, Property 39: Cache-First Data Access
  # Validates: Requirements 11.2
  describe "Property 39: Cache-First Data Access" do
    it "checks PostgreSQL cache first and only queries Airtable if data is stale or missing" do
      # Run property test with 100 iterations
      100.times do
        base_id = Rantly { string(/[a-z]{3}[0-9]{10}/) }
        table = Rantly { string(/[A-Z][a-z]+/) }
        record_id = Rantly { string(/rec[a-zA-Z0-9]{14}/) }

        cache_key = "#{base_id}/#{table}"

        fields = {
          "Name" => Rantly { string },
          "Value" => Rantly { range(1, 1000) }
        }

        cached_data = {
          "id" => record_id,
          "fields" => fields,
          "createdTime" => Time.current.iso8601
        }

        # Store fresh data in cache
        AirtableCache.store(cache_key, record_id, cached_data)

        # Ensure the cache is fresh
        cached_record = AirtableCache.fetch(cache_key, record_id)
        expect(cached_record.fresh?).to be true

        # Mock the API call - it should NOT be called for fresh cache
        expect(described_class).not_to receive(:fetch_record_from_api)

        # Call get_record - should return cached data without API call
        result = described_class.get_record(
          base_id: base_id,
          table: table,
          record_id: record_id,
          use_cache: true
        )

        # Verify we got the cached data
        expect(result["id"]).to eq(record_id)
        expect(result["fields"]).to eq(fields)

        # Clean up for next iteration
        RSpec::Mocks.space.proxy_for(described_class).reset
      end
    end

    it "queries Airtable when cache is stale" do
      # Run property test with 100 iterations
      100.times do
        base_id = Rantly { string(/[a-z]{3}[0-9]{10}/) }
        table = Rantly { string(/[A-Z][a-z]+/) }
        record_id = Rantly { string(/rec[a-zA-Z0-9]{14}/) }
        cache_key = "#{base_id}/#{table}"

        old_fields = { "Name" => "Old Value" }
        new_fields = { "Name" => "New Value" }

        # Store stale data in cache (older than TTL)
        stale_data = {
          "id" => record_id,
          "fields" => old_fields,
          "createdTime" => 10.minutes.ago.iso8601
        }

        AirtableCache.store(cache_key, record_id, stale_data)
        cached = AirtableCache.fetch(cache_key, record_id)
        # Force the cache to be stale
        cached.update_column(:cached_at, 10.minutes.ago)

        # Verify cache is stale
        expect(cached.reload.stale?).to be true

        # Mock the API call - it SHOULD be called for stale cache
        api_response = {
          "id" => record_id,
          "fields" => new_fields,
          "createdTime" => Time.current.iso8601
        }

        allow(described_class).to receive(:fetch_record_from_api)
          .with(base_id: base_id, table: table, record_id: record_id)
          .and_return(api_response)

        # Call get_record - should fetch from API and update cache
        result = described_class.get_record(
          base_id: base_id,
          table: table,
          record_id: record_id,
          use_cache: true
        )

        # Verify we got the new data from API
        expect(result["fields"]).to eq(new_fields)

        # Verify cache was updated
        updated_cache = AirtableCache.fetch(cache_key, record_id)
        expect(updated_cache.data["fields"]).to eq(new_fields)
        expect(updated_cache.fresh?).to be true

        # Clean up for next iteration
        AirtableCache.invalidate(cache_key, record_id)
        RSpec::Mocks.space.proxy_for(described_class).reset
      end
    end

    it "queries Airtable when cache is missing" do
      # Run property test with 100 iterations
      100.times do
        base_id = Rantly { string(/[a-z]{3}[0-9]{10}/) }
        table = Rantly { string(/[A-Z][a-z]+/) }
        record_id = Rantly { string(/rec[a-zA-Z0-9]{14}/) }

        cache_key = "#{base_id}/#{table}"

        # Ensure no cache exists
        AirtableCache.invalidate(cache_key, record_id)
        expect(AirtableCache.fetch(cache_key, record_id)).to be_nil

        fields = { "Name" => Rantly { string } }
        api_response = {
          "id" => record_id,
          "fields" => fields,
          "createdTime" => Time.current.iso8601
        }

        # Mock the API call - it SHOULD be called when cache is missing
        allow(described_class).to receive(:fetch_record_from_api)
          .with(base_id: base_id, table: table, record_id: record_id)
          .and_return(api_response)

        # Call get_record - should fetch from API
        result = described_class.get_record(
          base_id: base_id,
          table: table,
          record_id: record_id,
          use_cache: true
        )

        # Verify we got the data from API
        expect(result["id"]).to eq(record_id)
        expect(result["fields"]).to eq(fields)

        # Clean up for next iteration
        RSpec::Mocks.space.proxy_for(described_class).reset
      end
    end
  end
end
