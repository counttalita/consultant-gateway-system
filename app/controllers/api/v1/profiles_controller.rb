# frozen_string_literal: true

module Api
  module V1
    # Controller for consultant profile management
    class ProfilesController < ApplicationController
      before_action :authenticate_user!
      before_action :set_consultant
      before_action :authorize_profile_access!

      # GET /api/v1/consultants/:id/profile
      # Retrieve consultant profile
      def show
        render json: {
          success: true,
          consultant: consultant_response(@consultant)
        }, status: :ok
      end

      # PATCH /api/v1/consultants/:id/profile
      # Update consultant profile
      def update
        service = ProfileService.new
        result = service.update_profile(@consultant, profile_params)

        if result[:success]
          render json: {
            success: true,
            consultant: consultant_response(result[:consultant]),
            message: "Profile updated successfully. Changes will be synced to Airtable shortly."
          }, status: :ok
        else
          render json: {
            success: false,
            errors: result[:errors]
          }, status: :unprocessable_entity
        end
      end

      private

      def set_consultant
        @consultant = Consultant.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: {
          success: false,
          errors: [ "Consultant not found" ]
        }, status: :not_found
      end

      def authorize_profile_access!
        # Consultants can only access their own profile
        # Admins and finance users can access any profile
        unless current_user.internal_staff? || @consultant.user_id == current_user.id
          render json: {
            success: false,
            errors: [ "You are not authorized to access this profile" ]
          }, status: :forbidden
        end
      end

      def profile_params
        params.require(:profile).permit(
          :bio,
          :availability_status,
          skills: [],
          banking_details: [
            :bank_name,
            :account_number,
            :branch_code,
            :account_type
          ]
        )
      end

      def consultant_response(consultant)
        {
          id: consultant.id,
          email: consultant.user.email,
          bio: consultant.bio,
          skills: consultant.skills,
          availability_status: consultant.availability_status,
          utilization_percentage: consultant.utilization_percentage,
          onboarding_status: consultant.onboarding_status,
          banking_details_complete: consultant.banking_details.present?,
          profile_complete: consultant.profile_complete?,
          synced_to_airtable: consultant.airtable_id.present?,
          synced_to_harvest: consultant.harvest_id.present?,
          synced_to_xero: consultant.xero_id.present?,
          created_at: consultant.created_at,
          updated_at: consultant.updated_at
        }
      end

      # Stub for authentication - will be implemented by authentication system
      def authenticate_user!
        # This will be implemented by the authentication system
        # For now, we'll add a basic implementation
        token = request.headers["Authorization"]&.gsub(/^Bearer /, "")

        if token.blank?
          render json: {
            success: false,
            errors: [ "Authentication required" ]
          }, status: :unauthorized
          return
        end

        # Find session by token
        session = Session.find_by(token: token)

        if session.nil? || session.expired?
          render json: {
            success: false,
            errors: [ "Invalid or expired session" ]
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
