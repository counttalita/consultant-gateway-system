# frozen_string_literal: true

# Centralized service for audit logging
# Provides a consistent interface for logging all major system actions
# with automatic sensitive data redaction
class AuditLogger
  # Sensitive field patterns that should be redacted in logs
  SENSITIVE_PATTERNS = %w[
    password
    banking_details
    account_number
    branch_code
    code
    token
    secret
    api_key
    access_token
    refresh_token
    otp
    pin
    ssn
    id_number
    tax_number
  ].freeze

  class << self
    # Log an authentication event (login, logout, OTP generation, etc.)
    # @param action [String, Symbol] The authentication action (login, logout, otp_generated, etc.)
    # @param user [User] The user performing the action
    # @param resource [Object] Optional resource associated with the action
    # @param ip_address [String] IP address of the request
    # @param metadata [Hash] Additional context data
    # @return [AuditLog] The created audit log entry
    def log_authentication(action:, user:, resource: nil, ip_address: nil, metadata: {})
      log(
        action: action,
        user: user,
        resource: resource,
        ip_address: ip_address,
        metadata: metadata
      )
    end

    # Log a profile change event
    # @param user [User] The user whose profile is being changed
    # @param consultant [Consultant] The consultant record being modified
    # @param changes [Hash] Hash of field changes with old and new values
    # @param ip_address [String] IP address of the request
    # @param metadata [Hash] Additional context data
    # @return [AuditLog] The created audit log entry
    def log_profile_change(user:, consultant:, changes:, ip_address: nil, metadata: {})
      # Format changes to show old → new values
      formatted_changes = format_changes(changes)

      log(
        action: "profile_updated",
        user: user,
        resource: consultant,
        change_data: formatted_changes,
        ip_address: ip_address,
        metadata: metadata
      )
    end

    # Log a financial operation (invoice creation, bill creation, payment processing)
    # @param action [String, Symbol] The financial action (invoice_created, bill_created, etc.)
    # @param user [User] The user performing the action (can be nil for system actions)
    # @param resource [Object] The financial resource (invoice, bill, etc.)
    # @param external_system [String] The external system involved (xero, harvest, etc.)
    # @param external_id [String] The ID in the external system
    # @param ip_address [String] IP address of the request
    # @param metadata [Hash] Additional context data
    # @return [AuditLog] The created audit log entry
    def log_financial_operation(action:, user: nil, resource: nil, external_system:, external_id:, ip_address: nil, metadata: {})
      enriched_metadata = metadata.merge(
        external_system: external_system,
        external_id: external_id
      )

      log(
        action: action,
        user: user,
        resource: resource,
        ip_address: ip_address,
        metadata: enriched_metadata
      )
    end

    # Log an admin action
    # @param action [String, Symbol] The admin action
    # @param admin_user [User] The admin performing the action
    # @param resource [Object] The resource being acted upon
    # @param changes [Hash] Optional changes being made
    # @param justification [String] Optional justification for the action
    # @param ip_address [String] IP address of the request
    # @param metadata [Hash] Additional context data
    # @return [AuditLog] The created audit log entry
    def log_admin_action(action:, admin_user:, resource: nil, changes: {}, justification: nil, ip_address: nil, metadata: {})
      enriched_metadata = metadata.merge(
        admin_roles: admin_user.roles,
        justification: justification
      ).compact

      formatted_changes = changes.present? ? format_changes(changes) : {}

      log(
        action: action,
        user: admin_user,
        resource: resource,
        change_data: formatted_changes,
        ip_address: ip_address,
        metadata: enriched_metadata
      )
    end

    # Generic log method - used by all specific logging methods
    # @param action [String, Symbol] The action being logged
    # @param user [User] The user performing the action (optional for system actions)
    # @param resource [Object] The resource being acted upon (optional)
    # @param resource_type [String] Explicit resource type (optional, overrides resource.class.name)
    # @param change_data [Hash] Changes being made (optional)
    # @param ip_address [String] IP address of the request (optional)
    # @param metadata [Hash] Additional context data (optional)
    # @return [AuditLog] The created audit log entry
    def log(action:, user: nil, resource: nil, resource_type: nil, change_data: {}, ip_address: nil, metadata: {})
      # Sanitize sensitive data from both change_data and metadata
      sanitized_changes = sanitize_sensitive_data(change_data)
      sanitized_metadata = sanitize_sensitive_data(metadata)

      AuditLog.create!(
        user: user,
        action: action.to_s,
        resource_type: resource_type || resource&.class&.name,
        resource_id: resource&.id,
        change_data: sanitized_changes,
        ip_address: ip_address,
        metadata: sanitized_metadata
      )
    rescue StandardError => e
      # Log audit logging failures to Rails logger but don't fail the operation
      Rails.logger.error("Failed to create audit log: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      nil
    end

    # Query audit logs with filtering
    # @param filters [Hash] Filter options
    # @option filters [User] :user Filter by user
    # @option filters [String, Symbol] :action Filter by action
    # @option filters [Object] :resource Filter by resource
    # @option filters [String] :resource_type Filter by resource type
    # @option filters [Date, Time] :start_date Filter by start date
    # @option filters [Date, Time] :end_date Filter by end date
    # @option filters [Integer] :limit Limit number of results
    # @return [ActiveRecord::Relation] Filtered audit logs
    def query(filters = {})
      scope = AuditLog.all

      scope = scope.for_user(filters[:user]) if filters[:user]
      scope = scope.by_action(filters[:action]) if filters[:action]
      scope = scope.for_resource(filters[:resource]) if filters[:resource]
      scope = scope.where(resource_type: filters[:resource_type]) if filters[:resource_type]
      scope = scope.in_date_range(filters[:start_date], filters[:end_date]) if filters[:start_date] && filters[:end_date]

      scope = scope.order(created_at: :desc)
      scope = scope.limit(filters[:limit]) if filters[:limit]

      scope
    end

    # Get authentication events for a user
    # @param user [User] The user
    # @param limit [Integer] Maximum number of events to return
    # @return [ActiveRecord::Relation] Authentication audit logs
    def authentication_events(user:, limit: 100)
      AuditLog.authentication_events
              .for_user(user)
              .order(created_at: :desc)
              .limit(limit)
    end

    # Get profile changes for a consultant
    # @param consultant [Consultant] The consultant
    # @param limit [Integer] Maximum number of changes to return
    # @return [ActiveRecord::Relation] Profile change audit logs
    def profile_changes(consultant:, limit: 100)
      AuditLog.profile_changes
              .for_resource(consultant)
              .order(created_at: :desc)
              .limit(limit)
    end

    # Get financial operations
    # @param user [User] Optional user filter
    # @param limit [Integer] Maximum number of operations to return
    # @return [ActiveRecord::Relation] Financial operation audit logs
    def financial_operations(user: nil, limit: 100)
      scope = AuditLog.financial_operations
      scope = scope.for_user(user) if user
      scope.order(created_at: :desc).limit(limit)
    end

    # Get admin actions
    # @param admin_user [User] Optional admin user filter
    # @param limit [Integer] Maximum number of actions to return
    # @return [ActiveRecord::Relation] Admin action audit logs
    def admin_actions(admin_user: nil, limit: 100)
      scope = AuditLog.admin_actions
      scope = scope.for_user(admin_user) if admin_user
      scope.order(created_at: :desc).limit(limit)
    end

    private

    # Sanitize sensitive data from a hash
    # Recursively redacts values for keys matching sensitive patterns
    # @param data [Hash, Array, Object] Data to sanitize
    # @return [Hash, Array, Object] Sanitized data
    def sanitize_sensitive_data(data)
      case data
      when Hash
        data.each_with_object({}) do |(key, value), result|
          if sensitive_key?(key)
            result[key] = "[REDACTED]"
          elsif value.is_a?(Hash) || value.is_a?(Array)
            result[key] = sanitize_sensitive_data(value)
          else
            result[key] = value
          end
        end
      when Array
        data.map { |item| sanitize_sensitive_data(item) }
      else
        data
      end
    end

    # Check if a key matches sensitive patterns
    # @param key [String, Symbol] The key to check
    # @return [Boolean] true if key is sensitive
    def sensitive_key?(key)
      key_str = key.to_s.downcase
      SENSITIVE_PATTERNS.any? { |pattern| key_str.include?(pattern) }
    end

    # Format changes hash to show old → new values
    # @param changes [Hash] Hash of changes (can be ActiveModel::Dirty format or custom format)
    # @return [Hash] Formatted changes
    def format_changes(changes)
      return {} if changes.blank?

      changes.each_with_object({}) do |(key, value), result|
        if value.is_a?(Array) && value.length == 2
          # ActiveModel::Dirty format: [old_value, new_value]
          result[key] = { "old" => value[0], "new" => value[1] }
        elsif value.is_a?(Hash) && value.key?("old") && value.key?("new")
          # Already in our format
          result[key] = value
        elsif value.is_a?(Hash) && value.key?(:old) && value.key?(:new)
          # Symbol keys format
          result[key] = { "old" => value[:old], "new" => value[:new] }
        else
          # Single value - treat as new value with no old value
          result[key] = { "old" => nil, "new" => value }
        end
      end
    end
  end
end
