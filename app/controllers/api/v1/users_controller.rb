# frozen_string_literal: true

module Api
  module V1
    class UsersController < ApplicationController
      before_action :authenticate_user!
      before_action :authorize_admin!, except: [ :me ]
      before_action :set_user, only: [ :show, :update_roles ]

      # GET /api/v1/users
      # List all users with their roles
      def index
        users = User.includes(:consultant)
                   .order(created_at: :desc)
                   .page(params[:page])
                   .per(params[:per_page] || 50)

        render json: {
          success: true,
          users: users.map { |user| user_summary(user) },
          meta: pagination_meta(users)
        }
      end

      # GET /api/v1/users/:id
      # Get detailed user information
      def show
        render json: {
          success: true,
          user: user_details(@user)
        }
      end

      # GET /api/v1/users/me
      # Get current user information
      def me
        render json: {
          success: true,
          user: user_details(current_user)
        }
      end

      # PATCH /api/v1/users/:id/roles
      # Update user roles (internal staff only)
      def update_roles
        service = UserManagementService.new(current_user)
        new_roles = params.require(:roles)

        updated_user = service.update_roles(@user, new_roles)

        render json: {
          success: true,
          message: "User roles updated successfully",
          user: user_details(updated_user)
        }
      rescue UserManagementService::RoleManagementError => e
        render json: {
          success: false,
          error: e.message,
          errors: [ e.message ]
        }, status: :unprocessable_entity
      rescue ActionController::ParameterMissing => e
        render json: {
          success: false,
          error: "Roles parameter is required",
          errors: [ "Roles parameter is required" ]
        }, status: :bad_request
      end

      private

      def authorize_admin!
        authorize!(:manage_users)
      end

      def set_user
        @user = User.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: {
          success: false,
          error: "User not found",
          errors: [ "User with ID #{params[:id]} not found" ]
        }, status: :not_found
      end

      def user_summary(user)
        {
          id: user.id,
          email: user.email,
          roles: user.roles,
          active: user.active,
          is_consultant: user.consultant?,
          is_internal_staff: user.internal_staff?,
          created_at: user.created_at,
          last_login_at: user.sessions.order(created_at: :desc).first&.created_at
        }
      end

      def user_details(user)
        summary = user_summary(user)
        summary.merge(
          permissions: user.permissions,
          consultant_profile: user.consultant? ? consultant_profile_summary(user.consultant) : nil,
          can_modify_roles: can_modify_roles?(user)
        )
      end

      def consultant_profile_summary(consultant)
        return nil unless consultant

        {
          id: consultant.id,
          availability_status: consultant.availability_status,
          onboarding_status: consultant.onboarding_status,
          skills: consultant.skills
        }
      end

      def can_modify_roles?(user)
        return false unless current_user.has_role?("admin")
        service = UserManagementService.new(current_user)
        service.can_modify_roles?(user)
      end

      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          total_pages: collection.total_pages,
          total_count: collection.total_count,
          per_page: collection.limit_value
        }
      end

      # Authentication methods
      def authenticate_user!
        token = request.headers["Authorization"]&.gsub(/^Bearer /, "")

        if token.blank?
          render json: {
            success: false,
            error: "Authentication required",
            errors: [ "You must be logged in to access this resource" ]
          }, status: :unauthorized
          return
        end

        # Find session by token
        session = Session.find_by(token: token)

        if session.nil? || session.expired?
          render json: {
            success: false,
            error: "Invalid or expired session",
            errors: [ "Your session has expired. Please log in again." ]
          }, status: :unauthorized
          return
        end

        @current_user = session.user
      end

      def current_user
        @current_user
      end
    end
  end
end
