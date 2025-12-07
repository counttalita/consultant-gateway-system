# frozen_string_literal: true

module Api
  module V1
    # Controller for managing consultant availability and talent pool
    class AvailabilityController < ApplicationController
      include Authorizable

      before_action :require_authentication
      before_action :set_consultant, only: [ :update_availability ]
      before_action :authorize_resource_manager, only: [ :talent_pool, :filter_by_skills ]

      # GET /api/v1/availability/talent_pool
      # Get talent pool view with availability and utilization
      def talent_pool
        service = AvailabilityService.new
        filters = talent_pool_params

        talent_pool = service.get_talent_pool(filters)

        render json: {
          success: true,
          talent_pool: talent_pool.map { |entry| format_talent_pool_entry(entry) },
          filters_applied: filters
        }, status: :ok
      rescue StandardError => e
        Rails.logger.error("Talent pool retrieval failed: #{e.message}")
        render json: {
          success: false,
          error: "Failed to retrieve talent pool: #{e.message}"
        }, status: :internal_server_error
      end

      # POST /api/v1/availability/filter_by_skills
      # Filter consultants by required skills
      def filter_by_skills
        required_skills = params[:skills] || []
        availability_filter = params[:availability_status]

        if required_skills.blank?
          return render json: {
            success: false,
            error: "Skills parameter is required"
          }, status: :bad_request
        end

        service = AvailabilityService.new
        consultants = service.filter_by_skills(required_skills, availability_filter: availability_filter)

        render json: {
          success: true,
          consultants: consultants.map { |c| format_consultant(c) },
          filters: {
            skills: required_skills,
            availability_status: availability_filter
          }
        }, status: :ok
      rescue StandardError => e
        Rails.logger.error("Skills-based filtering failed: #{e.message}")
        render json: {
          success: false,
          error: "Failed to filter consultants: #{e.message}"
        }, status: :internal_server_error
      end

      # PATCH /api/v1/availability/:consultant_id
      # Update consultant availability status
      def update_availability
        # Consultants can only update their own availability
        # Admins and resource managers can update any consultant's availability
        unless can_update_availability?(@consultant)
          return render json: {
            success: false,
            error: "Unauthorized to update this consultant's availability"
          }, status: :forbidden
        end

        availability_status = params[:availability_status]

        if availability_status.blank?
          return render json: {
            success: false,
            error: "availability_status parameter is required"
          }, status: :bad_request
        end

        service = AvailabilityService.new
        result = service.update_availability(@consultant, availability_status)

        if result[:success]
          render json: {
            success: true,
            consultant: format_consultant(result[:consultant]),
            message: "Availability updated successfully"
          }, status: :ok
        else
          render json: {
            success: false,
            errors: result[:errors]
          }, status: :unprocessable_content
        end
      rescue StandardError => e
        Rails.logger.error("Availability update failed: #{e.message}")
        render json: {
          success: false,
          error: "Failed to update availability: #{e.message}"
        }, status: :internal_server_error
      end

      private

      def set_consultant
        @consultant = Consultant.find(params[:consultant_id])
      rescue ActiveRecord::RecordNotFound
        render json: {
          success: false,
          error: "Consultant not found"
        }, status: :not_found
      end

      def can_update_availability?(consultant)
        # Admins and users (resource managers) can update any consultant
        return true if current_user.has_role?("admin") || current_user.has_role?("user")

        # Consultants can only update their own availability
        current_user.has_role?("consultant") && consultant.user_id == current_user.id
      end

      def authorize_resource_manager
        unless current_user.has_role?("admin") || current_user.has_role?("user")
          render json: {
            success: false,
            error: "Unauthorized. Resource manager access required."
          }, status: :forbidden
        end
      end

      def talent_pool_params
        params.permit(:availability_status, :min_utilization, :max_utilization, skills: [])
      end

      def format_talent_pool_entry(entry)
        {
          id: entry[:consultant].id,
          email: entry[:consultant].user.email,
          availability_status: entry[:availability_status],
          utilization_percentage: entry[:utilization_percentage],
          skills: entry[:skills],
          active_projects: entry[:active_projects],
          upcoming_projects: entry[:upcoming_projects],
          bio: entry[:consultant].bio
        }
      end

      def format_consultant(consultant)
        {
          id: consultant.id,
          email: consultant.user.email,
          availability_status: consultant.availability_status,
          utilization_percentage: consultant.utilization_percentage || 0,
          skills: consultant.skills || [],
          bio: consultant.bio,
          active_projects: consultant.projects.where(status: "active").count
        }
      end
    end
  end
end
