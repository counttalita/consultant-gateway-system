# UAT Test Data Seed Script
# This script creates test data for UAT environment
# Run with: rails db:seed:uat_test_data

puts "🌱 Seeding UAT test data..."

# Clean existing test data
puts "Cleaning existing test data..."
User.where("email LIKE '%@test.uptimeconsulting.co.za%'").destroy_all
Consultant.joins(:user).where("users.email LIKE '%@test.uptimeconsulting.co.za%'").destroy_all

# Create test consultant users
puts "Creating test consultant users..."

# 1. New Consultant (for onboarding testing)
new_consultant_user = User.create!(
  email: "new.consultant@test.uptimeconsulting.co.za",
  roles: [ "consultant" ],
  active: true
)
puts "✅ Created new consultant user: #{new_consultant_user.email}"

# 2. Active Consultant (fully onboarded)
active_consultant_user = User.create!(
  email: "active.consultant@test.uptimeconsulting.co.za",
  roles: [ "consultant" ],
  active: true
)

active_consultant = Consultant.create!(
  user: active_consultant_user,
  bio: "Experienced change management consultant with 10+ years in digital transformation projects.",
  skills: [ "Change Management", "Project Management", "Stakeholder Engagement", "Training Delivery" ],
  banking_details: {
    bank_name: "FNB",
    account_number: "62123456789",
    branch_code: "250655",
    account_type: "Cheque"
  },
  availability_status: "available",
  utilization_percentage: 0.0,
  onboarding_status: "completed",
  airtable_id: "rec_active_consultant_test",
  harvest_id: "harvest_active_test",
  xero_id: "xero_active_test"
)

# Create completed onboarding steps
%w[personal_info banking skills contract welcome].each do |step_name|
  OnboardingStep.create!(
    consultant: active_consultant,
    step_name: step_name,
    status: "completed",
    completed_at: 1.week.ago,
    data: { test: true }
  )
end

puts "✅ Created active consultant: #{active_consultant_user.email}"

# 3. Partially Available Consultant
partial_consultant_user = User.create!(
  email: "partial.consultant@test.uptimeconsulting.co.za",
  roles: [ "consultant" ],
  active: true
)

partial_consultant = Consultant.create!(
  user: partial_consultant_user,
  bio: "Senior consultant specializing in organizational change and process improvement.",
  skills: [ "Change Management", "Process Improvement", "Lean Six Sigma" ],
  banking_details: {
    bank_name: "Standard Bank",
    account_number: "12345678901",
    branch_code: "051001",
    account_type: "Cheque"
  },
  availability_status: "partially_available",
  utilization_percentage: 50.0,
  onboarding_status: "completed",
  airtable_id: "rec_partial_consultant_test",
  harvest_id: "harvest_partial_test",
  xero_id: "xero_partial_test"
)

# Create completed onboarding steps
%w[personal_info banking skills contract welcome].each do |step_name|
  OnboardingStep.create!(
    consultant: partial_consultant,
    step_name: step_name,
    status: "completed",
    completed_at: 2.weeks.ago,
    data: { test: true }
  )
end

puts "✅ Created partially available consultant: #{partial_consultant_user.email}"

# Create internal staff users
puts "Creating internal staff users..."

# 1. Admin User
admin_user = User.create!(
  email: "admin@test.uptimeconsulting.co.za",
  roles: [ "admin" ],
  active: true
)
puts "✅ Created admin user: #{admin_user.email}"

# 2. Finance User
finance_user = User.create!(
  email: "finance@test.uptimeconsulting.co.za",
  roles: [ "finance" ],
  active: true
)
puts "✅ Created finance user: #{finance_user.email}"

# 3. Multi-Role User
manager_user = User.create!(
  email: "manager@test.uptimeconsulting.co.za",
  roles: [ "admin", "finance" ],
  active: true
)
puts "✅ Created multi-role user: #{manager_user.email}"

# Create test projects
puts "Creating test projects..."

project1 = Project.create!(
  name: "Digital Transformation Initiative",
  client_name: "Acme Corporation",
  status: "active",
  start_date: Date.today,
  end_date: 6.months.from_now,
  airtable_deal_id: "rec_deal_acme_test",
  clickup_project_id: "clickup_acme_test",
  clickup_url: "https://app.clickup.com/test/acme",
  drive_folder_id: "drive_acme_test",
  drive_url: "https://drive.google.com/test/acme"
)

# Assign partial consultant to project
ProjectAssignment.create!(
  project: project1,
  consultant: partial_consultant,
  role: "Lead Consultant",
  allocated_hours: 80,
  start_date: Date.today,
  end_date: 6.months.from_now
)

puts "✅ Created test project: #{project1.name}"

project2 = Project.create!(
  name: "Change Management Program",
  client_name: "Beta Industries",
  status: "active",
  start_date: 1.month.ago,
  end_date: 5.months.from_now,
  airtable_deal_id: "rec_deal_beta_test",
  clickup_project_id: "clickup_beta_test",
  clickup_url: "https://app.clickup.com/test/beta",
  drive_folder_id: "drive_beta_test",
  drive_url: "https://drive.google.com/test/beta"
)

puts "✅ Created test project: #{project2.name}"

# Create test tenders
puts "Creating test tenders..."

tender1 = Tender.create!(
  reference_number: "TENDER-2025-001",
  title: "Government Change Management Services",
  source: "National Treasury Portal",
  tender_value: 2_000_000.00,
  submission_deadline: 2.months.from_now,
  required_capabilities: [ "Change Management", "Training", "Communication" ],
  bid_decision: "pursue",
  bid_score: 8.5,
  bid_rationale: "Strong alignment with our capabilities and strategic focus",
  airtable_id: "rec_tender_001_test"
)

puts "✅ Created test tender: #{tender1.reference_number}"

tender2 = Tender.create!(
  reference_number: "TENDER-2025-002",
  title: "IT Infrastructure Upgrade",
  source: "Provincial Government Portal",
  tender_value: 500_000.00,
  submission_deadline: 1.month.from_now,
  required_capabilities: [ "IT Infrastructure", "Network Engineering" ],
  bid_decision: "decline",
  bid_score: 3.2,
  bid_rationale: "Outside our core competency area",
  airtable_id: "rec_tender_002_test"
)

puts "✅ Created test tender: #{tender2.reference_number}"

# Create test audit logs
puts "Creating test audit logs..."

# Login audit logs
[ active_consultant_user, partial_consultant_user, admin_user, finance_user ].each do |user|
  3.times do |i|
    AuditLog.create!(
      user: user,
      action: "login",
      resource_type: "User",
      resource_id: user.id,
      change_data: {},
      ip_address: "192.168.1.#{100 + i}",
      metadata: { method: "otp", test: true },
      created_at: (i + 1).days.ago
    )
  end
end

# Profile change audit logs
AuditLog.create!(
  user: active_consultant_user,
  action: "profile_update",
  resource_type: "Consultant",
  resource_id: active_consultant.id,
  change_data: {
    bio: [ "Old bio text", "Experienced change management consultant with 10+ years in digital transformation projects." ]
  },
  ip_address: "192.168.1.150",
  metadata: { test: true },
  created_at: 2.days.ago
)

# Financial operation audit logs
AuditLog.create!(
  user: nil, # System action
  action: "invoice_created",
  resource_type: "Project",
  resource_id: project1.id,
  change_data: {},
  ip_address: "127.0.0.1",
  metadata: {
    xero_invoice_id: "xero_inv_test_001",
    amount: 50_000.00,
    test: true
  },
  created_at: 1.day.ago
)

puts "✅ Created test audit logs"

# Create test Airtable cache entries
puts "Creating test Airtable cache entries..."

AirtableCache.create!(
  table: "Consultants",
  record_id: "rec_active_consultant_test",
  data: {
    name: "Active Consultant",
    email: "active.consultant@test.uptimeconsulting.co.za",
    status: "Active",
    skills: [ "Change Management", "Project Management" ]
  },
  cached_at: 1.minute.ago
)

AirtableCache.create!(
  table: "Projects",
  record_id: "rec_deal_acme_test",
  data: {
    client: "Acme Corporation",
    project: "Digital Transformation Initiative",
    status: "In Delivery"
  },
  cached_at: 5.minutes.ago
)

puts "✅ Created test Airtable cache entries"

# Note: CV uploads require actual file attachments via Active Storage
# Skipping CV upload creation in seed data
puts "ℹ️  Skipped CV upload (requires Active Storage file attachment)"

# Summary
puts "\n" + "=" * 60
puts "✅ UAT Test Data Seeding Complete!"
puts "=" * 60
puts "\nTest Users Created:"
puts "  Consultants:"
puts "    - new.consultant@test.uptimeconsulting.co.za (not onboarded)"
puts "    - active.consultant@test.uptimeconsulting.co.za (fully onboarded)"
puts "    - partial.consultant@test.uptimeconsulting.co.za (50% utilized)"
puts "\n  Internal Staff:"
puts "    - admin@test.uptimeconsulting.co.za (Admin role)"
puts "    - finance@test.uptimeconsulting.co.za (Finance role)"
puts "    - manager@test.uptimeconsulting.co.za (Admin + Finance roles)"
puts "\nTest Projects: #{Project.count}"
puts "Test Tenders: #{Tender.count}"
puts "Test Audit Logs: #{AuditLog.count}"
puts "Test Cache Entries: #{AirtableCache.count}"
puts "\n" + "=" * 60
puts "\n🎯 Ready for UAT testing!"
puts "📧 Use OTP authentication to login with any test user email"
puts "=" * 60
