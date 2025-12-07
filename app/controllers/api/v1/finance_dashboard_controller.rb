# frozen_string_literal: true

module Api
  module V1
    # Controller for finance analytics dashboard
    class FinanceDashboardController < ApplicationController
      include Authorizable

      before_action :require_authentication
      before_action :require_finance_or_admin_role

      # GET /api/v1/finance/dashboard
      def index
        dashboard = FinanceDashboard.new

        render json: {
          current_month_revenue: dashboard.current_month_revenue,
          outstanding_invoices: dashboard.outstanding_invoices,
          payment_aging: dashboard.payment_aging_report
        }
      rescue FinanceDashboard::CalculationError => e
        render json: { error: e.message }, status: :unprocessable_content
      end

      # GET /api/v1/finance/revenue
      def revenue
        dashboard = FinanceDashboard.new
        render json: dashboard.current_month_revenue
      rescue FinanceDashboard::CalculationError => e
        render json: { error: e.message }, status: :unprocessable_content
      end

      # GET /api/v1/finance/outstanding_invoices
      def outstanding_invoices
        dashboard = FinanceDashboard.new
        render json: dashboard.outstanding_invoices
      rescue FinanceDashboard::CalculationError => e
        render json: { error: e.message }, status: :unprocessable_content
      end

      # GET /api/v1/finance/utilization
      def utilization
        start_date = params[:start_date] ? Date.parse(params[:start_date]) : Date.current.beginning_of_month
        end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.current.end_of_month

        dashboard = FinanceDashboard.new
        render json: {
          period: { start_date: start_date, end_date: end_date },
          consultants: dashboard.consultant_utilization(start_date: start_date, end_date: end_date)
        }
      rescue ArgumentError => e
        render json: { error: "Invalid date format: #{e.message}" }, status: :bad_request
      rescue FinanceDashboard::CalculationError => e
        render json: { error: e.message }, status: :unprocessable_content
      end

      # GET /api/v1/finance/profitability
      def profitability
        project_id = params[:project_id]&.to_i

        dashboard = FinanceDashboard.new
        render json: {
          projects: dashboard.project_profitability(project_id: project_id)
        }
      rescue FinanceDashboard::CalculationError => e
        render json: { error: e.message }, status: :unprocessable_content
      end

      # GET /api/v1/finance/payment_aging
      def payment_aging
        dashboard = FinanceDashboard.new
        render json: dashboard.payment_aging_report
      rescue FinanceDashboard::CalculationError => e
        render json: { error: e.message }, status: :unprocessable_content
      end

      # GET /api/v1/finance/export
      def export
        type = params[:type]&.to_sym
        start_date = params[:start_date] ? Date.parse(params[:start_date]) : nil
        end_date = params[:end_date] ? Date.parse(params[:end_date]) : nil

        unless [ :revenue, :invoices, :bills, :utilization, :profitability ].include?(type)
          return render json: { error: "Invalid export type" }, status: :bad_request
        end

        dashboard = FinanceDashboard.new
        csv_data = dashboard.export_to_csv(type: type, start_date: start_date, end_date: end_date)

        send_data csv_data,
                  filename: "#{type}_export_#{Date.current}.csv",
                  type: "text/csv",
                  disposition: "attachment"
      rescue ArgumentError => e
        render json: { error: "Invalid parameters: #{e.message}" }, status: :bad_request
      rescue FinanceDashboard::CalculationError => e
        render json: { error: e.message }, status: :unprocessable_content
      end

      private

      def require_finance_or_admin_role
        unless current_user.has_role?("finance") || current_user.has_role?("admin")
          render json: { error: "Unauthorized: Finance or Admin role required" }, status: :forbidden
        end
      end
    end
  end
end
