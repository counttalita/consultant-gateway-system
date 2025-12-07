# frozen_string_literal: true

require "rails_helper"

RSpec.describe User, type: :model do
  describe "validations" do
    it "validates email presence and format" do
      user = User.new(roles: [ "consultant" ])
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include("can't be blank")

      user.email = "invalid"
      expect(user).not_to be_valid

      user.email = "valid@example.com"
      expect(user).to be_valid
    end

    it "validates roles presence" do
      user = User.new(email: "test@example.com")
      expect(user).not_to be_valid
      expect(user.errors[:roles]).to include("can't be blank")
    end
  end

  describe "role management" do
    let(:user) { create(:user, email: "test@example.com", roles: [ "user" ]) }

    it "allows adding valid roles" do
      user.add_role("finance")
      expect(user.roles).to include("finance")
    end

    it "prevents adding invalid roles" do
      result = user.add_role("invalid_role")
      expect(result).to be false
    end

    it "prevents duplicate roles" do
      user.add_role("finance")
      user.add_role("finance")
      expect(user.roles.count("finance")).to eq(1)
    end
  end

  # Property 57: Multiple Role Assignment (Requirement 16.1)
  describe "Property 57: Multiple Role Assignment" do
    it "allows internal staff to have multiple roles assigned" do
      property_test(iterations: 100) do
        # Generate a random subset of internal roles (1-3 roles)
        num_roles = Rantly { range(1, 3) }
        roles = Rantly { array(num_roles) { choose(*User::INTERNAL_ROLES) } }.uniq

        user = User.new(
          email: Faker::Internet.email,
          roles: roles
        )

        expect(user).to be_valid
        expect(user.roles.length).to be >= 1
        expect(user.roles.length).to be <= 3
        expect(user.internal_staff?).to be true

        # All assigned roles should be internal roles
        expect((user.roles - User::INTERNAL_ROLES)).to be_empty
      end
    end
  end

  # Property 58: Permission Union Calculation (Requirement 16.2)
  describe "Property 58: Permission Union Calculation" do
    it "grants union of all permissions from assigned roles" do
      property_test(iterations: 100) do
        # Generate random combination of internal roles
        num_roles = Rantly { range(1, 3) }
        roles = Rantly { array(num_roles) { choose(*User::INTERNAL_ROLES) } }.uniq

        user = User.new(
          email: Faker::Internet.email,
          roles: roles
        )

        # Calculate expected permissions manually
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

        actual_permissions = user.permissions

        # User should have all expected permissions
        expect(actual_permissions).to match_array(expected_permissions)

        # If user has multiple roles, they should have more permissions than any single role
        if roles.length > 1
          roles.each do |role|
            single_role_user = User.new(email: Faker::Internet.email, roles: [ role ])
            expect(actual_permissions.length).to be >= single_role_user.permissions.length
          end
        end
      end
    end
  end

  # Property 59: Consultant Role Restriction (Requirement 16.3)
  describe "Property 59: Consultant Role Restriction" do
    it "only allows consultant role without other roles" do
      property_test(iterations: 100) do
        # Try to combine consultant role with other roles
        other_role = Rantly { choose(*User::INTERNAL_ROLES) }

        # Consultant role alone should be valid
        consultant_only = User.new(
          email: Faker::Internet.email,
          roles: [ User::CONSULTANT_ROLE ]
        )
        expect(consultant_only).to be_valid

        # Consultant role combined with other roles should be invalid
        consultant_with_other = User.new(
          email: Faker::Internet.email,
          roles: [ User::CONSULTANT_ROLE, other_role ]
        )
        expect(consultant_with_other).not_to be_valid
        expect(consultant_with_other.errors[:roles]).to include("consultant role cannot be combined with other roles")
      end
    end

    it "prevents adding internal roles to consultant users" do
      consultant = User.create!(
        email: Faker::Internet.email,
        roles: [ User::CONSULTANT_ROLE ]
      )

      User::INTERNAL_ROLES.each do |internal_role|
        result = consultant.add_role(internal_role)
        expect(result).to be false
        expect(consultant.roles).to eq([ User::CONSULTANT_ROLE ])
      end
    end
  end

  describe "permissions" do
    it "returns correct permissions for admin role" do
      admin = User.new(email: "admin@example.com", roles: [ "admin" ])
      expect(admin.permissions).to include("manage_users", "manage_consultants", "manage_projects")
    end

    it "returns correct permissions for finance role" do
      finance = User.new(email: "finance@example.com", roles: [ "finance" ])
      expect(finance.permissions).to include("view_financial_data", "manage_invoices", "manage_bills")
    end

    it "returns correct permissions for consultant role" do
      consultant = User.new(email: "consultant@example.com", roles: [ "consultant" ])
      expect(consultant.permissions).to include("manage_own_profile", "view_own_projects")
    end

    it "returns union of permissions for multiple roles" do
      multi_role = User.new(email: "multi@example.com", roles: [ "admin", "finance" ])
      admin_perms = User.new(email: "a@example.com", roles: [ "admin" ]).permissions
      finance_perms = User.new(email: "f@example.com", roles: [ "finance" ]).permissions

      expect(multi_role.permissions).to match_array((admin_perms + finance_perms).uniq)
    end
  end

  describe "helper methods" do
    it "correctly identifies consultant users" do
      consultant = User.new(email: "c@example.com", roles: [ "consultant" ])
      expect(consultant.consultant?).to be true
      expect(consultant.internal_staff?).to be false
    end

    it "correctly identifies internal staff" do
      admin = User.new(email: "a@example.com", roles: [ "admin" ])
      expect(admin.internal_staff?).to be true
      expect(admin.consultant?).to be false
    end

    it "correctly checks role membership" do
      user = User.new(email: "u@example.com", roles: [ "admin", "finance" ])
      expect(user.has_role?("admin")).to be true
      expect(user.has_role?("finance")).to be true
      expect(user.has_role?("user")).to be false
    end
  end
end
