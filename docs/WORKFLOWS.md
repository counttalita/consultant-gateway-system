# System Workflows

## Overview

This document provides visual diagrams and detailed explanations of key workflows in the Consultant Gateway System.

---

## 1. Authentication Flow

### Diagram

```
┌─────────┐                                                    ┌─────────┐
│ Client  │                                                    │ System  │
└────┬────┘                                                    └────┬────┘
     │                                                              │
     │  1. POST /auth/request-otp                                  │
     │     { email: "user@example.com" }                           │
     ├────────────────────────────────────────────────────────────>│
     │                                                              │
     │                                          2. Generate 6-digit OTP
     │                                          3. Store in database
     │                                          4. Send via Resend
     │                                                              │
     │  5. { success: true, message: "OTP sent" }                  │
     │<────────────────────────────────────────────────────────────┤
     │                                                              │
     │  6. User receives email with OTP code                       │
     │                                                              │
     │  7. POST /auth/validate-otp                                 │
     │     { email: "user@example.com", code: "123456" }           │
     ├────────────────────────────────────────────────────────────>│
     │                                                              │
     │                                          8. Validate OTP
     │                                          9. Check expiration
     │                                          10. Mark as consumed
     │                                          11. Create session
     │                                          12. Log audit entry
     │                                                              │
     │  13. { success: true, session_token: "..." }                │
     │<────────────────────────────────────────────────────────────┤
     │                                                              │
     │  14. Subsequent requests with session token                 │
     │      Authorization: Bearer <session_token>                  │
     ├────────────────────────────────────────────────────────────>│
     │                                                              │
     │  15. Validate session, return data                          │
     │<────────────────────────────────────────────────────────────┤
     │                                                              │
```

### Steps

1. **Request OTP**: Client submits email address
2. **Generate Code**: System creates 6-digit random code
3. **Store Code**: OTP saved with 10-minute expiration
4. **Send Email**: Resend delivers OTP to user's email
5. **Confirm Sent**: Success response returned to client
6. **User Receives**: Email arrives with OTP code
7. **Submit OTP**: Client sends email and OTP code
8. **Validate**: System checks code matches and belongs to user
9. **Check Expiration**: Verify code not expired (< 10 minutes)
10. **Mark Consumed**: Set consumed_at to prevent reuse
11. **Create Session**: Generate session token with 24-hour expiration
12. **Audit Log**: Record successful login
13. **Return Token**: Session token sent to client
14. **Authenticated Requests**: Client includes token in headers
15. **Validate & Respond**: System validates token and processes request

### Error Scenarios

- **Invalid Email**: Return 400 Bad Request
- **Rate Limit Exceeded**: Return 429 Too Many Requests (max 3 per 15 min)
- **Invalid OTP**: Return 401 Unauthorized
- **Expired OTP**: Return 401 Unauthorized with "expired" message
- **Already Consumed**: Return 401 Unauthorized with "already used" message
- **Expired Session**: Return 401 Unauthorized, require re-authentication

---

## 2. Profile Update & Airtable Sync Flow

### Diagram

```
┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│Consultant│         │   API    │         │Background│         │ Airtable │
└────┬─────┘         └────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                     │                     │
     │ 1. PATCH /profile  │                     │                     │
     │    {bio, skills}   │                     │                     │
     ├───────────────────>│                     │                     │
     │                    │                     │                     │
     │              2. Validate input           │                     │
     │              3. Save to PostgreSQL       │                     │
     │              4. Queue sync job           │                     │
     │                    │                     │                     │
     │ 5. Success response│                     │                     │
     │<───────────────────┤                     │                     │
     │                    │                     │                     │
     │                    │  6. Process job     │                     │
     │                    ├────────────────────>│                     │
     │                    │                     │                     │
     │                    │              7. Get consultant data       │
     │                    │              8. Call Airtable API         │
     │                    │                     ├────────────────────>│
     │                    │                     │                     │
     │                    │                     │  9. Update record   │
     │                    │                     │<────────────────────┤
     │                    │                     │                     │
     │                    │              10. Update cache             │
     │                    │              11. Log audit entry          │
     │                    │                     │                     │
     │                    │  12. Job complete   │                     │
     │                    │<────────────────────┤                     │
     │                    │                     │                     │
```

### Steps

1. **Submit Update**: Consultant sends profile changes
2. **Validate**: Check data format and completeness
3. **Save Locally**: Update PostgreSQL immediately
4. **Queue Job**: Schedule background sync to Airtable
5. **Respond**: Return success to consultant (fast response)
6. **Process Job**: Sidekiq worker picks up job
7. **Get Data**: Retrieve consultant record from database
8. **Call API**: Send update request to Airtable
9. **Update Record**: Airtable processes update
10. **Update Cache**: Refresh PostgreSQL cache
11. **Audit Log**: Record sync operation
12. **Complete**: Job finishes successfully

### Retry Logic

```
Attempt 1: Immediate
   ↓ (fails)
Attempt 2: Wait 2 seconds
   ↓ (fails)
Attempt 3: Wait 4 seconds
   ↓ (fails)
Final Failure: Log error, notify admin
```

---

## 3. Consultant Onboarding Flow

### Diagram

```
┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│Consultant│         │   API    │         │ Services │         │ External │
└────┬─────┘         └────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                     │                     │
     │ 1. First login     │                     │                     │
     ├───────────────────>│                     │                     │
     │                    │                     │                     │
     │              2. Check onboarding status  │                     │
     │              3. Initialize steps         │                     │
     │                    │                     │                     │
     │ 4. Onboarding wizard│                    │                     │
     │<───────────────────┤                     │                     │
     │                    │                     │                     │
     │ 5. Step 1: Personal│                     │                     │
     │    Info            │                     │                     │
     ├───────────────────>│                     │                     │
     │              6. Validate & save          │                     │
     │ 7. Next step       │                     │                     │
     │<───────────────────┤                     │                     │
     │                    │                     │                     │
     │ 8. Step 2: Banking │                     │                     │
     ├───────────────────>│                     │                     │
     │              9. Validate SA banking      │                     │
     │              10. Encrypt & save          │                     │
     │ 11. Next step      │                     │                     │
     │<───────────────────┤                     │                     │
     │                    │                     │                     │
     │ 12. Step 3: Skills │                     │                     │
     │     (Upload CV)    │                     │                     │
     ├───────────────────>│                     │                     │
     │              13. Parse CV                │                     │
     │              14. Extract skills          │                     │
     │ 15. Pre-populated  │                     │                     │
     │     skills         │                     │                     │
     │<───────────────────┤                     │                     │
     │                    │                     │                     │
     │ 16. Confirm skills │                     │                     │
     ├───────────────────>│                     │                     │
     │ 17. Next step      │                     │                     │
     │<───────────────────┤                     │                     │
     │                    │                     │                     │
     │ 18. Step 4: Contract│                    │                     │
     ├───────────────────>│                     │                     │
     │              19. Digital signature       │                     │
     │ 20. Next step      │                     │                     │
     │<───────────────────┤                     │                     │
     │                    │                     │                     │
     │              21. All steps complete      │                     │
     │              22. Trigger financial setup │                     │
     │                    ├────────────────────>│                     │
     │                    │                     │                     │
     │                    │              23. Create Harvest user      │
     │                    │                     ├────────────────────>│
     │                    │                     │  24. User created   │
     │                    │                     │<────────────────────┤
     │                    │                     │                     │
     │                    │              25. Create Xero supplier     │
     │                    │                     ├────────────────────>│
     │                    │                     │  26. Supplier created│
     │                    │                     │<────────────────────┤
     │                    │                     │                     │
     │                    │              27. Update Airtable status   │
     │                    │                     ├────────────────────>│
     │                    │                     │  28. Status: Active │
     │                    │                     │<────────────────────┤
     │                    │                     │                     │
     │                    │              29. Send welcome email       │
     │                    │                     ├────────────────────>│
     │                    │                     │  30. Email sent     │
     │                    │                     │<────────────────────┤
     │                    │                     │                     │
     │                    │  31. Setup complete │                     │
     │                    │<────────────────────┤                     │
     │                    │                     │                     │
     │ 32. Welcome message│                     │                     │
     │<───────────────────┤                     │                     │
     │                    │                     │                     │
```

### Onboarding Steps

1. **Personal Info**: Name, ID number, phone
2. **Banking Details**: Bank, account number, branch code (SA validation)
3. **Skills & Experience**: CV upload with parsing, or manual entry
4. **Contract Signing**: Digital signature on consulting agreement
5. **Welcome**: Automated welcome email with portal guide

### Financial System Setup

After onboarding completion:
1. Create user in Harvest (time tracking)
2. Create supplier in Xero (payments)
3. Update Airtable status to "Active"
4. Send welcome email via Resend

---

## 4. Month-End Financial Processing Flow

### Diagram

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Scheduler│    │MonthEndJob│   │  Harvest │    │   Xero   │    │  Email   │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │               │
     │ 1. Trigger    │               │               │               │
     │   (monthly)   │               │               │               │
     ├──────────────>│               │               │               │
     │               │               │               │               │
     │               │ 2. Get approved hours         │               │
     │               ├──────────────>│               │               │
     │               │               │               │               │
     │               │ 3. Hours data │               │               │
     │               │<──────────────┤               │               │
     │               │               │               │               │
     │               │ 4. Group by project           │               │
     │               │ 5. Calculate amounts          │               │
     │               │               │               │               │
     │               │ 6. Create client invoices     │               │
     │               ├──────────────────────────────>│               │
     │               │               │               │               │
     │               │ 7. Invoices created           │               │
     │               │<──────────────────────────────┤               │
     │               │               │               │               │
     │               │ 8. Create consultant bills    │               │
     │               ├──────────────────────────────>│               │
     │               │               │               │               │
     │               │ 9. Bills created              │               │
     │               │<──────────────────────────────┤               │
     │               │               │               │               │
     │               │ 10. Generate summary          │               │
     │               │               │               │               │
     │               │ 11. Send notification         │               │
     │               ├──────────────────────────────────────────────>│
     │               │               │               │               │
     │               │ 12. Email sent│               │               │
     │               │<──────────────────────────────────────────────┤
     │               │               │               │               │
     │ 13. Complete  │               │               │               │
     │<──────────────┤               │               │               │
     │               │               │               │               │
```

### Steps

1. **Trigger**: Scheduled job runs on 1st of month
2. **Get Hours**: Retrieve approved hours from Harvest for previous month
3. **Return Data**: Harvest returns time entries with project/consultant details
4. **Group**: Organize hours by project for client billing
5. **Calculate**: Compute invoice amounts (hours × rates)
6. **Create Invoices**: Generate draft invoices in Xero for clients
7. **Confirm**: Xero returns invoice IDs
8. **Create Bills**: Generate draft bills in Xero for consultants
9. **Confirm**: Xero returns bill IDs
10. **Summary**: Compile counts and totals
11. **Notify**: Send email to finance team with summary
12. **Confirm**: Email delivery confirmed
13. **Complete**: Job finishes, audit logs created

### Batch Processing Resilience

If individual operations fail:
- Continue processing remaining records
- Compile failure report
- Notify admin of failures
- Mark failed records for manual review

---

## 5. Project Automation Flow (Won Deal)

### Diagram

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Airtable │    │ Webhook  │    │ProjectJob│    │ ClickUp  │    │  Drive   │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │               │
     │ 1. Deal marked│               │               │               │
     │    as "Won"   │               │               │               │
     │               │               │               │               │
     │ 2. Webhook    │               │               │               │
     ├──────────────>│               │               │               │
     │               │               │               │               │
     │               │ 3. Validate   │               │               │
     │               │    signature  │               │               │
     │               │               │               │               │
     │               │ 4. Queue job  │               │               │
     │               ├──────────────>│               │               │
     │               │               │               │               │
     │               │ 5. Ack        │               │               │
     │               │<──────────────┤               │               │
     │               │               │               │               │
     │ 6. Response   │               │               │               │
     │<──────────────┤               │               │               │
     │               │               │               │               │
     │               │               │ 7. Create project             │
     │               │               ├──────────────>│               │
     │               │               │               │               │
     │               │               │ 8. Apply template             │
     │               │               ├──────────────>│               │
     │               │               │               │               │
     │               │               │ 9. Project URL│               │
     │               │               │<──────────────┤               │
     │               │               │               │               │
     │               │               │ 10. Create folders            │
     │               │               ├──────────────────────────────>│
     │               │               │               │               │
     │               │               │ 11. Folder URL│               │
     │               │               │<──────────────────────────────┤
     │               │               │               │               │
     │               │               │ 12. Update Airtable           │
     │               │               │               │               │
     │ 13. Update    │               │               │               │
     │     with URLs │               │               │               │
     │<──────────────────────────────┤               │               │
     │               │               │               │               │
```

### Steps

1. **Deal Won**: User marks deal as "Won" in Airtable
2. **Webhook**: Airtable sends webhook to system
3. **Validate**: Verify webhook signature for security
4. **Queue Job**: Schedule background job for project setup
5. **Acknowledge**: Return 200 OK to Airtable
6. **Response**: Airtable receives confirmation
7. **Create Project**: Create list in ClickUp with client/project name
8. **Apply Template**: Apply "Change Management" template
9. **Return URL**: ClickUp returns project URL
10. **Create Folders**: Create folder structure in Google Drive
11. **Return URL**: Drive returns folder URL
12. **Update Airtable**: Add ClickUp and Drive URLs to deal record
13. **Confirm**: Airtable updated with project links

### Folder Structure

```
Project Root/
├── Documents/
├── Deliverables/
└── Internal/
```

---

## 6. Tender Management Flow

### Diagram

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Portal  │    │ Webhook  │    │  Tender  │    │ Airtable │    │ ClickUp  │
│          │    │          │    │  Service │    │          │    │          │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │               │
     │ 1. New tender │               │               │               │
     │    published  │               │               │               │
     │               │               │               │               │
     │ 2. Webhook    │               │               │               │
     ├──────────────>│               │               │               │
     │               │               │               │               │
     │               │ 3. Validate   │               │               │
     │               │    signature  │               │               │
     │               │               │               │               │
     │               │ 4. Process    │               │               │
     │               ├──────────────>│               │               │
     │               │               │               │               │
     │               │               │ 5. Check duplicate            │
     │               │               │    (ref number)               │
     │               │               │               │               │
     │               │               │ 6. Evaluate   │               │
     │               │               │    bid/no-bid │               │
     │               │               │               │               │
     │               │               │ 7. Create CRM record          │
     │               │               ├──────────────>│               │
     │               │               │               │               │
     │               │               │ 8. Record ID  │               │
     │               │               │<──────────────┤               │
     │               │               │               │               │
     │               │               │ 9. If "Pursue"│               │
     │               │               │    create task│               │
     │               │               ├──────────────────────────────>│
     │               │               │               │               │
     │               │               │ 10. Task ID   │               │
     │               │               │<──────────────────────────────┤
     │               │               │               │               │
     │               │ 11. Success   │               │               │
     │               │<──────────────┤               │               │
     │               │               │               │               │
     │ 12. Response  │               │               │               │
     │<──────────────┤               │               │               │
     │               │               │               │               │
```

### Bid/No-Bid Evaluation Criteria

```
Score = (Scope Fit × 0.3) + (Capacity × 0.25) + 
        (Budget × 0.25) + (Timeline × 0.2)

Decision:
- Score ≥ 6.5: Pursue
- Score < 6.5: Decline
```

### Steps

1. **Tender Published**: New opportunity appears on portal
2. **Webhook**: Portal sends tender data to system
3. **Validate**: Verify webhook signature
4. **Process**: TenderService handles tender
5. **Check Duplicate**: Look for existing tender by reference number
6. **Evaluate**: BidDecisionEngine scores opportunity
7. **Create Record**: Add to Airtable CRM
8. **Return ID**: Airtable confirms creation
9. **Create Task**: If "Pursue", create ClickUp task for proposal
10. **Return ID**: ClickUp confirms task creation
11. **Success**: Return to webhook handler
12. **Response**: Confirm receipt to portal

---

## 7. Availability & Utilization Flow

### Diagram

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│Consultant│    │   API    │    │ Airtable │    │  Email   │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │ 1. Update     │               │               │
     │    availability│              │               │
     ├──────────────>│               │               │
     │               │               │               │
     │               │ 2. Save to DB │               │
     │               │               │               │
     │               │ 3. Sync to Airtable           │
     │               ├──────────────>│               │
     │               │               │               │
     │               │ 4. Updated    │               │
     │               │<──────────────┤               │
     │               │               │               │
     │ 5. Success    │               │               │
     │<──────────────┤               │               │
     │               │               │               │
     │               │ 6. Calculate utilization      │
     │               │    (on project assignment)    │
     │               │               │               │
     │               │ 7. If > 80%   │               │
     │               │    send alert │               │
     │               ├──────────────────────────────>│
     │               │               │               │
     │               │ 8. Alert sent │               │
     │               │<──────────────────────────────┤
     │               │               │               │
```

### Utilization Calculation

```
Utilization = (Allocated Hours / Available Hours) × 100

Thresholds:
- 80%: Warning alert
- 100%: Critical alert
```

---

## 8. Error Handling & Retry Flow

### Diagram

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│Operation │    │  Retry   │    │  Circuit │    │  Admin   │
│          │    │  Logic   │    │  Breaker │    │  Alert   │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │ 1. Execute    │               │               │
     ├──────────────>│               │               │
     │               │               │               │
     │               │ 2. Check circuit              │
     │               ├──────────────>│               │
     │               │               │               │
     │               │ 3. Open/Closed│               │
     │               │<──────────────┤               │
     │               │               │               │
     │               │ 4. If closed, │               │
     │               │    attempt    │               │
     │               │               │               │
     │ 5. Error      │               │               │
     │<──────────────┤               │               │
     │               │               │               │
     │               │ 6. Wait 2s    │               │
     │               │               │               │
     │               │ 7. Retry      │               │
     │               │               │               │
     │ 8. Error      │               │               │
     │<──────────────┤               │               │
     │               │               │               │
     │               │ 9. Wait 4s    │               │
     │               │               │               │
     │               │ 10. Retry     │               │
     │               │               │               │
     │ 11. Error     │               │               │
     │<──────────────┤               │               │
     │               │               │               │
     │               │ 12. Max retries               │
     │               │     reached   │               │
     │               │               │               │
     │               │ 13. Open circuit              │
     │               ├──────────────>│               │
     │               │               │               │
     │               │ 14. Notify admin              │
     │               ├──────────────────────────────>│
     │               │               │               │
     │ 15. Final     │               │               │
     │     failure   │               │               │
     │<──────────────┤               │               │
     │               │               │               │
```

### Retry Strategy

```
Attempt 1: Immediate
Attempt 2: Wait 2 seconds (2^1)
Attempt 3: Wait 4 seconds (2^2)
Final: Notify admin, log error
```

### Circuit Breaker States

- **Closed**: Normal operation, requests pass through
- **Open**: Too many failures, requests fail fast
- **Half-Open**: Testing if service recovered

---

## Summary

These workflows demonstrate the key processes in the Consultant Gateway System:

1. **Authentication**: Secure OTP-based login
2. **Profile Updates**: Real-time sync with Airtable
3. **Onboarding**: Multi-step wizard with financial system setup
4. **Financial Processing**: Automated monthly invoice/bill generation
5. **Project Automation**: Automatic setup when deals won
6. **Tender Management**: Automated capture and evaluation
7. **Availability**: Utilization tracking with alerts
8. **Error Handling**: Robust retry and circuit breaker patterns

All workflows include comprehensive audit logging, error handling, and admin notifications for critical failures.
