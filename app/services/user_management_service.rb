# frozen_string_literal: true

# Service for managing user roles and permissions
class UserManagementService
  class RoleManagementError < StandardError; end

  def initialize(admin_user)
    @admin_user = admin_user
    validate_admin_permissions!
  end

  # Update user roles
  # @param user [User] The user to update
  # @param new_roles [Array<String>] The new roles to assign
  # @return [User] The updated user
  def update_roles(user, new_roles)
    validate_can_modify_roles!(user)
    validate_roles!(new_roles, user)

    old_roles = user.roles.dup
    user.roles = new_roles

    if user.save
      log_role_change(user, old_roles, new_roles)
      user
    else
      raise RoleManagementError, user.errors.full_messages.join(", ")
    end
  end

  # Check if a user's roles can be modified
  # @param user [User] The user to check
  # @return [Boolean]
  def can_modify_roles?(user)
    # Cannot modify consultant roles
    return false if user.consultant?

    # Cannot modify own roles
    return false if user == @admin_user

    # Can modify internal staff roles
    true
  end

  private

  def validate_admin_permissions!
    unless @admin_user&.has_role?("admin")
      raise RoleManagementError, "Only administrators can manage user roles"
    end
  end

  def validate_can_modify_roles!(user)
    unless can_modify_roles?(user)
      if user.consultant?
        raise RoleManagementError, "Cannot modify consultant roles through this interface"
      elsif user == @admin_user
        raise RoleManagementError, "Cannot modify your own roles"
      else
        raise RoleManagementError, "Cannot modify roles for this user"
      end
    end
  end

  def validate_roles!(new_roles, user)
    # Ensure roles is an array
    unless new_roles.is_a?(Array)
      raise RoleManagementError, "Roles must be an array"
    end

    # Validate all roles are valid
    invalid_roles = new_roles - User::VALID_ROLES
    if invalid_roles.any?
      raise RoleManagementError, "Invalid roles: #{invalid_roles.join(', ')}"
    end

    # Prevent adding consultant role to existing internal staff
    if new_roles.include?(User::CONSULTANT_ROLE) && user.internal_staff?
      raise RoleManagementError, "Cannot add consultant role to internal staff"
    end

    # Prevent consultant role from being combined with other roles
    if new_roles.include?(User::CONSULTANT_ROLE) && new_roles.length > 1
      raise RoleManagementError, "Consultant role cannot be combined with other roles"
    end

    # Ensure at least one role is assigned
    if new_roles.empty?
      raise RoleManagementError, "User must have at least one role"
    end
  end

  def log_role_change(user, old_roles, new_roles)
    AuditLogger.log(
      action: :user_roles_updated,
      user: @admin_user,
      resource: user,
      change_data: {
        old_roles: old_roles,
        new_roles: new_roles
      },
      metadata: {
        admin_id: @admin_user.id,
        admin_email: @admin_user.email,
        target_user_id: user.id,
        target_user_email: user.email
      }
    )
  end
end
