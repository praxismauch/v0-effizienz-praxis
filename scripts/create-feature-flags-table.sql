-- Drop and recreate feature_flags table to ensure correct schema
DROP TABLE IF EXISTS practice_feature_overrides CASCADE;
DROP TABLE IF EXISTS feature_flags CASCADE;

-- Create feature_flags table for managing feature toggles
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'general',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create practice_feature_overrides table for practice-specific feature settings
CREATE TABLE IF NOT EXISTS practice_feature_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(practice_id, feature_flag_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON feature_flags(category);
CREATE INDEX IF NOT EXISTS idx_practice_feature_overrides_practice ON practice_feature_overrides(practice_id);
CREATE INDEX IF NOT EXISTS idx_practice_feature_overrides_feature ON practice_feature_overrides(feature_flag_id);

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_feature_overrides ENABLE ROW LEVEL SECURITY;

-- Allow all access (API handles authorization)
CREATE POLICY "Allow all feature_flags access" ON feature_flags FOR ALL USING (true);
CREATE POLICY "Allow all practice_feature_overrides access" ON practice_feature_overrides FOR ALL USING (true);

-- Insert default feature flags for navigation items
INSERT INTO feature_flags (key, name, description, enabled, category) VALUES
  ('nav.dashboard', 'Dashboard', 'Main dashboard view', true, 'navigation'),
  ('nav.analytics', 'Analytics', 'Analytics and reporting', true, 'navigation'),
  ('nav.team', 'Team', 'Team management', true, 'navigation'),
  ('nav.zeiterfassung', 'Zeiterfassung', 'Time tracking', true, 'navigation'),
  ('nav.documents', 'Documents', 'Document management', true, 'navigation'),
  ('nav.settings', 'Settings', 'Application settings', true, 'navigation'),
  ('nav.calendar', 'Calendar', 'Calendar view', true, 'navigation'),
  ('nav.tasks', 'Tasks', 'Task management', true, 'navigation'),
  ('nav.responsibilities', 'Responsibilities', 'Responsibility management', true, 'navigation'),
  ('feature.ai_analysis', 'AI Analysis', 'AI-powered practice analysis', true, 'backend'),
  ('feature.export', 'Export', 'Data export functionality', true, 'backend')
ON CONFLICT (key) DO NOTHING;
