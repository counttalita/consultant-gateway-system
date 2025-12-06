module Api
  module V1
    class ProfilesController < ApplicationController
      before_action :authenticate_user!
      before_action :set_consultant

      def show
        # Get active project assignments with project details
        active_assignments = @consultant.project_assignments.active.includes(:project).map do |assignment|
          {
            id: assignment.id,
            project_id: assignment.project.id,
            project_name: assignment.project.name,
            client_name: assignment.project.client_name,
            role: assignment.role,
            allocated_hours: assignment.allocated_hours,
            start_date: assignment.start_date,
            end_date: assignment.end_date
          }
        end

        render json: {
          id: @consultant.id,
          bio: @consultant.bio,
          skills: @consultant.skills,
          banking_details: @consultant.banking_details,
          tax_number: @consultant.tax_number,
          vat_number: @consultant.vat_number,
          phone: @consultant.metadata&.dig("phone"),
          linkedin_url: @consultant.metadata&.dig("linkedin_url"),
          hourly_rate: @consultant.metadata&.dig("hourly_rate"),
          onboarding_status: @consultant.onboarding_status,
          availability_status: @consultant.availability_status,
          utilization_percentage: @consultant.utilization_percentage,
          project_assignments: active_assignments
        }
      end

      def update
        if @consultant.update(profile_params)
          # Update metadata fields separately if they are passed
          if params[:consultant][:phone] || params[:consultant][:linkedin_url] || params[:consultant][:hourly_rate]
            metadata = @consultant.metadata || {}
            metadata[:phone] = params[:consultant][:phone] if params[:consultant][:phone]
            metadata[:linkedin_url] = params[:consultant][:linkedin_url] if params[:consultant][:linkedin_url]
            metadata[:hourly_rate] = params[:consultant][:hourly_rate] if params[:consultant][:hourly_rate]
            @consultant.update(metadata: metadata)
          end

          render json: { message: "Profile updated successfully", consultant: @consultant }
        else
          render json: { error: @consultant.errors.full_messages.join(", ") }, status: :unprocessable_content
        end
      end

      private

      def set_consultant
        @consultant = current_user.consultant
        unless @consultant
          render json: { error: "Consultant profile not found" }, status: :not_found
        end
      end

      def profile_params
        params.require(:consultant).permit(
          :bio,
          :tax_number,
          :vat_number,
          skills: [],
          banking_details: [ :bank_name, :account_number, :branch_code, :account_type ]
        )
      end
    end
  end
end
