# API Integrations Documentation

## Overview

The Consultant Gateway System integrates with multiple external services to automate workflows and synchronize data. This document provides comprehensive documentation for all API integrations.

## Table of Contents

1. [Airtable Integration](#airtable-integration)
2. [Xero Integration](#xero-integration)
3. [Harvest Integration](#harvest-integration)
4. [ClickUp Integration](#clickup-integration)
5. [Google Drive Integration](#google-drive-integration)
6. [Resend Integration](#resend-integration)
7. [SimplePay Integration](#simplepay-integration)
8. [Zapier Integration](#zapier-integration)
9. [Webhook Endpoints](#webhook-endpoints)

---

## Airtable Integration

### Purpose
Airtable serves as the source of truth for CRM data, talent pool information, and project records. The system synchronizes consultant profiles, project data, and tender opportunities with Airtable.

### API Version
Airtable Web API (Latest stable version)

### Authentication
```ruby
# API Key authentication
headers = {
  'Authorization' => "Bearer #{ENV['AIRTABLE_API_KEY']}",
  'Content-Type' => 'application/json'
}
```

### Configuration
```bash
# Environment Variables
AIRTABLE_API_KEY=your_api_key_here
AIRTABLE_BASE_ID=your_base_id_here
```

### Key Operations

#### Get Record
```ruby
GET https://api.airtable.com/v0/{base_id}/{table_name}/{record_id}

# Example
AirtableAdapter.get_record('Consultants', 'rec123456')
```

#### Create Record
```ruby
POST https://api.airtable.com/v0/{base_id}/{table_name}

# Request Body
{
  "fields": {
    "Name": "John Doe",
    "Email": "john@example.com",
    "Status": "Active"
  }
}

# Example
AirtableAdapter.create_record('Consultants', fields)
```

#### Update Record
```ruby
PATCH https://api.airtable.com/v0/{base_id}/{table_name}/{record_id}

# Request Body
{
  "fields": {
    "Status": "Active",
    "Skills": ["Change Management", "Project Management"]
  }
}

# Example
AirtableAdapter.update_record('Consultants', 'rec123456', fields)
```

#### Delete Record
```ruby
DELETE https://api.airtable.com/v0/{base_id}/{table_name}/{record_id}

# Example
AirtableAdapter.delete_record('Consultants', 'rec123456')
```

### Caching Strategy

The system implements a PostgreSQL cache layer for Airtable data:

```ruby
# Cache-first read
cached_data = CacheManager.fetch('Consultants', 'rec123456')

# Cache TTL: 5 minutes
# Fallback: Serve stale cache if Airtable unavailable
```

### Error Handling

```ruby
# Retry logic with exponential backoff
MAX_RETRIES = 3
BASE_DELAY = 1.second

begin
  response = make_api_call
rescue AirtableAdapter::ApiError => e
  retry_with_backoff if attempts < MAX_RETRIES
end
```

### Rate Limits
- 5 requests per second per base
- Monitor via response headers: `X-RateLimit-Remaining`

---

## Xero Integration

### Purpose
Xero handles accounting operations including supplier management, invoice creation, and bill generation for consultant payments.

### API Version
Xero Accounting API (Latest version)

### Authentication
OAuth 2.0 with refresh tokens

```ruby
# OAuth 2.0 Configuration
client_id = ENV['XERO_CLIENT_ID']
client_secret = ENV['XERO_CLIENT_SECRET']
redirect_uri = ENV['XERO_REDIRECT_URI']

# Token refresh
XeroAdapter.refresh_access_token
```

### Configuration
```bash
# Environment Variables
XERO_CLIENT_ID=your_client_id
XERO_CLIENT_SECRET=your_client_secret
XERO_TENANT_ID=your_tenant_id
XERO_REDIRECT_URI=https://your-app.com/oauth/callback
```

### Key Operations

#### Create Supplier
```ruby
POST https://api.xero.com/api.xro/2.0/Contacts

# Request Body
{
  "Name": "John Doe",
  "EmailAddress": "john@example.com",
  "IsSupplier": true,
  "BankAccountDetails": "encrypted_data",
  "TaxNumber": "1234567890"
}

# Example
XeroAdapter.create_supplier(consultant)
```

#### Create Draft Invoice
```ruby
POST https://api.xero.com/api.xro/2.0/Invoices

# Request Body
{
  "Type": "ACCREC",
  "Contact": { "ContactID": "contact_id" },
  "LineItems": [
    {
      "Description": "Consulting Services",
      "Quantity": 40,
      "UnitAmount": 1250.00,
      "AccountCode": "200"
    }
  ],
  "Status": "DRAFT"
}

# Example
XeroAdapter.create_draft_invoice(invoice_data)
```

#### Create Draft Bill
```ruby
POST https://api.xero.com/api.xro/2.0/Invoices

# Request Body
{
  "Type": "ACCPAY",
  "Contact": { "ContactID": "supplier_id" },
  "LineItems": [
    {
      "Description": "Consultant Payment",
      "Quantity": 40,
      "UnitAmount": 1000.00,
      "AccountCode": "400"
    }
  ],
  "Status": "DRAFT"
}

# Example
XeroAdapter.create_draft_bill(bill_data)
```

### Security

- Banking data encrypted during transmission (TLS 1.3)
- Sensitive fields encrypted at rest
- OAuth tokens stored securely in Rails credentials

### Error Handling

```ruby
# Handle Xero-specific errors
rescue XeroAdapter::AuthenticationError => e
  # Refresh OAuth token
  XeroAdapter.refresh_access_token
  retry
rescue XeroAdapter::ValidationError => e
  # Log validation errors
  ErrorService.log_error(e, severity: :high)
end
```

---

## Harvest Integration

### Purpose
Harvest tracks consultant time and provides approved hours data for financial processing.

### API Version
Harvest API v2

### Authentication
Personal Access Token

```ruby
# Headers
headers = {
  'Authorization' => "Bearer #{ENV['HARVEST_ACCESS_TOKEN']}",
  'Harvest-Account-ID' => ENV['HARVEST_ACCOUNT_ID'],
  'Content-Type' => 'application/json'
}
```

### Configuration
```bash
# Environment Variables
HARVEST_ACCESS_TOKEN=your_access_token
HARVEST_ACCOUNT_ID=your_account_id
```

### Key Operations

#### Create User
```ruby
POST https://api.harvestapp.com/v2/users

# Request Body
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "is_contractor": true
}

# Example
HarvestAdapter.create_user(consultant)
```

#### Get Approved Hours
```ruby
GET https://api.harvestapp.com/v2/time_entries?from=2025-01-01&to=2025-01-31&is_billed=false

# Query Parameters
- from: Start date (YYYY-MM-DD)
- to: End date (YYYY-MM-DD)
- is_billed: Filter by billing status
- user_id: Filter by user

# Example
HarvestAdapter.get_approved_hours(month, year)
```

#### Get Time Entry Details
```ruby
GET https://api.harvestapp.com/v2/time_entries/{time_entry_id}

# Example
HarvestAdapter.get_time_entry(entry_id)
```

### Pagination

```ruby
# Harvest uses cursor-based pagination
response = HarvestAdapter.get_approved_hours(month, year)
next_page = response['links']['next']

# Fetch all pages
all_entries = []
while next_page
  page_data = HarvestAdapter.fetch_page(next_page)
  all_entries.concat(page_data['time_entries'])
  next_page = page_data['links']['next']
end
```

### Rate Limits
- 100 requests per 15 seconds
- Monitor via response header: `X-RateLimit-Remaining`

---

## ClickUp Integration

### Purpose
ClickUp manages project tasks and workflows. The system automatically creates projects with templates when deals are won.

### API Version
ClickUp API v2

### Authentication
API Token

```ruby
# Headers
headers = {
  'Authorization' => ENV['CLICKUP_API_TOKEN'],
  'Content-Type' => 'application/json'
}
```

### Configuration
```bash
# Environment Variables
CLICKUP_API_TOKEN=your_api_token
CLICKUP_TEAM_ID=your_team_id
CLICKUP_SPACE_ID=your_space_id
```

### Key Operations

#### Create List (Project)
```ruby
POST https://api.clickup.com/api/v2/folder/{folder_id}/list

# Request Body
{
  "name": "Acme Corp - Digital Transformation",
  "content": "Project for Acme Corporation",
  "status": "active"
}

# Example
ClickUpAdapter.create_project(project_name, client_name)
```

#### Apply Template
```ruby
POST https://api.clickup.com/api/v2/list/{list_id}/template/{template_id}

# Example
ClickUpAdapter.apply_template(list_id, 'change-management')
```

#### Create Task
```ruby
POST https://api.clickup.com/api/v2/list/{list_id}/task

# Request Body
{
  "name": "Bid Decision: Review Tender",
  "description": "Evaluate tender opportunity",
  "assignees": [user_id],
  "due_date": 1735689600000,
  "priority": 2
}

# Example
ClickUpAdapter.create_task(list_id, task_data)
```

### Error Handling

```ruby
# Handle ClickUp-specific errors
rescue ClickUpAdapter::NotFoundError => e
  # Template or list not found
  ErrorService.log_error(e, severity: :high)
rescue ClickUpAdapter::RateLimitError => e
  # Wait and retry
  sleep(60)
  retry
end
```

---

## Google Drive Integration

### Purpose
Google Drive stores project documentation in organized folder structures.

### API Version
Google Drive API v3

### Authentication
Service Account with JSON credentials

```ruby
# Service Account Configuration
credentials = JSON.parse(ENV['GOOGLE_DRIVE_CREDENTIALS'])
authorizer = Google::Auth::ServiceAccountCredentials.make_creds(
  json_key_io: StringIO.new(credentials.to_json),
  scope: Google::Apis::DriveV3::AUTH_DRIVE
)
```

### Configuration
```bash
# Environment Variables
GOOGLE_DRIVE_CREDENTIALS='{"type":"service_account","project_id":"...","private_key":"..."}'
GOOGLE_DRIVE_PARENT_FOLDER_ID=your_parent_folder_id
```

### Key Operations

#### Create Folder
```ruby
POST https://www.googleapis.com/drive/v3/files

# Request Body
{
  "name": "Acme Corp - Digital Transformation",
  "mimeType": "application/vnd.google-apps.folder",
  "parents": ["parent_folder_id"]
}

# Example
GoogleDriveAdapter.create_folder(folder_name, parent_id)
```

#### Create Folder Structure
```ruby
# Creates nested folder structure
# - Project Root
#   - Documents
#   - Deliverables
#   - Internal

GoogleDriveAdapter.create_folder_structure(project_name, client_name)
```

#### Set Permissions
```ruby
POST https://www.googleapis.com/drive/v3/files/{file_id}/permissions

# Request Body
{
  "type": "user",
  "role": "writer",
  "emailAddress": "user@example.com"
}

# Example
GoogleDriveAdapter.share_folder(folder_id, email, role)
```

### Error Handling

```ruby
# Handle Google Drive errors
rescue Google::Apis::AuthorizationError => e
  # Refresh service account credentials
  GoogleDriveAdapter.refresh_credentials
  retry
rescue Google::Apis::ClientError => e
  # Log and notify
  ErrorService.log_error(e, severity: :high)
end
```

---

## Resend Integration

### Purpose
Resend handles all email delivery including OTP codes, notifications, and welcome emails.

### API Version
Resend API (Latest)

### Authentication
API Key

```ruby
# Headers
headers = {
  'Authorization' => "Bearer #{ENV['RESEND_API_KEY']}",
  'Content-Type' => 'application/json'
}
```

### Configuration
```bash
# Environment Variables
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@uptimeconsulting.co.za
```

### Key Operations

#### Send Email
```ruby
POST https://api.resend.com/emails

# Request Body
{
  "from": "Up Time Consulting <noreply@uptimeconsulting.co.za>",
  "to": ["user@example.com"],
  "subject": "Your OTP Code",
  "html": "<p>Your code is: <strong>123456</strong></p>",
  "text": "Your code is: 123456"
}

# Example
ResendAdapter.send_email(
  to: email,
  template: 'otp_code',
  variables: { code: '123456' }
)
```

#### Email Templates

**OTP Template**
```ruby
ResendAdapter.send_email(
  to: email,
  template: 'otp_code',
  variables: {
    code: otp_code,
    expires_in: '10 minutes'
  }
)
```

**Welcome Template**
```ruby
ResendAdapter.send_email(
  to: email,
  template: 'welcome',
  variables: {
    name: consultant_name,
    portal_url: 'https://portal.uptimeconsulting.co.za'
  }
)
```

**Admin Notification Template**
```ruby
ResendAdapter.send_email(
  to: admin_emails,
  template: 'admin_notification',
  variables: {
    priority: 'high',
    message: error_message,
    details: error_details
  }
)
```

### Retry Logic

```ruby
# Exponential backoff for failed emails
MAX_RETRIES = 3
BASE_DELAY = 1.second

attempts = 0
begin
  ResendAdapter.send_email(params)
rescue ResendAdapter::EmailDeliveryError => e
  attempts += 1
  if attempts < MAX_RETRIES
    delay = BASE_DELAY * (2 ** attempts)
    sleep(delay)
    retry
  else
    ErrorService.log_error(e, severity: :critical)
  end
end
```

### Rate Limits
- Varies by plan
- Monitor via response headers

---

## SimplePay Integration

### Purpose
SimplePay handles payroll processing for consultant payments. The system generates CSV exports in SimplePay's required format.

### Integration Type
File-based export (CSV)

### Configuration
```bash
# Environment Variables
SIMPLEPAY_API_KEY=your_api_key (if using API)
```

### CSV Export Format

```csv
Employee ID,Payment Amount,Tax Amount,Payment Date,Description
EMP001,50000.00,7500.00,2025-01-31,January Consulting Fees
EMP002,45000.00,6750.00,2025-01-31,January Consulting Fees
```

### Key Operations

#### Generate SimplePay Export
```ruby
# Extract payment data from Xero bills
bills = XeroAdapter.get_approved_bills(month, year)

# Generate CSV
csv_data = SimplePayAdapter.generate_csv(bills)

# Validate required fields
SimplePayAdapter.validate_export(csv_data)

# Update Xero bill status
bills.each do |bill|
  XeroAdapter.update_bill_status(bill.id, 'Queued for Payment')
end
```

#### Field Validation
```ruby
# Required fields
- employee_id (SimplePay ID from consultant record)
- payment_amount (from Xero bill)
- tax_amount (calculated from bill)
- payment_date (end of month)
- description (standardized format)

# Validation errors
SimplePayAdapter::ValidationError if any field missing or invalid
```

### Error Handling

```ruby
# Handle validation errors
rescue SimplePayAdapter::ValidationError => e
  # Provide detailed error messages
  errors = e.details
  # Example: "Consultant John Doe missing SimplePay ID"
  ErrorService.log_error(e, severity: :high, details: errors)
end
```

---

## Zapier Integration

### Purpose
Zapier orchestrates cross-system automations and provides flexibility for custom workflows without code changes.

### Integration Type
Webhook-based triggers and REST API actions

### Authentication
API Key authentication for REST endpoints

```ruby
# Headers
headers = {
  'Authorization' => "Bearer #{ENV['ZAPIER_API_KEY']}",
  'Content-Type' => 'application/json'
}
```

### Configuration
```bash
# Environment Variables
ZAPIER_API_KEY=your_api_key
```

### Webhook Triggers

#### Consultant Profile Updated
```ruby
POST https://hooks.zapier.com/hooks/catch/{zap_id}/

# Payload
{
  "event": "consultant.profile_updated",
  "consultant_id": 123,
  "consultant_email": "john@example.com",
  "changes": {
    "bio": "Updated bio text",
    "skills": ["Change Management", "Project Management"]
  },
  "timestamp": "2025-12-05T13:00:00Z"
}
```

#### Project Created
```ruby
POST https://hooks.zapier.com/hooks/catch/{zap_id}/

# Payload
{
  "event": "project.created",
  "project_id": 456,
  "project_name": "Digital Transformation",
  "client_name": "Acme Corp",
  "clickup_url": "https://app.clickup.com/...",
  "drive_url": "https://drive.google.com/...",
  "timestamp": "2025-12-05T13:00:00Z"
}
```

#### Tender Received
```ruby
POST https://hooks.zapier.com/hooks/catch/{zap_id}/

# Payload
{
  "event": "tender.received",
  "tender_id": 789,
  "reference_number": "TENDER-2025-001",
  "title": "Government Change Management Services",
  "value": 2000000.00,
  "deadline": "2025-02-28",
  "bid_decision": "pursue",
  "timestamp": "2025-12-05T13:00:00Z"
}
```

### REST API Actions

#### Get Consultant Profile
```ruby
GET /api/v1/zapier/consultants/:id

# Response
{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "skills": ["Change Management", "Project Management"],
  "availability_status": "available",
  "utilization_percentage": 50.0
}
```

#### Update Consultant Availability
```ruby
PATCH /api/v1/zapier/consultants/:id/availability

# Request Body
{
  "availability_status": "partially_available",
  "notes": "Available 50% capacity"
}

# Response
{
  "success": true,
  "consultant_id": 123,
  "availability_status": "partially_available"
}
```

#### Create Tender
```ruby
POST /api/v1/zapier/tenders

# Request Body
{
  "reference_number": "TENDER-2025-002",
  "title": "IT Infrastructure Upgrade",
  "source": "Provincial Government Portal",
  "tender_value": 500000.00,
  "submission_deadline": "2025-02-15",
  "required_capabilities": ["IT Infrastructure", "Network Engineering"]
}

# Response
{
  "success": true,
  "tender_id": 790,
  "bid_decision": "decline",
  "bid_score": 3.2
}
```

### Workflow Logging

All Zapier interactions are logged for monitoring and debugging:

```ruby
AuditLog.create!(
  action: 'zapier_webhook_received',
  resource_type: 'Zapier',
  metadata: {
    event: 'consultant.profile_updated',
    consultant_id: 123,
    zap_id: 'abc123'
  }
)
```

### Error Handling

```ruby
# Handle Zapier webhook failures
rescue ZapierAdapter::WebhookError => e
  # Queue for retry
  ZapierRetryJob.perform_later(webhook_data)
  # Notify admin after 3 failures
  ErrorService.notify_admin(e) if retry_count >= 3
end
```

### Data Validation

All incoming Zapier data is validated before processing:

```ruby
# Validate payload structure
ZapierAdapter.validate_payload(params)

# Required fields check
raise ValidationError unless required_fields_present?

# Data type validation
raise ValidationError unless data_types_valid?
```

---

## Webhook Endpoints

### Tender Portal Webhooks

```ruby
POST /webhooks/tenders

# Headers
X-Webhook-Signature: sha256_signature

# Payload
{
  "reference_number": "TENDER-2025-001",
  "title": "Government Change Management Services",
  "source": "National Treasury Portal",
  "tender_value": 2000000.00,
  "submission_deadline": "2025-02-28T23:59:59Z",
  "required_capabilities": ["Change Management", "Training", "Communication"],
  "description": "Full tender description...",
  "contact_email": "procurement@gov.za"
}

# Response
{
  "success": true,
  "tender_id": 789,
  "bid_decision": "pursue",
  "bid_score": 8.5
}
```

### Airtable Webhooks

```ruby
POST /webhooks/deals

# Headers
X-Airtable-Signature: signature

# Payload
{
  "event": "deal.won",
  "deal_id": "rec123456",
  "client_name": "Acme Corporation",
  "project_title": "Digital Transformation Initiative",
  "start_date": "2025-01-01",
  "end_date": "2025-06-30",
  "budget": 500000.00
}

# Response
{
  "success": true,
  "project_id": 456,
  "clickup_url": "https://app.clickup.com/...",
  "drive_url": "https://drive.google.com/..."
}
```

### Webhook Security

All webhooks validate signatures to ensure authenticity:

```ruby
# Signature validation
def validate_webhook_signature!(request)
  signature = request.headers['X-Webhook-Signature']
  payload = request.body.read
  
  expected_signature = OpenSSL::HMAC.hexdigest(
    'SHA256',
    ENV['WEBHOOK_SECRET'],
    payload
  )
  
  unless Rack::Utils.secure_compare(signature, expected_signature)
    raise UnauthorizedError, 'Invalid webhook signature'
  end
end
```

---

## Error Handling Best Practices

### Retry Logic

All integrations implement retry logic with exponential backoff:

```ruby
def execute_with_retry(max_retries: 3, base_delay: 1.second)
  attempts = 0
  begin
    yield
  rescue RetryableError => e
    attempts += 1
    if attempts < max_retries
      delay = base_delay * (2 ** attempts)
      sleep(delay)
      retry
    else
      handle_final_failure(e)
    end
  end
end
```

### Circuit Breaker

Prevent cascading failures with circuit breaker pattern:

```ruby
class CircuitBreaker
  FAILURE_THRESHOLD = 5
  TIMEOUT_DURATION = 60.seconds
  
  def call_service
    if circuit_open?
      raise CircuitOpenError
    end
    
    begin
      result = yield
      record_success
      result
    rescue => e
      record_failure
      raise
    end
  end
end
```

### Error Notification

Critical errors trigger immediate notifications:

```ruby
# Critical: Authentication, Financial, Data Integrity
ErrorService.notify_admin(
  error: e,
  severity: :critical,
  integration: 'Xero',
  context: { operation: 'create_invoice', data: invoice_data }
)
```

---

## Rate Limiting

### Per-Integration Limits

| Integration | Rate Limit | Window | Action on Limit |
|------------|------------|--------|-----------------|
| Airtable | 5 req/sec | Per base | Wait and retry |
| Xero | 60 req/min | Per tenant | Queue requests |
| Harvest | 100 req/15s | Per account | Exponential backoff |
| ClickUp | 100 req/min | Per token | Wait and retry |
| Google Drive | 1000 req/100s | Per user | Queue requests |
| Resend | Varies | Per plan | Exponential backoff |

### Rate Limit Handling

```ruby
def handle_rate_limit(response)
  if response.code == 429
    retry_after = response.headers['Retry-After']&.to_i || 60
    sleep(retry_after)
    retry
  end
end
```

---

## Monitoring & Debugging

### Integration Health Dashboard

Monitor all integrations from admin dashboard:

```ruby
GET /api/v1/admin/integration_health

# Response
{
  "airtable": {
    "status": "healthy",
    "last_sync": "2025-12-05T13:00:00Z",
    "error_count_24h": 0
  },
  "xero": {
    "status": "healthy",
    "last_sync": "2025-12-05T12:45:00Z",
    "error_count_24h": 2
  },
  ...
}
```

### Audit Logs

All integration calls are logged:

```ruby
AuditLog.create!(
  action: 'api_call',
  resource_type: 'Xero',
  metadata: {
    endpoint: '/api.xro/2.0/Invoices',
    method: 'POST',
    response_code: 200,
    duration_ms: 245,
    correlation_id: 'abc-123-def'
  }
)
```

---

## Testing Integrations

### Sandbox Environments

Use test/sandbox instances for all integrations:

```bash
# Test Environment Variables
AIRTABLE_BASE_ID=test_base_id
XERO_TENANT_ID=demo_company_id
HARVEST_ACCOUNT_ID=test_account_id
```

### Integration Tests

```ruby
# spec/lib/adapters/xero_adapter_spec.rb
RSpec.describe XeroAdapter do
  describe '.create_supplier' do
    it 'creates supplier in Xero' do
      VCR.use_cassette('xero_create_supplier') do
        result = XeroAdapter.create_supplier(consultant)
        expect(result.contact_id).to be_present
      end
    end
  end
end
```

---

## Support & Troubleshooting

### Common Issues

**Airtable: Rate Limit Exceeded**
- Solution: Implement request queuing
- Monitor: Check `X-RateLimit-Remaining` header

**Xero: OAuth Token Expired**
- Solution: Implement automatic token refresh
- Monitor: Token expiration timestamps

**Harvest: Pagination Issues**
- Solution: Follow cursor-based pagination
- Monitor: Check for incomplete data sets

**ClickUp: Template Not Found**
- Solution: Verify template ID in configuration
- Monitor: Log template application failures

### Getting Help

- Check integration health dashboard
- Review audit logs for detailed error context
- Contact integration support with correlation IDs
- Consult adapter-specific documentation

---

## Conclusion

The Consultant Gateway System integrates with 8 external services to automate workflows and synchronize data. Each integration follows best practices for authentication, error handling, and monitoring to ensure reliable operation.

For specific integration questions or issues, refer to the adapter implementation in `lib/adapters/` or contact the development team.
