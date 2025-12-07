# Render Setup Guide

This guide walks through the complete setup process for deploying the Consultant Gateway System on Render.

## Prerequisites

- GitHub account with repository access
- Render account (sign up at https://render.com)
- Access to all third-party service credentials (Airtable, Xero, Harvest, etc.)

## Step-by-Step Setup

### 1. Prepare Your Repository

Ensure your repository has the following files:
- `render.yaml` - Render Blueprint configuration
- `bin/render-build.sh` - Build script (must be executable)
- `Procfile` - Process definitions
- Environment example files (`.env.*.example`)

### 2. Create Render Account and Connect GitHub

1. Go to https://render.com and sign up
2. Navigate to Account Settings → GitHub
3. Click "Connect GitHub Account"
4. Authorize Render to access your repositories

### 3. Deploy Using Blueprint

1. In Render Dashboard, click "New" → "Blueprint"
2. Select your GitHub repository
3. Render will detect the `render.yaml` file
4. Review the services that will be created:
   - 4 Web Services (production, qa, staging, dev)
   - 4 Worker Services (production, qa, staging, dev)
   - 4 PostgreSQL Databases
   - 4 Redis Instances

5. Click "Apply" to create all services

**Note**: This will create all services but they won't be fully functional until environment variables are configured.

### 4. Configure Environment Variables

For each environment (production, qa, staging, dev), configure the following:

#### Web and Worker Services

Navigate to each service → Environment tab and add:

##### Rails Configuration
```
RAILS_MASTER_KEY=<your-master-key>
RAILS_LOG_LEVEL=info (production) or debug (others)
```

##### Airtable Configuration
```
AIRTABLE_API_KEY=<your-api-key>
AIRTABLE_BASE_ID=<your-base-id>
AIRTABLE_TIMEOUT=30
```

##### Xero Configuration
```
XERO_CLIENT_ID=<your-client-id>
XERO_CLIENT_SECRET=<your-client-secret>
XERO_TENANT_ID=<your-tenant-id>
XERO_REDIRECT_URI=https://<environment>.uptimeconsulting.co.za/auth/xero/callback
```

##### Harvest Configuration
```
HARVEST_ACCOUNT_ID=<your-account-id>
HARVEST_ACCESS_TOKEN=<your-access-token>
HARVEST_TIMEOUT=30
```

##### ClickUp Configuration
```
CLICKUP_API_TOKEN=<your-api-token>
CLICKUP_TEAM_ID=<your-team-id>
CLICKUP_TIMEOUT=30
```

##### Google Drive Configuration
```
GOOGLE_DRIVE_CREDENTIALS=<service-account-json>
GOOGLE_DRIVE_FOLDER_ID=<root-folder-id>
```

##### Resend Configuration
```
RESEND_API_KEY=<your-api-key>
RESEND_FROM_EMAIL=<environment>@uptimeconsulting.co.za
RESEND_FROM_NAME=Up Time Consulting (<Environment>)
```

##### SimplePay Configuration
```
SIMPLEPAY_API_KEY=<your-api-key>
SIMPLEPAY_COMPANY_ID=<your-company-id>
```

##### Application Configuration
```
APP_HOST=<environment>.uptimeconsulting.co.za
APP_PROTOCOL=https
FRONTEND_URL=https://<environment>.uptimeconsulting.co.za
CORS_ORIGINS=https://<environment>.uptimeconsulting.co.za
```

##### OTP Configuration
```
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=3
OTP_RATE_LIMIT_PER_HOUR=3
```

##### Session Configuration
```
SESSION_EXPIRY_HOURS=24
```

##### Cache Configuration
```
CACHE_TTL_MINUTES=5
CACHE_STALE_SERVE_ENABLED=true
```

##### Retry Configuration
```
MAX_RETRIES=3
BASE_RETRY_DELAY_SECONDS=1
```

##### Circuit Breaker Configuration
```
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT_SECONDS=60
```

##### Notification Configuration
```
ADMIN_NOTIFICATION_EMAILS=admin@uptimeconsulting.co.za
FINANCE_NOTIFICATION_EMAILS=finance@uptimeconsulting.co.za
```

### 5. Configure GitHub Secrets

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```
RENDER_API_KEY=<your-render-api-key>

# Production
RENDER_WEB_SERVICE_ID_PRODUCTION=<service-id>
RENDER_WORKER_SERVICE_ID_PRODUCTION=<service-id>

# QA
RENDER_WEB_SERVICE_ID_QA=<service-id>
RENDER_WORKER_SERVICE_ID_QA=<service-id>

# Staging
RENDER_WEB_SERVICE_ID_STAGING=<service-id>
RENDER_WORKER_SERVICE_ID_STAGING=<service-id>

# Development
RENDER_WEB_SERVICE_ID_DEV=<service-id>
RENDER_WORKER_SERVICE_ID_DEV=<service-id>
```

To get service IDs:
1. Go to Render Dashboard
2. Click on a service
3. Copy the ID from the URL (e.g., `srv-xxxxxxxxxxxxx`)

To get Render API key:
1. Go to Account Settings → API Keys
2. Create a new API key
3. Copy and save it securely

### 6. Configure Custom Domains (Optional)

For each environment:

1. Go to service → Settings → Custom Domain
2. Add your domain (e.g., `app.uptimeconsulting.co.za` for production)
3. Configure DNS records as instructed by Render:
   - Add CNAME record pointing to Render's domain
   - Wait for DNS propagation (can take up to 48 hours)
4. Render will automatically provision SSL certificate

### 7. Initial Deployment

#### Development Environment
Development auto-deploys when you push to the `dev` branch:

```bash
git checkout dev
git push origin dev
```

#### Staging Environment
Staging auto-deploys when you push to the `staging` branch:

```bash
git checkout staging
git merge dev
git push origin staging
```

#### QA Environment
QA requires manual deployment:

1. Merge staging into qa:
   ```bash
   git checkout qa
   git merge staging
   git push origin qa
   ```

2. Manually deploy in Render Dashboard:
   - Navigate to QA web service
   - Click "Manual Deploy"
   - Select `qa` branch
   - Click "Deploy"
   - Repeat for QA worker service

#### Production Environment
Production requires manual deployment:

1. Merge qa into main:
   ```bash
   git checkout main
   git merge qa
   git push origin main
   ```

2. Manually deploy in Render Dashboard:
   - Navigate to Production web service
   - Click "Manual Deploy"
   - Select `main` branch
   - Click "Deploy"
   - Repeat for Production worker service

### 8. Verify Deployment

Use the verification script:

```bash
./bin/verify-deployment.sh https://dev.uptimeconsulting.co.za
./bin/verify-deployment.sh https://staging.uptimeconsulting.co.za
./bin/verify-deployment.sh https://qa.uptimeconsulting.co.za
./bin/verify-deployment.sh https://app.uptimeconsulting.co.za
```

Or manually check:
- Health endpoint: `https://<environment>.uptimeconsulting.co.za/health`
- Config endpoint: `https://<environment>.uptimeconsulting.co.za/api/v1/config`

### 9. Monitor Services

#### Render Dashboard
- View logs: Service → Logs tab
- View metrics: Service → Metrics tab
- View events: Service → Events tab

#### Health Checks
Render automatically monitors the `/health` endpoint. If it fails, you'll receive notifications.

### 10. Database Seeding (Optional)

To seed the database with initial data:

1. Connect to the service shell:
   ```bash
   render shell <service-id>
   ```

2. Run seed command:
   ```bash
   bundle exec rails db:seed
   ```

## Troubleshooting

### Build Fails

**Problem**: Build fails with "Permission denied" error

**Solution**: Ensure `bin/render-build.sh` is executable:
```bash
chmod +x bin/render-build.sh
git add bin/render-build.sh
git commit -m "Make render-build.sh executable"
git push
```

### Database Connection Fails

**Problem**: Service can't connect to database

**Solution**: 
1. Verify `DATABASE_URL` is set correctly in environment variables
2. Check that database and service are in the same region
3. Verify database service is running

### Redis Connection Fails

**Problem**: Background jobs aren't processing

**Solution**:
1. Verify `REDIS_URL` is set correctly
2. Check Redis service status
3. Verify worker service is running
4. Check worker logs for errors

### External API Errors

**Problem**: Integration with Airtable/Xero/etc. fails

**Solution**:
1. Verify API keys are correct
2. Check you're using the right environment (sandbox vs production)
3. Verify API endpoints are accessible from Render
4. Check rate limits

### Asset Compilation Fails

**Problem**: Assets don't compile during build

**Solution**:
1. Ensure `RAILS_ENV` is set correctly
2. Check that all asset dependencies are in Gemfile
3. Verify Node.js is available during build

## Maintenance

### Updating Environment Variables

1. Go to service → Environment tab
2. Update the variable
3. Click "Save Changes"
4. Service will automatically restart

### Scaling Services

#### Vertical Scaling (Upgrade Instance)
1. Go to service → Settings
2. Change "Instance Type"
3. Click "Save Changes"

#### Horizontal Scaling (Add Instances)
1. Upgrade to Professional plan
2. Go to service → Settings
3. Increase "Number of Instances"
4. Click "Save Changes"

### Database Backups

Render automatically creates daily backups. To restore:

1. Go to database service → Backups tab
2. Select backup to restore
3. Click "Restore"

### Viewing Logs

#### Via Dashboard
1. Go to service → Logs tab
2. Use search and filters

#### Via CLI
```bash
# Install Render CLI
npm install -g @render/cli

# Login
render login

# View logs
render logs --service-id <service-id> --tail
```

## Cost Optimization

### Development Environment
- Use Starter plan ($7/month per service)
- Can be suspended when not in use

### Staging/QA Environments
- Use Starter plan ($7/month per service)
- Share database instances if possible

### Production Environment
- Use Standard plan ($25/month per service)
- Enable auto-scaling for peak loads
- Monitor usage and optimize as needed

## Security Best Practices

1. **Secrets Management**
   - Never commit secrets to Git
   - Use Render's environment variable encryption
   - Rotate API keys regularly

2. **Access Control**
   - Limit Render dashboard access
   - Use GitHub branch protection
   - Require code review before merging

3. **SSL/TLS**
   - Use Render's automatic SSL certificates
   - Force HTTPS in production

4. **Database Security**
   - Use strong passwords
   - Limit IP access if needed
   - Enable automatic backups

## Support

- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- Render Support: support@render.com
- Application Issues: Contact development team

## Next Steps

After successful deployment:

1. Configure monitoring and alerting
2. Set up log aggregation (optional)
3. Configure custom domains
4. Run initial data migrations
5. Perform user acceptance testing
6. Plan production launch

For detailed deployment procedures, see `DEPLOYMENT.md`.
