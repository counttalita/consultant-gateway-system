# Database Schema Documentation

## Overview

The Consultant Gateway System uses PostgreSQL as its primary database. The schema is designed to support consultant management, authentication, audit logging, and caching of external data.

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│    Users    │────────<│  Consultants │>────────│ OnboardingSteps │
└──────┬──────┘         └──────┬───────┘         └─────────────────┘
       │                       │
       │                       │
       ├───────────────────────┼────────────────┐
       │                       │                │
       ▼                       ▼                ▼
┌─────────────┐         ┌──────────────┐  ┌────────────┐
│  OtpCodes   │         │  CvUploads   │  │  Sessions  │
└─────────────┘         └──────────────┘  └────────────┘
       
       │
       ▼
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│ AuditLogs   │         │   Projects   │────────<│ProjectAssignments│
└─────────────┘         └──────┬───────┘         └─────────────────┘
                               │
                               │
                        ┌──────────────┐
                        │   Tenders    │
                        └──────────────┘

┌──────────────────┐
│ AirtableCaches   │
└──────────────────┘
```

---

## Tables

### users

Stores user accounts for both consultants and internal staff.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY | Auto-incrementing ID |
| email | string | NOT NULL, UNIQUE | User email address |
| roles | text[] | NOT NULL, DEFAULT [] | Array of roles (consultant, admin, finance, user) |
| active | boolean | NOT NULL, DEFAULT true | Account active status |
| created_at | timestamp | NOT NULL | Record creation timestamp |
| updated_at | timestamp | NOT NULL | Record update timestamp |

**Indexes:**
- `index_users_on_email` (UNIQUE)
- `index_users_on_roles` (GIN)

**Validations:**
- Email must be valid format
- Roles must be from allowed list
- Consultants can only have 'consultant' role
- Internal staff can have multiple roles

---

### consultants

Stores consultant profile information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY | Auto-incrementing ID |
| user_id | bigint | NOT NULL, FOREIGN KEY | Reference to users table |
| bio | text | | Consultant biography |
| skills | jsonb | DEFAULT [] | Array of skills |
| banking_details | jsonb | ENCRYPTED | Encrypted banking information |
| availability_status | string | NOT NULL, DEFAULT 'available' | Availability status |
| utilization_percentage | decimal(5,2) | DEFAULT 0.0 | Current utilization (0-100) |
| onboarding_status | string | NOT NULL, DEFAULT 'pending' | Onboarding progress |
| airtable_id | string | | Airtable record ID |
| harvest_id | string | | Harvest user ID |
| xero_id | string | | Xero supplier ID |
| simplepay_id | string | | SimplePay employee ID |
| tax_number | string | | Tax identification number |
| vat_number | string | | VAT registration number |
| metadata | jsonb | DEFAULT {} | Additional metadata |
| manual_review_required | boolean | DEFAULT false | Flags for manual review |
| manual_review_notes | text | | Notes for manual review |
| created_at | timestamp | NOT NULL | Record creation timestamp |
| updated_at | timestamp | NOT NULL | Record update timestamp |

**Indexes:**
- `index_consultants_on_user_id` (UNIQUE)
- `index_consultants_on_airtable_id`
- `index_consultants_on_availability_status`
- `index_consultants_on_skills` (GIN)

**Enums:**
- availability_status: available, partially_available, unavailable
- onboarding_status: pending, in_progress, completed

**Encrypted Fields:**
- banking_details (Rails encrypted attributes)

---

### otp_codes

Stores one-time password codes for authentication.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY | Auto-incrementing ID |
| user_id | bigint | NOT NULL, FOREIGN KEY | Reference to users table |
| code | string | NOT NULL | 6-digit OTP code |
| expires_at | timestamp | NOT NULL | Expiration timestamp (10 minutes) |
| consumed_at | timestamp | | Timestamp when code was used |
| ip_address | inet | | IP address of requester |
| resend_message_id | string | | Resend email message ID |
| created_at | timestamp | NOT NULL | Record creation timestamp |
| updated_at | timestamp | NOT NULL | Record update timestamp |

**Indexes:**
- `index_otp_codes_on_user_id`
- `index_otp_codes_on_code`
- `index_otp_codes_on_expires_at`

**Validations:**
- Code must be 6 digits
- Expires_at must be in future
- Code is single-use (consumed_at set after use)

---

### sessions

Manages user sessions with 24-hour expiration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY | Auto-incrementing ID |
| user_id | bigint | NOT NULL, FOREIGN KEY | Reference to users table |
| token | string | NOT NULL, UNIQUE | Session token (JWT or UUID) |
| expires_at | timestamp | NOT NULL | Expiration timestamp (24 hours) |
| last_activity_at | timestamp | NOT NULL | Last activity timestamp |
| ip_address | inet | | IP address of session |
| user_agent | string | | Browser user agent |
| created_at | timestamp | NOT NULL | Record creation timestamp |
| updated_at | timestamp | NOT NULL | Record update timestamp |

**Indexes:**
- `index_sessions_on_user_id`
- `index_sessions_on_token` (UNIQUE)
- `index_sessions_on_expires_at`

**Cleanup:**
- Expired sessions removed by scheduled job

---

### audit_logs

Comprehensive audit trail for all major system actions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY | Auto-incrementing ID |
| user_id | bigint | FOREIGN KEY | Reference to users table (nullable for system actions) |
| action | string | NOT NULL | Action performed |
| resource_type | string | NOT NULL | Type of resource affected |
| resource_id | bigint | | ID of affected resource |
| change_data | jsonb | DEFAULT {} | Old/new values for changes |
| ip_address | inet | | IP address of action |
| metadata | jsonb | DEFAULT {} | Additional context |
| created_at | timestamp | NOT NULL | Record creation timestamp |

**Indexes:**
- `index_audit_logs_on_user_id`
- `index_audit_logs_on_action`
- `index_audit_logs_on_resource_type_and_resource_id`
- `index_audit_logs_on_created_at`
- `index_audit_logs_on_metadata` (GIN)

**Common Actions:**
- login, logout, otp_generated
- profile_update, availability_update
- invoice_created, bill_created
- project_created, tender_created

**Data Redaction:**
- Sensitive fields automatically redacted in change_data

---

### airtable_caches

Caches Airtable data in PostgreSQL for performance and resilience.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY | Auto-incrementing ID |
| table | string | NOT NULL | Airtable table name |
| record_id | string | NOT NULL | Airtable record ID |
| data | jsonb | NOT NULL | Cached record data |
| cached_at | timestamp | NOT NULL | Cache timestamp |
| created_at | timestamp | NOT NULL | Record creation timestamp |
| updated_at | timestamp | NOT NULL | Record update timestamp |

**Indexes:**
- `index_airtable_caches_on_table_and_record_id` (UNIQUE)
- `index_airtable_caches_on_cached_at`
- `index_airtable_caches_on_data` (GIN)

**Cache Strategy:**
- TTL: 5 minutes
- Fallback to stale cache if Airtable unavailable
- Invalidated on updates

---

### onboarding_steps

Tracks consultant onboarding progress.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY | Auto-incrementing ID |
| consultant_id | bigint | NOT NULL, FOREIGN KEY | Reference to consultants table |
| step_name | string | NOT NULL | Step identifier |
| status | string | NOT NULL, DEFAULT 'pending' | Step status |
| data | jsonb | DEFAULT {} | Step-specific data |
| completed_at | timestamp | | Completion timestamp |
| created_at | timestamp | NOT NULL | Record creation timestamp |
| updated_at | timestamp | NOT NULL | Record update timestamp |

**Indexes:**
- `index_onboarding_steps_on_consultant_id`
- `index_onboarding_steps_on_consultant_id_and_step_name` (UNIQUE)
- `index_onboarding_steps_on_status`

**Step Names:**
- personal_info
- banking
- skills
- contract
- welcome

**Enums:**
- status: pending, in_progress, completed

---

### projects

Stores project information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY | Auto-incrementing ID |
| name | string | NOT NULL | Project name |
| client_name | string | NOT NULL | Client name |
| status | string | NOT NULL, DEFAULT 'setup' | Project status |
| start_date | date | | Project start date |
| end_date | date | | Project end date |
| airtable_deal_id | string | UNIQUE | Airtable deal record ID |
| clickup_project_id | string | UNIQUE | ClickUp list ID |
| clickup_url | string | | ClickUp project URL |
| drive_folder_id | string | UNIQUE | Google Drive folder ID |
| drive_url | string | | Google Drive folder URL |
| created_at | timestamp | NOT NULL | Record creation timestamp |
| updated_at | timestamp | NOT NULL | Record update timestamp |

**Indexes:**
- `index_projects_on_airtable_deal_id` (UNIQUE)
- `index_projects_on_clickup_project_id` (UNIQUE)
- `index_projects_on_status`

**Enums:**
- status: setup, active, completed, archived

---

### project_assignments

Links consultants to projects.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY | Auto-incrementing ID |
| project_id | bigint | NOT NULL, FOREIGN KEY | Reference to projects table |
| consultant_id | bigint | NOT NULL, FOREIGN KEY | Reference to consultants table |
| role | string | | Consultant role on project |
| allocated_hours | integer | | Hours allocated to project |
| start_date | date | | Assignment start date |
| end_date | date | | Assignment end date |
| created_at | timestamp | NOT NULL | Record creation timestamp |
| updated_at | timestamp | NOT NULL | Record update timestamp |

**Indexes:**
- `index_project_assignments_on_project_id`
- `index_project_assignments_on_consultant_id`
- `index_project_assignments_on_project_id_and_consultant_id` (UNIQUE)

---

### tenders

Stores tender opportunities.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY | Auto-incrementing ID |
| reference_number | string | NOT NULL, UNIQUE | Tender reference number |
| title | string | NOT NULL | Tender title |
| source | string | NOT NULL | Source portal name |
| tender_value | decimal(15,2) | | Tender value in ZAR |
| submission_deadline | timestamp | | Submission deadline |
| required_capabilities | jsonb | DEFAULT [] | Required skills/capabilities |
| airtable_id | string | | Airtable CRM record ID |
| bid_decision | string | DEFAULT 'pending' | Bid/no-bid decision |
| bid_score | decimal(3,1) | | Evaluation score (0-10) |
| bid_rationale | text | | Decision rationale |
| created_at | timestamp | NOT NULL | Record creation timestamp |
| updated_at | timestamp | NOT NULL | Record update timestamp |

**Indexes:**
- `index_tenders_on_reference_number` (UNIQUE)
- `index_tenders_on_airtable_id`
- `index_tenders_on_bid_decision`
- `index_tenders_on_submission_deadline`
- `index_tenders_on_required_capabilities` (GIN)

**Enums:**
- bid_decision: pending, pursue, decline

---

### cv_uploads

Stores CV upload information (files stored in Active Storage).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY | Auto-incrementing ID |
| consultant_id | bigint | NOT NULL, FOREIGN KEY | Reference to consultants table |
| parsed_data | jsonb | DEFAULT {} | Extracted CV data |
| status | string | NOT NULL, DEFAULT 'pending' | Processing status |
| created_at | timestamp | NOT NULL | Record creation timestamp |
| updated_at | timestamp | NOT NULL | Record update timestamp |

**Indexes:**
- `index_cv_uploads_on_consultant_id`
- `index_cv_uploads_on_status`

**Enums:**
- status: pending, parsing, parsed, failed

**Active Storage:**
- Files stored using Active Storage
- Supports PDF and DOCX formats

---

## Database Migrations

### Running Migrations

```bash
# Run pending migrations
rails db:migrate

# Rollback last migration
rails db:rollback

# Check migration status
rails db:migrate:status
```

### Creating Migrations

```bash
# Generate new migration
rails generate migration AddFieldToTable field:type

# Example
rails generate migration AddSimplePayIdToConsultants simplepay_id:string
```

---

## Database Maintenance

### Backups

- **Frequency**: Daily automated backups
- **Retention**: 7 days for daily, 1 year for monthly
- **Location**: Render managed backups

### Cleanup Jobs

Scheduled jobs clean up old data:

```ruby
# Remove expired OTP codes (older than 24 hours)
OtpCode.where('expires_at < ?', 24.hours.ago).delete_all

# Remove expired sessions
Session.where('expires_at < ?', Time.current).delete_all

# Archive old audit logs (older than 1 year)
AuditLog.where('created_at < ?', 1.year.ago).archive!
```

### Performance Optimization

**Indexes:**
- All foreign keys indexed
- Frequently queried fields indexed
- JSONB fields use GIN indexes for efficient querying

**Query Optimization:**
- Use `includes` for eager loading associations
- Use `select` to limit returned columns
- Use database views for complex queries

---

## Data Integrity

### Foreign Key Constraints

All foreign keys enforce referential integrity:

```sql
ALTER TABLE consultants
  ADD CONSTRAINT fk_consultants_user_id
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;
```

### Check Constraints

Ensure data validity:

```sql
ALTER TABLE consultants
  ADD CONSTRAINT check_utilization_percentage
  CHECK (utilization_percentage >= 0 AND utilization_percentage <= 100);
```

### Unique Constraints

Prevent duplicate data:

```sql
ALTER TABLE users
  ADD CONSTRAINT unique_email
  UNIQUE (email);
```

---

## Security

### Encryption

**Encrypted Fields:**
- `consultants.banking_details` (Rails encrypted attributes)

**Encryption Configuration:**
```ruby
# config/application.rb
config.active_record.encryption.primary_key = ENV['ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY']
config.active_record.encryption.deterministic_key = ENV['ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY']
config.active_record.encryption.key_derivation_salt = ENV['ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT']
```

### Access Control

- Database credentials stored in Rails credentials
- Connection pooling limits concurrent connections
- Read-only replicas for reporting (future enhancement)

---

## Monitoring

### Database Metrics

Monitor via Render dashboard:
- Connection pool usage
- Query performance
- Disk usage
- Backup status

### Slow Query Log

Enable slow query logging:

```sql
ALTER DATABASE consultant_gateway_production
  SET log_min_duration_statement = 1000; -- Log queries > 1 second
```

---

## Schema Version

Current schema version: See `db/schema.rb`

To check current version:
```bash
rails db:version
```

---

## Future Enhancements

Potential schema improvements:

1. **Partitioning**: Partition audit_logs by date for better performance
2. **Read Replicas**: Add read replicas for reporting queries
3. **Full-Text Search**: Add PostgreSQL full-text search for consultants
4. **Materialized Views**: Cache complex analytics queries
5. **Time-Series Data**: Separate table for time-series metrics

---

## Support

For database questions:
- Check migration files in `db/migrate/`
- Review model definitions in `app/models/`
- Contact development team for schema changes
