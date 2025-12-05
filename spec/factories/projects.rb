FactoryBot.define do
  factory :project do
    name { Faker::Company.bs.titleize }
    client_name { Faker::Company.name }
    airtable_deal_id { nil }
    clickup_project_id { nil }
    clickup_url { nil }
    drive_folder_id { nil }
    drive_url { nil }
    status { "setup" }
    start_date { Date.current }
    end_date { Date.current + 30.days }
  end
end
