# frozen_string_literal: true

require "net/http"
require "json"

# Adapter for Airtable Web API
# Handles communication with Airtable with caching, retry logic, and fallback
module Adapters
  class AirtableAdapter
    class ApiError < StandardError; end
    class RateLimitError < StandardError; end
    class RecordNotFoundError < StandardError; end
    class AuthenticationError < StandardError; end

    # Retry configuration
    MAX_RETRIES = 3
    BASE_DELAY = 1.second
    AIRTABLE_API_URL = "https://api.airtable.com/v0"

    # Get a single record from Airtable with caching
    # @param base_id [String] Airtable base ID
    # @param table [String] Table name
    # @param record_id [String] Record ID
    # @param use_cache [Boolean] Whether to use cache (default: true)
    # @return [Hash] Record data
    def self.get_record(base_id:, table:, record_id:, use_cache: true)
      cache_key = "#{base_id}/#{table}"

      if use_cache
        cached = CacheManager.fetch(cache_key, record_id)
        return cached if cached
      end

      # Fetch from Airtable with retry
      data = execute_with_retry do
        fetch_record_from_api(base_id: base_id, table: table, record_id: record_id)
      end

      # Store in cache
      CacheManager.store(cache_key, record_id, data)

      data
    rescue ApiError => e
      # Fallback to stale cache if Airtable is unavailable
      if use_cache
        stale_cached = CacheManager.fetch_stale(cache_key, record_id)
        if stale_cached
          Rails.logger.warn("Airtable unavailable, serving stale cache for #{table}/#{record_id}: #{e.message}")
          return stale_cached
        end
      end

      raise
    end

    # List records from Airtable with optional filtering
    # @param base_id [String] Airtable base ID
    # @param table [String] Table name
    # @param filter_formula [String] Airtable filter formula (optional)
    # @param max_records [Integer] Maximum number of records to return (optional)
    # @return [Array<Hash>] Array of record data
    def self.list_records(base_id:, table:, filter_formula: nil, max_records: nil)
      execute_with_retry do
        fetch_records_from_api(
          base_id: base_id,
          table: table,
          filter_formula: filter_formula,
          max_records: max_records
        )
      end
    end

    # Create a new record in Airtable
    # @param base_id [String] Airtable base ID
    # @param table [String] Table name
    # @param fields [Hash] Record fields
    # @return [Hash] Created record data with ID
    def self.create_record(base_id:, table:, fields:)
      data = execute_with_retry do
        create_record_in_api(base_id: base_id, table: table, fields: fields)
      end

      # Store in cache
      cache_key = "#{base_id}/#{table}"
      CacheManager.store(cache_key, data["id"], data)

      data
    end

    # Update an existing record in Airtable
    # @param base_id [String] Airtable base ID
    # @param table [String] Table name
    # @param record_id [String] Record ID
    # @param fields [Hash] Fields to update
    # @return [Hash] Updated record data
    def self.update_record(base_id:, table:, record_id:, fields:)
      data = execute_with_retry do
        update_record_in_api(base_id: base_id, table: table, record_id: record_id, fields: fields)
      end

      # Invalidate and update cache
      cache_key = "#{base_id}/#{table}"
      CacheManager.invalidate(cache_key, record_id)
      CacheManager.store(cache_key, record_id, data)

      data
    end

    # Delete a record from Airtable
    # @param base_id [String] Airtable base ID
    # @param table [String] Table name
    # @param record_id [String] Record ID
    # @return [Boolean] True if deleted successfully
    def self.delete_record(base_id:, table:, record_id:)
      execute_with_retry do
        delete_record_from_api(base_id: base_id, table: table, record_id: record_id)
      end

      # Invalidate cache
      cache_key = "#{base_id}/#{table}"
      CacheManager.invalidate(cache_key, record_id)

      true
    end

    # Execute a block with retry logic and circuit breaker
    # @yield Block to execute
    # @return Result of the block
    def self.execute_with_retry
      circuit_breaker.call do
        Utils::RetryableOperation.execute(
          max_retries: MAX_RETRIES,
          base_delay: BASE_DELAY,
          on_error: ->(e, attempt, delay) {
            if e.is_a?(RateLimitError)
              Rails.logger.warn("Airtable Rate Limit (attempt #{attempt}): #{e.message}. Retrying in #{delay}s...")
            else
              Rails.logger.warn("Airtable API Error (attempt #{attempt}): #{e.message}. Retrying in #{delay}s...")
            end
          }
        ) do
          yield
        end
      end
    rescue Utils::CircuitBreaker::OpenCircuitError => e
      Rails.logger.error("Airtable Circuit Breaker OPEN: #{e.message}")
      raise ApiError, "Airtable service temporarily unavailable"
    rescue Utils::RetryableOperation::MaxRetriesExceededError => e
      # Convert MaxRetriesExceededError to ApiError for consistency
      raise ApiError, e.message
    end

    def self.circuit_breaker
      @circuit_breaker ||= Utils::CircuitBreaker.new("AirtableAdapter")
    end

    # Fetch a single record from Airtable API
    def self.fetch_record_from_api(base_id:, table:, record_id:)
      uri = URI("#{AIRTABLE_API_URL}/#{base_id}/#{encode_table_name(table)}/#{record_id}")
      response = send_get_request(uri)
      parse_record_response(response)
    end

    # Fetch multiple records from Airtable API
    def self.fetch_records_from_api(base_id:, table:, filter_formula: nil, max_records: nil)
      uri = URI("#{AIRTABLE_API_URL}/#{base_id}/#{encode_table_name(table)}")

      params = {}
      params["filterByFormula"] = filter_formula if filter_formula
      params["maxRecords"] = max_records if max_records

      if params.any?
        uri.query = URI.encode_www_form(params)
      end

      response = send_get_request(uri)
      data = JSON.parse(response.body)

      records = data["records"] || []
      records.map { |record| normalize_record(record) }
    rescue JSON::ParserError => e
      raise ApiError, "Invalid JSON response: #{e.message}"
    end

    # Create a record via Airtable API
    def self.create_record_in_api(base_id:, table:, fields:)
      uri = URI("#{AIRTABLE_API_URL}/#{base_id}/#{encode_table_name(table)}")

      body = { fields: fields }.to_json
      response = send_post_request(uri, body)
      parse_record_response(response)
    end

    # Update a record via Airtable API
    def self.update_record_in_api(base_id:, table:, record_id:, fields:)
      uri = URI("#{AIRTABLE_API_URL}/#{base_id}/#{encode_table_name(table)}/#{record_id}")

      body = { fields: fields }.to_json
      response = send_patch_request(uri, body)
      parse_record_response(response)
    end

    # Delete a record via Airtable API
    def self.delete_record_from_api(base_id:, table:, record_id:)
      uri = URI("#{AIRTABLE_API_URL}/#{base_id}/#{encode_table_name(table)}/#{record_id}")
      response = send_delete_request(uri)

      data = JSON.parse(response.body)
      data["deleted"] == true
    rescue JSON::ParserError => e
      raise ApiError, "Invalid JSON response: #{e.message}"
    end

    # Send GET request to Airtable API
    def self.send_get_request(uri)
      http = build_http_client(uri)
      request = Net::HTTP::Get.new(uri)
      add_auth_headers(request)

      response = http.request(request)
      handle_response(response)
    end

    # Send POST request to Airtable API
    def self.send_post_request(uri, body)
      http = build_http_client(uri)
      request = Net::HTTP::Post.new(uri)
      add_auth_headers(request)
      request["Content-Type"] = "application/json"
      request.body = body

      response = http.request(request)
      handle_response(response)
    end

    # Send PATCH request to Airtable API
    def self.send_patch_request(uri, body)
      http = build_http_client(uri)
      request = Net::HTTP::Patch.new(uri)
      add_auth_headers(request)
      request["Content-Type"] = "application/json"
      request.body = body

      response = http.request(request)
      handle_response(response)
    end

    # Send DELETE request to Airtable API
    def self.send_delete_request(uri)
      http = build_http_client(uri)
      request = Net::HTTP::Delete.new(uri)
      add_auth_headers(request)

      response = http.request(request)
      handle_response(response)
    end

    # Build HTTP client with timeouts
    def self.build_http_client(uri)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.read_timeout = 30
      http.open_timeout = 10
      http
    end

    # Add authentication headers
    def self.add_auth_headers(request)
      request["Authorization"] = "Bearer #{airtable_api_key}"
      request["User-Agent"] = "UpTimeConsulting/1.0"
    end

    # Handle API response
    def self.handle_response(response)
      case response
      when Net::HTTPSuccess
        response
      when Net::HTTPTooManyRequests
        retry_after = response["Retry-After"]&.to_i || 30
        raise RateLimitError, "Rate limit exceeded. Retry after #{retry_after} seconds"
      when Net::HTTPUnauthorized
        raise AuthenticationError, "Invalid Airtable API key"
      when Net::HTTPNotFound
        raise RecordNotFoundError, "Record not found"
      else
        error_data = JSON.parse(response.body) rescue {}
        error_message = error_data["error"]&.dig("message") || response.message
        raise ApiError, "Airtable API error (#{response.code}): #{error_message}"
      end
    end

    # Parse record response
    def self.parse_record_response(response)
      data = JSON.parse(response.body)
      normalize_record(data)
    rescue JSON::ParserError => e
      raise ApiError, "Invalid JSON response: #{e.message}"
    end

    # Normalize record structure
    def self.normalize_record(record)
      {
        "id" => record["id"],
        "fields" => record["fields"] || {},
        "createdTime" => record["createdTime"]
      }
    end

    # Calculate exponential backoff delay
    def self.calculate_backoff_delay(attempt)
      BASE_DELAY * (2 ** attempt)
    end

    # Encode table name for URL
    def self.encode_table_name(table)
      URI.encode_www_form_component(table)
    end

    # Get Airtable API key from environment
    def self.airtable_api_key
      ENV.fetch("AIRTABLE_API_KEY") do
        raise AuthenticationError, "AIRTABLE_API_KEY environment variable not set"
      end
    end
  end
end
