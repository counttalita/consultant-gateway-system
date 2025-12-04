FactoryBot.define do
  factory :otp_code do
    user { nil }
    code { "MyString" }
    expires_at { "2025-12-04 10:06:36" }
    consumed_at { "2025-12-04 10:06:36" }
    ip_address { "" }
  end
end
