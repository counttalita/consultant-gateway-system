class HealthController < ApplicationController
  def show
    render json: {
      status: "ok",
      timestamp: Time.current,
      environment: Rails.env,
      version: "1.0.0"
    }
  end
end
