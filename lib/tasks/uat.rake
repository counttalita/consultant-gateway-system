# UAT-related rake tasks

namespace :uat do
  desc "Seed UAT test data"
  task seed: :environment do
    load Rails.root.join("db", "seeds", "uat_test_data.rb")
  end

  desc "Clean UAT test data"
  task clean: :environment do
    puts "🧹 Cleaning UAT test data..."

    # Delete test users and associated data
    test_users = User.where("email LIKE '%@test.uptimeconsulting.co.za%'")
    puts "Deleting #{test_users.count} test users..."
    test_users.destroy_all

    # Delete test projects
    test_projects = Project.where("airtable_deal_id LIKE '%_test'")
    puts "Deleting #{test_projects.count} test projects..."
    test_projects.destroy_all

    # Delete test tenders
    test_tenders = Tender.where("reference_number LIKE 'TENDER-2025-%'")
    puts "Deleting #{test_tenders.count} test tenders..."
    test_tenders.destroy_all

    # Delete test audit logs
    test_audit_logs = AuditLog.where("metadata->>'test' = 'true'")
    puts "Deleting #{test_audit_logs.count} test audit logs..."
    test_audit_logs.destroy_all

    # Delete test cache entries
    test_cache = AirtableCache.where("record_id LIKE '%_test'")
    puts "Deleting #{test_cache.count} test cache entries..."
    test_cache.destroy_all

    puts "✅ UAT test data cleaned!"
  end

  desc "Reset UAT environment (clean and seed)"
  task reset: :environment do
    Rake::Task["uat:clean"].invoke
    Rake::Task["uat:seed"].invoke
  end

  desc "Run UAT health check"
  task health_check: :environment do
    puts "🏥 Running UAT Health Check..."
    puts "\n" + "=" * 60

    # Check database connectivity
    begin
      ActiveRecord::Base.connection.execute("SELECT 1")
      puts "✅ Database: Connected"
    rescue => e
      puts "❌ Database: Failed - #{e.message}"
    end

    # Check Redis connectivity (for Sidekiq)
    begin
      Sidekiq.redis { |conn| conn.ping }
      puts "✅ Redis: Connected"
    rescue => e
      puts "❌ Redis: Failed - #{e.message}"
    end

    # Check test users exist
    test_user_count = User.where("email LIKE '%@test.uptimeconsulting.co.za%'").count
    if test_user_count >= 6
      puts "✅ Test Users: #{test_user_count} users found"
    else
      puts "⚠️  Test Users: Only #{test_user_count} users found (expected 6+)"
    end

    # Check test projects exist
    test_project_count = Project.where("airtable_deal_id LIKE '%_test'").count
    if test_project_count >= 2
      puts "✅ Test Projects: #{test_project_count} projects found"
    else
      puts "⚠️  Test Projects: Only #{test_project_count} projects found (expected 2+)"
    end

    # Check test tenders exist
    test_tender_count = Tender.where("reference_number LIKE 'TENDER-2025-%'").count
    if test_tender_count >= 2
      puts "✅ Test Tenders: #{test_tender_count} tenders found"
    else
      puts "⚠️  Test Tenders: Only #{test_tender_count} tenders found (expected 2+)"
    end

    # Check environment variables
    required_env_vars = %w[
      DATABASE_URL
      REDIS_URL
      AIRTABLE_API_KEY
      XERO_CLIENT_ID
      HARVEST_ACCESS_TOKEN
      CLICKUP_API_TOKEN
      RESEND_API_KEY
      SECRET_KEY_BASE
    ]

    missing_vars = required_env_vars.reject { |var| ENV[var].present? }
    if missing_vars.empty?
      puts "✅ Environment Variables: All required variables set"
    else
      puts "⚠️  Environment Variables: Missing #{missing_vars.join(', ')}"
    end

    # Check external service adapters
    puts "\n📡 External Service Status:"

    # Airtable
    begin
      if ENV["AIRTABLE_API_KEY"].present?
        puts "✅ Airtable: API key configured"
      else
        puts "⚠️  Airtable: API key not configured"
      end
    rescue => e
      puts "❌ Airtable: #{e.message}"
    end

    # Xero
    begin
      if ENV["XERO_CLIENT_ID"].present? && ENV["XERO_CLIENT_SECRET"].present?
        puts "✅ Xero: OAuth credentials configured"
      else
        puts "⚠️  Xero: OAuth credentials not configured"
      end
    rescue => e
      puts "❌ Xero: #{e.message}"
    end

    # Harvest
    begin
      if ENV["HARVEST_ACCESS_TOKEN"].present?
        puts "✅ Harvest: Access token configured"
      else
        puts "⚠️  Harvest: Access token not configured"
      end
    rescue => e
      puts "❌ Harvest: #{e.message}"
    end

    # ClickUp
    begin
      if ENV["CLICKUP_API_TOKEN"].present?
        puts "✅ ClickUp: API token configured"
      else
        puts "⚠️  ClickUp: API token not configured"
      end
    rescue => e
      puts "❌ ClickUp: #{e.message}"
    end

    # Resend
    begin
      if ENV["RESEND_API_KEY"].present?
        puts "✅ Resend: API key configured"
      else
        puts "⚠️  Resend: API key not configured"
      end
    rescue => e
      puts "❌ Resend: #{e.message}"
    end

    puts "\n" + "=" * 60
    puts "🏥 Health Check Complete!"
    puts "=" * 60
  end

  desc "Generate UAT test report"
  task test_report: :environment do
    puts "📊 Generating UAT Test Report..."
    puts "\n" + "=" * 60
    puts "UAT Environment Status Report"
    puts "Generated: #{Time.current.strftime('%Y-%m-%d %H:%M:%S')}"
    puts "=" * 60

    puts "\n📈 System Statistics:"
    puts "  Total Users: #{User.count}"
    puts "  Test Users: #{User.where("email LIKE '%@test.uptimeconsulting.co.za%'").count}"
    puts "  Consultants: #{Consultant.count}"
    puts "  Projects: #{Project.count}"
    puts "  Tenders: #{Tender.count}"
    puts "  Audit Logs: #{AuditLog.count}"
    puts "  Cache Entries: #{AirtableCache.count}"

    puts "\n👥 User Breakdown:"
    User.group(:roles).count.each do |roles, count|
      puts "  #{roles.join(', ')}: #{count}"
    end

    puts "\n📋 Onboarding Status:"
    Consultant.group(:onboarding_status).count.each do |status, count|
      puts "  #{status.titleize}: #{count}"
    end

    puts "\n📊 Project Status:"
    Project.group(:status).count.each do |status, count|
      puts "  #{status.titleize}: #{count}"
    end

    puts "\n🎯 Tender Decisions:"
    Tender.group(:bid_decision).count.each do |decision, count|
      puts "  #{decision.titleize}: #{count}"
    end

    puts "\n📝 Recent Audit Activity (Last 7 days):"
    recent_logs = AuditLog.where("created_at > ?", 7.days.ago)
    recent_logs.group(:action).count.sort_by { |_, count| -count }.first(5).each do |action, count|
      puts "  #{action}: #{count}"
    end

    puts "\n💾 Cache Statistics:"
    cache_stats = CacheManager.stats
    puts "  Total Entries: #{cache_stats[:total_entries]}"
    puts "  Fresh Entries: #{cache_stats[:fresh_entries]}"
    puts "  Stale Entries: #{cache_stats[:stale_entries]}"

    puts "\n" + "=" * 60
    puts "📊 Report Complete!"
    puts "=" * 60
  end
end
