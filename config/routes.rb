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
      resources :consultants, only: [] do
        collection do
          get "profile", to: "profiles#show"
          patch "profile", to: "profiles#update"
          post "cv", to: "cv_uploads#create"
        end
      end

      # Onboarding routes
      get "onboarding", to: "onboarding#show"
      post "onboarding/initialize", to: "onboarding#initialize_onboarding"
      post "onboarding/steps/:step_name", to: "onboarding#complete_step"

      # Zapier routes
      get "zapier/ping", to: "zapier#ping"
      post "zapier/triggers/:event_type", to: "zapier#receive_event"

      # User management routes (admin only)
      resources :users, only: [ :index, :show ] do
        collection do
          get "me", to: "users#me"
        end
        member do
          patch "roles", to: "users#update_roles"
        end
      end

      # Finance dashboard routes (finance/admin only)
      namespace :finance do
        get "dashboard", to: "finance_dashboard#index"
        get "revenue", to: "finance_dashboard#revenue"
        get "outstanding_invoices", to: "finance_dashboard#outstanding_invoices"
        get "utilization", to: "finance_dashboard#utilization"
        get "profitability", to: "finance_dashboard#profitability"
        get "payment_aging", to: "finance_dashboard#payment_aging"
        get "export", to: "finance_dashboard#export"
      end

      # Admin dashboard routes (admin only)
      namespace :admin do
        get "dashboard", to: "admin_dashboard#index"
        get "dashboard/active_users", to: "admin_dashboard#active_users"
        get "dashboard/integration_health", to: "admin_dashboard#integration_health"
        get "dashboard/activity_trends", to: "admin_dashboard#activity_trends"
        get "dashboard/errors", to: "admin_dashboard#errors"
        get "dashboard/data_quality", to: "admin_dashboard#data_quality"
      end

      # Availability and talent pool routes
      namespace :availability do
        get "talent_pool", to: "availability#talent_pool"
        post "filter_by_skills", to: "availability#filter_by_skills"
      end

      patch "availability/:consultant_id", to: "availability#update_availability"

      # Configuration management routes (admin only)
      get "config", to: "config#show"
      post "config/reload", to: "config#reload"
    end
  end

  # Webhook routes
  namespace :webhooks do
    # Tender webhooks
    post "tenders", to: "tenders#create"

    # Deal webhooks
    post "deals", to: "deals#create"
  end

  # Defines the root path route ("/")
  root "health#show"
end
