# frozen_string_literal: true

module Adapters
  # Adapter for interacting with the Harvest API v2
  class HarvestAdapter
    include HTTParty
    base_uri "https://api.harvestapp.com/v2"

    class ApiError < StandardError; end
    class AuthenticationError < ApiError; end
    class RateLimitError < ApiError; end
    class ValidationError < ApiError; end

    def initialize(access_token: nil, account_id: nil)
      @access_token = access_token || ENV["HARVEST_ACCESS_TOKEN"]
      @account_id = account_id || ENV["HARVEST_ACCOUNT_ID"]

      raise AuthenticationError, "Missing Harvest credentials" if @access_token.blank? || @account_id.blank?

      @headers = {
        "Authorization" => "Bearer #{@access_token}",
        "Harvest-Account-Id" => @account_id,
        "User-Agent" => "ConsultantGateway (admin@uptimeconsulting.co.za)",
        "Content-Type" => "application/json"
      }
    end

    # Create a new user (consultant) in Harvest
    # @param first_name [String]
    # @param last_name [String]
    # @param email [String]
    # @return [Hash] The created user data
    def create_user(first_name:, last_name:, email:)
      payload = {
        first_name: first_name,
        last_name: last_name,
        email: email,
        is_contractor: true,
        roles: [ "Member" ], # Default role for consultants
        is_active: true
      }

      response = self.class.post("/users", headers: @headers, body: payload.to_json)
      handle_response(response)
    end

    # Retrieve approved hours for a given date range
    # @param start_date [Date|String]
    # @param end_date [Date|String]
    # @return [Array<Hash>] List of time entries
    def get_approved_hours(start_date:, end_date:)
      options = {
        query: {
          from: start_date.to_s,
          to: end_date.to_s,
          is_billed: false,
          page: 1,
          per_page: 100
        },
        headers: @headers
      }

      all_entries = []
      loop do
        response = self.class.get("/time_entries", options)
        data = handle_response(response)

        entries = data["time_entries"] || []
        all_entries.concat(entries)

        break unless data["links"] && data["links"]["next"]

        options[:query][:page] += 1
      end

      all_entries
    end

    # Find user by email
    # @param email [String]
    # @return [Hash, nil] User data or nil
    def find_user_by_email(email)
      options = {
        query: { email: email },
        headers: @headers
      }

      response = self.class.get("/users", options)
      data = handle_response(response)

      users = data["users"] || []
      users.first
    end

    # Alias for get_approved_hours to support FinanceDashboard service
    # @param start_date [Date|String]
    # @param end_date [Date|String]
    # @return [Array<Hash>] List of time entries
    def get_time_entries(start_date:, end_date:)
      get_approved_hours(start_date: start_date, end_date: end_date)
    end

    private

    def handle_response(response)
      case response.code
      when 200, 201
        response.parsed_response
      when 401, 403
        raise AuthenticationError, "Harvest authentication failed: #{response.body}"
      when 422
        error_message = response.parsed_response["message"] rescue "Validation failed"
        raise ValidationError, error_message
      when 429
        raise RateLimitError, "Harvest rate limit exceeded"
      else
        raise ApiError, "Harvest API error (Code: #{response.code}): #{response.body}"
      end
    end
  end
end
