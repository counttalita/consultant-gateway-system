FactoryBot.define do
  factory :otp_code do
    user
    sequence(:code) { |n| format("%06d", (100000 + n) % 1000000) }
    expires_at { 10.minutes.from_now }
    consumed_at { nil }
    ip_address { "127.0.0.1" }
  end
end
