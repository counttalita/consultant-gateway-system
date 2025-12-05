# frozen_string_literal: true

# Controller concern providing authorization methods for role-based access control
module Authorizable
  extend ActiveSupport::Concern

  class AuthorizationError < StandardError; end

  # Check if current user has the required permission
  # @param permission [String, Symbol] The permission to check
  # @raise [AuthorizationError] if user doesn't have permission
  def authorize!(permission)
    unless current_user_has_permission?(permission)
      raise AuthorizationError, "You do not have permission to perform this action"
    end
  end

  # Check if current user has the required role
  # @param role [String, Symbol] The role to check
  # @raise [AuthorizationError] if user doesn't have role
  def authorize_role!(role)
    unless current_user_has_role?(role)
      raise AuthorizationError, "You do not have the required role to perform this action"
    end
  end

  # Check if current user owns the resource
  # @param resource [Object] The resource to check ownership of
  # @raise [AuthorizationError] if user doesn't own resource
  def authorize_resource_owner!(resource)
    return if current_user_owns_resource?(resource)

    raise AuthorizationError, "You are not authorized to access this resource"
  end

  # Get permissions for current user
  # @return [Array<String>] List of permissions
  def current_user_permissions
    return [] unless current_user
    current_user.permissions
  end

  private

  # Check if current user has a specific permission
  # @param permission [String, Symbol] The permission to check
  # @return [Boolean]
  def current_user_has_permission?(permission)
    return false unless current_user
    current_user_permissions.include?(permission.to_s)
  end

  # Check if current user has a specific role
  # @param role [String, Symbol] The role to check
  # @return [Boolean]
  def current_user_has_role?(role)
    return false unless current_user
    current_user.has_role?(role)
  end

  # Check if current user owns a resource
  # @param resource [Object] The resource to check
  # @return [Boolean]
  def current_user_owns_resource?(resource)
    return false unless current_user

    # Check if resource belongs to current user
    if resource.respond_to?(:user_id)
      resource.user_id == current_user.id
    elsif resource.respond_to?(:user)
      resource.user == current_user
    elsif resource.is_a?(User)
      resource == current_user
    else
      false
    end
  end

  protected

  # Handle authorization errors
  def handle_authorization_error(exception)
    render json: {
      success: false,
      error: exception.message,
      errors: [ exception.message ]
    }, status: :forbidden
  end
end
