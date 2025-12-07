# Technical Architecture

## System Overview

The Consultant Gateway System is a Ruby on Rails API application that serves as the central integration hub for Up Time Consulting's operations. It connects external consultants with internal systems through a secure, scalable architecture.

## Architecture Principles

1. **API-First Design**: All functionality exposed through RESTful APIs
2. **Service-Oriented**: Business logic encapsulated in service objects
3. **Adapter Pattern**: Third-party integrations isolated behind adapters
4. **Asynchronous Processing**: Long-running operations handled by background jobs
5. **Cache-First Strategy**: PostgreSQL caches Airtable data for performance
6. **Comprehensive Auditing**: All major actions logged for compliance

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        External Users                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Consultants  │  │    Admins    │  │   Finance    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Rails API     │
                    │  (Port 3000)    │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐
    │Controllers│     │  Services  │     │   Jobs    │
    └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐
    │  Models   │     │  Adapters  │     │   Cache   │
    └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐
    │PostgreSQL │     │   Redis    │     │  Sidekiq  │
    └───────────┘     └───────────┘     └───────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐
    │ Airtable  │     │    Xero    │     │  Harvest  │
    └───────────┘     └───────────┘     └───────────┘
          │                  │                  │
    ┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐
    │  ClickUp  │     │Google Drive│     │  Resend   │
    └───────────┘     └───────────┘     └───────────┘
```

## Component Architecture

### Presentation Layer

**Controllers** (`app/controllers/`)
- Handle HTTP requests and responses
- Perform authentication and authorization
- Delegate business logic to services
- Return JSON responses

Key Controllers:
- `AuthController`: OTP authentication
- `ProfilesController`: Consultant profile management
- `OnboardingController`: Onboarding workflow
- `AdminDashboardController`: Admin analytics
- `FinanceDashboardController`: Finance analytics

### Application Layer

**Services** (`app/services/`)
- Encapsulate business logic
- Coordinate between models and adapters
- Handle complex workflows
- Maintain single responsibility

Key Services:
- `AuthenticationService`: OTP generation and validation
- `ProfileService`: Profile updates and Airtable sync
- `OnboardingService`: Onboarding workflow management
- `FinancialService`: Financial automation orchestration
- `ProjectService`: Project setup coordination
- `TenderService`: Tender management and evaluation

### Integration Layer

**Adapters** (`lib/adapters/`)
- Isolate third-party dependencies
- Provide consistent interface for external services
- Handle API authentication and error handling
- Implement retry logic with exponential backoff

Key Adapters:
- `AirtableAdapter`: Airtable Web API integration
- `XeroAdapter`: Xero Accounting API with OAuth 2.0
- `HarvestAdapter`: Harvest API v2 integration
- `ClickUpAdapter`: ClickUp API v2 integration
- `GoogleDriveAdapter`: Google Drive API integration
- `ResendAdapter`: Email delivery service
- `SimplePayAdapter`: Payroll export generation

### Data Layer

**Models** (`app/models/`)
- Represent domain entities
- Define associations and validations
- Implement business rules
- Use ActiveRecord for persistence

Key Models:
- `User`: User accounts with role management
- `Consultant`: Consultant profiles with encrypted banking
- `OtpCode`: One-time password codes
- `Session`: User session management
- `AuditLog`: Comprehensive audit trail
- `Project`: Project records
- `Tender`: Tender opportunities

**Cache Manager** (`app/services/cache_manager.rb`)
- Manages PostgreSQL cache for Airtable data
- Implements cache-first read strategy
- Handles cache invalidation
- Provides fallback when Airtable unavailable

### Background Processing

**Jobs** (`app/jobs/`)
- Handle asynchronous operations
- Process webhooks
- Perform scheduled tasks
- Implement retry logic

Key Jobs:
- `MonthEndJob`: Monthly financial processing
- `ProjectSetupJob`: Automated project creation
- `ProfileSyncJob`: Airtable profile synchronization
- `EmailJob`: Email delivery
- `AirtableSyncJob`: Batch Airtable synchronization

## Data Flow Patterns

### Authentication Flow

```
1. User enters email
2. AuthenticationService generates 6-digit OTP
3. OTP stored in database with 10-minute expiration
4. ResendAdapter sends OTP via email
5. User enters OTP code
6. AuthenticationService validates OTP
7. Session created with 24-hour expiration
8. Session token returned to client
9. Audit log entry created
```

### Profile Update Flow

```
1. Consultant submits profile update
2. ProfileService validates input
3. Data saved to PostgreSQL
4. ProfileSyncJob queued for background processing
5. Job retrieves consultant data
6. AirtableAdapter updates talent pool record
7. Retry logic handles transient failures (3 attempts)
8. Audit log entry created with old/new values
9. Success response returned to client
```

### Month-End Financial Flow

```
1. MonthEndJob triggered (scheduled or manual)
2. FinancialService orchestrates process
3. HarvestAdapter retrieves approved hours
4. Hours grouped by project for client invoices
5. XeroAdapter creates draft invoices
6. XeroAdapter creates draft consultant bills
7. Batch processing continues on individual failures
8. Summary notification sent to finance team
9. Audit logs created for all operations
```

### Project Setup Flow

```
1. Airtable deal marked as "Won"
2. Webhook received by ProjectService
3. ProjectSetupJob queued
4. ClickUpAdapter creates project with template
5. GoogleDriveAdapter creates folder structure
6. AirtableAdapter updates deal with links
7. Audit log entry created
8. Admin notification sent
```

## Security Architecture

### Authentication & Authorization

- **OTP Authentication**: Passwordless login with email-based codes
- **Session Management**: 24-hour sessions with secure tokens
- **Role-Based Access Control**: Flexible permission system
- **Rate Limiting**: Prevents brute force attacks

### Data Protection

- **Encryption at Rest**: Banking details encrypted with Rails encryption
- **Encryption in Transit**: TLS 1.3 for all external communication
- **Sensitive Data Redaction**: PII removed from logs
- **Audit Trail**: Comprehensive logging for compliance

### API Security

- **API Key Authentication**: For external integrations
- **OAuth 2.0**: For Xero integration
- **Webhook Signature Validation**: Verifies webhook authenticity
- **CORS Configuration**: Restricts cross-origin requests

## Scalability Considerations

### Horizontal Scaling

- **Stateless API**: No server-side session storage
- **Background Jobs**: Sidekiq workers scale independently
- **Database Connection Pooling**: Efficient resource utilization
- **Redis for Caching**: Distributed cache layer

### Performance Optimization

- **PostgreSQL Caching**: Reduces Airtable API calls
- **Database Indexes**: Optimized query performance
- **Eager Loading**: Prevents N+1 queries
- **Background Processing**: Long operations don't block requests

### Capacity Planning

- **Current**: 25 consultants, 5 internal staff
- **Growth**: Supports up to 100 consultants without changes
- **Monitoring**: Track usage metrics for proactive scaling

## Deployment Architecture

### Render Platform

- **Web Service**: Rails API (Puma web server)
- **Worker Service**: Sidekiq background jobs
- **PostgreSQL**: Managed database with daily backups
- **Redis**: Managed cache and queue storage

### Environment Strategy

- **Development**: Local development with test data
- **Staging**: Pre-production testing environment
- **QA**: User acceptance testing environment
- **Production**: Live system serving real users

### CI/CD Pipeline

```
1. Developer pushes code to branch
2. GitHub Actions triggers CI workflow
3. Security scans (Brakeman, Bundler Audit)
4. Code linting (RuboCop)
5. Test suite execution (RSpec)
6. On success, triggers Render deployment
7. Render builds application
8. Database migrations run automatically
9. Services restart with new code
10. Health checks verify deployment
```

## Monitoring & Observability

### Application Monitoring

- **Render Logs**: Centralized log aggregation
- **Error Tracking**: Detailed stack traces
- **Performance Metrics**: Response times per endpoint
- **Background Job Monitoring**: Sidekiq dashboard

### Integration Health

- **Periodic Health Checks**: Verify external service connectivity
- **Circuit Breaker Pattern**: Prevent cascading failures
- **API Rate Limit Tracking**: Monitor usage against limits
- **Fallback Strategies**: Serve cached data when services unavailable

### Alerting

- **Critical Errors**: Immediate email notifications
- **Service Degradation**: 15-minute alert window
- **Performance Issues**: Daily summary reports
- **Integration Failures**: Admin dashboard alerts

## Disaster Recovery

### Backup Strategy

- **Database Backups**: Daily automated backups (7-day retention)
- **Monthly Archives**: Long-term backup storage (1-year retention)
- **Airtable as Source of Truth**: Business data recoverable from Airtable
- **Redis Persistence**: Background job queue backed up

### Recovery Procedures

- **Database Restore**: < 1 hour recovery time
- **Full System Recovery**: < 4 hours recovery time
- **Data Loss Tolerance**: < 24 hours (last backup)
- **Cache Rebuild**: Automatic from Airtable

## Technology Decisions

### Why Rails?

- Mature ecosystem with extensive libraries
- Convention over configuration reduces boilerplate
- ActiveRecord provides powerful ORM
- Strong security defaults
- Excellent testing support

### Why PostgreSQL?

- ACID compliance for data integrity
- JSONB support for flexible data structures
- Full-text search capabilities
- Robust replication and backup tools
- Excellent performance at scale

### Why Sidekiq?

- Efficient background job processing
- Redis-backed for reliability
- Built-in retry logic
- Web UI for monitoring
- Scales horizontally

### Why Render?

- Native Ruby buildpack (no Docker complexity)
- Managed PostgreSQL and Redis
- Automatic SSL certificates
- Branch-based deployments
- Cost-effective for startup scale

## Future Considerations

### Potential Enhancements

- **GraphQL API**: More flexible data fetching
- **WebSocket Support**: Real-time updates
- **Mobile Apps**: Native iOS/Android applications
- **Advanced Analytics**: Machine learning for insights
- **Multi-Tenancy**: Support multiple consulting agencies

### Scaling Strategies

- **Read Replicas**: Distribute read load
- **CDN Integration**: Cache static assets
- **Microservices**: Split into smaller services if needed
- **Event Sourcing**: Audit trail as event stream
- **CQRS**: Separate read and write models

## Conclusion

The Consultant Gateway System architecture prioritizes:
- **Maintainability**: Clean separation of concerns
- **Testability**: Comprehensive test coverage
- **Reliability**: Robust error handling and retry logic
- **Security**: Multiple layers of protection
- **Scalability**: Designed for growth
