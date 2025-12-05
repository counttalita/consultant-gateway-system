# Admin & Finance User Guide

## Overview

This guide covers administrative and financial management features of the Consultant Gateway System.

---

## Table of Contents

### Admin Functions
1. [Admin Dashboard](#admin-dashboard)
2. [User Management](#user-management)
3. [Integration Health](#integration-health)
4. [System Configuration](#system-configuration)
5. [Audit Logs](#audit-logs)

### Finance Functions
6. [Finance Dashboard](#finance-dashboard)
7. [Month-End Processing](#month-end-processing)
8. [SimplePay Export](#simplepay-export)
9. [Financial Reports](#financial-reports)

### Common Functions
10. [Talent Pool Management](#talent-pool-management)
11. [Project Management](#project-management)
12. [Tender Management](#tender-management)

---

## Admin Dashboard

### Accessing the Dashboard

1. Log in with admin credentials
2. Navigate to "Admin Dashboard"
3. View system metrics and health

### Key Metrics

**Active Users**
- Total active consultants
- Recent logins (last 24 hours)
- Onboarding in progress

**Integration Health**
- Airtable: Connection status, last sync
- Xero: Connection status, last sync
- Harvest: Connection status, last sync
- ClickUp: Connection status, last sync
- Google Drive: Connection status
- Resend: Email delivery status

**Activity Trends**
- Login trends (last 7 days)
- Profile updates (last 7 days)
- Onboarding completions (last 30 days)

**Error Summary**
- Critical errors: 0 (immediate attention)
- High priority: Count
- Medium priority: Count
- Low priority: Count

### Data Quality Assessment

**Incomplete Profiles**
- Consultants missing bio
- Consultants missing skills
- Consultants missing banking details

**Pending Onboarding**
- Consultants in onboarding
- Stuck at specific steps
- Time in onboarding

### Actions

- Click on metrics for detailed views
- Drill down into errors for full context
- Export data for reporting
- Refresh dashboard for latest data

---

## User Management

### Viewing Users

1. Navigate to "Users" in admin menu
2. View list of all users
3. Filter by role, status, or search

### User Roles

**Consultant**
- External consultants
- Can only have consultant role
- Restricted to own profile

**Admin**
- Full system access
- User management
- System configuration

**Finance**
- Financial dashboards
- Invoice/bill management
- Payment processing

**User**
- Basic internal staff
- View-only access
- No administrative functions

### Creating Users

1. Click "Add User"
2. Enter email address
3. Select role(s) for internal staff
4. Click "Create"
5. User receives OTP setup email

### Updating User Roles

1. Find user in list
2. Click "Edit Roles"
3. Add or remove roles (internal staff only)
4. Click "Save"

**Restrictions:**
- Cannot modify consultant roles
- Cannot modify own roles
- Changes are audit logged

### Deactivating Users

1. Find user in list
2. Click "Deactivate"
3. Confirm action
4. User can no longer log in

**Note:** Deactivation is reversible. Reactivate anytime.

---

## Integration Health

### Monitoring Integrations

1. Navigate to "Integration Health"
2. View status of all external services
3. Check last successful sync times
4. Review error counts

### Integration Status

**Healthy (Green)**
- Service responding normally
- Recent successful operations
- No errors in last 24 hours

**Degraded (Yellow)**
- Service responding slowly
- Some errors in last 24 hours
- May need attention

**Down (Red)**
- Service not responding
- Multiple consecutive failures
- Immediate attention required

### Troubleshooting

**Airtable Issues**
- Check API key validity
- Verify base ID configuration
- Review rate limit status
- Check cache fallback working

**Xero Issues**
- Refresh OAuth tokens
- Verify tenant ID
- Check API rate limits
- Review failed operations

**Harvest Issues**
- Verify access token
- Check account ID
- Review API rate limits

**ClickUp Issues**
- Verify API token
- Check team/space IDs
- Review template availability

**Google Drive Issues**
- Verify service account credentials
- Check folder permissions
- Review API quotas

**Resend Issues**
- Verify API key
- Check email delivery rates
- Review bounce/complaint rates

### Manual Sync

If automatic sync fails:
1. Navigate to integration settings
2. Click "Manual Sync"
3. Select data to sync
4. Monitor progress
5. Review results

---

## System Configuration

### Accessing Configuration

1. Navigate to "System Config"
2. View current settings
3. Make changes as needed
4. Click "Save"

### Configuration Options

**Environment**
- Current environment (dev/staging/qa/production)
- Version information
- Deployment details

**Features**
- CV parsing: Enabled/Disabled
- SimplePay export: Enabled/Disabled
- Zapier integration: Enabled/Disabled

**Integrations**
- API keys and credentials
- Endpoint URLs
- Timeout settings
- Retry configurations

### Reloading Configuration

After making changes:
1. Click "Reload Configuration"
2. System reloads without restart
3. Verify changes applied
4. Test affected features

**Note:** Some changes may require application restart.

---

## Audit Logs

### Viewing Audit Logs

1. Navigate to "Audit Logs"
2. View recent activity
3. Filter and search logs

### Filter Options

**By User**
- Select specific user
- View all their actions

**By Action**
- login, logout
- profile_update
- invoice_created, bill_created
- project_created, tender_created

**By Resource**
- User, Consultant, Project, Tender
- View all actions on specific resource

**By Date Range**
- Last 24 hours
- Last 7 days
- Last 30 days
- Custom range

### Log Details

Each log entry includes:
- Timestamp
- User who performed action
- Action type
- Resource affected
- Old/new values (for updates)
- IP address
- Additional metadata

### Exporting Logs

1. Apply desired filters
2. Click "Export"
3. Select format (CSV/Excel)
4. Download file

**Use cases:**
- Compliance audits
- Security investigations
- Troubleshooting
- Reporting

---

## Finance Dashboard

### Accessing Finance Dashboard

1. Log in with finance role
2. Navigate to "Finance Dashboard"
3. View financial metrics

### Key Metrics

**Current Month Revenue**
- Total invoiced amount
- Breakdown by project
- Comparison to previous month

**Outstanding Invoices**
- Total amount outstanding
- Aging breakdown (30/60/90 days)
- Overdue invoices highlighted

**Pending Payments**
- Consultant bills awaiting payment
- Total amount
- Payment due dates

**Consultant Utilization**
- Billable hours per consultant
- Utilization percentage
- Revenue per consultant

**Project Profitability**
- Revenue vs. cost per project
- Margin percentage
- Most/least profitable projects

### Payment Aging Report

**30 Days**
- Invoices 0-30 days old
- Generally on track

**60 Days**
- Invoices 31-60 days old
- May need follow-up

**90+ Days**
- Invoices over 60 days old
- Require immediate attention

### Actions

- Click on metrics for details
- Export data for analysis
- Generate reports
- Send payment reminders

---

## Month-End Processing

### Overview

Month-end processing automates:
1. Retrieving approved hours from Harvest
2. Creating client invoices in Xero
3. Creating consultant bills in Xero
4. Sending summary to finance team

### Manual Trigger

1. Navigate to "Finance" > "Month-End"
2. Select month and year
3. Click "Process Month-End"
4. Monitor progress
5. Review summary

### Automatic Schedule

- Runs automatically on 1st of each month
- Processes previous month
- Sends notification when complete

### Process Steps

**Step 1: Retrieve Hours**
- Connects to Harvest
- Gets approved time entries
- Groups by project and consultant

**Step 2: Create Invoices**
- Calculates amounts (hours × rates)
- Groups by project for client billing
- Creates draft invoices in Xero

**Step 3: Create Bills**
- Calculates consultant payments
- Creates draft bills in Xero
- Links to corresponding invoices

**Step 4: Notify**
- Compiles summary
- Sends email to finance team
- Includes counts and totals

### Reviewing Results

1. Check email for summary
2. Log into Xero
3. Review draft invoices
4. Review draft bills
5. Approve for payment

### Handling Errors

If processing fails:
- Check error report
- Review failed records
- Fix issues (missing data, etc.)
- Reprocess failed records
- Or process manually in Xero

### Batch Processing Resilience

- Individual failures don't stop processing
- System continues with remaining records
- Failure report generated
- Failed records marked for manual review

---

## SimplePay Export

### Overview

SimplePay export generates CSV files for payroll processing.

### Generating Export

1. Navigate to "Finance" > "SimplePay Export"
2. Select period (month/year)
3. Click "Generate Export"
4. Wait for processing
5. Download CSV file

### Export Process

**Step 1: Extract Data**
- Gets approved bills from Xero
- Extracts payment details
- Validates consultant SimplePay IDs

**Step 2: Validate**
- Checks all required fields present
- Validates amounts and tax
- Ensures SimplePay IDs exist

**Step 3: Generate CSV**
- Formats data per SimplePay requirements
- Includes: Employee ID, Amount, Tax, Date
- Generates file

**Step 4: Update Status**
- Marks Xero bills as "Queued for Payment"
- Logs export timestamp
- Creates audit log

### CSV Format

```csv
Employee ID,Payment Amount,Tax Amount,Payment Date,Description
EMP001,50000.00,7500.00,2025-01-31,January Consulting Fees
```

### Uploading to SimplePay

1. Download CSV from portal
2. Log into SimplePay
3. Navigate to bulk import
4. Upload CSV file
5. Review and confirm
6. Process payments

### Validation Errors

If validation fails:
- Review error messages
- Identify missing data
- Update consultant records
- Regenerate export

**Common issues:**
- Missing SimplePay ID
- Invalid tax number
- Missing banking details

---

## Financial Reports

### Available Reports

**Revenue Report**
- Monthly revenue breakdown
- By project, consultant, client
- Trend analysis

**Utilization Report**
- Consultant utilization rates
- Billable vs. available hours
- Capacity planning

**Profitability Report**
- Project margins
- Cost analysis
- ROI calculations

**Payment Aging Report**
- Outstanding invoices
- Aging breakdown
- Collection metrics

### Generating Reports

1. Navigate to "Reports"
2. Select report type
3. Choose date range
4. Apply filters
5. Click "Generate"
6. View or export

### Export Formats

- **CSV**: For Excel analysis
- **Excel**: Formatted spreadsheets
- **PDF**: For sharing/printing

### Scheduled Reports

Set up automatic reports:
1. Navigate to "Scheduled Reports"
2. Click "New Schedule"
3. Select report type
4. Choose frequency (daily/weekly/monthly)
5. Add recipients
6. Save

---

## Talent Pool Management

### Viewing Talent Pool

1. Navigate to "Talent Pool"
2. View all consultants
3. See availability and skills

### Filtering Consultants

**By Availability**
- Available
- Partially Available
- Unavailable

**By Skills**
- Enter required skills
- See matching consultants
- View skill proficiency

**By Utilization**
- Set min/max utilization
- Find consultants with capacity
- Plan resource allocation

### Consultant Details

Click on consultant to view:
- Full profile
- Skills and experience
- Current projects
- Utilization percentage
- Availability status
- Upcoming commitments

### Assigning to Projects

1. Find available consultant
2. Click "Assign to Project"
3. Select project
4. Set role and hours
5. Set start/end dates
6. Click "Assign"

**Automatic Updates:**
- Availability status updated
- Utilization recalculated
- Alerts sent if over-utilized

---

## Project Management

### Viewing Projects

1. Navigate to "Projects"
2. View all projects
3. Filter by status or client

### Project Statuses

- **Setup**: Being created
- **Active**: In progress
- **Completed**: Finished
- **Archived**: Historical

### Project Details

For each project:
- Client name
- Project title
- Start/end dates
- Assigned consultants
- ClickUp project link
- Google Drive folder link
- Airtable deal link

### Creating Projects Manually

1. Click "New Project"
2. Enter project details
3. Assign consultants
4. Set up integrations
5. Click "Create"

**Automatic Setup:**
- ClickUp project created
- Google Drive folders created
- Airtable updated
- Team notified

### Managing Assignments

**Add Consultant:**
1. Open project
2. Click "Add Consultant"
3. Select consultant
4. Set role and hours
5. Save

**Remove Consultant:**
1. Open project
2. Find assignment
3. Click "Remove"
4. Confirm

**Update Assignment:**
1. Open project
2. Click on assignment
3. Update details
4. Save

---

## Tender Management

### Viewing Tenders

1. Navigate to "Tenders"
2. View all opportunities
3. Filter by status or source

### Tender Statuses

- **Pending**: Awaiting decision
- **Pursue**: Approved for bidding
- **Decline**: Not pursuing

### Tender Details

For each tender:
- Reference number
- Title and description
- Source portal
- Tender value
- Submission deadline
- Required capabilities
- Bid score
- Decision rationale

### Bid/No-Bid Evaluation

**Automatic Scoring:**
- Scope fit (30%)
- Capacity (25%)
- Budget (25%)
- Timeline (20%)

**Decision Threshold:**
- Score ≥ 6.5: Recommend Pursue
- Score < 6.5: Recommend Decline

### Manual Review

1. Open tender
2. Review details and score
3. Override decision if needed
4. Add rationale
5. Save

### Creating Bid Tasks

For "Pursue" tenders:
1. Tender creates ClickUp task automatically
2. Assigned to BD team
3. Includes deadline
4. Links to tender details

### Archiving Tenders

For declined tenders:
1. Open tender
2. Click "Archive"
3. Add decision rationale
4. Confirm

**Archived tenders:**
- Removed from active list
- Searchable for reference
- Include decision history

---

## Best Practices

### Admin

1. **Monitor daily** - Check dashboard for issues
2. **Review errors** - Address critical errors immediately
3. **Audit regularly** - Review logs for unusual activity
4. **Keep integrations healthy** - Monitor and maintain connections
5. **Manage users promptly** - Process requests quickly

### Finance

1. **Run month-end on time** - Process by 5th of month
2. **Review before approving** - Check invoices/bills carefully
3. **Follow up on aging** - Contact clients with overdue invoices
4. **Reconcile regularly** - Match system to Xero
5. **Export for backup** - Keep financial data exports

### Both

1. **Communicate** - Keep team informed of issues
2. **Document** - Note unusual situations
3. **Train** - Help consultants use system effectively
4. **Improve** - Suggest enhancements
5. **Secure** - Protect sensitive data

---

## Troubleshooting

### Common Issues

**"Integration showing as down"**
- Check API credentials
- Verify network connectivity
- Review error logs
- Contact integration support

**"Month-end processing failed"**
- Check Harvest/Xero connectivity
- Review error report
- Fix missing data
- Reprocess or manual entry

**"SimplePay export has errors"**
- Review validation messages
- Update consultant records
- Ensure SimplePay IDs present
- Regenerate export

**"User can't log in"**
- Verify user is active
- Check email address correct
- Test OTP delivery
- Check spam filters

### Getting Help

**Technical Support**
- Email: support@uptimeconsulting.co.za
- Phone: +27 11 123 4567

**Integration Issues**
- Check integration health dashboard
- Review audit logs
- Contact vendor support if needed

**Financial Questions**
- Consult finance team lead
- Review Xero documentation
- Check SimplePay guides

---

## Security & Compliance

### Data Protection

- All data encrypted in transit and at rest
- Banking details specially encrypted
- Access logged and audited
- Regular security reviews

### Access Control

- Role-based permissions
- Least privilege principle
- Regular access reviews
- Immediate revocation on departure

### Audit Compliance

- Comprehensive audit logs
- Retention per policy
- Available for compliance reviews
- Exportable for auditors

### POPIA Compliance

- Personal data protected
- Consent managed
- Data subject rights supported
- Breach notification procedures

---

## Appendix

### Keyboard Shortcuts

- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + /`: Help
- `Esc`: Close modal

### API Access

For advanced users:
- API documentation available
- API keys in settings
- Rate limits apply
- Audit logged

### Support Resources

- User guides: /docs
- API docs: /api/docs
- Video tutorials: [link]
- Knowledge base: [link]

---

## Version History

- **v1.0** (December 2025): Initial release

---

Thank you for managing the Consultant Gateway System!
