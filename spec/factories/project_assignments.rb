FactoryBot.define do
  factory :project_assignment do
    project { nil }
    consultant { nil }
    role { "MyString" }
    start_date { "2025-12-04" }
    end_date { "2025-12-04" }
  end
end
