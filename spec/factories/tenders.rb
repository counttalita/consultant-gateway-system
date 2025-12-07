FactoryBot.define do
  factory :tender do
    reference_number { "MyString" }
    title { "MyString" }
    source { "MyString" }
    tender_value { "9.99" }
    submission_deadline { "2025-12-04 10:09:59" }
    required_capabilities { "" }
    airtable_id { "MyString" }
    bid_decision { "MyString" }
    bid_score { "9.99" }
    bid_rationale { "MyText" }
  end
end
