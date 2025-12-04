FactoryBot.define do
  factory :consultant do
    user { nil }
    bio { "MyText" }
    skills { "" }
    banking_details { "" }
    airtable_id { "MyString" }
    harvest_id { "MyString" }
    xero_id { "MyString" }
    availability_status { "MyString" }
    utilization_percentage { "9.99" }
    onboarding_status { "MyString" }
  end
end
