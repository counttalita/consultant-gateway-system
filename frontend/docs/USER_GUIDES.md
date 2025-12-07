# User Guides

Role-specific guides for using the Consultant Gateway application.

## Table of Contents

- [Consultant Guide](#consultant-guide)
- [Admin Guide](#admin-guide)
- [Finance Guide](#finance-guide)

---

## Consultant Guide

### Getting Started

#### First Login

1. Navigate to the login page
2. Enter your email address
3. Click "Send Code"
4. Check your email for the 6-digit verification code
5. Enter the code and click "Verify & Login"
6. You'll be redirected to the onboarding wizard (first-time users) or dashboard

#### Onboarding Process

New consultants must complete the onboarding wizard:

**Step 1: Personal Information**
- Full name
- South African ID number
- Phone number

**Step 2: Skills & Experience**
- List your technical skills
- Years of experience
- Areas of expertise

**Step 3: Banking Details**
- Bank name
- Account number
- Branch code
- Account type

**Step 4: Contract Review**
- Review consultant agreement
- Accept terms and conditions

### Managing Your Profile

#### Viewing Your Profile

1. Click on your name in the top navigation
2. Select "Profile" from the dropdown
3. View your current profile information across three tabs:
   - Profile (bio, skills, experience)
   - Banking (payment details)
   - CV Upload (document management)

#### Updating Profile Information

1. Navigate to your profile page
2. Click the "Profile" tab
3. Edit the fields you want to update:
   - Bio (max 1000 characters)
   - Skills (comma-separated)
   - Years of experience
   - Qualifications
4. Click "Save Changes"
5. Wait for confirmation message

#### Updating Banking Details

1. Navigate to your profile page
2. Click the "Banking" tab
3. Update your banking information:
   - Bank name
   - Account number (10-11 digits)
   - Branch code (6 digits)
   - Account type
4. Click "Save Changes"
5. Verify the success message

#### Uploading Your CV

1. Navigate to your profile page
2. Click the "CV Upload" tab
3. Drag and drop your CV file or click to browse
4. Supported formats: PDF, DOCX
5. Wait for the upload to complete
6. Review the automatically extracted information:
   - Skills
   - Experience
   - Qualifications
7. Confirm or edit the extracted data
8. Click "Confirm" to update your profile

### Managing Availability

#### Viewing Current Availability

1. Navigate to "Availability" from the main menu
2. View your current status:
   - Available
   - Partially Available
   - Unavailable
3. See your utilization percentage
4. Review current project assignments

#### Updating Availability Status

1. Go to the Availability page
2. Select your new status from the dropdown:
   - **Available**: Ready for new projects
   - **Partially Available**: Limited capacity
   - **Unavailable**: Not available for projects
3. Click "Update Status"
4. Your status will sync with Airtable automatically

#### Understanding Utilization

Your utilization is calculated as:
```
Utilization = (Allocated Hours / Total Available Hours) × 100
```

- **Green (0-75%)**: Good availability
- **Yellow (76-90%)**: Limited availability
- **Red (91-100%)**: Fully utilized

### Dashboard Overview

Your consultant dashboard shows:

- **Profile Completion**: Percentage of profile fields completed
- **Current Availability**: Your availability status
- **Utilization**: Current capacity usage
- **Active Projects**: Projects you're assigned to
- **Quick Actions**: Common tasks

### Troubleshooting

#### Can't Login

- Verify your email address is correct
- Check spam folder for OTP email
- Wait 60 seconds before requesting a new code
- Contact support if issues persist

#### CV Upload Fails

- Ensure file is PDF or DOCX format
- Check file size is under 10MB
- Try a different browser
- Contact support with error message

#### Profile Changes Not Saving

- Check for validation errors (red text)
- Ensure all required fields are filled
- Try refreshing the page
- Contact support if problem continues

---

## Admin Guide

### Dashboard Overview

The admin dashboard provides system-wide monitoring:

- **Active Users**: Current active user count
- **Recent Logins**: Login activity in last 24 hours
- **System Status**: Overall integration health
- **Data Quality**: Profile completion metrics

#### Auto-Refresh

- Dashboard auto-refreshes every 60 seconds
- Toggle auto-refresh on/off with checkbox
- Manual refresh available via "Refresh" button

### User Management

#### Viewing Users

1. Navigate to "Users" from admin menu
2. View list of all users with:
   - Email address
   - Roles
   - Status (Active/Inactive)
   - Created date

#### Filtering Users

Use filters to find specific users:
- **Role**: Filter by consultant, admin, finance
- **Status**: Active or inactive users
- **Search**: Search by email or name

#### Viewing User Details

1. Click on a user in the list
2. View detailed information:
   - Contact details
   - Role assignments
   - Activity history
   - Profile completion

#### Managing User Roles

1. Navigate to user details page
2. Click "Edit Roles"
3. Select/deselect roles:
   - Consultant
   - Admin
   - Finance
4. Click "Save Roles"
5. User will have new permissions immediately

#### Deactivating Users

1. Go to user details page
2. Click "Deactivate User"
3. Confirm the action
4. User will no longer be able to log in

### Talent Pool Management

#### Viewing Available Consultants

1. Navigate to "Talent Pool"
2. View all consultants with:
   - Name and contact info
   - Skills
   - Availability status
   - Current utilization

#### Filtering Consultants

Filter by:
- **Skills**: Find consultants with specific skills
- **Availability**: Available, Partially Available, Unavailable
- **Utilization**: Filter by capacity

#### Assigning Consultants to Projects

1. Find consultant in talent pool
2. Click "Assign to Project"
3. Select project from dropdown
4. Enter allocated hours
5. Click "Assign"
6. Assignment syncs to Airtable and ClickUp

### Project Management

#### Viewing Projects

1. Navigate to "Projects"
2. View all projects with:
   - Project name
   - Client
   - Status
   - Start/end dates
   - Assigned consultants

#### Viewing Project Details

1. Click on a project
2. View:
   - Full project information
   - Assigned consultants with hours
   - Integration links (ClickUp, Google Drive)
   - Financial metrics

#### Managing Project Assignments

1. Go to project details
2. Click "Manage Assignments"
3. Add consultants:
   - Select consultant
   - Enter allocated hours
   - Click "Add"
4. Remove consultants:
   - Click "Remove" next to consultant
   - Confirm removal

### Tender Management

#### Viewing Tenders

1. Navigate to "Tenders"
2. View opportunities with:
   - Title
   - Bid score
   - Bid decision (Bid/No Bid/Review)
   - Status

#### Reviewing Tender Details

1. Click on a tender
2. View:
   - Full tender description
   - Bid score breakdown
   - Recommended decision
   - Required skills

#### Overriding Bid Decisions

1. Go to tender details
2. Click "Override Decision"
3. Select new decision:
   - Bid
   - No Bid
   - Review
4. Enter reason for override
5. Click "Save"

### Audit Logs

#### Viewing Activity Logs

1. Navigate to "Audit Logs"
2. View chronological list of system activities

#### Filtering Logs

Filter by:
- **User**: Specific user's actions
- **Action Type**: Login, update, delete, etc.
- **Date Range**: Custom date range

#### Exporting Logs

1. Apply desired filters
2. Click "Export"
3. Choose format (CSV or Excel)
4. File will download automatically

### System Configuration

#### Viewing Configuration

1. Navigate to "System Config"
2. View current settings:
   - Feature flags
   - Integration settings
   - System parameters

#### Updating Configuration

1. Click "Edit Configuration"
2. Modify settings as needed
3. Click "Save Changes"
4. Click "Reload Configuration" to apply

---

## Finance Guide

### Dashboard Overview

The finance dashboard provides financial metrics:

- **Current Month Revenue**: Total revenue for current month
- **Outstanding Invoices**: Total unpaid invoices
- **Average Utilization**: Consultant capacity usage
- **Active Consultants**: Number of active consultants

### Revenue Metrics

#### Viewing Revenue

1. Navigate to Finance Dashboard
2. View revenue metrics:
   - Current month total
   - Previous month comparison
   - Trend percentage
   - Breakdown by project

#### Analyzing Trends

- Green trend: Revenue increased
- Red trend: Revenue decreased
- Percentage shows change from previous month

### Outstanding Invoices

#### Viewing Invoices

1. Check "Outstanding Invoices" section
2. View aging breakdown:
   - Current (not yet due)
   - 30 days overdue
   - 60 days overdue
   - 90+ days overdue

#### Invoice Details

Click on aging category to see:
- Client name
- Invoice amount
- Due date
- Days overdue

### Consultant Utilization

#### Viewing Utilization

1. Scroll to "Consultant Utilization" section
2. View table with:
   - Consultant name
   - Billable hours
   - Total hours
   - Utilization percentage

#### Understanding Metrics

- **Billable Hours**: Hours assigned to client projects
- **Total Hours**: Total available hours
- **Utilization**: Billable / Total × 100

### Project Profitability

#### Viewing Project Metrics

1. Check "Project Profitability" section
2. View for each project:
   - Revenue
   - Cost
   - Profit margin

#### Analyzing Profitability

- **Green**: Healthy margin (>30%)
- **Yellow**: Moderate margin (15-30%)
- **Red**: Low margin (<15%)

### Month-End Processing

#### Triggering Month-End

1. Navigate to "Month-End Processing"
2. Select month and year
3. Review summary of what will be processed
4. Click "Trigger Month-End"
5. Confirm the action

#### Monitoring Progress

- Progress bar shows completion
- Summary displays:
  - Invoices created
  - Bills created
  - Any errors

#### Reviewing Results

1. Check summary after completion
2. Click links to view in Xero
3. Review any failed records
4. Contact support for errors

### SimplePay Export

#### Generating Export

1. Navigate to "SimplePay Export"
2. Enter period (YYYY-MM format)
3. Click "Generate Export"
4. File downloads automatically

#### Export Contents

CSV file includes:
- Employee details
- Hours worked
- Rates
- Total amounts

#### Handling Errors

If validation fails:
- Review error messages
- Fix issues in source data
- Regenerate export

### Data Export

#### Exporting Dashboard Data

1. Select period from dropdown
2. Click "Export CSV" or "Export Excel"
3. File downloads with all dashboard data

#### Export Contents

Includes:
- Revenue metrics
- Invoice details
- Consultant utilization
- Project profitability

### Period Selection

#### Changing Period

1. Use period selector dropdown
2. Options:
   - Current month
   - Previous month
   - Last 3 months
   - Last 6 months
   - Custom range
3. Dashboard updates automatically

### Troubleshooting

#### Month-End Fails

- Check all consultants have valid banking details
- Verify project hours are logged
- Review error details
- Contact support with error codes

#### Export Fails

- Ensure period has data
- Check browser allows downloads
- Try different format (CSV vs Excel)
- Contact support if issue persists

#### Data Doesn't Match

- Verify correct period selected
- Check auto-refresh is enabled
- Manually refresh dashboard
- Contact support for discrepancies

---

## Common Tasks

### Changing Your Password

Currently, the system uses OTP authentication. No password is required.

### Updating Email Address

Contact your system administrator to update your email address.

### Getting Support

For technical support:
1. Document the issue (screenshots helpful)
2. Note any error messages
3. Email support@example.com
4. Include your user ID and timestamp

### Reporting Bugs

To report a bug:
1. Describe what you were trying to do
2. Explain what happened vs what you expected
3. Include screenshots if possible
4. Note your browser and operating system
5. Submit via support email

---

## Keyboard Shortcuts

### Global Shortcuts

- `Ctrl/Cmd + K`: Open search
- `Esc`: Close modal/drawer
- `Tab`: Navigate between fields
- `Enter`: Submit form (when in form)

### Navigation

- `Alt + H`: Go to home/dashboard
- `Alt + P`: Go to profile (consultants)
- `Alt + U`: Go to users (admins)

---

## Browser Compatibility

### Supported Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile Support

The application is fully responsive and works on:
- iOS 14+ (Safari, Chrome)
- Android 10+ (Chrome, Firefox)

### Recommended Setup

- Use latest browser version
- Enable JavaScript
- Allow cookies
- Minimum screen resolution: 1024x768

---

## Privacy & Security

### Data Protection

- All data is encrypted in transit (HTTPS)
- Passwords are never stored (OTP-based auth)
- Session tokens expire after inactivity
- Audit logs track all actions

### Best Practices

- Don't share your OTP codes
- Log out when using shared computers
- Report suspicious activity immediately
- Keep your contact information current

---

## Glossary

- **OTP**: One-Time Password - temporary code sent via email
- **Utilization**: Percentage of available hours allocated to projects
- **Bid Score**: Automated assessment of tender suitability
- **Month-End**: Process of generating invoices and bills
- **SimplePay**: Payroll system integration
- **Airtable**: Database system for consultant records
- **Xero**: Accounting system for financial records
- **ClickUp**: Project management system
