FactoryBot.define do
  factory :onboarding_step do
    consultant
    step_name { "personal_info" }
    status { "pending" }
    data { {} }
    completed_at { nil }
  end
end
