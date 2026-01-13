import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing. Remote sync will be disabled.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Throttle for battery optimization
    },
  },
});

// Database table names mapping
export const SUPABASE_TABLES = {
  users: 'users',
  events: 'events',
  tasks: 'tasks',
  songs: 'songs',
  setlists: 'setlists',
  tech_riders: 'tech_riders',
  contractors: 'contractors',
  gigs: 'gigs',
  call_sheets: 'call_sheets',
  brand_deals: 'brand_deals',
  content_assets: 'content_assets',
  brands: 'brands',
  scripts: 'scripts',
  solar_leads: 'solar_leads',
  solar_projects: 'solar_projects',
  followup_tasks: 'followup_tasks',
  pomodoro_sessions: 'pomodoro_sessions',
  pomodoro_stats: 'pomodoro_stats',
  study_trackers: 'study_trackers',
  appearance_windows: 'appearance_windows',
  pr_events: 'pr_events',
  talking_points: 'talking_points',
  approved_narratives: 'approved_narratives',
  media_coverage: 'media_coverage',
  pr_contracts: 'pr_contracts',
} as const;

export type SupabaseTableName = keyof typeof SUPABASE_TABLES;

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Helper function to get table name
export const getTableName = (entityType: string): string => {
  return SUPABASE_TABLES[entityType as SupabaseTableName] || entityType;
};