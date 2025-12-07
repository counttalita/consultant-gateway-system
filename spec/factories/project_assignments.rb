FactoryBot.define do
  factory :project_assignment do
    association :project
    association :consultant
    role { "Consultant" }
    start_date { Date.current }
    end_date { Date.current + 30.days }
    allocated_hours { 40.0 }
  end
end
