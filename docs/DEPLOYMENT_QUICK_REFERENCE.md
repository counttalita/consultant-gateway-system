# Deployment Quick Reference

Quick commands and checklists for deploying the Consultant Gateway System.

## Environment URLs

- **Development**: https://dev.uptimeconsulting.co.za
- **Staging**: https://staging.uptimeconsulting.co.za
- **QA**: https://qa.uptimeconsulting.co.za
- **Production**: https://app.uptimeconsulting.co.za

## Deployment Commands

### Deploy to Development (Auto)
```bash
git checkout dev
git pull origin dev
# Make your changes
git add .
git commit -m "Your commit message"
git push origin dev
# Automatically deploys
```

### Deploy to Staging (Auto)
```bash
git checkout staging
git pull origin staging
git merge dev
git push origin staging
# Automatically deploys
```

### Deploy to QA (Manual)
```bash
git checkout qa
git pull origin qa
git merge staging
git push origin qa
# Manual deployment required in Render Dashboard
```

### Deploy to Production (Manual)
```bash
git checkout main
git pull origin main
git merge qa
git push origin main
# Manual deployment required in Render Dashboard
```

## Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Breaking changes documented
- [ ] Rollback plan prepared

## Post-Deployment Checklist

- [ ] Health check passes: `/health`
- [ ] Config endpoint accessible: `/api/v1/config`
- [ ] Database migrations completed
- [ ] Background jobs processing
- [ ] External integrations working
- [ ] Logs show no errors
- [ ] Performance metrics normal

## Quick Verification

```bash
# Verify deployment
./bin/verify-deployment.sh https://<environment>.uptimeconsulting.co.za

# Check health
curl https://<environment>.uptimeconsulting.co.za/health

# Check config
curl https://<environment>.uptimeconsulting.co.za/api/v1/config
```

## Rollback Procedure

### Option 1: Redeploy Previous Version (Render Dashboard)
1. Go to service → Deploys tab
2. Find last working deployment
3. Click "Redeploy"

### Option 2: Git Revert
```bash
git revert <commit-hash>
git push origin <branch>
```

## Common Issues

### Build Fails
```bash
# Check build logs in Render Dashboard
# Verify bin/render-build.sh is executable
chmod +x bin/render-build.sh
git add bin/render-build.sh
git commit -m "Fix permissions"
git push
```

### Database Connection Fails
- Verify DATABASE_URL is set
- Check database service status
- Verify same region

### Redis Connection Fails
- Verify REDIS_URL is set
- Check Redis service status
- Verify worker service running

### External API Errors
- Verify API keys correct
- Check sandbox vs production
- Verify rate limits

## Monitoring

### View Logs (Render Dashboard)
1. Navigate to service
2. Click "Logs" tab
3. Filter/search as needed

### View Logs (CLI)
```bash
render logs --service-id <service-id> --tail
```

### Check Metrics
- CPU usage
- Memory usage
- Request count
- Response time
- Error rate

## Emergency Contacts

- **Render Support**: support@render.com
- **Development Team**: dev-team@uptimeconsulting.co.za
- **System Admin**: admin@uptimeconsulting.co.za

## Useful Links

- [Full Deployment Guide](DEPLOYMENT.md)
- [Render Setup Guide](RENDER_SETUP.md)
- [Render Dashboard](https://dashboard.render.com)
- [GitHub Repository](https://github.com/your-org/consultant-gateway)

## Environment Setup

```bash
# Setup local environment
./bin/setup-environment.sh development

# Install dependencies
bundle install

# Setup database
bundle exec rails db:setup

# Start server
bundle exec rails server
```

## Database Operations

### Run Migrations
```bash
# Automatically runs during deployment
# Manual run:
render shell <service-id>
bundle exec rails db:migrate
```

### Rollback Migration
```bash
render shell <service-id>
bundle exec rails db:rollback
# Or rollback multiple:
bundle exec rails db:rollback STEP=3
```

### Seed Database
```bash
render shell <service-id>
bundle exec rails db:seed
```

## Service IDs Reference

Store these in your password manager:

```
# Production
WEB_SERVICE_ID_PRODUCTION=srv-xxxxx
WORKER_SERVICE_ID_PRODUCTION=srv-xxxxx

# QA
WEB_SERVICE_ID_QA=srv-xxxxx
WORKER_SERVICE_ID_QA=srv-xxxxx

# Staging
WEB_SERVICE_ID_STAGING=srv-xxxxx
WORKER_SERVICE_ID_STAGING=srv-xxxxx

# Development
WEB_SERVICE_ID_DEV=srv-xxxxx
WORKER_SERVICE_ID_DEV=srv-xxxxx
```

## GitHub Secrets Required

```
RENDER_API_KEY
RENDER_WEB_SERVICE_ID_PRODUCTION
RENDER_WORKER_SERVICE_ID_PRODUCTION
RENDER_WEB_SERVICE_ID_QA
RENDER_WORKER_SERVICE_ID_QA
RENDER_WEB_SERVICE_ID_STAGING
RENDER_WORKER_SERVICE_ID_STAGING
RENDER_WEB_SERVICE_ID_DEV
RENDER_WORKER_SERVICE_ID_DEV
```

## Branch Protection Rules

- **main**: Only merge from qa, manual deployment
- **qa**: Only merge from staging, manual deployment
- **staging**: Only merge from dev, auto deployment
- **dev**: Merge from feature/*, auto deployment

## Feature Development Workflow

```bash
# Create feature branch
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Implement feature"

# Push and create PR
git push origin feature/your-feature-name
# Create PR to dev branch on GitHub

# After approval, merge to dev
# Dev automatically deploys

# Promote through environments
# dev → staging → qa → main
```
