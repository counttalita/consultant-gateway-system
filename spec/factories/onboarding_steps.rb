FactoryBot.define do
  factory :onboarding_step do
    consultant { nil }
    step_name { "MyString" }
    status { "MyString" }
    data { "" }
    completed_at { "2025-12-04 10:09:22" }
  end
end
