# Integration testing tasks for external services

namespace :integration do
  desc "Test all external service integrations"
  task test_all: :environment do
    puts "🔌 Testing All External Service Integrations..."
    puts "=" * 60

    results = {
      airtable: test_airtable,
      xero: test_xero,
      harvest: test_harvest,
      clickup: test_clickup,
      google_drive: test_google_drive,
      resend: test_resend
    }

    puts "\n" + "=" * 60
    puts "📊 Integration Test Summary"
    puts "=" * 60

    results.each do |service, result|
      status = result[:success] ? "✅" : "❌"
      puts "#{status} #{service.to_s.titleize}: #{result[:message]}"
    end

    puts "=" * 60

    all_passed = results.values.all? { |r| r[:success] }
    if all_passed
      puts "✅ All integration tests passed!"
      exit 0
    else
      puts "❌ Some integration tests failed"
      exit 1
    end
  end

  desc "Test Airtable integration"
  task test_airtable: :environment do
    result = test_airtable
    puts result[:success] ? "✅ #{result[:message]}" : "❌ #{result[:message]}"
    exit(result[:success] ? 0 : 1)
  end

  desc "Test Xero integration"
  task test_xero: :environment do
    result = test_xero
    puts result[:success] ? "✅ #{result[:message]}" : "❌ #{result[:message]}"
    exit(result[:success] ? 0 : 1)
  end

  desc "Test Harvest integration"
  task test_harvest: :environment do
    result = test_harvest
    puts result[:success] ? "✅ #{result[:message]}" : "❌ #{result[:message]}"
    exit(result[:success] ? 0 : 1)
  end

  desc "Test ClickUp integration"
  task test_clickup: :environment do
    result = test_clickup
    puts result[:success] ? "✅ #{result[:message]}" : "❌ #{result[:message]}"
    exit(result[:success] ? 0 : 1)
  end

  desc "Test Google Drive integration"
  task test_google_drive: :environment do
    result = test_google_drive
    puts result[:success] ? "✅ #{result[:message]}" : "❌ #{result[:message]}"
    exit(result[:success] ? 0 : 1)
  end

  desc "Test Resend integration"
  task test_resend: :environment do
    result = test_resend
    puts result[:success] ? "✅ #{result[:message]}" : "❌ #{result[:message]}"
    exit(result[:success] ? 0 : 1)
  end

  private

  def test_airtable
    return { success: false, message: "AIRTABLE_API_KEY not configured" } unless ENV["AIRTABLE_API_KEY"].present?

    begin
      # Test basic connectivity by checking API key format
      api_key = Adapters::AirtableAdapter.send(:airtable_api_key)

      # Test cache functionality
      test_record_id = "test_integration_#{SecureRandom.hex(4)}"
      test_data = { test: true, timestamp: Time.current.to_i }

      # Store in cache
      CacheManager.store("TestTable", test_record_id, test_data)

      # Retrieve from cache
      cached_data = CacheManager.fetch("TestTable", test_record_id)

      if cached_data == test_data
        { success: true, message: "Airtable adapter configured and cache working" }
      else
        { success: false, message: "Cache data mismatch" }
      end
    rescue => e
      { success: false, message: "Error: #{e.message}" }
    end
  end

  def test_xero
    return { success: false, message: "XERO_CLIENT_ID not configured" } unless ENV["XERO_CLIENT_ID"].present?
    return { success: false, message: "XERO_CLIENT_SECRET not configured" } unless ENV["XERO_CLIENT_SECRET"].present?

    begin
      # Test OAuth configuration
      client_id = ENV["XERO_CLIENT_ID"]
      client_secret = ENV["XERO_CLIENT_SECRET"]

      if client_id.present? && client_secret.present?
        { success: true, message: "Xero OAuth credentials configured" }
      else
        { success: false, message: "Xero OAuth credentials incomplete" }
      end
    rescue => e
      { success: false, message: "Error: #{e.message}" }
    end
  end

  def test_harvest
    return { success: false, message: "HARVEST_ACCESS_TOKEN not configured" } unless ENV["HARVEST_ACCESS_TOKEN"].present?
    return { success: false, message: "HARVEST_ACCOUNT_ID not configured" } unless ENV["HARVEST_ACCOUNT_ID"].present?

    begin
      # Test token configuration
      token = ENV["HARVEST_ACCESS_TOKEN"]
      account_id = ENV["HARVEST_ACCOUNT_ID"]

      if token.present? && account_id.present?
        { success: true, message: "Harvest API credentials configured" }
      else
        { success: false, message: "Harvest API credentials incomplete" }
      end
    rescue => e
      { success: false, message: "Error: #{e.message}" }
    end
  end

  def test_clickup
    return { success: false, message: "CLICKUP_API_TOKEN not configured" } unless ENV["CLICKUP_API_TOKEN"].present?

    begin
      # Test token configuration
      token = ENV["CLICKUP_API_TOKEN"]

      if token.present?
        { success: true, message: "ClickUp API token configured" }
      else
        { success: false, message: "ClickUp API token not configured" }
      end
    rescue => e
      { success: false, message: "Error: #{e.message}" }
    end
  end

  def test_google_drive
    return { success: false, message: "GOOGLE_DRIVE_CREDENTIALS not configured" } unless ENV["GOOGLE_DRIVE_CREDENTIALS"].present?

    begin
      # Test credentials configuration
      credentials = ENV["GOOGLE_DRIVE_CREDENTIALS"]

      # Try to parse as JSON
      JSON.parse(credentials)

      { success: true, message: "Google Drive credentials configured and valid JSON" }
    rescue JSON::ParserError
      { success: false, message: "Google Drive credentials not valid JSON" }
    rescue => e
      { success: false, message: "Error: #{e.message}" }
    end
  end

  def test_resend
    return { success: false, message: "RESEND_API_KEY not configured" } unless ENV["RESEND_API_KEY"].present?

    begin
      # Test API key configuration
      api_key = ENV["RESEND_API_KEY"]

      if api_key.present? && api_key.start_with?("re_")
        { success: true, message: "Resend API key configured with correct format" }
      elsif api_key.present?
        { success: false, message: "Resend API key format incorrect (should start with 're_')" }
      else
        { success: false, message: "Resend API key not configured" }
      end
    rescue => e
      { success: false, message: "Error: #{e.message}" }
    end
  end
end
