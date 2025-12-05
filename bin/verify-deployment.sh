#!/usr/bin/env bash
# Deployment verification script

set -e

echo "==> Consultant Gateway Deployment Verification"
echo ""

# Check if URL is provided
if [ -z "$1" ]; then
  echo "Usage: ./bin/verify-deployment.sh <environment-url>"
  echo "Example: ./bin/verify-deployment.sh https://staging.uptimeconsulting.co.za"
  exit 1
fi

BASE_URL=$1

echo "Verifying deployment at: $BASE_URL"
echo ""

# Function to check endpoint
check_endpoint() {
  local endpoint=$1
  local expected_status=$2
  local description=$3
  
  echo -n "Checking $description... "
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" || echo "000")
  
  if [ "$response" = "$expected_status" ]; then
    echo "✓ OK (HTTP $response)"
    return 0
  else
    echo "✗ FAILED (HTTP $response, expected $expected_status)"
    return 1
  fi
}

# Track failures
FAILURES=0

# Check health endpoint
check_endpoint "/health" "200" "Health Check" || ((FAILURES++))

# Check API endpoints (should return 401 without auth)
check_endpoint "/api/v1/config" "200" "Config Endpoint" || ((FAILURES++))

# Check if assets are accessible (for production/staging)
if [[ "$BASE_URL" != *"dev"* ]]; then
  echo -n "Checking asset compilation... "
  if curl -s "$BASE_URL" | grep -q "stylesheet"; then
    echo "✓ OK"
  else
    echo "✗ FAILED"
    ((FAILURES++))
  fi
fi

echo ""
echo "==> Verification Summary"
echo ""

if [ $FAILURES -eq 0 ]; then
  echo "✓ All checks passed!"
  echo "Deployment appears to be successful."
  exit 0
else
  echo "✗ $FAILURES check(s) failed"
  echo "Please review the deployment logs and configuration."
  exit 1
fi
