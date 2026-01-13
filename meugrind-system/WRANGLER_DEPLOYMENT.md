# MEUGRIND System - Wrangler Deployment Guide

## Overview

This guide covers deploying the MEUGRIND productivity system to Cloudflare Pages using Wrangler CLI for direct deployment control.

## Prerequisites

### 1. Install Wrangler CLI

```bash
# Global installation (recommended)
npm install -g wrangler

# Or local installation
npm install wrangler --save-dev
```

### 2. Authenticate with Cloudflare

```bash
# Login to Cloudflare
wrangler login

# Verify authentication
wrangler whoami
```

### 3. Supabase Production Setup

1. Create a production Supabase project
2. Import database schema from `supabase-schema.sql`
3. Configure Row Level Security (RLS) policies
4. Note your project URL and anon key

## Environment Variables

### Local Environment (.env.local)

Create `.env.local` file with your production values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://meugrind-system.pages.dev
```

### Cloudflare Pages Environment Variables

Set these in Cloudflare Pages dashboard (Settings → Environment variables):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://meugrind-system.pages.dev
NODE_ENV=production
```

## Deployment Methods

### Method 1: Using NPM Scripts (Recommended)

```bash
# Deploy to production (with tests and build)
npm run deploy:wrangler

# Deploy to preview environment
npm run deploy:wrangler:preview

# Quick deploy (skip tests, use existing build)
npm run wrangler:deploy:production
```

### Method 2: Using Deployment Scripts

#### Linux/macOS:
```bash
# Make script executable
chmod +x scripts/wrangler-deploy.sh

# Deploy to production
./scripts/wrangler-deploy.sh

# Deploy to preview
./scripts/wrangler-deploy.sh --env preview

# Skip tests for faster deployment
./scripts/wrangler-deploy.sh --skip-tests

# Skip build (use existing build)
./scripts/wrangler-deploy.sh --skip-build
```

#### Windows (PowerShell):
```powershell
# Deploy to production
.\scripts\wrangler-deploy.ps1

# Deploy to preview
.\scripts\wrangler-deploy.ps1 -Environment preview

# Skip tests for faster deployment
.\scripts\wrangler-deploy.ps1 -SkipTests

# Skip build (use existing build)
.\scripts\wrangler-deploy.ps1 -SkipBuild
```

### Method 3: Manual Wrangler Commands

```bash
# Build the application
npm run build:production

# Deploy to production
wrangler pages deploy out --project-name=meugrind-system --env=production

# Deploy to preview
wrangler pages deploy out --project-name=meugrind-system --env=preview
```

## Project Setup in Cloudflare

### First-Time Setup

1. **Create Cloudflare Pages Project**:
   ```bash
   # This will be done automatically on first deployment
   wrangler pages project create meugrind-system
   ```

2. **Configure Custom Domain** (Optional):
   - Go to Cloudflare Pages dashboard
   - Select your project
   - Go to Custom domains
   - Add your domain

### Environment Configuration

Set environment variables in Cloudflare Pages:

1. Go to Cloudflare Pages dashboard
2. Select your project → Settings → Environment variables
3. Add production and preview environment variables

## Deployment Workflow

### 1. Pre-Deployment Checklist

- [ ] Code is committed to Git
- [ ] All tests pass locally
- [ ] Environment variables are configured
- [ ] Supabase production database is ready
- [ ] Wrangler is authenticated

### 2. Build and Test

```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Run all tests
npm run test -- --watchAll=false
npm run test:property -- --watchAll=false

# Build for production
npm run build:production
```

### 3. Deploy

```bash
# Deploy to production
npm run deploy:wrangler

# Or use the deployment script
./scripts/wrangler-deploy.sh
```

### 4. Post-Deployment Validation

- [ ] Application loads at production URL
- [ ] PWA installation works
- [ ] Offline functionality works
- [ ] Supabase integration works
- [ ] All modules function correctly

## Advanced Configuration

### Custom Headers and Redirects

The `wrangler.toml` file includes:

- **Security Headers**: X-Frame-Options, CSP, etc.
- **Caching Rules**: Optimized for PWA and static assets
- **PWA Support**: Service worker caching rules
- **SPA Routing**: Fallback to index.html for client-side routing

### Performance Optimization

```bash
# Analyze bundle size
npm run build:analyze

# Check build output
ls -la out/

# Validate PWA manifest
cat out/manifest.json | jq .
```

### Monitoring and Debugging

```bash
# View deployment logs
wrangler pages deployment list --project-name=meugrind-system

# View project info
wrangler pages project list

# Tail logs (if using Workers)
wrangler tail --project-name=meugrind-system
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   ```bash
   wrangler logout
   wrangler login
   ```

2. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check environment variables

3. **PWA Issues**:
   - Verify service worker is in build output
   - Check manifest.json is valid
   - Ensure HTTPS is enabled

4. **Supabase Connection Issues**:
   - Verify environment variables
   - Check RLS policies
   - Test database connection

### Debug Commands

```bash
# Check Wrangler configuration
wrangler pages project list

# Validate wrangler.toml
wrangler pages project show meugrind-system

# Test local build
npm run build:production && ls -la out/

# Check service worker
cat out/sw.js | head -20
```

## Rollback Procedure

### Quick Rollback

1. **Find Previous Deployment**:
   ```bash
   wrangler pages deployment list --project-name=meugrind-system
   ```

2. **Promote Previous Deployment**:
   - Go to Cloudflare Pages dashboard
   - Select deployment to promote
   - Click "Promote to production"

### Code Rollback

```bash
# Revert to previous commit
git revert HEAD

# Redeploy
npm run deploy:wrangler
```

## CI/CD Integration

### GitHub Actions with Wrangler

The existing `.github/workflows/deploy.yml` can be updated to use Wrangler:

```yaml
- name: Deploy with Wrangler
  run: |
    npm install -g wrangler
    wrangler pages deploy out --project-name=meugrind-system --env=production
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Security Considerations

### API Token Management

- Use Cloudflare API tokens with minimal permissions
- Store tokens securely in CI/CD secrets
- Rotate tokens regularly

### Environment Variables

- Never commit sensitive data to Git
- Use Cloudflare Pages environment variables for secrets
- Separate production and preview configurations

## Support and Resources

- **Wrangler Documentation**: https://developers.cloudflare.com/workers/wrangler/
- **Cloudflare Pages**: https://pages.cloudflare.com/
- **MEUGRIND Issues**: Check deployment logs and GitHub issues

## Quick Reference

### Essential Commands

```bash
# Deploy to production
npm run deploy:wrangler

# Deploy to preview
npm run deploy:wrangler:preview

# Quick deploy (existing build)
npm run wrangler:deploy:production

# Check deployment status
wrangler pages deployment list --project-name=meugrind-system

# View project details
wrangler pages project show meugrind-system
```

### URLs

- **Production**: https://meugrind-system.pages.dev
- **Dashboard**: https://dash.cloudflare.com/pages
- **Supabase**: https://app.supabase.com/