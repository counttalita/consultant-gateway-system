# API Endpoints Documentation

## Base URL

```
Development: http://localhost:3000
Production: https://consultant-gateway.uptimeconsulting.co.za
```

## Authentication

Most endpoints require authentication via session token:

```http
Authorization: Bearer <session_token>
```

## Response Format

All responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

---

## Authentication Endpoints

### Request OTP

Generate and send OTP code to user's email.

```http
POST /api/v1/auth/request-otp
```

**Request Body:**
```json
{
  "email": "consultant@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to email"
}
```

**Rate Limit:** 3 requests per email per 15 minutes

---

### Validate OTP

Validate OTP code and create session.

```http
POST /api/v1/auth/validate-otp
```

**Request Body:**
```json
{
  "email": "consultant@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "consultant@example.com",
      "roles": ["consultant"]
    }
  }
}
```

---

### Get Current Session

Retrieve current user session information.

```http
GET /api/v1/auth/session
Authorization: Bearer <session_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "consultant@example.com",
      "roles": ["consultant"],
      "active": true
    },
    "expires_at": "2025-12-06T13:00:00Z"
  }
}
```

---

### Logout

Invalidate current session.

```http
DELETE /api/v1/auth/logout
Authorization: Bearer <session_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Consultant Profile Endpoints

### Get Profile

Retrieve consultant profile.

```http
GET /api/v1/consultants/profile
Authorization: Bearer <session_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "bio": "Experienced change management consultant...",
    "skills": ["Change Management", "Project Management"],
    "availability_status": "available",
    "utilization_percentage": 50.0,
    "onboarding_status": "completed",
    "banking_details": {
      "bank_name": "FNB",
      "account_type": "Cheque"
    }
  }
}
```

---

### Update Profile

Update consultant profile information.

```http
PATCH /api/v1/consultants/profile
Authorization: Bearer <session_token>
```

**Request Body:**
```json
{
  "bio": "Updated bio text",
  "skills": ["Change Management", "Project Management", "Training"],
  "banking_details": {
    "bank_name": "FNB",
    "account_number": "62123456789",
    "branch_code": "250655",
    "account_type": "Cheque"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "bio": "Updated bio text",
    "skills": ["Change Management", "Project Management", "Training"]
  },
  "message": "Profile updated successfully"
}
```

---

### Upload CV

Upload and parse CV file.

```http
POST /api/v1/consultants/cv
Authorization: Bearer <session_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
file: <CV file (PDF or DOCX)>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "parsed_skills": ["Change Management", "Project Management"],
    "parsed_experience": ["10+ years in consulting"],
    "parsed_qualifications": ["MBA", "PMP Certified"]
  },
  "message": "CV parsed successfully"
}
```

---

## Onboarding Endpoints

### Initialize Onboarding

Start onboarding process for new consultant.

```http
POST /api/v1/onboarding/initialize
Authorization: Bearer <session_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current_step": "personal_info",
    "steps": [
      {"name": "personal_info", "status": "pending"},
      {"name": "banking", "status": "pending"},
      {"name": "skills", "status": "pending"},
      {"name": "contract", "status": "pending"},
      {"name": "welcome", "status": "pending"}
    ]
  }
}
```

---

### Complete Onboarding Step

Submit data for onboarding step.

```http
POST /api/v1/onboarding/steps/:step_name
Authorization: Bearer <session_token>
```

**Request Body (personal_info):**
```json
{
  "full_name": "John Doe",
  "id_number": "8001015009087",
  "phone": "+27821234567"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "step": "personal_info",
    "status": "completed",
    "next_step": "banking"
  }
}
```

---

### Get Onboarding Status

Retrieve current onboarding progress.

```http
GET /api/v1/onboarding/status
Authorization: Bearer <session_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "in_progress",
    "current_step": "banking",
    "completed_steps": ["personal_info"],
    "remaining_steps": ["banking", "skills", "contract", "welcome"]
  }
}
```

---

## Admin Dashboard Endpoints

### Get Dashboard Metrics

Retrieve admin dashboard metrics.

```http
GET /api/v1/admin/dashboard
Authorization: Bearer <session_token>
Requires: admin role
```

**Response:**
```json
{
  "success": true,
  "data": {
    "active_users": 25,
    "recent_logins": 15,
    "integration_health": {
      "airtable": {"status": "healthy", "last_sync": "2025-12-05T13:00:00Z"},
      "xero": {"status": "healthy", "last_sync": "2025-12-05T12:45:00Z"}
    },
    "activity_trends": {
      "logins_last_7_days": [10, 12, 15, 13, 14, 16, 15],
      "profile_updates_last_7_days": [5, 3, 7, 4, 6, 5, 8]
    },
    "error_summary": {
      "critical": 0,
      "high": 2,
      "medium": 5,
      "low": 10
    }
  }
}
```

---

### Get Integration Health

Check health status of all integrations.

```http
GET /api/v1/admin/integration_health
Authorization: Bearer <session_token>
Requires: admin role
```

**Response:**
```json
{
  "success": true,
  "data": {
    "airtable": {
      "status": "healthy",
      "last_sync": "2025-12-05T13:00:00Z",
      "error_count_24h": 0
    },
    "xero": {
      "status": "degraded",
      "last_sync": "2025-12-05T10:00:00Z",
      "error_count_24h": 3
    }
  }
}
```

---

## Finance Dashboard Endpoints

### Get Finance Metrics

Retrieve finance dashboard metrics.

```http
GET /api/v1/finance/dashboard
Authorization: Bearer <session_token>
Requires: finance role
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current_month_revenue": 250000.00,
    "outstanding_invoices": 150000.00,
    "pending_payments": 100000.00,
    "consultant_utilization": [
      {
        "consultant_name": "John Doe",
        "billable_hours": 120,
        "utilization_percentage": 75.0,
        "revenue": 150000.00
      }
    ],
    "project_profitability": [
      {
        "project_name": "Digital Transformation",
        "revenue": 200000.00,
        "cost": 150000.00,
        "margin": 25.0
      }
    ]
  }
}
```

---

### Export Financial Data

Generate financial data export.

```http
GET /api/v1/finance/export?format=csv&period=2025-01
Authorization: Bearer <session_token>
Requires: finance role
```

**Query Parameters:**
- `format`: csv or excel
- `period`: YYYY-MM format

**Response:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="financial_data_2025-01.csv"

Date,Type,Client,Amount,Status
2025-01-15,Invoice,Acme Corp,50000.00,Paid
2025-01-20,Bill,John Doe,40000.00,Pending
```

---

## User Management Endpoints

### List Users

Get list of all users (admin only).

```http
GET /api/v1/users
Authorization: Bearer <session_token>
Requires: admin role
```

**Query Parameters:**
- `role`: Filter by role (consultant, admin, finance, user)
- `active`: Filter by active status (true/false)
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 25)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "email": "consultant@example.com",
        "roles": ["consultant"],
        "active": true,
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 3,
      "total_count": 75
    }
  }
}
```

---

### Get User Details

Retrieve specific user details.

```http
GET /api/v1/users/:id
Authorization: Bearer <session_token>
Requires: admin role
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "consultant@example.com",
    "roles": ["consultant"],
    "active": true,
    "last_login": "2025-12-05T10:00:00Z",
    "consultant_profile": {
      "bio": "Experienced consultant...",
      "skills": ["Change Management"]
    }
  }
}
```

---

### Update User Roles

Update roles for internal staff (admin only).

```http
PATCH /api/v1/users/:id/roles
Authorization: Bearer <session_token>
Requires: admin role
```

**Request Body:**
```json
{
  "roles": ["admin", "finance"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "email": "staff@example.com",
    "roles": ["admin", "finance"]
  },
  "message": "Roles updated successfully"
}
```

**Note:** Cannot modify consultant roles or own roles.

---

## Availability Endpoints

### Update Availability

Update consultant availability status.

```http
PATCH /api/v1/consultants/availability
Authorization: Bearer <session_token>
```

**Request Body:**
```json
{
  "availability_status": "partially_available",
  "notes": "Available 50% capacity"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "availability_status": "partially_available",
    "utilization_percentage": 50.0
  }
}
```

---

### Get Talent Pool

View available consultants (admin/finance only).

```http
GET /api/v1/admin/talent_pool
Authorization: Bearer <session_token>
Requires: admin or finance role
```

**Query Parameters:**
- `skills`: Filter by skills (comma-separated)
- `availability`: Filter by availability status
- `min_utilization`: Minimum utilization percentage
- `max_utilization`: Maximum utilization percentage

**Response:**
```json
{
  "success": true,
  "data": {
    "consultants": [
      {
        "id": 1,
        "name": "John Doe",
        "skills": ["Change Management", "Project Management"],
        "availability_status": "available",
        "utilization_percentage": 50.0,
        "upcoming_commitments": []
      }
    ]
  }
}
```

---

## Configuration Endpoints

### Get System Configuration

Retrieve system configuration (admin only).

```http
GET /api/v1/config
Authorization: Bearer <session_token>
Requires: admin role
```

**Response:**
```json
{
  "success": true,
  "data": {
    "environment": "production",
    "version": "1.0.0",
    "features": {
      "cv_parsing": true,
      "simplepay_export": true,
      "zapier_integration": true
    },
    "integrations": {
      "airtable": "configured",
      "xero": "configured",
      "harvest": "configured"
    }
  }
}
```

---

### Reload Configuration

Reload system configuration without restart.

```http
POST /api/v1/config/reload
Authorization: Bearer <session_token>
Requires: admin role
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration reloaded successfully"
}
```

---

## Webhook Endpoints

### Tender Webhook

Receive tender opportunities from external portals.

```http
POST /webhooks/tenders
X-Webhook-Signature: <signature>
```

**Request Body:**
```json
{
  "reference_number": "TENDER-2025-001",
  "title": "Government Change Management Services",
  "source": "National Treasury Portal",
  "tender_value": 2000000.00,
  "submission_deadline": "2025-02-28T23:59:59Z",
  "required_capabilities": ["Change Management", "Training"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tender_id": 789,
    "bid_decision": "pursue",
    "bid_score": 8.5
  }
}
```

---

### Deal Won Webhook

Receive notifications when deals are won in Airtable.

```http
POST /webhooks/deals
X-Airtable-Signature: <signature>
```

**Request Body:**
```json
{
  "event": "deal.won",
  "deal_id": "rec123456",
  "client_name": "Acme Corporation",
  "project_title": "Digital Transformation",
  "start_date": "2025-01-01",
  "budget": 500000.00
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": 456,
    "clickup_url": "https://app.clickup.com/...",
    "drive_url": "https://drive.google.com/..."
  }
}
```

---

## Zapier Endpoints

### Zapier: Get Consultant

Retrieve consultant data for Zapier actions.

```http
GET /api/v1/zapier/consultants/:id
Authorization: Bearer <zapier_api_key>
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "skills": ["Change Management"],
  "availability_status": "available"
}
```

---

### Zapier: Update Availability

Update consultant availability via Zapier.

```http
PATCH /api/v1/zapier/consultants/:id/availability
Authorization: Bearer <zapier_api_key>
```

**Request Body:**
```json
{
  "availability_status": "partially_available"
}
```

**Response:**
```json
{
  "success": true,
  "consultant_id": 1,
  "availability_status": "partially_available"
}
```

---

### Zapier: Create Tender

Create tender via Zapier workflow.

```http
POST /api/v1/zapier/tenders
Authorization: Bearer <zapier_api_key>
```

**Request Body:**
```json
{
  "reference_number": "TENDER-2025-002",
  "title": "IT Infrastructure Upgrade",
  "tender_value": 500000.00,
  "submission_deadline": "2025-02-15"
}
```

**Response:**
```json
{
  "success": true,
  "tender_id": 790,
  "bid_decision": "decline"
}
```

---

## Health Check Endpoint

### System Health

Check system health status (public endpoint).

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-05T13:00:00Z",
  "services": {
    "database": "up",
    "redis": "up",
    "sidekiq": "up"
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable - External service down |

---

## Rate Limiting

- **OTP Generation**: 3 requests per email per 15 minutes
- **API Endpoints**: 100 requests per minute per user
- **Webhook Endpoints**: 1000 requests per hour per source

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1733410800
```

---

## Pagination

List endpoints support pagination:

```http
GET /api/v1/users?page=2&per_page=25
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "current_page": 2,
    "total_pages": 5,
    "total_count": 125,
    "per_page": 25
  }
}
```

---

## Filtering & Sorting

Many list endpoints support filtering and sorting:

```http
GET /api/v1/users?role=consultant&active=true&sort=created_at&order=desc
```

Common parameters:
- `sort`: Field to sort by
- `order`: asc or desc
- `search`: Search query
- Various field-specific filters

---

## Versioning

API version is included in the URL path:

```
/api/v1/...
```

Breaking changes will result in a new version (v2, v3, etc.).

---

## Support

For API questions or issues:
- Check integration health dashboard
- Review audit logs for request details
- Contact development team with correlation IDs
