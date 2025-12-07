FactoryBot.define do
  factory :audit_log do
    user { nil }
    action { "MyString" }
    resource_type { "MyString" }
    resource_id { 1 }
    change_data { "" }
    ip_address { "" }
    metadata { "" }
  end
end
