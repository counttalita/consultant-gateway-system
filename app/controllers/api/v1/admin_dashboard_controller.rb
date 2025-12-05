# frozen_string_literal: true

module Api
  module V1
    class AdminDashboardController < ApplicationController
      include Authorizable

      before_action :require_admin

      # GET /api/v1/admin/dashboard
      def index
        dashboard = AdminDashboard.new

        render json: {
          active_users: dashboard.active_users,
          integration_health: dashboard.integration_health,
          data_quality: dashboard.data_quality_assessment
        }, status: :ok
      rescue AdminDashboard::CalculationError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # GET /api/v1/admin/dashboard/active_users
      def active_users
        dashboard = AdminDashboard.new
        period = params[:period]&.to_i&.hours || 24.hours

        render json: dashboard.active_users(period: period), status: :ok
      rescue AdminDashboard::CalculationError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # GET /api/v1/admin/dashboard/integration_health
      def integration_health
        dashboard = AdminDashboard.new

        render json: dashboard.integration_health, status: :ok
      rescue AdminDashboard::CalculationError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # GET /api/v1/admin/dashboard/activity_trends
      def activity_trends
        dashboard = AdminDashboard.new

        start_date = params[:start_date] ? Date.parse(params[:start_date]) : 30.days.ago.to_date
        end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.current
        granularity = params[:granularity]&.to_sym || :day

        unless %i[day week month].include?(granularity)
          return render json: { error: "Invalid granularity. Must be day, week, or month" }, status: :bad_request
        end

        render json: dashboard.activity_trends(
          start_date: start_date,
          end_date: end_date,
          granularity: granularity
        ), status: :ok
      rescue ArgumentError => e
        render json: { error: "Invalid date format: #{e.message}" }, status: :bad_request
      rescue AdminDashboard::CalculationError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # GET /api/v1/admin/dashboard/errors
      def errors
        dashboard = AdminDashboard.new

        start_date = params[:start_date] ? Time.parse(params[:start_date]) : 7.days.ago
        end_date = params[:end_date] ? Time.parse(params[:end_date]) : Time.current
        limit = params[:limit]&.to_i || 10

        render json: dashboard.error_aggregation(
          start_date: start_date,
          end_date: end_date,
          limit: limit
        ), status: :ok
      rescue ArgumentError => e
        render json: { error: "Invalid date format: #{e.message}" }, status: :bad_request
      rescue AdminDashboard::CalculationError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # GET /api/v1/admin/dashboard/data_quality
      def data_quality
        dashboard = AdminDashboard.new

        render json: dashboard.data_quality_assessment, status: :ok
      rescue AdminDashboard::CalculationError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      private

      def require_admin
        unless current_user&.has_role?("admin")
          render json: { error: "Unauthorized. Admin access required." }, status: :forbidden
        end
      end
    end
  end
end
