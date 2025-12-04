FactoryBot.define do
  factory :session do
    user { nil }
    token { "MyString" }
    expires_at { "2025-12-04 10:07:06" }
    last_activity_at { "2025-12-04 10:07:06" }
    ip_address { "" }
  end
end
