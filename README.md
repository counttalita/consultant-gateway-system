# Consultant Gateway System

The Consultant Gateway System is a Ruby on Rails API application that serves as the digital operating system for Up Time Consulting, a change management consulting agency. The system bridges existing tools (Airtable, ClickUp, Xero, Harvest) with a professional consultant-facing portal, enabling efficient back-office operations while providing 25+ external consultants with a secure, easy-to-use interface for profile management, onboarding, and administrative tasks.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Deployment](#deployment)
- [Architecture](#architecture)
- [Development Guidelines](#development-guidelines)
- [Contributing](#contributing)

## Features

- **OTP Authentication**: Passwordless login using email-based one-time passwords
- **Profile Management**: Consultant profile updates with Airtable synchronization
- **Digital Onboarding**: Step-by-step onboarding wizard with contract signing
- **Financial Automation**: Automated invoice and bill generation from Harvest timesheets
- **Project Automation**: Automatic project setup in ClickUp and Google Drive
- **Tender Management**: Automated tender capture with bid/no-bid decision support
- **Analytics Dashboards**: Finance and admin dashboards with real-time metrics
- **Audit Logging**: Comprehensive audit trail for compliance and debugging
- **Role-Based Access Control**: Flexible permissions for consultants and internal staff

## Technology Stack

- **Ruby**: 3.3.x
- **Rails**: 8.1.x
- **Database**: PostgreSQL 14+
- **Cache/Queue**: Redis 7+
- **Background Jobs**: Sidekiq
- **Testing**: RSpec with property-based testing (Rantly)
- **Deployment**: Render (native Ruby buildpack)
- **CI/CD**: GitHub Actions

## Prerequisites

Before you begin, ensure you have the following installed:

- Ruby 3.3.x (see `.ruby-version`)
- PostgreSQL 14 or higher
- Redis 7 or higher
- Bundler 2.x
- Git

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd consultant-gateway
```

2. Install dependencies:
```bash
bundle install
```

3. Copy the environment variables template:
```bash
cp .env.example .env
```

4. Update `.env` with your local configuration values

## Configuration

### Environment Variables

The application uses environment variables for configuration. Key variables include:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `RAILS_MASTER_KEY`: Rails credentials encryption key
- `AIRTABLE_API_KEY`: Airtable API authentication
- `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`: Xero OAuth credentials
- `HARVEST_ACCESS_TOKEN`: Harvest API authentication
- `CLICKUP_API_TOKEN`: ClickUp API authentication
- `RESEND_API_KEY`: Email service authentication

See `.env.example` for a complete list of required variables.

### Secrets Management

Sensitive credentials are stored in Rails encrypted credentials:

```bash
# Edit credentials
EDITOR="code --wait" rails credentials:edit

# Edit environment-specific credentials
EDITOR="code --wait" rails credentials:edit --environment production
```

## Database Setup

1. Create the databases:
```bash
rails db:create
```

2. Run migrations:
```bash
rails db:migrate
```

3. Seed the database (optional):
```bash
rails db:seed
```

## Running the Application

### Development Mode

Start the Rails server:
```bash
rails server
```

Start Sidekiq for background jobs:
```bash
bundle exec sidekiq -C config/sidekiq.yml
```

Or use Foreman to start all services:
```bash
foreman start
```

The API will be available at `http://localhost:3000`

### Production Mode

The application is deployed on Render using the configuration in `render.yaml`. Deployments are triggered automatically via GitHub Actions when code is pushed to `main`, `staging`, `qa`, or `dev` branches.

## Testing

### Running Tests

Run the full test suite:
```bash
bundle exec rspec
```

Run specific test files:
```bash
bundle exec rspec spec/models/user_spec.rb
```

Run tests with coverage:
```bash
COVERAGE=true bundle exec rspec
```

### Property-Based Testing

The application uses property-based testing with Rantly to verify correctness properties. Property tests are configured to run 100 iterations by default.

Example property test:
```ruby
RSpec.describe "OTP Generation" do
  it "generates valid 6-digit codes for any email" do
    property_of {
      Rantly { string(:alpha) + "@" + string(:alpha) + ".com" }
    }.check(100) { |email|
      code = AuthenticationService.generate_otp(email)
      expect(code).to match(/^\d{6}$/)
    }
  end
end
```

### Test Coverage

The project maintains a minimum of 80% code coverage for critical paths. Coverage reports are generated using SimpleCov.

## Deployment

### Render Deployment

The application is deployed to Render using native Ruby buildpacks (no Docker). The deployment process:

1. Push code to the appropriate branch (`main`, `staging`, `qa`, `dev`)
2. GitHub Actions runs CI tests
3. On success, triggers Render deployment via API
4. Render runs `bin/render-build.sh` to build the application
5. Database migrations run automatically
6. Web and worker services start

### Environment-Specific Deployments

- `main` → Production environment
- `staging` → Staging environment
- `qa` → QA environment
- `dev` → Development environment

### Manual Deployment

To manually trigger a deployment:
```bash
curl -X POST "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"clearCache": false}'
```

## Architecture

### System Design

The application follows an API-first architecture with clear separation of concerns:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Encapsulate business logic (e.g., `AuthenticationService`, `ProfileService`)
- **Adapters**: Isolate third-party integrations (e.g., `AirtableAdapter`, `XeroAdapter`)
- **Jobs**: Handle asynchronous processing (e.g., `MonthEndJob`, `ProjectSetupJob`)
- **Models**: Represent domain entities with ActiveRecord

### Key Design Patterns

- **Service Objects**: Complex operations encapsulated in single-responsibility services
- **Adapter Pattern**: Third-party dependencies isolated for easy testing and replacement
- **Background Jobs**: Long-running operations processed asynchronously with Sidekiq
- **Cache Layer**: PostgreSQL caches Airtable data for performance and resilience

### Database Schema

The application uses PostgreSQL with the following key tables:

- `users`: User accounts (consultants and staff)
- `consultants`: Consultant profiles with encrypted banking details
- `otp_codes`: One-time password codes for authentication
- `sessions`: User session management
- `audit_logs`: Comprehensive audit trail
- `airtable_caches`: Cached Airtable data
- `onboarding_steps`: Onboarding progress tracking
- `projects`: Project records
- `tenders`: Tender opportunities

## Development Guidelines

### Code Style

The project follows Rails best practices and uses RuboCop for style enforcement:

```bash
bundle exec rubocop
```

Auto-fix style issues:
```bash
bundle exec rubocop -a
```

### Testing Guidelines

- Write tests before implementation (TDD)
- Use property-based tests for universal properties
- Use unit tests for specific examples and edge cases
- Maintain 80% minimum code coverage
- Tag property tests with the design document property they validate

### Git Workflow

1. Create feature branches from `dev`: `git checkout -b feature/feature-name dev`
2. Make changes and commit with descriptive messages
3. Push to remote and create pull request to `dev`
4. After code review approval, merge to `dev`
5. Promote through environments: `dev` → `staging` → `qa` → `main`

### Commit Message Format

```
[Type] Brief description

Detailed explanation of changes

Requirements: X.Y, Z.A
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

- All sensitive data is encrypted at rest and in transit
- Banking details use Rails encrypted attributes
- API keys stored in Rails credentials
- Audit logging for all major actions
- Rate limiting on authentication endpoints

## Support

For issues, questions, or contributions, please contact the development team or open an issue in the repository.

## License

Proprietary - Up Time Consulting
