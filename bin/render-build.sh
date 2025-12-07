#!/usr/bin/env bash
# exit on error
set -o errexit

echo "==> Installing dependencies..."
bundle install

echo "==> Preparing database..."
bundle exec rails db:prepare

echo "==> Running database migrations..."
bundle exec rails db:migrate

echo "==> Precompiling assets..."
if [ "$RAILS_ENV" = "production" ] || [ "$RAILS_ENV" = "staging" ]; then
  bundle exec rails assets:precompile
fi

echo "==> Build completed successfully!"
