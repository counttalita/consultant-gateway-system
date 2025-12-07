# frozen_string_literal: true

module Adapters
  class ClickUpAdapter
    include HTTParty
    base_uri "https://api.clickup.com/api/v2"

    class ApiError < StandardError; end
    class AuthenticationError < ApiError; end
    class ResourceNotFoundError < ApiError; end

    def initialize(api_token: nil)
      @api_token = api_token || ENV["CLICKUP_API_TOKEN"]
      raise AuthenticationError, "ClickUp API token is required" if @api_token.blank?

      @headers = {
        "Authorization" => @api_token,
        "Content-Type" => "application/json"
      }
    end

    # Create a new list (Project)
    # @param name [String] Name of the list/project
    # @param folder_id [String] Folder ID to create list in (optional)
    # @param space_id [String] Space ID to create list in (required if folder_id not provided)
    # @return [Hash] Created list data
    def create_list(name:, folder_id: nil, space_id: nil)
      if folder_id.present?
        endpoint = "/folder/#{folder_id}/list"
      elsif space_id.present?
        endpoint = "/space/#{space_id}/list"
      else
        raise ArgumentError, "Either folder_id or space_id must be provided"
      end

      payload = { name: name, content: "Project created via Consultant Gateway" }
      response = self.class.post(endpoint, headers: @headers, body: payload.to_json)

      handle_response(response)
    end

    # Apply a template to a list
    # @param list_id [String] List ID to apply template to
    # @param template_id [String] Template ID to apply
    # @return [Boolean] True if successful
    def apply_template(list_id:, template_id:)
      endpoint = "/list/#{list_id}/taskTemplate/#{template_id}"
      response = self.class.post(endpoint, headers: @headers)

      # ClickUp doesn't always return body for template application, check status
      handle_response(response)
      true
    end

    # Create a task (e.g., for Bid Decision)
    # @param list_id [String] List ID to create task in
    # @param name [String] Task name
    # @param description [String] Task description
    # @param status [String] Task status
    # @param priority [Integer] Task priority (1: Urgent, 2: High, 3: Normal, 4: Low)
    # @return [Hash] Created task data
    def create_task(list_id:, name:, description: nil, status: nil, priority: nil)
      endpoint = "/list/#{list_id}/task"

      payload = {
        name: name,
        description: description,
        status: status,
        priority: priority
      }.compact

      response = self.class.post(endpoint, headers: @headers, body: payload.to_json)
      handle_response(response)
    end

    # Get current user (for auth verification)
    def get_user
      response = self.class.get("/user", headers: @headers)
      handle_response(response)
    end

    private

    def handle_response(response)
      case response.code
      when 200, 201
        response.parsed_response
      when 401
        raise AuthenticationError, "ClickUp authentication failed"
      when 404
        raise ResourceNotFoundError, "ClickUp resource not found: #{response.body}"
      else
        raise ApiError, "ClickUp API error (Code: #{response.code}): #{response.body}"
      end
    end
  end
end
