# Deployment Guide

This document provides instructions for deploying the Consultant Gateway System to Render across multiple environments.

## Environment Strategy

The system uses a four-environment deployment strategy:

1. **Development (dev)** - Active development and feature integration
2. **Staging** - Developer testing and QA preparation
3. **QA** - Client acceptance testing
4. **Production (main)** - Live system serving real users

## Promotion Path

Code must follow this strict promotion path:

```
feature/* → dev → staging → qa → main
```

Direct merges to production are prevented by branch protection rules.

## Environment Configuration

### Development Environment
- **Branch**: `dev`
- **Auto-deploy**: Enabled
- **Purpose**: Active development and feature integration
- **Database**: Shared development PostgreSQL instance
- **External Services**: Test/sandbox instances
- **URL**: https://dev.uptimeconsulting.co.za

### Staging Environment
- **Branch**: `staging`
- **Auto-deploy**: Enabled
- **Purpose**: Developer testing and QA preparation
- **Database**: Staging PostgreSQL instance
- **External Services**: Test/sandbox instances
- **URL**: https://staging.uptimeconsulting.co.za

### QA Environment
- **Branch**: `qa`
- **Auto-deploy**: Disabled (manual approval required)
- **Purpose**: Client acceptance testing
- **Database**: QA PostgreSQL instance with sanitized production data
- **External Services**: Test/sandbox instances
- **URL**: https://qa.uptimeconsulting.co.za

### Production Environment
- **Branch**: `main`
- **Auto-deploy**: Disabled (manual approval required)
- **Purpose**: Live system serving real users
- **Database**: Production PostgreSQL instance
- **External Services**: Production instances
- **URL**: https://app.uptimeconsulting.co.za

## Initial Setup on Render

### 1. Create Services

The `render.yaml` file defines all services. To deploy:

1. Log in to Render Dashboard
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Select the repository containing the `render.yaml` file
5. Render will automatically create all services defined in the blueprint

### 2. Configure Environment Variables

For each environment, configure the following secrets in Render:

#### Required Secrets (All Environments)
- `RAILS_MASTER_KEY` - Rails master key for credentials
- `AIRTABLE_API_KEY` - Airtable API key
- `AIRTABLE_BASE_ID` - Airtable base ID
- `XERO_CLIENT_ID` - Xero OAuth client ID
- `XERO_CLIENT_SECRET` - Xero OAuth client secret
- `XERO_TENANT_ID` - Xero tenant ID
- `HARVEST_ACCOUNT_ID` - Harvest account ID
- `HARVEST_ACCESS_TOKEN` - Harvest personal access token
- `CLICKUP_API_TOKEN` - ClickUp API token
- `CLICKUP_TEAM_ID` - ClickUp team/workspace ID
- `GOOGLE_DRIVE_CREDENTIALS` - Google Drive service account credentials (JSON)
- `GOOGLE_DRIVE_FOLDER_ID` - Root folder ID for project folders
- `RESEND_API_KEY` - Resend API key
- `SIMPLEPAY_API_KEY` - SimplePay API key
- `SIMPLEPAY_COMPANY_ID` - SimplePay company ID

#### Environment-Specific Configuration
- Development/Staging/QA: Use sandbox/test instances
- Production: Use production API credentials

### 3. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

- `RENDER_API_KEY` - Render API key for deployments
- `RENDER_WEB_SERVICE_ID_PRODUCTION` - Production web service ID
- `RENDER_WORKER_SERVICE_ID_PRODUCTION` - Production worker service ID
- `RENDER_WEB_SERVICE_ID_QA` - QA web service ID
- `RENDER_WORKER_SERVICE_ID_QA` - QA worker service ID
- `RENDER_WEB_SERVICE_ID_STAGING` - Staging web service ID
- `RENDER_WORKER_SERVICE_ID_STAGING` - Staging worker service ID
- `RENDER_WEB_SERVICE_ID_DEV` - Development web service ID
- `RENDER_WORKER_SERVICE_ID_DEV` - Development worker service ID

## Deployment Process

### Automatic Deployments

**Development and Staging** environments deploy automatically when code is pushed:

```bash
# Deploy to development
git push origin dev

# Deploy to staging (after merging from dev)
git checkout staging
git merge dev
git push origin staging
```

### Manual Deployments

**QA and Production** environments require manual deployment:

#### Option 1: Render Dashboard
1. Log in to Render Dashboard
2. Navigate to the service (web or worker)
3. Click "Manual Deploy"
4. Select the branch (qa or main)
5. Click "Deploy"

#### Option 2: Render CLI
```bash
# Install Render CLI
npm install -g @render/cli

# Login
render login

# Deploy to QA
render deploy --service-id <QA_WEB_SERVICE_ID>
render deploy --service-id <QA_WORKER_SERVICE_ID>

# Deploy to Production
render deploy --service-id <PRODUCTION_WEB_SERVICE_ID>
render deploy --service-id <PRODUCTION_WORKER_SERVICE_ID>
```

#### Option 3: GitHub Actions (Manual Trigger)
For QA and Production, the GitHub Actions workflow will notify that manual deployment is required. Follow the instructions in the workflow output.

## Database Migrations

Database migrations run automatically during deployment via the `bin/render-build.sh` script:

```bash
bundle exec rails db:prepare
bundle exec rails db:migrate
bundle exec rails db:migrate:cache
bundle exec rails db:migrate:queue
bundle exec rails db:migrate:cable
```

### Manual Migration Rollback

If you need to rollback a migration:

```bash
# Connect to Render shell
render shell <SERVICE_ID>

# Rollback one migration
bundle exec rails db:rollback

# Rollback multiple migrations
bundle exec rails db:rollback STEP=3
```

## Health Checks

All web services include a health check endpoint at `/health`. Render automatically monitors this endpoint.

To manually check service health:

```bash
curl https://<environment>.uptimeconsulting.co.za/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-05T10:30:00Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

## Monitoring and Logs

### Viewing Logs

#### Render Dashboard
1. Navigate to the service
2. Click "Logs" tab
3. Filter by time range or search terms

#### Render CLI
```bash
# View web service logs
render logs --service-id <SERVICE_ID> --tail

# View worker service logs
render logs --service-id <WORKER_SERVICE_ID> --tail
```

### Monitoring Metrics

Render provides built-in metrics:
- CPU usage
- Memory usage
- Request count
- Response time
- Error rate

Access metrics in the Render Dashboard under the "Metrics" tab for each service.

## Troubleshooting

### Build Failures

If the build fails:

1. Check the build logs in Render Dashboard
2. Verify all environment variables are set correctly
3. Ensure `bin/render-build.sh` has execute permissions:
   ```bash
   chmod +x bin/render-build.sh
   ```
4. Test the build locally:
   ```bash
   ./bin/render-build.sh
   ```

### Database Connection Issues

If the service can't connect to the database:

1. Verify `DATABASE_URL` is set correctly
2. Check database service status in Render Dashboard
3. Verify database is in the same region as the web/worker service
4. Check database connection limits

### Redis Connection Issues

If background jobs aren't processing:

1. Verify `REDIS_URL` is set correctly
2. Check Redis service status in Render Dashboard
3. Verify Redis maxmemory policy is set to `allkeys-lru`
4. Check Sidekiq logs for connection errors

### External API Integration Issues

If external services (Airtable, Xero, etc.) aren't working:

1. Verify API keys are set correctly
2. Check API rate limits
3. Verify using correct API endpoints (sandbox vs production)
4. Check audit logs for detailed error messages

## Rollback Procedure

If a deployment causes issues:

### Option 1: Redeploy Previous Version
1. Go to Render Dashboard
2. Navigate to the service
3. Click "Deploys" tab
4. Find the last working deployment
5. Click "Redeploy"

### Option 2: Revert Git Commit
```bash
# Revert the problematic commit
git revert <commit-hash>
git push origin <branch>

# This will trigger a new deployment with the reverted code
```

## Backup and Recovery

### Database Backups

Render automatically creates daily backups with 7-day retention.

To restore from backup:

1. Go to Render Dashboard
2. Navigate to the database service
3. Click "Backups" tab
4. Select the backup to restore
5. Click "Restore"

### Manual Backup

To create a manual backup:

```bash
# Connect to database
render psql <DATABASE_SERVICE_ID>

# Create backup
pg_dump -Fc > backup_$(date +%Y%m%d_%H%M%S).dump
```

## Security Considerations

### Secrets Management
- Never commit secrets to Git
- Use Render's environment variable encryption
- Rotate API keys regularly
- Use different credentials for each environment

### SSL/TLS
- All Render services use TLS 1.3 by default
- Custom domains require DNS configuration
- Render provides automatic SSL certificate management

### Access Control
- Limit Render dashboard access to authorized personnel
- Use GitHub branch protection rules
- Require code review before merging to protected branches
- Enable two-factor authentication on all accounts

## Performance Optimization

### Scaling

To scale services:

1. **Vertical Scaling**: Upgrade instance type in Render Dashboard
2. **Horizontal Scaling**: Add more instances (available on Professional plan)

### Caching

The system uses PostgreSQL as a cache layer for Airtable data. Monitor cache hit rates in the admin dashboard.

### Background Jobs

Monitor Sidekiq queue depth and processing time. Scale worker instances if queues are consistently backed up.

## Support and Escalation

For deployment issues:

1. Check this guide first
2. Review Render documentation: https://render.com/docs
3. Check application logs for error details
4. Contact Render support for platform issues
5. Escalate to development team for application issues

## Maintenance Windows

Schedule maintenance windows for:
- Major version upgrades
- Database migrations with downtime
- Infrastructure changes

Recommended maintenance window: Sundays 02:00-06:00 SAST (low traffic period)
