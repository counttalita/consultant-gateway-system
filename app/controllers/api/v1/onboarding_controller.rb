# frozen_string_literal: true

module Api
  module V1
    # Controller for consultant onboarding workflow
    class OnboardingController < ApplicationController
      before_action :authenticate_user!
      before_action :set_consultant
      before_action :authorize_onboarding_access!

      # GET /api/v1/onboarding
      # Get current onboarding progress and next step
      def show
        service = OnboardingService.new

        # Resume or get current progress
        progress = service.resume_onboarding(@consultant)

        render json: {
          success: true,
          onboarding: {
            consultant_id: @consultant.id,
            status: @consultant.onboarding_status,
            progress: progress
          }
        }, status: :ok
      end

      # POST /api/v1/onboarding/steps/:step_name
      # Complete a specific onboarding step
      def complete_step
        service = OnboardingService.new
        step_name = params[:step_name]

        result = service.complete_step(
          consultant: @consultant,
          step_name: step_name,
          data: step_params,
          ip_address: request.remote_ip
        )

        if result[:success]
          render json: {
            success: true,
            message: "Step completed successfully",
            step: step_response(result[:step]),
            next_step: result[:next_step] ? step_response(result[:next_step]) : nil,
            all_complete: result[:all_complete]
          }, status: :ok
        else
          render json: {
            success: false,
            errors: result[:errors]
          }, status: :unprocessable_entity
        end
      rescue OnboardingService::InvalidStepError => e
        render json: {
          success: false,
          errors: [ e.message ]
        }, status: :not_found
      rescue OnboardingService::StepNotReadyError => e
        render json: {
          success: false,
          errors: [ e.message ]
        }, status: :unprocessable_entity
      end

      # POST /api/v1/onboarding/initialize
      # Initialize onboarding for a consultant (admin only)
      def initialize_onboarding
        unless current_user.has_role?("admin")
          render json: {
            success: false,
            errors: [ "Only administrators can initialize onboarding" ]
          }, status: :forbidden
          return
        end

        service = OnboardingService.new
        steps = service.initialize_onboarding(@consultant)

        render json: {
          success: true,
          message: "Onboarding initialized successfully",
          steps: steps.map { |step| step_response(step) }
        }, status: :created
      end

      private

      def set_consultant
        # If consultant_id is provided, use it (for admin access)
        if params[:consultant_id].present?
          @consultant = Consultant.find(params[:consultant_id])
        else
          # Otherwise, use current user's consultant record
          @consultant = current_user.consultant
          unless @consultant
            render json: {
              success: false,
              errors: [ "No consultant profile found for current user" ]
            }, status: :not_found
          end
        end
      rescue ActiveRecord::RecordNotFound
        render json: {
          success: false,
          errors: [ "Consultant not found" ]
        }, status: :not_found
      end

      def authorize_onboarding_access!
        # Consultants can only access their own onboarding
        # Admins can access any consultant's onboarding
        unless current_user.has_role?("admin") || @consultant.user_id == current_user.id
          render json: {
            success: false,
            errors: [ "You are not authorized to access this onboarding" ]
          }, status: :forbidden
        end
      end

      def step_params
        # Different steps have different parameters
        case params[:step_name]
        when "personal_info"
          params.require(:step).permit(:first_name, :last_name, :phone_number, :id_number)
        when "banking"
          params.require(:step).permit(:bank_name, :account_number, :branch_code, :account_type, :tax_number, :vat_number)
        when "skills"
          params.require(:step).permit(:bio, skills: [])
        when "contract"
          params.require(:step).permit(:contract_accepted, :signature, :signed_at)
        when "welcome"
          {}
        else
          {}
        end
      end

      def step_response(step)
        return nil unless step

        {
          step_name: step.step_name,
          step_number: step.step_number,
          total_steps: step.total_steps,
          status: step.status,
          completed_at: step.completed_at,
          data: sanitize_step_data(step)
        }
      end

      def sanitize_step_data(step)
        # Remove sensitive data from response
        data = step.data.dup
        if step.step_name == "banking"
          data["account_number"] = mask_account_number(data["account_number"]) if data["account_number"]
        end
        data
      end

      def mask_account_number(account_number)
        return nil unless account_number
        "****#{account_number.to_s.last(4)}"
      end

      # Authentication helper (will be replaced by proper authentication system)
      def authenticate_user!
        token = request.headers["Authorization"]&.gsub(/^Bearer /, "")

        if token.blank?
          render json: {
            success: false,
            errors: [ "Authentication required" ]
          }, status: :unauthorized
          return
        end

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
