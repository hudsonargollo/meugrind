# MEUGRIND System Deployment Guide

## Overview

This guide covers deploying the MEUGRIND productivity system to production using GitHub Actions and Cloudflare Pages.

## Prerequisites

1. **GitHub Repository**: Code must be in a GitHub repository
2. **Cloudflare Account**: Free account with Pages enabled
3. **Supabase Project**: Production database setup
4. **Domain** (optional): Custom domain for production

## Setup Instructions

### 1. Supabase Production Setup

1. Create a new Supabase project for production
2. Run the database schema from `supabase-schema.sql`
3. Configure Row Level Security (RLS) policies
4. Note your project URL and anon key

### 2. GitHub Repository Secrets

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
NEXT_PUBLIC_APP_URL=https://your-domain.pages.dev
```

### 3. Cloudflare Pages Setup

1. **Create Cloudflare API Token**:
   - Go to Cloudflare Dashboard → My Profile → API Tokens
   - Create token with "Cloudflare Pages:Edit" permissions
   - Copy the token for GitHub secrets

2. **Get Account ID**:
   - Go to Cloudflare Dashboard → Right sidebar
   - Copy Account ID for GitHub secrets

### 4. Production Environment Variables

Copy `.env.production` to `.env.local` and update with your production values:

```bash
cp .env.production .env.local
# Edit .env.local with your actual production values
```

## Deployment Process

### Automatic Deployment

1. **Push to main branch**: Triggers automatic deployment
2. **CI Pipeline**: Runs tests and builds the application
3. **Cloudflare Pages**: Deploys to production automatically

### Manual Deployment

1. Go to GitHub Actions tab
2. Select "Deploy to Cloudflare Pages" workflow
3. Click "Run workflow" → "Run workflow"

## Build Configuration

### Next.js Configuration

The application is configured for static export with PWA support:

- **Static Export**: Generates static files for Cloudflare Pages
- **PWA**: Service worker and manifest for offline functionality
- **Security Headers**: Configured in `next.config.mjs` and `_headers`
- **Image Optimization**: WebP and AVIF support

### Performance Optimizations

- **Bundle Analysis**: Run `npm run build:analyze` to check bundle size
- **Caching**: Aggressive caching for static assets
- **Compression**: Gzip compression enabled
- **Code Splitting**: Automatic code splitting by Next.js

## Monitoring and Validation

### Post-Deployment Checks

1. **PWA Installation**: Verify app can be installed on devices
2. **Offline Functionality**: Test offline CRUD operations
3. **Sync Operations**: Verify Supabase integration works
4. **Performance**: Check Core Web Vitals
5. **Security**: Verify security headers are applied

### Performance Monitoring

- **Cloudflare Analytics**: Built-in analytics for Pages
- **Web Vitals**: Monitor Core Web Vitals scores
- **Error Tracking**: Monitor console errors and failed requests

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check environment variables are set correctly
   - Verify all tests pass locally
   - Check Node.js version compatibility

2. **PWA Issues**:
   - Verify service worker is registered
   - Check manifest.json is accessible
   - Ensure HTTPS is enabled

3. **Supabase Connection**:
   - Verify environment variables
   - Check RLS policies
   - Confirm database schema is up to date

### Debug Commands

```bash
# Local production build
npm run build

# Test PWA functionality
npm run dev
# Open DevTools → Application → Service Workers

# Analyze bundle size
npm run build:analyze

# Run all tests
npm run deploy:build
```

## Security Considerations

### Headers Configuration

Security headers are configured in:
- `next.config.mjs`: Application-level headers
- `public/_headers`: Cloudflare Pages headers

### Environment Variables

- Never commit `.env.local` to version control
- Use GitHub Secrets for sensitive data
- Rotate API keys regularly

### Content Security Policy

Consider adding CSP headers for additional security:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
```

## Rollback Procedure

If deployment issues occur:

1. **GitHub**: Revert the problematic commit
2. **Cloudflare Pages**: Use deployment history to rollback
3. **Database**: Have migration rollback scripts ready

## Support

For deployment issues:
- Check GitHub Actions logs
- Review Cloudflare Pages build logs
- Verify Supabase project status
- Test locally with production environment variables