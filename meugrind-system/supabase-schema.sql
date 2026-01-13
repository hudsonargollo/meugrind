-- MEUGRIND Productivity System Database Schema for Supabase
-- This file contains the complete database schema for the offline-first productivity system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('manager', 'personal');
CREATE TYPE sync_status AS ENUM ('synced', 'pending', 'conflict');
CREATE TYPE event_type AS ENUM ('gig', 'brand_deal', 'pr_event', 'solar_appointment', 'personal');
CREATE TYPE event_visibility AS ENUM ('manager_only', 'fyi_only', 'mandatory');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE brand_deal_status AS ENUM ('pitch', 'contract', 'content', 'posted', 'paid');
CREATE TYPE content_asset_type AS ENUM ('story', 'post', 'reel');
CREATE TYPE solar_lead_status AS ENUM ('lead', 'qualified', 'assessment', 'proposal', 'contract', 'installation', 'customer');
CREATE TYPE property_type AS ENUM ('domestic', 'commercial');
CREATE TYPE permit_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE gig_status AS ENUM ('booked', 'confirmed', 'completed', 'cancelled');
CREATE TYPE pr_event_type AS ENUM ('interview', 'appearance', 'photoshoot', 'event');

-- Core system tables

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'personal',
    permissions JSONB DEFAULT '[]',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status DEFAULT 'synced',
    version INTEGER DEFAULT 1
);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    type event_type NOT NULL,
    visibility event_visibility DEFAULT 'mandatory',
    module_id UUID,
    module_type VARCHAR(50),
    created_by UUID REFERENCES users(id),
    is_privacy_shielded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status DEFAULT 'synced',
    version INTEGER DEFAULT 1
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    priority task_priority DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    project_id UUID,
    category VARCHAR(100),
    estimated_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status DEFAULT 'synced',
    version INTEGER DEFAULT 1
);

-- Band management tables

-- Songs table
CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255),
    key VARCHAR(10),
    bpm INTEGER,
    duration INTEGER, -- in seconds
    tech_requirements JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Setlists table
CREATE TABLE setlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    gig_id UUID,
    songs JSONB DEFAULT '[]', -- Array of song IDs with order
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status DEFAULT 'synced',
    version INTEGER DEFAULT 1
);

-- Tech riders table
CREATE TABLE tech_riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setlist_id UUID REFERENCES setlists(id),
    input_list JSONB DEFAULT '[]',
    stage_plot TEXT, -- Base64 or URL
    special_requirements JSONB DEFAULT '[]',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contractors table
CREATE TABLE contractors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    skills JSONB DEFAULT '[]',
    rate_per_hour DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gigs table
CREATE TABLE gigs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue VARCHAR(255) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    status gig_status DEFAULT 'booked',
    load_in_time TIMESTAMP WITH TIME ZONE,
    sound_check_time TIMESTAMP WITH TIME ZONE,
    show_time TIMESTAMP WITH TIME ZONE,
    fee DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status DEFAULT 'synced',
    version INTEGER DEFAULT 1
);

-- Call sheets table
CREATE TABLE call_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID REFERENCES gigs(id),
    contractor_id UUID REFERENCES contractors(id),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    load_in_time TIMESTAMP WITH TIME ZONE,
    sound_check_time TIMESTAMP WITH TIME ZONE,
    show_time TIMESTAMP WITH TIME ZONE,
    special_instructions TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Influencer CRM tables

-- Brands table
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    blacklisted BOOLEAN DEFAULT FALSE,
    exclusivity_clauses JSONB DEFAULT '[]',
    contact_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand deals table
CREATE TABLE brand_deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_name VARCHAR(255) NOT NULL,
    campaign_name VARCHAR(255) NOT NULL,
    status brand_deal_status DEFAULT 'pitch',
    deliverables JSONB DEFAULT '[]',
    exclusivity_clauses JSONB DEFAULT '[]',
    fee DECIMAL(10,2),
    deadline TIMESTAMP WITH TIME ZONE,
    contract_signed_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status DEFAULT 'synced',
    version INTEGER DEFAULT 1
);

-- Content assets table
CREATE TABLE content_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type content_asset_type NOT NULL,
    platform VARCHAR(50),
    brand_deal_id UUID REFERENCES brand_deals(id),
    published_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'draft',
    metrics JSONB DEFAULT '{}',
    media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scripts table
CREATE TABLE scripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    brand_deal_id UUID REFERENCES brand_deals(id),
    content_asset_id UUID REFERENCES content_assets(id),
    content TEXT,
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Solar CRM tables

-- Solar leads table
CREATE TABLE solar_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_info JSONB NOT NULL, -- {name, email, phone, address}
    property_type property_type NOT NULL,
    energy_requirements JSONB DEFAULT '{}', -- {current_bill, usage_kwh, etc}
    status solar_lead_status DEFAULT 'lead',
    followup_date TIMESTAMP WITH TIME ZONE,
    source VARCHAR(100),
    priority task_priority DEFAULT 'medium',
    notes JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status DEFAULT 'synced',
    version INTEGER DEFAULT 1
);

-- Solar projects table
CREATE TABLE solar_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES solar_leads(id),
    customer_id UUID,
    system_size DECIMAL(8,2), -- kW
    installation_date TIMESTAMP WITH TIME ZONE,
    permit_status permit_status DEFAULT 'pending',
    timeline JSONB DEFAULT '[]', -- Array of milestones
    contract_value DECIMAL(12,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status DEFAULT 'synced',
    version INTEGER DEFAULT 1
);

-- Followup tasks table
CREATE TABLE followup_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES solar_leads(id),
    type VARCHAR(100) NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pomodoro timer tables

-- Pomodoro sessions table
CREATE TABLE pomodoro_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID,
    task_category VARCHAR(100),
    duration INTEGER NOT NULL DEFAULT 25, -- minutes
    break_duration INTEGER DEFAULT 5, -- minutes
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status DEFAULT 'synced',
    version INTEGER DEFAULT 1
);

-- Pomodoro stats table
CREATE TABLE pomodoro_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    total_focus_time INTEGER DEFAULT 0, -- minutes
    categories JSONB DEFAULT '{}', -- category -> time mapping
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Study trackers table
CREATE TABLE study_trackers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    time_spent INTEGER NOT NULL, -- minutes
    progress_notes TEXT,
    streak_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PR management tables

-- PR contracts table
CREATE TABLE pr_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    show_name VARCHAR(255) NOT NULL,
    network VARCHAR(100),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    contract_terms JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appearance windows table
CREATE TABLE appearance_windows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES pr_contracts(id),
    show_name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    availability_type VARCHAR(50) DEFAULT 'available', -- available, blackout, exclusive
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status DEFAULT 'synced',
    version INTEGER DEFAULT 1
);

-- PR events table
CREATE TABLE pr_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    type pr_event_type NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    wardrobe_notes TEXT,
    styling_notes TEXT,
    talking_points JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status DEFAULT 'synced',
    version INTEGER DEFAULT 1
);

-- Talking points table
CREATE TABLE talking_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    approved BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approved narratives table
CREATE TABLE approved_narratives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    content TEXT NOT NULL,
    approved BOOLEAN DEFAULT TRUE,
    approved_by VARCHAR(255),
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media coverage table
CREATE TABLE media_coverage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pr_event_id UUID REFERENCES pr_events(id),
    outlet VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- article, video, podcast, etc
    publish_date TIMESTAMP WITH TIME ZONE,
    sentiment VARCHAR(20), -- positive, neutral, negative
    url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_setlists_gig_id ON setlists(gig_id);
CREATE INDEX idx_brand_deals_status ON brand_deals(status);
CREATE INDEX idx_brand_deals_deadline ON brand_deals(deadline);
CREATE INDEX idx_solar_leads_status ON solar_leads(status);
CREATE INDEX idx_solar_leads_followup_date ON solar_leads(followup_date);
CREATE INDEX idx_pomodoro_sessions_start_time ON pomodoro_sessions(start_time);
CREATE INDEX idx_appearance_windows_dates ON appearance_windows(start_date, end_date);

-- Create updated_at triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_setlists_updated_at BEFORE UPDATE ON setlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gigs_updated_at BEFORE UPDATE ON gigs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brand_deals_updated_at BEFORE UPDATE ON brand_deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_solar_leads_updated_at BEFORE UPDATE ON solar_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_solar_projects_updated_at BEFORE UPDATE ON solar_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pomodoro_sessions_updated_at BEFORE UPDATE ON pomodoro_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appearance_windows_updated_at BEFORE UPDATE ON appearance_windows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pr_events_updated_at BEFORE UPDATE ON pr_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appearance_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_events ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be customized based on specific requirements)
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Events are visible based on user role and privacy settings
CREATE POLICY "Users can view events" ON events FOR SELECT USING (
    auth.uid()::text = created_by::text OR 
    visibility != 'manager_only'
);

-- Tasks are user-specific
CREATE POLICY "Users can manage own tasks" ON tasks FOR ALL USING (true); -- Simplified for now

-- Other tables follow similar patterns - can be customized based on business rules