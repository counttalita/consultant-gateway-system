# frozen_string_literal: true

module Api
  module V1
    # Controller for finance analytics dashboard
    class FinanceDashboardController < ApplicationController
      before_action :authenticate_user!
      before_action :authorize_finance_access!

      # GET /api/v1/finance/dashboard
      # Get dashboard overview metrics
      def dashboard
        month = params[:month]&.to_i || Date.today.month
        year = params[:year]&.to_i || Date.today.year

        service = FinanceDashboard.new

        revenue = service.current_month_revenue(month: month, year: year)
        outstanding = service.outstanding_invoices
        pending_payments = service.pending_consultant_payments

        render json: {
          success: true,
          data: {
            revenue: revenue,
            outstanding_invoices: {
              count: outstanding.length,
              total_amount: outstanding.sum { |inv| inv[:amount_due] }.round(2),
              invoices: outstanding.first(10) # Limit to 10 for dashboard
            },
            pending_payments: {
              count: pending_payments.length,
              total_amount: pending_payments.sum { |bill| bill[:total] }.round(2),
              bills: pending_payments.first(10) # Limit to 10 for dashboard
            }
          }
        }
      end

      # GET /api/v1/finance/utilization
      # Get consultant utilization metrics
      def utilization
        start_date = parse_date(params[:start_date]) || Date.today.beginning_of_month
        end_date = parse_date(params[:end_date]) || Date.today.end_of_month

        service = FinanceDashboard.new
        utilization_data = service.consultant_utilization(start_date: start_date, end_date: end_date)

        render json: {
          success: true,
          data: {
            period: {
              start_date: start_date,
              end_date: end_date
            },
            consultants: utilization_data
          }
        }
      end

      # GET /api/v1/finance/profitability
      # Get project profitability metrics
      def profitability
        start_date = parse_date(params[:start_date]) || Date.today.beginning_of_month
        end_date = parse_date(params[:end_date]) || Date.today.end_of_month

        service = FinanceDashboard.new
        profitability_data = service.project_profitability(start_date: start_date, end_date: end_date)

        render json: {
          success: true,
          data: {
            period: {
              start_date: start_date,
              end_date: end_date
            },
            projects: profitability_data,
            summary: {
              total_revenue: profitability_data.sum { |p| p[:revenue] }.round(2),
              total_cost: profitability_data.sum { |p| p[:cost] }.round(2),
              total_profit: profitability_data.sum { |p| p[:profit] }.round(2),
              average_margin: profitability_data.any? ? (profitability_data.sum { |p| p[:margin_percentage] } / profitability_data.length).round(2) : 0
            }
          }
        }
      end

      # GET /api/v1/finance/aging
      # Get invoice aging report
      def aging
        service = FinanceDashboard.new
        aging_data = service.invoice_aging_report

        render json: {
          success: true,
          data: aging_data
        }
      end

      # GET /api/v1/finance/upcoming_payments
      # Get upcoming payment obligations
      def upcoming_payments
        days_ahead = params[:days_ahead]&.to_i || 30

        service = FinanceDashboard.new
        payments = service.upcoming_payment_obligations(days_ahead: days_ahead)

        render json: {
          success: true,
          data: {
            days_ahead: days_ahead,
            payments: payments,
            total_amount: payments.sum { |p| p[:total] }.round(2)
          }
        }
      end

      # GET /api/v1/finance/export
      # Export financial data to CSV
      def export
        start_date = parse_date(params[:start_date]) || Date.today.beginning_of_month
        end_date = parse_date(params[:end_date]) || Date.today.end_of_month

        service = FinanceDashboard.new
        csv_content = service.export_financial_summary(start_date: start_date, end_date: end_date)

        send_data csv_content,
                  filename: "financial_summary_#{start_date}_to_#{end_date}.csv",
                  type: "text/csv",
                  disposition: "attachment"
      end

      private

      def authorize_finance_access!
        authorize!(:view_financial_data)
      end

      def parse_date(date_string)
        return nil if date_string.blank?
        Date.parse(date_string)
      rescue ArgumentError
        nil
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
