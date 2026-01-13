# Quick Deployment Guide - MEUGRIND System

## 🚀 Deploy to GitHub and Cloudflare with Wrangler

### Prerequisites (One-time setup)

1. **Install Wrangler CLI**:
   ```bash
   npm install -g wrangler
   ```

2. **Authenticate with Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Set up Supabase** (if not done):
   - Create production Supabase project
   - Import `supabase-schema.sql`
   - Note URL and anon key

### Environment Variables

Create `.env.local` file in `meugrind-system/` directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://meugrind-system.pages.dev
```

### Deploy Commands

#### Option 1: Full Deployment (Recommended)
```bash
cd meugrind-system
npm run deploy:wrangler
```

#### Option 2: Quick Deploy (Skip Tests)
```bash
cd meugrind-system
npm run build:production
npm run wrangler:deploy:production
```

#### Option 3: Using Scripts

**Windows (PowerShell)**:
```powershell
cd meugrind-system
.\scripts\wrangler-deploy.ps1
```

**Linux/macOS**:
```bash
cd meugrind-system
chmod +x scripts/wrangler-deploy.sh
./scripts/wrangler-deploy.sh
```

### After Deployment

1. **Set Environment Variables in Cloudflare**:
   - Go to https://dash.cloudflare.com/pages
   - Select `meugrind-system` project
   - Settings → Environment variables
   - Add your Supabase credentials

2. **Test Your Deployment**:
   - Visit: https://meugrind-system.pages.dev
   - Test PWA installation
   - Test offline functionality

### Troubleshooting

**Authentication Issues**:
```bash
wrangler logout
wrangler login
```

**Build Issues**:
```bash
npm ci
npm run lint
npm run test -- --watchAll=false
```

**Environment Variables**:
- Check `.env.local` exists
- Verify Cloudflare Pages environment variables
- Ensure Supabase project is active

### Quick Commands Reference

```bash
# Check authentication
wrangler whoami

# List deployments
wrangler pages deployment list --project-name=meugrind-system

# Deploy to preview
npm run deploy:wrangler:preview

# Build only
npm run build:production

# Test locally
npm run dev
```

### URLs

- **Production**: https://meugrind-system.pages.dev
- **Cloudflare Dashboard**: https://dash.cloudflare.com/pages
- **GitHub Repository**: https://github.com/YOUR_USERNAME/meugrind-system

---

**Need help?** Check `WRANGLER_DEPLOYMENT.md` for detailed instructions.