# frozen_string_literal: true

# Service for managing PostgreSQL caching of Airtable data
# Implements cache-first read strategy with staleness checking and fallback
class CacheManager
  # Cache time-to-live
  CACHE_TTL = 5.minutes

  class << self
    # Fetch data from cache if fresh, otherwise return nil
    # @param table [String] Table identifier (e.g., "base_id/table_name")
    # @param record_id [String] Record ID
    # @return [Hash, nil] Cached data if fresh, nil otherwise
    def fetch(table, record_id)
      cached = AirtableCache.fetch(table, record_id)
      
      if cached&.fresh?
        Rails.logger.debug("Cache hit (fresh) for #{table}/#{record_id}")
        cached.data
      else
        Rails.logger.debug("Cache miss or stale for #{table}/#{record_id}")
        nil
      end
    end

    # Fetch data from cache even if stale (for fallback scenarios)
    # @param table [String] Table identifier
    # @param record_id [String] Record ID
    # @return [Hash, nil] Cached data regardless of freshness, nil if not found
    def fetch_stale(table, record_id)
      cached = AirtableCache.fetch(table, record_id)
      
      if cached
        Rails.logger.debug("Cache hit (stale) for #{table}/#{record_id}, age: #{cached.age.to_i}s")
        cached.data
      else
        Rails.logger.debug("Cache miss for #{table}/#{record_id}")
        nil
      end
    end

    # Store data in cache
    # @param table [String] Table identifier
    # @param record_id [String] Record ID
    # @param data [Hash] Data to cache
    # @return [AirtableCache] The cached record
    def store(table, record_id, data)
      Rails.logger.debug("Storing in cache: #{table}/#{record_id}")
      
      AirtableCache.store(table, record_id, data)
      
      # Return the cached record for chaining
      AirtableCache.fetch(table, record_id)
    end

    # Invalidate a specific cache entry
    # @param table [String] Table identifier
    # @param record_id [String] Record ID
    # @return [Integer] Number of records deleted
    def invalidate(table, record_id)
      Rails.logger.debug("Invalidating cache: #{table}/#{record_id}")
      AirtableCache.invalidate(table, record_id)
    end

    # Invalidate all cache entries for a table
    # @param table [String] Table identifier
    # @return [Integer] Number of records deleted
    def invalidate_table(table)
      Rails.logger.info("Invalidating all cache for table: #{table}")
      AirtableCache.invalidate_table(table)
    end

    # Invalidate all cache entries
    # @return [Integer] Number of records deleted
    def invalidate_all
      Rails.logger.info("Invalidating all cache entries")
      AirtableCache.delete_all
    end

    # Get cache statistics
    # @return [Hash] Statistics about cache usage
    def stats
      total = AirtableCache.count
      fresh = AirtableCache.fresh.count
      stale = AirtableCache.stale.count
      
      {
        total_entries: total,
        fresh_entries: fresh,
        stale_entries: stale,
        freshness_ratio: total > 0 ? (fresh.to_f / total * 100).round(2) : 0,
        cache_ttl_seconds: CACHE_TTL.to_i
      }
    end

    # Cleanup old cache entries
    # @param older_than [ActiveSupport::Duration] Delete entries older than this (default: 1 day)
    # @return [Integer] Number of records deleted
    def cleanup(older_than: 1.day.ago)
      deleted_count = AirtableCache.cleanup_stale(older_than: older_than)
      Rails.logger.info("Cleaned up #{deleted_count} stale cache entries older than #{older_than}")
      deleted_count
    end

    # Refresh a specific cache entry by fetching from Airtable
    # @param table [String] Table identifier
    # @param record_id [String] Record ID
    # @param base_id [String] Airtable base ID
    # @param table_name [String] Airtable table name
    # @return [Hash] Refreshed data
    def refresh(table, record_id, base_id:, table_name:)
      Rails.logger.debug("Refreshing cache: #{table}/#{record_id}")
      
      # Fetch fresh data from Airtable (bypass cache)
      data = Adapters::AirtableAdapter.get_record(
        base_id: base_id,
        table: table_name,
        record_id: record_id,
        use_cache: false
      )
      
      # Update cache
      store(table, record_id, data)
      
      data
    end

    # Warm up cache by fetching multiple records
    # @param table [String] Table identifier
    # @param base_id [String] Airtable base ID
    # @param table_name [String] Airtable table name
    # @param filter_formula [String] Optional Airtable filter formula
    # @param max_records [Integer] Maximum number of records to fetch
    # @return [Integer] Number of records cached
    def warm_up(table, base_id:, table_name:, filter_formula: nil, max_records: nil)
      Rails.logger.info("Warming up cache for table: #{table}")
      
      records = Adapters::AirtableAdapter.list_records(
        base_id: base_id,
        table: table_name,
        filter_formula: filter_formula,
        max_records: max_records
      )
      
      records.each do |record|
        store(table, record["id"], record)
      end
      
      Rails.logger.info("Cached #{records.count} records for #{table}")
      records.count
    end

    # Check if cache is healthy
    # @return [Hash] Health check results
    def health_check
      begin
        # Try to access the cache
        test_table = "health_check"
        test_id = "test_#{Time.current.to_i}"
        test_data = { "test" => true, "timestamp" => Time.current.to_s }
        
        # Store test data
        store(test_table, test_id, test_data)
        
        # Fetch test data
        fetched = fetch(test_table, test_id)
        
        # Clean up test data
        invalidate(test_table, test_id)
        
        # Verify data integrity
        if fetched == test_data
          {
            status: "healthy",
            message: "Cache is operational",
            stats: stats
          }
        else
          {
            status: "degraded",
            message: "Cache data integrity issue",
            stats: stats
          }
        end
      rescue => e
        {
          status: "unhealthy",
          message: "Cache error: #{e.message}",
          error: e.class.name
        }
      end
    end
  end
end
