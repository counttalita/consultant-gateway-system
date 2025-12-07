# UAT Test Cases - Consultant Gateway System

## Test Environment Setup

**Environment**: QA Environment on Render
**Test Data**: Sanitized production-like data
**External Services**: Sandbox/Test instances
- Airtable: Test base
- Xero: Demo company
- Harvest: Test account
- ClickUp: Test workspace
- Google Drive: Test folder
- Resend: Test API key
- SimplePay: Test environment

## Test User Accounts

### Consultant Users
1. **New Consultant** (for onboarding flow)
   - Email: new.consultant@test.uptimeconsulting.co.za
   - Status: Not yet onboarded

2. **Active Consultant** (for profile management)
   - Email: active.consultant@test.uptimeconsulting.co.za
   - Status: Fully onboarded, active

3. **Partially Available Consultant**
   - Email: partial.consultant@test.uptimeconsulting.co.za
   - Status: Active, 50% utilization

### Internal Staff Users
1. **Admin User**
   - Email: admin@test.uptimeconsulting.co.za
   - Roles: Admin

2. **Finance User**
   - Email: finance@test.uptimeconsulting.co.za
   - Roles: Finance

3. **Multi-Role User**
   - Email: manager@test.uptimeconsulting.co.za
   - Roles: Admin, Finance

## Critical Workflow Test Cases

### Workflow 1: Consultant Onboarding (End-to-End)

**Objective**: Verify complete onboarding process from OTP login to welcome email

**Prerequisites**: 
- New consultant email not in system
- Harvest test account accessible
- Xero demo company accessible
- Resend test API configured

**Test Steps**:

1. **OTP Authentication**
   - Navigate to login page
   - Enter email: new.consultant@test.uptimeconsulting.co.za
   - Click "Request OTP"
   - **Expected**: Success message displayed
   - Check email inbox for OTP code
   - **Expected**: Email received within 30 seconds with 6-digit code
   - Enter OTP code
   - **Expected**: Successfully logged in, redirected to onboarding

2. **Personal Information Step**
   - Fill in: Name, ID Number, Phone Number
   - Click "Next"
   - **Expected**: Data validated and saved, progress to next step

3. **Banking Details Step**
   - Fill in: Bank Name, Account Number, Branch Code
   - Use valid SA banking details: Bank: FNB, Account: 62123456789, Branch: 250655
   - Click "Next"
   - **Expected**: Banking validation passes, progress to next step

4. **Skills & Experience Step**
   - Upload CV (PDF format)
   - **Expected**: CV parsed, skills extracted and pre-populated
   - Review and confirm skills
   - Click "Next"
   - **Expected**: Skills saved, progress to contract step

5. **Contract Signing Step**
   - Review consulting agreement
   - Provide digital signature
   - Click "Complete Onboarding"
   - **Expected**: Contract accepted, onboarding marked complete

6. **System Integration Verification**
   - Check Harvest: User created with correct email
   - **Expected**: Harvest user exists
   - Check Xero: Supplier created with banking details
   - **Expected**: Xero supplier exists with encrypted banking data
   - Check Airtable: Consultant marked as "Active"
   - **Expected**: Airtable record updated
   - Check email: Welcome pack received
   - **Expected**: Welcome email delivered within 2 minutes

7. **Audit Trail Verification**
   - Admin logs in and checks audit logs
   - **Expected**: All onboarding steps logged with timestamps

**Success Criteria**:
- ✅ OTP delivered and validated successfully
- ✅ All onboarding steps completed without errors
- ✅ Harvest user created
- ✅ Xero supplier created with valid banking details
- ✅ Airtable status updated to "Active"
- ✅ Welcome email received
- ✅ Complete audit trail captured

---

### Workflow 2: Profile Management & Airtable Sync

**Objective**: Verify profile updates synchronize to Airtable within 30 seconds

**Prerequisites**:
- Active consultant logged in
- Airtable test base accessible

**Test Steps**:

1. **Login as Active Consultant**
   - Use OTP authentication
   - **Expected**: Successfully logged in

2. **Update Bio**
   - Navigate to Profile page
   - Update bio text (max 1000 characters)
   - Click "Save"
   - **Expected**: Success message displayed

3. **Verify Airtable Sync**
   - Wait 30 seconds
   - Check Airtable talent pool record
   - **Expected**: Bio updated in Airtable within 30 seconds

4. **Update Skills**
   - Add new skill: "Change Management"
   - Remove existing skill
   - Click "Save"
   - **Expected**: Skills updated successfully

5. **Verify Airtable Sync**
   - Wait 30 seconds
   - Check Airtable talent pool record
   - **Expected**: Skills array updated in Airtable

6. **Update Banking Details**
   - Change account number
   - Click "Save"
   - **Expected**: Banking details validated and saved

7. **Verify Audit Log**
   - Admin checks audit logs
   - **Expected**: Profile changes logged with old/new values
   - **Expected**: Banking details redacted in logs

**Success Criteria**:
- ✅ Profile updates saved successfully
- ✅ Airtable synchronized within 30 seconds
- ✅ Audit logs capture all changes
- ✅ Sensitive data redacted in logs

---

### Workflow 3: Month-End Financial Processing

**Objective**: Verify automated invoice and bill generation from Harvest hours

**Prerequisites**:
- Harvest test account with approved hours
- Xero demo company accessible
- Finance user logged in

**Test Steps**:

1. **Trigger Month-End Job**
   - Admin triggers month-end processing for previous month
   - **Expected**: Job queued successfully

2. **Monitor Job Execution**
   - Check Sidekiq dashboard
   - **Expected**: Job processing without errors

3. **Verify Harvest Hours Retrieved**
   - Check logs for Harvest API calls
   - **Expected**: All approved hours retrieved for the month

4. **Verify Client Invoices Created**
   - Check Xero demo company
   - **Expected**: Draft invoices created, grouped by project
   - **Expected**: Invoice amounts match billable hours

5. **Verify Consultant Bills Created**
   - Check Xero demo company
   - **Expected**: Draft bills created for each consultant
   - **Expected**: Bill amounts match consultant hours

6. **Verify Finance Team Notification**
   - Check finance user email
   - **Expected**: Summary email received with invoice/bill counts

7. **Verify Batch Processing Resilience**
   - Simulate one consultant with missing data
   - **Expected**: Processing continues for other consultants
   - **Expected**: Failure report generated

8. **Verify Audit Logs**
   - Check audit logs for financial operations
   - **Expected**: All invoice/bill creations logged with Xero IDs

**Success Criteria**:
- ✅ All approved hours retrieved from Harvest
- ✅ Client invoices created correctly
- ✅ Consultant bills created correctly
- ✅ Finance team notified with summary
- ✅ Batch processing handles failures gracefully
- ✅ Complete audit trail for financial operations

---

### Workflow 4: Tender Management & Bid Decision

**Objective**: Verify tender webhook processing and bid/no-bid evaluation

**Prerequisites**:
- Tender portal webhook configured
- Airtable CRM base accessible
- ClickUp test workspace accessible

**Test Steps**:

1. **Send Tender Webhook**
   - Simulate tender portal webhook with test payload
   - Include: Reference number, title, value, deadline, capabilities
   - **Expected**: Webhook received and validated

2. **Verify Webhook Signature Validation**
   - Send webhook with invalid signature
   - **Expected**: Request rejected with 401 Unauthorized

3. **Verify Tender CRM Record Creation**
   - Check Airtable CRM base
   - **Expected**: New opportunity record created with all fields

4. **Verify Bid Decision Evaluation**
   - Check tender record in Airtable
   - **Expected**: Bid score calculated
   - **Expected**: Recommendation (Pursue/Decline) assigned

5. **Verify ClickUp Task Creation**
   - For "Pursue" recommendation, check ClickUp
   - **Expected**: Task created for proposal development
   - **Expected**: Task includes deadline and assigned owner

6. **Test Deduplication**
   - Send duplicate webhook with same reference number
   - **Expected**: Existing record updated, no duplicate created

7. **Test Webhook Retry Logic**
   - Simulate Airtable API failure
   - **Expected**: Webhook queued for retry
   - **Expected**: Admin notified after 3 failed attempts

**Success Criteria**:
- ✅ Webhook signature validation working
- ✅ Tender records created in Airtable
- ✅ Bid decision evaluation accurate
- ✅ ClickUp tasks created for pursued opportunities
- ✅ Deduplication prevents duplicates
- ✅ Retry logic handles failures

---

### Workflow 5: Project Automation (Won Deal)

**Objective**: Verify automatic project setup when deal is won

**Prerequisites**:
- Airtable deal marked as "Won"
- ClickUp test workspace accessible
- Google Drive test folder accessible

**Test Steps**:

1. **Mark Deal as Won in Airtable**
   - Update deal status to "Won"
   - **Expected**: Webhook triggered to Consultant Gateway

2. **Verify Webhook Reception**
   - Check logs for webhook receipt
   - **Expected**: Webhook received with project details

3. **Verify ClickUp Project Creation**
   - Check ClickUp workspace
   - **Expected**: New project space created with client name
   - **Expected**: Change Management template applied
   - **Expected**: Standard task lists and views present

4. **Verify Google Drive Folder Creation**
   - Check Google Drive test folder
   - **Expected**: Folder structure created for project
   - **Expected**: Subfolders: Documents, Deliverables, Internal

5. **Verify Airtable Update**
   - Check Airtable deal record
   - **Expected**: ClickUp project URL added
   - **Expected**: Google Drive folder URL added
   - **Expected**: Status updated to "In Delivery"

6. **Verify Audit Log**
   - Check audit logs
   - **Expected**: Project setup logged with all integration IDs

**Success Criteria**:
- ✅ ClickUp project created with template
- ✅ Google Drive folder structure created
- ✅ Airtable deal updated with links
- ✅ Complete audit trail captured

---

### Workflow 6: Role-Based Access Control

**Objective**: Verify RBAC enforcement across all user roles

**Prerequisites**:
- Test users for each role created
- All features accessible

**Test Steps**:

1. **Test Consultant Access**
   - Login as consultant
   - Attempt to access admin dashboard
   - **Expected**: Access denied with 403 Forbidden
   - Attempt to access finance dashboard
   - **Expected**: Access denied with 403 Forbidden
   - Access own profile
   - **Expected**: Access granted

2. **Test Finance User Access**
   - Login as finance user
   - Access finance dashboard
   - **Expected**: Access granted, metrics displayed
   - Attempt to access admin user management
   - **Expected**: Access denied with 403 Forbidden
   - View consultant profiles (read-only)
   - **Expected**: Access granted

3. **Test Admin User Access**
   - Login as admin user
   - Access admin dashboard
   - **Expected**: Access granted, system metrics displayed
   - Access user management
   - **Expected**: Access granted, can modify roles
   - Attempt to modify own roles
   - **Expected**: Action prevented

4. **Test Multi-Role User**
   - Login as multi-role user (Admin + Finance)
   - Access admin dashboard
   - **Expected**: Access granted
   - Access finance dashboard
   - **Expected**: Access granted
   - Verify permission union
   - **Expected**: Has all permissions from both roles

5. **Test Consultant Role Restriction**
   - Admin attempts to add Finance role to consultant
   - **Expected**: Action prevented, error message displayed

6. **Verify Audit Logs**
   - Check audit logs for authorization attempts
   - **Expected**: Failed access attempts logged

**Success Criteria**:
- ✅ Consultants restricted to own profile
- ✅ Finance users access finance features only
- ✅ Admin users access all admin features
- ✅ Multi-role users have union of permissions
- ✅ Consultant role restrictions enforced
- ✅ Authorization failures logged

---

### Workflow 7: Analytics Dashboards

**Objective**: Verify finance and admin dashboards display accurate metrics

**Prerequisites**:
- Test data populated in system
- Finance and admin users logged in

**Test Steps**:

1. **Finance Dashboard - Revenue Metrics**
   - Login as finance user
   - Navigate to finance dashboard
   - **Expected**: Current month revenue displayed
   - **Expected**: Outstanding invoices listed with amounts
   - **Expected**: Pending consultant payments shown

2. **Finance Dashboard - Utilization**
   - View consultant utilization section
   - **Expected**: Billable hours per consultant displayed
   - **Expected**: Utilization percentage calculated correctly
   - **Expected**: Revenue per consultant shown

3. **Finance Dashboard - Profitability**
   - View project profitability section
   - **Expected**: Margin calculated (billing rate - consultant cost)
   - **Expected**: Projects sorted by profitability

4. **Finance Dashboard - Payment Aging**
   - View payment aging report
   - **Expected**: Overdue invoices grouped by age (30/60/90 days)
   - **Expected**: Upcoming payment obligations listed

5. **Finance Dashboard - Data Export**
   - Click "Export to CSV"
   - **Expected**: CSV file downloaded with transaction history
   - **Expected**: Summary metrics included

6. **Admin Dashboard - Active Users**
   - Login as admin user
   - Navigate to admin dashboard
   - **Expected**: Active user count displayed
   - **Expected**: Recent logins listed

7. **Admin Dashboard - Integration Health**
   - View integration health section
   - **Expected**: Connection status for Airtable, Xero, Harvest, ClickUp
   - **Expected**: Last successful sync time for each integration

8. **Admin Dashboard - Activity Trends**
   - View activity trends charts
   - **Expected**: Login trends over time displayed
   - **Expected**: Profile updates chart shown
   - **Expected**: Onboarding completion rates visualized

9. **Admin Dashboard - Error Aggregation**
   - View error summary section
   - **Expected**: Recent error counts by type
   - **Expected**: Drill-down capability to view detailed logs

10. **Admin Dashboard - Data Quality**
    - View data quality assessment
    - **Expected**: Incomplete consultant profiles highlighted
    - **Expected**: Pending onboarding tasks listed

**Success Criteria**:
- ✅ Finance dashboard displays accurate financial metrics
- ✅ Utilization and profitability calculated correctly
- ✅ Payment aging reports accurate
- ✅ Data export generates valid CSV
- ✅ Admin dashboard shows system health
- ✅ Integration health monitoring working
- ✅ Activity trends visualized correctly
- ✅ Error aggregation and drill-down functional
- ✅ Data quality issues highlighted

---

### Workflow 8: Error Handling & Recovery

**Objective**: Verify system handles errors gracefully and recovers

**Prerequisites**:
- Admin user logged in
- External services accessible

**Test Steps**:

1. **Test Airtable Unavailability**
   - Simulate Airtable API failure
   - Attempt to fetch consultant data
   - **Expected**: System serves data from PostgreSQL cache
   - **Expected**: Warning logged about Airtable unavailability

2. **Test Email Service Failure**
   - Simulate Resend API failure
   - Trigger OTP generation
   - **Expected**: Email queued for retry
   - **Expected**: Retry attempted up to 3 times with exponential backoff
   - **Expected**: Admin notified after 3 failures

3. **Test Xero API Failure**
   - Simulate Xero API error during invoice creation
   - Trigger month-end processing
   - **Expected**: Error logged with full context
   - **Expected**: Processing continues for other consultants
   - **Expected**: Failure report generated

4. **Test Circuit Breaker**
   - Simulate repeated failures to external service
   - **Expected**: Circuit breaker opens after threshold
   - **Expected**: Subsequent requests fail fast
   - **Expected**: Circuit breaker closes after timeout

5. **Test Critical Error Notification**
   - Trigger critical error (e.g., authentication system failure)
   - **Expected**: Immediate email notification to admins
   - **Expected**: Dashboard alert with red indicator

6. **Verify Error Context Capture**
   - Check error logs for any failure
   - **Expected**: Stack trace captured
   - **Expected**: Input data included
   - **Expected**: System state recorded

7. **Verify Sensitive Data Redaction**
   - Check error logs containing banking details
   - **Expected**: Banking information redacted
   - **Expected**: PII removed from logs

**Success Criteria**:
- ✅ System serves cached data when Airtable unavailable
- ✅ Email retry logic works with exponential backoff
- ✅ Batch processing continues despite individual failures
- ✅ Circuit breaker prevents cascading failures
- ✅ Critical errors trigger immediate notifications
- ✅ Error context captured comprehensively
- ✅ Sensitive data redacted in logs

---

### Workflow 9: Consultant Availability & Utilization

**Objective**: Verify availability tracking and utilization alerts

**Prerequisites**:
- Active consultants in system
- Projects with assignments

**Test Steps**:

1. **Update Consultant Availability**
   - Login as consultant
   - Update availability status to "Partially Available"
   - **Expected**: Status saved successfully

2. **Verify Airtable Sync**
   - Check Airtable talent pool record
   - **Expected**: Availability status synchronized within 30 seconds

3. **Test Skills-Based Filtering**
   - Admin searches for consultants with "Change Management" skill
   - Filter by "Available" status
   - **Expected**: Filtered list shows only matching consultants

4. **Test Automatic Availability Update**
   - Admin assigns consultant to new project
   - **Expected**: Availability status automatically updated
   - **Expected**: Projected utilization calculated

5. **Test Utilization Threshold Alert**
   - Assign consultant to projects exceeding 80% utilization
   - **Expected**: Warning alert sent to resource manager
   - Assign consultant to projects exceeding 100% utilization
   - **Expected**: Critical alert sent to resource manager

6. **Verify Talent Pool View**
   - Admin views talent pool dashboard
   - **Expected**: Current availability status displayed for all consultants
   - **Expected**: Upcoming commitments shown
   - **Expected**: Utilization percentage calculated correctly

**Success Criteria**:
- ✅ Availability updates synchronized to Airtable
- ✅ Skills-based filtering works correctly
- ✅ Automatic availability updates on project assignment
- ✅ Utilization threshold alerts triggered
- ✅ Talent pool view displays accurate data

---

### Workflow 10: SimplePay Integration

**Objective**: Verify payroll export to SimplePay format

**Prerequisites**:
- Approved consultant bills in Xero
- Finance user logged in

**Test Steps**:

1. **Trigger SimplePay Export**
   - Finance user navigates to payroll export
   - Selects period for export
   - Clicks "Generate SimplePay Export"
   - **Expected**: Export initiated

2. **Verify Data Extraction**
   - Check logs for Xero API calls
   - **Expected**: Payment details extracted from approved bills

3. **Verify Field Validation**
   - Ensure all required fields present:
     - Employee ID (SimplePay ID)
     - Payment amount
     - Tax information
   - **Expected**: Validation passes for complete records
   - **Expected**: Validation fails for incomplete records with detailed error messages

4. **Verify CSV Generation**
   - Download generated CSV file
   - **Expected**: CSV format matches SimplePay requirements
   - **Expected**: All approved payments included

5. **Verify Xero Bill Status Update**
   - Check Xero bills after export
   - **Expected**: Bills marked as "Queued for Payment"
   - **Expected**: Export timestamp logged

6. **Test Validation Error Handling**
   - Simulate consultant missing SimplePay ID
   - Attempt export
   - **Expected**: Detailed error message identifying missing data
   - **Expected**: Export fails gracefully

**Success Criteria**:
- ✅ Payment data extracted from Xero correctly
- ✅ Field validation enforces required data
- ✅ CSV generated in SimplePay format
- ✅ Xero bills updated with export status
- ✅ Validation errors provide clear guidance

---

## Performance Test Cases

### Performance Test 1: Concurrent User Load

**Objective**: Verify system handles 25 concurrent consultants

**Test Steps**:
1. Simulate 25 concurrent users logging in
2. Each user performs profile update
3. Measure response times
4. **Expected**: Page loads < 2 seconds
5. **Expected**: No errors or timeouts

### Performance Test 2: Batch Processing

**Objective**: Verify month-end processing completes within 5 minutes

**Test Steps**:
1. Populate system with 50 consultant records
2. Trigger month-end processing
3. Measure execution time
4. **Expected**: Processing completes within 5 minutes
5. **Expected**: All records processed successfully

### Performance Test 3: Database Query Performance

**Objective**: Verify database queries are optimized

**Test Steps**:
1. Run analytics dashboard queries
2. Measure query execution time
3. **Expected**: All queries < 1 second
4. **Expected**: Proper indexes utilized

---

## Security Test Cases

### Security Test 1: OTP Security

**Test Steps**:
1. Generate OTP code
2. Wait 11 minutes
3. Attempt to use expired OTP
4. **Expected**: Authentication rejected

5. Use valid OTP once
6. Attempt to reuse same OTP
7. **Expected**: Authentication rejected

### Security Test 2: Session Security

**Test Steps**:
1. Login and obtain session token
2. Wait 25 hours
3. Attempt to use expired session
4. **Expected**: Session invalid, re-authentication required

### Security Test 3: Authorization Bypass Attempts

**Test Steps**:
1. Login as consultant
2. Manually craft request to admin endpoint
3. **Expected**: Request rejected with 403 Forbidden
4. **Expected**: Attempt logged in audit trail

### Security Test 4: Webhook Signature Validation

**Test Steps**:
1. Send webhook with missing signature
2. **Expected**: Request rejected
3. Send webhook with invalid signature
4. **Expected**: Request rejected
5. Send webhook with tampered payload
6. **Expected**: Request rejected

---

## Data Integrity Test Cases

### Data Integrity Test 1: Audit Trail Completeness

**Test Steps**:
1. Perform various actions (login, profile update, financial operation)
2. Check audit logs
3. **Expected**: All actions logged with complete context
4. **Expected**: Timestamps accurate
5. **Expected**: User attribution correct

### Data Integrity Test 2: Airtable-PostgreSQL Consistency

**Test Steps**:
1. Update data in Airtable
2. Wait for cache invalidation (60 seconds)
3. Fetch data from Consultant Gateway
4. **Expected**: Data matches Airtable
5. **Expected**: Cache refreshed

### Data Integrity Test 3: Financial Data Accuracy

**Test Steps**:
1. Create invoices and bills
2. Verify amounts match Harvest hours
3. Verify consultant costs match rates
4. **Expected**: All calculations accurate
5. **Expected**: No rounding errors

---

## Regression Test Cases

### Regression Test 1: OTP Authentication Flow

**Test Steps**:
1. Complete OTP authentication flow
2. Verify all steps work as before
3. **Expected**: No regressions in authentication

### Regression Test 2: Profile Management

**Test Steps**:
1. Update profile with various data types
2. Verify Airtable sync
3. **Expected**: All profile features working

### Regression Test 3: Financial Automation

**Test Steps**:
1. Run month-end processing
2. Verify invoices and bills created
3. **Expected**: Financial automation working correctly

---

## UAT Sign-Off Criteria

### Functional Completeness
- ✅ All critical workflows tested and passing
- ✅ All user roles tested and working
- ✅ All integrations tested and functional

### Performance
- ✅ Response times meet requirements (< 2 seconds)
- ✅ Batch processing completes within limits (< 5 minutes)
- ✅ System handles 25+ concurrent users

### Security
- ✅ Authentication and authorization working correctly
- ✅ Sensitive data encrypted and redacted
- ✅ Audit trail complete and accurate

### Data Integrity
- ✅ Data synchronization working correctly
- ✅ Financial calculations accurate
- ✅ No data loss or corruption

### Error Handling
- ✅ Errors handled gracefully
- ✅ Retry logic working correctly
- ✅ Admin notifications triggered appropriately

### User Experience
- ✅ UI intuitive and responsive
- ✅ Error messages clear and helpful
- ✅ Workflows smooth and efficient

---

## Known Issues and Limitations

### Pending Items
1. Task 26: Webhook Signature Validation - Implementation incomplete
2. Some model specs pending (AirtableCache, AuditLog, Consultant, OtpCode, ProjectAssignment, Project, Session, Tender)

### Limitations
1. SimplePay integration requires manual CSV upload to SimplePay system
2. Google Drive folder creation requires service account with appropriate permissions
3. Xero OAuth tokens require periodic refresh

---

## UAT Schedule

### Week 1: Setup and Training
- Day 1-2: Environment setup and test data preparation
- Day 3: UAT training session for test team
- Day 4-5: Test team familiarization with system

### Week 2: Critical Workflow Testing
- Day 1: Workflows 1-3 (Onboarding, Profile, Financial)
- Day 2: Workflows 4-6 (Tender, Project, RBAC)
- Day 3: Workflows 7-8 (Analytics, Error Handling)
- Day 4: Workflows 9-10 (Availability, SimplePay)
- Day 5: Performance and security testing

### Week 3: Regression and Sign-Off
- Day 1-2: Regression testing
- Day 3: Bug fixes and retesting
- Day 4: Final validation
- Day 5: UAT sign-off meeting

---

## Contact Information

### Support During UAT
- **Technical Lead**: Available for technical issues
- **Product Owner**: Available for functional questions
- **Test Coordinator**: Manages UAT schedule and reporting

### Issue Reporting
- **Critical Issues**: Immediate notification via email/Slack
- **High Priority**: Report within 4 hours
- **Medium/Low Priority**: Daily summary report

---

## Appendix: Test Data

### Sample Consultant Data
```
Name: John Smith
Email: john.smith@test.uptimeconsulting.co.za
ID Number: 8001015009087
Phone: +27 82 123 4567
Bank: FNB
Account: 62123456789
Branch Code: 250655
Skills: ["Change Management", "Project Management", "Stakeholder Engagement"]
```

### Sample Project Data
```
Client: Acme Corporation
Project: Digital Transformation Initiative
Start Date: 2025-01-01
End Date: 2025-06-30
Budget: R 500,000
```

### Sample Tender Data
```
Reference: TENDER-2025-001
Title: Government Change Management Services
Value: R 2,000,000
Deadline: 2025-02-28
Required Capabilities: ["Change Management", "Training", "Communication"]
```
