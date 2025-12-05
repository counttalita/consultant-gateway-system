# frozen_string_literal: true

require "rails_helper"

RSpec.describe UserManagementService, type: :service do
  let(:admin_user) { create(:user, roles: [ "admin" ]) }
  let(:service) { described_class.new(admin_user) }

  describe "Property-Based Tests" do
    # Feature: consultant-gateway-system, Property 57: Multiple Role Assignment
    # Validates: Requirements 16.1
    describe "Property 57: Multiple Role Assignment" do
      it "allows assignment of one or multiple roles from Admin, Finance, and User for any internal staff account" do
        property_test(iterations: 100) do
          # Generate random internal staff user
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          # Create internal staff user with single role
          initial_role = Rantly { choose("admin", "finance", "user") }
          user = create(:user, email: email, roles: [ initial_role ])

          # Generate random combination of internal roles (1 to 3 roles)
          num_roles = Rantly { range(1, 3) }
          available_roles = [ "admin", "finance", "user" ]
          new_roles = Rantly { array(num_roles) { choose(*available_roles) } }.uniq

          # Update roles
          updated_user = service.update_roles(user, new_roles)

          # Verify roles were updated
          expect(updated_user.roles).to match_array(new_roles)
          expect(updated_user.roles.length).to be >= 1
          expect(updated_user.roles.length).to be <= 3

          # Verify all roles are internal staff roles
          expect(updated_user.roles).to all(be_in(User::INTERNAL_ROLES))

          # Verify user is internal staff
          expect(updated_user.internal_staff?).to be true

          # Verify audit log was created
          audit_log = AuditLog.where(
            action: "user_roles_updated",
            resource_type: "User",
            resource_id: user.id
          ).last
          expect(audit_log).to be_present
          expect(audit_log.change_data["new_roles"]).to match_array(new_roles)
        end
      end

      it "allows single role assignment for internal staff" do
        property_test(iterations: 100) do
          # Generate random internal staff user
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          # Create internal staff user with multiple roles
          user = create(:user, email: email, roles: [ "admin", "finance" ])

          # Assign single role
          single_role = Rantly { choose("admin", "finance", "user") }
          updated_user = service.update_roles(user, [ single_role ])

          # Verify single role was assigned
          expect(updated_user.roles).to eq([ single_role ])
          expect(updated_user.roles.length).to eq(1)
          expect(updated_user.internal_staff?).to be true
        end
      end
    end

    # Feature: consultant-gateway-system, Property 58: Permission Union Calculation
    # Validates: Requirements 16.2
    describe "Property 58: Permission Union Calculation" do
      it "grants the union of all permissions from assigned roles for any user with multiple roles" do
        property_test(iterations: 100) do
          # Generate random internal staff user
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          # Generate random combination of internal roles (2 to 3 roles for meaningful union)
          num_roles = Rantly { range(2, 3) }
          available_roles = [ "admin", "finance", "user" ]
          roles = Rantly { array(num_roles) { choose(*available_roles) } }.uniq

          # Create user with multiple roles
          user = create(:user, email: email, roles: roles)

          # Get permissions
          permissions = user.permissions

          # Calculate expected permissions (union of all role permissions)
          expected_permissions = roles.flat_map do |role|
            case role
            when "admin"
              %w[manage_users manage_consultants manage_projects manage_tenders view_analytics manage_system]
            when "finance"
              %w[view_consultants view_projects view_financial_data manage_invoices manage_bills export_financial_data]
            when "user"
              %w[view_consultants view_projects]
            else
              []
            end
          end.uniq

          # Verify permissions are the union of all role permissions
          expect(permissions).to match_array(expected_permissions)

          # Verify no duplicate permissions
          expect(permissions.uniq).to eq(permissions)

          # Verify permissions include capabilities from all roles
          roles.each do |role|
            case role
            when "admin"
              expect(permissions).to include("manage_users", "manage_system")
            when "finance"
              expect(permissions).to include("view_financial_data", "manage_invoices")
            when "user"
              expect(permissions).to include("view_consultants", "view_projects")
            end
          end
        end
      end

      it "grants correct permissions for single role users" do
        property_test(iterations: 100) do
          # Generate random internal staff user
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          # Assign single role
          role = Rantly { choose("admin", "finance", "user") }
          user = create(:user, email: email, roles: [ role ])

          # Get permissions
          permissions = user.permissions

          # Verify permissions match the single role
          case role
          when "admin"
            expect(permissions).to match_array(%w[manage_users manage_consultants manage_projects manage_tenders view_analytics manage_system])
          when "finance"
            expect(permissions).to match_array(%w[view_consultants view_projects view_financial_data manage_invoices manage_bills export_financial_data])
          when "user"
            expect(permissions).to match_array(%w[view_consultants view_projects])
          end
        end
      end
    end

    # Feature: consultant-gateway-system, Property 59: Consultant Role Restriction
    # Validates: Requirements 16.3
    describe "Property 59: Consultant Role Restriction" do
      it "only allows assignment of the Consultant role and prevents addition of internal staff roles for any consultant account" do
        property_test(iterations: 100) do
          # Generate random consultant user
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          # Create consultant user
          user = create(:user, email: email, roles: [ "consultant" ])
          create(:consultant, user: user)

          # Attempt to add internal staff role to consultant
          internal_role = Rantly { choose("admin", "finance", "user") }

          # Should raise error when trying to modify consultant roles
          expect {
            service.update_roles(user, [ internal_role ])
          }.to raise_error(UserManagementService::RoleManagementError, /Cannot modify consultant roles/)

          # Verify roles remain unchanged
          user.reload
          expect(user.roles).to eq([ "consultant" ])
          expect(user.consultant?).to be true
          expect(user.internal_staff?).to be false
        end
      end

      it "prevents combining consultant role with other roles during creation" do
        property_test(iterations: 100) do
          # Generate random email
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          # Attempt to create user with consultant role combined with internal role
          internal_role = Rantly { choose("admin", "finance", "user") }
          invalid_roles = [ "consultant", internal_role ]

          # Should fail validation
          user = build(:user, email: email, roles: invalid_roles)
          expect(user.valid?).to be false
          expect(user.errors[:roles]).to include("consultant role cannot be combined with other roles")
        end
      end

      it "allows consultant role as single role" do
        property_test(iterations: 100) do
          # Generate random email
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          # Create user with only consultant role
          user = create(:user, email: email, roles: [ "consultant" ])

          # Verify user is valid
          expect(user.valid?).to be true
          expect(user.roles).to eq([ "consultant" ])
          expect(user.consultant?).to be true
          expect(user.internal_staff?).to be false

          # Verify consultant has limited permissions
          expect(user.permissions).to match_array(%w[manage_own_profile view_own_projects])
        end
      end
    end

    # Feature: consultant-gateway-system, Property 60: Authorization Enforcement
    # Validates: Requirements 16.4
    describe "Property 60: Authorization Enforcement" do
      it "denies access and returns authorization error for any consultant attempting to access admin or finance features" do
        property_test(iterations: 100) do
          # Generate random consultant user
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          # Create consultant user
          consultant_user = create(:user, email: email, roles: [ "consultant" ])
          create(:consultant, user: consultant_user)

          # Test various admin/finance permissions
          restricted_permissions = [
            "manage_users",
            "manage_system",
            "view_financial_data",
            "manage_invoices",
            "manage_bills",
            "export_financial_data",
            "manage_tenders"
          ]

          # Pick random restricted permission
          permission = Rantly { choose(*restricted_permissions) }

          # Verify consultant doesn't have the permission
          expect(consultant_user.permissions).not_to include(permission)
          expect(consultant_user.has_role?("admin")).to be false
          expect(consultant_user.has_role?("finance")).to be false

          # Verify consultant only has consultant permissions
          expect(consultant_user.permissions).to match_array(%w[manage_own_profile view_own_projects])
        end
      end

      it "allows internal staff to access admin and finance features based on their roles" do
        property_test(iterations: 100) do
          # Generate random internal staff user
          timestamp = (Time.current.to_f * 1000000).to_i
          random_suffix = Rantly { range(1000, 9999) }
          email = Rantly {
            username = sized(10) { string(:alpha) }
            domain = sized(8) { string(:alpha) }
            "#{username}#{timestamp}#{random_suffix}@#{domain}.com"
          }

          # Create internal staff user with random role
          role = Rantly { choose("admin", "finance", "user") }
          staff_user = create(:user, email: email, roles: [ role ])

          # Verify user has appropriate permissions
          case role
          when "admin"
            expect(staff_user.permissions).to include("manage_users", "manage_system")
            expect(staff_user.has_role?("admin")).to be true
          when "finance"
            expect(staff_user.permissions).to include("view_financial_data", "manage_invoices")
            expect(staff_user.has_role?("finance")).to be true
          when "user"
            expect(staff_user.permissions).to include("view_consultants", "view_projects")
            expect(staff_user.has_role?("user")).to be true
          end

          # Verify user is internal staff
          expect(staff_user.internal_staff?).to be true
          expect(staff_user.consultant?).to be false
        end
      end
    end
  end
end
