# Code coverage tasks

namespace :coverage do
  desc "Check if code coverage meets minimum threshold"
  task check: :environment do
    require "simplecov"

    # Load coverage results if they exist
    coverage_dir = Rails.root.join("coverage")
    resultset_path = coverage_dir.join(".resultset.json")

    unless File.exist?(resultset_path)
      puts "❌ No coverage data found. Run tests with COVERAGE=true first."
      puts "   Example: COVERAGE=true bundle exec rspec"
      exit 1
    end

    # Parse coverage results
    require "json"
    resultset = JSON.parse(File.read(resultset_path))

    # Calculate overall coverage
    total_lines = 0
    covered_lines = 0

    resultset.each do |_suite_name, data|
      next unless data["coverage"]

      data["coverage"].each do |_file, lines|
        lines.each do |line_coverage|
          next if line_coverage.nil?
          total_lines += 1
          covered_lines += 1 if line_coverage > 0
        end
      end
    end

    coverage_percentage = total_lines > 0 ? (covered_lines.to_f / total_lines * 100).round(2) : 0
    threshold = 80.0

    puts "\n" + "=" * 60
    puts "📊 Code Coverage Report"
    puts "=" * 60
    puts "Total Lines: #{total_lines}"
    puts "Covered Lines: #{covered_lines}"
    puts "Coverage: #{coverage_percentage}%"
    puts "Threshold: #{threshold}%"
    puts "=" * 60

    if coverage_percentage >= threshold
      puts "✅ Coverage meets threshold!"
      puts "=" * 60
      exit 0
    else
      puts "❌ Coverage below threshold!"
      puts "   Need #{(threshold - coverage_percentage).round(2)}% more coverage"
      puts "=" * 60
      exit 1
    end
  end

  desc "Generate detailed coverage report"
  task report: :environment do
    coverage_dir = Rails.root.join("coverage")
    index_path = coverage_dir.join("index.html")

    if File.exist?(index_path)
      puts "📊 Coverage report available at:"
      puts "   #{index_path}"
      puts "\n💡 Open in browser:"
      puts "   open #{index_path}"
    else
      puts "❌ No coverage report found. Run tests with COVERAGE=true first."
      puts "   Example: COVERAGE=true bundle exec rspec"
    end
  end

  desc "Clean coverage data"
  task clean: :environment do
    coverage_dir = Rails.root.join("coverage")
    if Dir.exist?(coverage_dir)
      FileUtils.rm_rf(coverage_dir)
      puts "✅ Coverage data cleaned"
    else
      puts "ℹ️  No coverage data to clean"
    end
  end
end
