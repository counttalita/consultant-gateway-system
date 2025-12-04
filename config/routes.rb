Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Custom health check endpoint
  get "health" => "health#show"

  # API routes will be added here as features are implemented
  namespace :api do
    namespace :v1 do
      # Authentication routes
      post "auth/request-otp", to: "auth#request_otp"
      post "auth/validate-otp", to: "auth#validate_otp"
      delete "auth/logout", to: "auth#logout"
      get "auth/session", to: "auth#session"

      # Profile routes
      # Onboarding routes
      # etc.
    end
  end

  # Webhook routes
  namespace :webhooks do
    # Tender webhooks
    # Deal webhooks
    # etc.
  end

  # Defines the root path route ("/")
  root "health#show"
end
