# Supabase Setup Guide for MEUGRIND System

## 🎯 Quick Setup Steps

### 1. Create Supabase Project

1. Go to [Supabase](https://app.supabase.com/)
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `meugrind-system`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 2. Get Your Credentials

1. Wait for project to be ready (2-3 minutes)
2. Go to **Settings** → **API**
3. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Update .env.local

Replace the placeholder values in `meugrind-system/.env.local`:

```bash
# Replace these with your actual values
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### 4. Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the contents of `supabase-schema.sql`
4. Click "Run" to create all tables and policies

### 5. Configure Row Level Security (RLS)

The schema includes RLS policies, but verify they're enabled:

1. Go to **Authentication** → **Policies**
2. Ensure policies are active for all tables
3. Test with a sample user if needed

## 🔒 Security Configuration

### Authentication Settings

1. Go to **Authentication** → **Settings**
2. Configure these settings:
   - **Site URL**: `https://meugrind-system.pages.dev`
   - **Redirect URLs**: Add your domain
   - **Email confirmation**: Enable if desired
   - **Password requirements**: Set as needed

### API Settings

1. Go to **Settings** → **API**
2. **JWT Settings**:
   - JWT expiry: 3600 (1 hour) recommended
   - Refresh token rotation: Enable for security

## 🧪 Test Your Setup

### 1. Test Database Connection

Create a simple test in your project:

```javascript
// Test file: test-supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count')
    if (error) throw error
    console.log('✅ Supabase connection successful!')
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message)
  }
}

testConnection()
```

### 2. Run the Test

```bash
cd meugrind-system
node test-supabase.js
```

## 📊 Database Schema Overview

The `supabase-schema.sql` creates these main tables:

- **users** - User profiles and preferences
- **events** - Calendar events across all modules
- **tasks** - Action items and todos
- **songs** - Music repertoire database
- **setlists** - Performance song lists
- **brand_deals** - Influencer campaigns
- **solar_leads** - CRM prospects and customers
- **pomodoro_sessions** - Time tracking data

## 🚀 Production vs Development

### Development (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key
NODE_ENV=development
```

### Production (Cloudflare Pages Environment Variables)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
NODE_ENV=production
```

## 🔧 Troubleshooting

### Common Issues

1. **"Invalid API key" Error**:
   - Check the anon key is copied correctly
   - Ensure no extra spaces or characters
   - Verify the key starts with `eyJ`

2. **"Project not found" Error**:
   - Check the project URL is correct
   - Ensure project is not paused
   - Verify the project ID in the URL

3. **RLS Policy Errors**:
   - Check policies are enabled
   - Verify user authentication
   - Test with disabled RLS temporarily

4. **CORS Errors**:
   - Add your domain to allowed origins
   - Check Site URL in Authentication settings

### Debug Commands

```bash
# Test environment variables
cd meugrind-system
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test build with Supabase
npm run build

# Test development server
npm run dev
```

## 📚 Resources

- **Supabase Documentation**: https://supabase.com/docs
- **JavaScript Client**: https://supabase.com/docs/reference/javascript
- **Authentication Guide**: https://supabase.com/docs/guides/auth
- **Row Level Security**: https://supabase.com/docs/guides/auth/row-level-security

## ✅ Checklist

- [ ] Supabase project created
- [ ] Database schema imported
- [ ] Credentials copied to `.env.local`
- [ ] RLS policies configured
- [ ] Authentication settings configured
- [ ] Connection tested successfully
- [ ] Ready for deployment!

---

**Next Step**: Once your `.env.local` is configured, you can deploy with:
```bash
npm run deploy:wrangler
```