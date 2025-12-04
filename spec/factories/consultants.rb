FactoryBot.define do
  factory :consultant do
    association :user
    bio { "Experienced consultant with expertise in change management" }
    skills { ["Change Management", "Project Management", "Stakeholder Engagement"] }
    banking_details do
      {
        "bank_name" => "Standard Bank",
        "account_number" => "1234567890",
        "branch_code" => "051001",
        "account_type" => "Cheque"
      }
    end
    airtable_id { "rec#{SecureRandom.hex(8)}" }
    harvest_id { nil }
    xero_id { nil }
    availability_status { "available" }
    utilization_percentage { 50.0 }
    onboarding_status { "completed" }
  end
end
