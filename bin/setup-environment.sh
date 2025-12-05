#!/usr/bin/env bash
# Setup script for environment configuration

set -e

echo "==> Consultant Gateway Environment Setup"
echo ""

# Detect environment
if [ -z "$1" ]; then
  echo "Usage: ./bin/setup-environment.sh [development|staging|qa|production]"
  exit 1
fi

ENVIRONMENT=$1

echo "Setting up $ENVIRONMENT environment..."
echo ""

# Copy appropriate .env file
case $ENVIRONMENT in
  development)
    if [ -f .env.dev.example ]; then
      cp .env.dev.example .env
      echo "✓ Copied .env.dev.example to .env"
    else
      echo "✗ .env.dev.example not found"
      exit 1
    fi
    ;;
  staging)
    if [ -f .env.staging.example ]; then
      cp .env.staging.example .env
      echo "✓ Copied .env.staging.example to .env"
    else
      echo "✗ .env.staging.example not found"
      exit 1
    fi
    ;;
  qa)
    if [ -f .env.qa.example ]; then
      cp .env.qa.example .env
      echo "✓ Copied .env.qa.example to .env"
    else
      echo "✗ .env.qa.example not found"
      exit 1
    fi
    ;;
  production)
    if [ -f .env.production.example ]; then
      cp .env.production.example .env
      echo "✓ Copied .env.production.example to .env"
    else
      echo "✗ .env.production.example not found"
      exit 1
    fi
    ;;
  *)
    echo "Invalid environment: $ENVIRONMENT"
    echo "Valid options: development, staging, qa, production"
    exit 1
    ;;
esac

echo ""
echo "==> Next Steps:"
echo ""
echo "1. Edit .env and fill in the required values:"
echo "   - RAILS_MASTER_KEY"
echo "   - AIRTABLE_API_KEY"
echo "   - XERO_CLIENT_ID and XERO_CLIENT_SECRET"
echo "   - HARVEST_ACCESS_TOKEN"
echo "   - CLICKUP_API_TOKEN"
echo "   - GOOGLE_DRIVE_CREDENTIALS"
echo "   - RESEND_API_KEY"
echo "   - SIMPLEPAY_API_KEY"
echo ""
echo "2. Install dependencies:"
echo "   bundle install"
echo ""
echo "3. Setup database:"
echo "   bundle exec rails db:setup"
echo ""
echo "4. Start the application:"
echo "   bundle exec rails server"
echo ""
echo "For more information, see DEPLOYMENT.md"
