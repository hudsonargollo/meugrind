# Supabase Setup Guide for MEUGRIND Productivity System

This guide will help you set up Supabase as the backend for the MEUGRIND offline-first productivity system.

## Prerequisites

- A Supabase account (free tier available at [supabase.com](https://supabase.com))
- Node.js and npm installed
- The MEUGRIND project cloned and dependencies installed

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `meugrind-productivity-system`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the region closest to your users
5. Click "Create new project"
6. Wait for the project to be created (this takes a few minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like `https://your-project.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Step 3: Configure Environment Variables

1. In your MEUGRIND project root, copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Step 4: Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase-schema.sql` from your project root
4. Paste it into the SQL editor
5. Click "Run" to execute the schema

This will create:
- All necessary tables for the MEUGRIND system
- Proper indexes for performance
- Row Level Security (RLS) policies
- Automatic timestamp triggers

## Step 5: Configure Row Level Security (Optional)

The schema includes basic RLS policies, but you may want to customize them based on your specific requirements:

1. Go to **Authentication** → **Policies** in your Supabase dashboard
2. Review the automatically created policies
3. Modify them as needed for your use case

### Example: Custom User Access Policy

```sql
-- Allow users to only see their own data
CREATE POLICY "Users can only access own data" ON events
FOR ALL USING (auth.uid()::text = created_by::text);
```

## Step 6: Test the Connection

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser
3. Check the browser console for any Supabase connection errors
4. Look for the sync status indicator - it should show "Supabase" instead of "Local Only"

## Step 7: Enable Real-time (Optional)

For real-time synchronization across devices:

1. In Supabase dashboard, go to **Database** → **Replication**
2. Enable replication for the tables you want to sync in real-time
3. The app will automatically subscribe to changes

## Troubleshooting

### Common Issues

**"Supabase not configured" message:**
- Check that your environment variables are correctly set
- Restart your development server after changing `.env.local`
- Verify the URL and key are correct (no extra spaces)

**Database connection errors:**
- Ensure the database schema was applied successfully
- Check that RLS policies allow your operations
- Verify your project is not paused (free tier limitation)

**Sync not working:**
- Check browser console for errors
- Verify you're online and the Supabase project is accessible
- Test the connection manually in the browser network tab

### Performance Tips

1. **Indexes**: The schema includes optimized indexes, but you may want to add more based on your query patterns
2. **RLS**: Keep RLS policies simple for better performance
3. **Realtime**: Only enable realtime for tables that need it
4. **Caching**: The app includes intelligent caching to reduce API calls

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **RLS Policies**: Always use Row Level Security in production
3. **API Keys**: The anon key is safe for client-side use, but consider additional security for sensitive operations
4. **HTTPS**: Always use HTTPS in production (Supabase enforces this)

## Backup and Migration

### Backup Your Data

```bash
# Using Supabase CLI (install first: npm install -g supabase)
supabase db dump --db-url "your-connection-string" > backup.sql
```

### Migration Between Projects

1. Export data from old project using the backup method above
2. Create new project and apply schema
3. Import data using the SQL editor or CLI

## Support

- **Supabase Documentation**: [docs.supabase.com](https://docs.supabase.com)
- **MEUGRIND Issues**: Check the project's GitHub issues
- **Community**: Supabase Discord community for general Supabase questions

## Next Steps

Once Supabase is configured:

1. Test offline functionality by disconnecting from the internet
2. Verify sync works by making changes and reconnecting
3. Set up authentication if needed (AWS Cognito is also configured)
4. Deploy to production with proper environment variables

The MEUGRIND system is designed to work seamlessly with or without Supabase - it will fall back to local-only mode if Supabase is not configured.