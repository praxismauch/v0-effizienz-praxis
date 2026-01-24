-- Migration: Add Google Business API settings table
-- This table stores Google Business Profile API credentials for each practice

CREATE TABLE IF NOT EXISTS google_business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- OAuth credentials
  client_id TEXT,
  client_secret_encrypted TEXT,
  refresh_token_encrypted TEXT,
  access_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Account/Location IDs
  account_id TEXT,
  location_id TEXT,
  location_name TEXT,
  
  -- Connection status
  is_connected BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_sync_status TEXT,
  last_sync_error TEXT,
  
  -- Auto-sync settings
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_frequency_hours INTEGER DEFAULT 24,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  
  UNIQUE(practice_id)
);

-- Enable RLS
ALTER TABLE google_business_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Allow all on google_business_settings" ON google_business_settings
  FOR ALL USING (true) WITH CHECK (true);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_business_settings_practice_id 
  ON google_business_settings(practice_id);

-- Comment on table
COMMENT ON TABLE google_business_settings IS 'Stores Google Business Profile API settings for each practice';
