#!/bin/bash

# Full Test Suite Execution Script
# This script runs all tests including unit tests, property-based tests, and integration checks

set -e  # Exit on error

echo "🧪 Starting Full Test Suite Execution..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
OVERALL_STATUS=0

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        OVERALL_STATUS=1
    fi
}

# 1. Run RSpec tests
echo ""
echo "📝 Step 1: Running RSpec Test Suite..."
echo "----------------------------------------"
if bundle exec rspec --format progress; then
    print_status 0 "RSpec tests passed"
else
    print_status 1 "RSpec tests failed"
fi

# 2. Run property-based tests specifically
echo ""
echo "🎲 Step 2: Running Property-Based Tests..."
echo "----------------------------------------"
if bundle exec rspec spec/**/*_property_spec.rb --format documentation; then
    print_status 0 "Property-based tests passed"
else
    print_status 1 "Property-based tests failed"
fi

# 3. Check code coverage
echo ""
echo "📊 Step 3: Checking Code Coverage..."
echo "----------------------------------------"
if COVERAGE=true bundle exec rspec --format progress > /dev/null 2>&1; then
    if bundle exec rake coverage:check; then
        print_status 0 "Code coverage meets threshold"
    else
        print_status 1 "Code coverage below threshold"
    fi
else
    print_status 1 "Failed to generate coverage report"
fi

# 4. Run integration tests
echo ""
echo "🔌 Step 4: Testing External Integrations..."
echo "----------------------------------------"
if bundle exec rake integration:test_all; then
    print_status 0 "Integration tests passed"
else
    print_status 1 "Integration tests failed"
fi

# 5. Run UAT health check
echo ""
echo "🏥 Step 5: UAT Environment Health Check..."
echo "----------------------------------------"
if bundle exec rake uat:health_check; then
    print_status 0 "UAT environment healthy"
else
    print_status 1 "UAT environment issues detected"
fi

# 6. Generate test report
echo ""
echo "📊 Step 6: Generating Test Report..."
echo "----------------------------------------"
if bundle exec rake uat:test_report; then
    print_status 0 "Test report generated"
else
    print_status 1 "Test report generation failed"
fi

# Summary
echo ""
echo "========================================"
echo "📋 Test Suite Execution Summary"
echo "========================================"

if [ $OVERALL_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review coverage report: open coverage/index.html"
    echo "  2. Proceed with UAT testing"
    echo "  3. Deploy to QA environment"
else
    echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check failed test output for details"
    echo "  2. Review logs in log/test.log"
    echo "  3. Ensure all environment variables are set"
fi

echo "========================================"

exit $OVERALL_STATUS
