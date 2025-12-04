# frozen_string_literal: true

require "rails_helper"

RSpec.describe CacheManager do
  let(:table) { "app123/Consultants" }
  let(:record_id) { "rec123" }
  let(:data) { { "id" => record_id, "fields" => { "Name" => "Test" } } }

  describe ".fetch" do
    context "when cache is fresh" do
      before do
        AirtableCache.store(table, record_id, data)
      end

      it "returns cached data" do
        result = described_class.fetch(table, record_id)
        expect(result).to eq(data)
      end
    end

    context "when cache is stale" do
      before do
        AirtableCache.store(table, record_id, data)
        cached = AirtableCache.fetch(table, record_id)
        cached.update_column(:cached_at, 10.minutes.ago)
      end

      it "returns nil" do
        result = described_class.fetch(table, record_id)
        expect(result).to be_nil
      end
    end

    context "when cache does not exist" do
      it "returns nil" do
        result = described_class.fetch(table, record_id)
        expect(result).to be_nil
      end
    end
  end

  describe ".fetch_stale" do
    context "when cache exists but is stale" do
      before do
        AirtableCache.store(table, record_id, data)
        cached = AirtableCache.fetch(table, record_id)
        cached.update_column(:cached_at, 10.minutes.ago)
      end

      it "returns cached data regardless of staleness" do
        result = described_class.fetch_stale(table, record_id)
        expect(result).to eq(data)
      end
    end

    context "when cache is fresh" do
      before do
        AirtableCache.store(table, record_id, data)
      end

      it "returns cached data" do
        result = described_class.fetch_stale(table, record_id)
        expect(result).to eq(data)
      end
    end

    context "when cache does not exist" do
      it "returns nil" do
        result = described_class.fetch_stale(table, record_id)
        expect(result).to be_nil
      end
    end
  end

  describe ".store" do
    it "stores data in cache with timestamp" do
      result = described_class.store(table, record_id, data)
      
      expect(result).to be_a(AirtableCache)
      expect(result.table).to eq(table)
      expect(result.record_id).to eq(record_id)
      expect(result.data).to eq(data)
      expect(result.cached_at).to be_within(1.second).of(Time.current)
    end

    it "updates existing cache entry" do
      # Store initial data
      described_class.store(table, record_id, data)
      
      # Update with new data
      new_data = { "id" => record_id, "fields" => { "Name" => "Updated" } }
      described_class.store(table, record_id, new_data)
      
      # Should only have one record
      expect(AirtableCache.where(table: table, record_id: record_id).count).to eq(1)
      
      # Should have new data
      cached = AirtableCache.fetch(table, record_id)
      expect(cached.data["fields"]["Name"]).to eq("Updated")
    end
  end

  describe ".invalidate" do
    before do
      AirtableCache.store(table, record_id, data)
    end

    it "removes cache entry" do
      described_class.invalidate(table, record_id)
      
      cached = AirtableCache.fetch(table, record_id)
      expect(cached).to be_nil
    end

    it "returns number of deleted records" do
      count = described_class.invalidate(table, record_id)
      expect(count).to eq(1)
    end
  end

  describe ".invalidate_table" do
    before do
      AirtableCache.store(table, "rec1", data)
      AirtableCache.store(table, "rec2", data)
      AirtableCache.store("other_table", "rec3", data)
    end

    it "removes all cache entries for the table" do
      described_class.invalidate_table(table)
      
      expect(AirtableCache.where(table: table).count).to eq(0)
      expect(AirtableCache.where(table: "other_table").count).to eq(1)
    end
  end

  describe ".invalidate_all" do
    before do
      AirtableCache.store(table, "rec1", data)
      AirtableCache.store("other_table", "rec2", data)
    end

    it "removes all cache entries" do
      described_class.invalidate_all
      expect(AirtableCache.count).to eq(0)
    end
  end

  describe ".stats" do
    before do
      # Create fresh entries
      AirtableCache.store(table, "rec1", data)
      AirtableCache.store(table, "rec2", data)
      
      # Create stale entry
      AirtableCache.store(table, "rec3", data)
      stale = AirtableCache.fetch(table, "rec3")
      stale.update_column(:cached_at, 10.minutes.ago)
    end

    it "returns cache statistics" do
      stats = described_class.stats
      
      expect(stats[:total_entries]).to eq(3)
      expect(stats[:fresh_entries]).to eq(2)
      expect(stats[:stale_entries]).to eq(1)
      expect(stats[:freshness_ratio]).to be_within(0.1).of(66.67)
      expect(stats[:cache_ttl_seconds]).to eq(300)
    end
  end

  describe ".cleanup" do
    before do
      # Create recent entry
      AirtableCache.store(table, "rec1", data)
      
      # Create old entries
      AirtableCache.store(table, "rec2", data)
      old1 = AirtableCache.fetch(table, "rec2")
      old1.update_column(:cached_at, 2.days.ago)
      
      AirtableCache.store(table, "rec3", data)
      old2 = AirtableCache.fetch(table, "rec3")
      old2.update_column(:cached_at, 3.days.ago)
    end

    it "removes entries older than specified time" do
      count = described_class.cleanup(older_than: 1.day.ago)
      
      expect(count).to eq(2)
      expect(AirtableCache.count).to eq(1)
    end
  end

  describe ".refresh" do
    let(:base_id) { "app123" }
    let(:table_name) { "Consultants" }
    let(:new_data) { { "id" => record_id, "fields" => { "Name" => "Refreshed" } } }

    before do
      # Store old data
      AirtableCache.store(table, record_id, data)
    end

    it "fetches fresh data from Airtable and updates cache" do
      expect(Adapters::AirtableAdapter).to receive(:get_record)
        .with(base_id: base_id, table: table_name, record_id: record_id, use_cache: false)
        .and_return(new_data)

      result = described_class.refresh(table, record_id, base_id: base_id, table_name: table_name)
      
      expect(result).to eq(new_data)
      
      cached = AirtableCache.fetch(table, record_id)
      expect(cached.data["fields"]["Name"]).to eq("Refreshed")
    end
  end

  describe ".warm_up" do
    let(:base_id) { "app123" }
    let(:table_name) { "Consultants" }
    let(:records) do
      [
        { "id" => "rec1", "fields" => { "Name" => "User 1" } },
        { "id" => "rec2", "fields" => { "Name" => "User 2" } },
        { "id" => "rec3", "fields" => { "Name" => "User 3" } }
      ]
    end

    it "fetches multiple records and caches them" do
      expect(Adapters::AirtableAdapter).to receive(:list_records)
        .with(base_id: base_id, table: table_name, filter_formula: nil, max_records: nil)
        .and_return(records)

      count = described_class.warm_up(table, base_id: base_id, table_name: table_name)
      
      expect(count).to eq(3)
      expect(AirtableCache.where(table: table).count).to eq(3)
      
      # Verify each record is cached
      records.each do |record|
        cached = AirtableCache.fetch(table, record["id"])
        expect(cached).not_to be_nil
        expect(cached.data["id"]).to eq(record["id"])
      end
    end

    it "supports filter formula and max records" do
      expect(Adapters::AirtableAdapter).to receive(:list_records)
        .with(
          base_id: base_id,
          table: table_name,
          filter_formula: "{Status}='Active'",
          max_records: 10
        )
        .and_return(records)

      described_class.warm_up(
        table,
        base_id: base_id,
        table_name: table_name,
        filter_formula: "{Status}='Active'",
        max_records: 10
      )
    end
  end

  describe ".health_check" do
    it "returns healthy status when cache is operational" do
      result = described_class.health_check
      
      expect(result[:status]).to eq("healthy")
      expect(result[:message]).to eq("Cache is operational")
      expect(result[:stats]).to be_a(Hash)
    end

    it "returns unhealthy status on error" do
      allow(AirtableCache).to receive(:store).and_raise(StandardError, "Database error")
      
      result = described_class.health_check
      
      expect(result[:status]).to eq("unhealthy")
      expect(result[:message]).to include("Cache error")
      expect(result[:error]).to eq("StandardError")
    end
  end
end
