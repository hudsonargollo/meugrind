# MEUGRIND System - Wrangler Deployment Guide

## 🚀 Quick Deployment with Wrangler

Since you already have Supabase and GitHub configured, let's deploy your MEUGRIND system using Wrangler CLI.

## Prerequisites ✅

- [x] Supabase project configured
- [x] GitHub repository set up
- [x] System fully implemented and tested

## Step 1: Install Wrangler CLI

```bash
# Install Wrangler globally
npm install -g wrangler

# Verify installation
wrangler --version
```

## Step 2: Authenticate with Cloudflare

```bash
# Login to Cloudflare
wrangler login

# Verify authentication
wrangler whoami
```

## Step 3: Set Environment Variables (Optional)

You can set environment variables via Wrangler CLI or Cloudflare dashboard:

```bash
# Set via Wrangler (optional - can also set in dashboard)
wrangler pages secret put NEXT_PUBLIC_SUPABASE_URL
wrangler pages secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
wrangler pages secret put NEXT_PUBLIC_APP_NAME
```

## Step 4: Deploy Your System

### Option A: Full Deployment (Recommended)
```bash
cd meugrind-system

# Complete deployment with tests and build
npm run deploy
```

### Option B: Quick Deployment (Skip Tests)
```bash
# Fast deployment without running tests
npm run deploy:fast
```

### Option C: Preview Deployment
```bash
# Deploy to preview environment
npm run deploy:preview
```

### Option D: Deploy Existing Build
```bash
# If you already have a build, just deploy it
npm run deploy:build-only
```

## Step 5: Access Your Live System

After successful deployment, your MEUGRIND system will be available at:

- **Production**: `https://meugrind-system.pages.dev`
- **Preview**: Custom URL provided in deployment output

## 🎯 Deployment Script Features

The deployment script (`deploy.js`) automatically:

- ✅ **Checks Prerequisites** - Verifies Wrangler installation and authentication
- ✅ **Validates Environment** - Checks for required environment variables
- ✅ **Runs Quality Checks** - ESLint and tests (unless skipped)
- ✅ **Builds for Production** - Optimized Next.js build with static export
- ✅ **Validates Build** - Ensures build completed successfully
- ✅ **Deploys to Cloudflare** - Uses Wrangler Pages deployment
- ✅ **Provides Feedback** - Clear status updates and error handling

## 🔧 Configuration Files

### `wrangler.toml`
```toml
name = "meugrind-system"
compatibility_date = "2024-01-15"

[env.production]
name = "meugrind-system"

[env.preview]
name = "meugrind-system-preview"

pages_build_output_dir = "out"
```

### Available NPM Scripts
```json
{
  "deploy": "node deploy.js",                    // Full deployment
  "deploy:preview": "node deploy.js --preview",  // Preview deployment
  "deploy:fast": "node deploy.js --skip-tests",  // Skip tests
  "deploy:build-only": "node deploy.js --skip-build" // Deploy existing build
}
```

## 🚨 Troubleshooting

### Wrangler Not Found
```bash
npm install -g wrangler
```

### Authentication Issues
```bash
wrangler logout
wrangler login
```

### Build Failures
```bash
# Check for linting errors
npm run lint

# Run tests locally
npm run test

# Build locally to debug
npm run build:production
```

### Environment Variables Missing
Set them via Cloudflare dashboard:
1. Go to Cloudflare Pages
2. Select your project
3. Go to Settings → Environment Variables
4. Add your Supabase credentials

## 🎉 Success!

Once deployed, your MEUGRIND productivity system will be:

- ✅ **Live on the Internet** - Accessible from any device
- ✅ **PWA Installable** - Can be installed on phones, tablets, desktops
- ✅ **Offline Functional** - Works without internet connection
- ✅ **Globally Distributed** - Fast loading worldwide via Cloudflare CDN
- ✅ **Automatically HTTPS** - Secure by default
- ✅ **Production Ready** - Optimized and validated

## 🔄 Continuous Deployment

For automatic deployments on every push:

1. **GitHub Actions** (already configured) - Deploys on push to main
2. **Wrangler Manual** - Use the scripts above for manual deployment
3. **Cloudflare Dashboard** - Connect GitHub repo for automatic builds

---

**Your offline-first productivity system is ready to go live! 🚀**

Run `npm run deploy` to deploy your MEUGRIND system now!