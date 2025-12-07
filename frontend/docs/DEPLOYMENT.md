# Deployment Guide

Guide for deploying the Consultant Gateway Frontend to various platforms.

## Table of Contents

- [Build Process](#build-process)
- [Environment Configuration](#environment-configuration)
- [Deployment Platforms](#deployment-platforms)
- [CI/CD Setup](#cicd-setup)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Build Process

### Production Build

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build for production
npm run build

# Preview build locally
npm run preview
```

### Build Output

The build process creates optimized files in the `dist/` directory:

```
dist/
├── assets/
│   ├── index-[hash].js      # Main JavaScript bundle
│   ├── index-[hash].css     # Compiled CSS
│   └── [other-assets]       # Images, fonts, etc.
├── index.html               # Entry HTML file
└── vite.svg                 # Favicon
```

### Build Optimization

The build is optimized with:
- **Code splitting**: Separate chunks for routes
- **Tree shaking**: Removes unused code
- **Minification**: Compressed JavaScript and CSS
- **Asset optimization**: Compressed images and fonts
- **Cache busting**: Hashed filenames for cache invalidation

## Environment Configuration

### Environment Variables

Create environment-specific files:

**.env.development** (local development):
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_ENABLE_MOCK_API=false
```

**.env.staging** (staging environment):
```env
VITE_API_BASE_URL=https://staging-api.example.com/api/v1
VITE_ENABLE_MOCK_API=false
```

**.env.production** (production environment):
```env
VITE_API_BASE_URL=https://api.example.com/api/v1
VITE_ENABLE_MOCK_API=false
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `https://api.example.com/api/v1` |
| `VITE_ENABLE_MOCK_API` | Enable API mocking | `false` |

### Building with Environment

```bash
# Development build
npm run build -- --mode development

# Staging build
npm run build -- --mode staging

# Production build
npm run build -- --mode production
```

## Deployment Platforms

### Vercel (Recommended)

Vercel provides zero-configuration deployment for React apps.

#### Setup

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

#### Configuration

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "VITE_API_BASE_URL": "@api-base-url"
  }
}
```

#### Environment Variables

Set in Vercel dashboard:
1. Go to Project Settings
2. Navigate to Environment Variables
3. Add `VITE_API_BASE_URL`
4. Set for Production, Preview, and Development

### Netlify

#### Setup

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Login:
```bash
netlify login
```

3. Deploy:
```bash
netlify deploy --prod
```

#### Configuration

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

#### Environment Variables

Set in Netlify dashboard:
1. Go to Site Settings
2. Navigate to Build & Deploy > Environment
3. Add environment variables

### AWS S3 + CloudFront

#### Prerequisites

- AWS account
- AWS CLI installed and configured
- S3 bucket created
- CloudFront distribution created

#### Build and Upload

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

#### S3 Bucket Configuration

Enable static website hosting:
- Index document: `index.html`
- Error document: `index.html`

Bucket policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

#### CloudFront Configuration

- Origin: S3 bucket
- Default root object: `index.html`
- Error pages: 404 → `/index.html` (200)

### Docker

#### Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### Build and Run

```bash
# Build image
docker build -t consultant-gateway-frontend .

# Run container
docker run -p 8080:80 consultant-gateway-frontend

# With environment variables
docker run -p 8080:80 \
  -e VITE_API_BASE_URL=https://api.example.com/api/v1 \
  consultant-gateway-frontend
```

## CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"

test:
  stage: test
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run lint
    - npm test
  cache:
    paths:
      - node_modules/

build:
  stage: build
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
  cache:
    paths:
      - node_modules/

deploy:
  stage: deploy
  image: node:${NODE_VERSION}
  script:
    - npm install -g vercel
    - vercel --token $VERCEL_TOKEN --prod
  only:
    - main
```

## Monitoring

### Error Tracking

Integrate error tracking service (e.g., Sentry):

```javascript
// src/main.jsx
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 1.0,
  });
}
```

### Analytics

Add analytics tracking:

```javascript
// src/utils/analytics.js
export const trackPageView = (path) => {
  if (window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: path,
    });
  }
};

export const trackEvent = (action, category, label, value) => {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
```

### Performance Monitoring

Monitor Core Web Vitals:

```javascript
// src/utils/performance.js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify(metric);
  const url = '/api/analytics';
  
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, { body, method: 'POST', keepalive: true });
  }
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## Troubleshooting

### Build Failures

**Issue**: Build fails with memory error

**Solution**:
```bash
# Increase Node memory limit
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

**Issue**: Missing environment variables

**Solution**:
- Verify `.env.production` exists
- Check variable names start with `VITE_`
- Ensure variables are set in deployment platform

### Deployment Issues

**Issue**: 404 errors on page refresh

**Solution**:
- Configure server to serve `index.html` for all routes
- Add rewrite rules (see platform-specific configs above)

**Issue**: API calls fail after deployment

**Solution**:
- Verify `VITE_API_BASE_URL` is correct
- Check CORS configuration on backend
- Ensure API is accessible from deployment environment

### Performance Issues

**Issue**: Slow initial load

**Solution**:
- Enable code splitting
- Implement lazy loading for routes
- Optimize images and assets
- Enable compression (gzip/brotli)

**Issue**: Large bundle size

**Solution**:
```bash
# Analyze bundle
npm run build -- --mode production
npx vite-bundle-visualizer

# Optimize imports
# Instead of: import { Button } from '@/components'
# Use: import Button from '@/components/Button'
```

## Security Checklist

Before deploying to production:

- [ ] Environment variables are set correctly
- [ ] API endpoints use HTTPS
- [ ] Security headers are configured
- [ ] CORS is properly configured
- [ ] Authentication tokens are secure
- [ ] Sensitive data is not in client code
- [ ] Dependencies are up to date
- [ ] Error messages don't expose sensitive info
- [ ] Rate limiting is implemented
- [ ] Input validation is in place

## Post-Deployment

### Verification

1. Test all user flows
2. Verify API connectivity
3. Check error tracking is working
4. Confirm analytics are tracking
5. Test on multiple browsers
6. Test on mobile devices

### Rollback Plan

If issues occur:

**Vercel**:
```bash
vercel rollback
```

**Netlify**:
- Go to Deploys
- Click on previous successful deploy
- Click "Publish deploy"

**AWS S3**:
- Restore from S3 versioning
- Invalidate CloudFront cache

## Support

For deployment issues:
- Check platform status pages
- Review deployment logs
- Contact platform support
- Consult platform documentation
