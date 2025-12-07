FactoryBot.define do
  factory :session do
    user
    token { SecureRandom.urlsafe_base64(32) }
    expires_at { 24.hours.from_now }
    last_activity_at { Time.current }
    ip_address { "127.0.0.1" }
  end
end
