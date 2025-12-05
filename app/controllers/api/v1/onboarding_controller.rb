module Api
  module V1
    class OnboardingController < ApplicationController
      before_action :authenticate_user!
      before_action :set_consultant

      def show
        service = OnboardingService.new(@consultant)
        render json: service.status
      end

      def initialize_onboarding
        service = OnboardingService.new(@consultant)
        service.initialize_onboarding
        render json: { message: "Onboarding initialized", status: service.status }
      end

      def complete_step
        service = OnboardingService.new(@consultant)
        step_name = params[:step_name]
        data = params[:data] || {}

        begin
          service.complete_step(step_name, data)
          render json: { message: "Step completed", status: service.status }
        rescue OnboardingService::Error => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      private

      def set_consultant
        @consultant = current_user.consultant
        unless @consultant
          # Auto-create consultant profile if it doesn't exist for the user
          @consultant = Consultant.create!(user: current_user)
        end
      end
    end
  end
end
