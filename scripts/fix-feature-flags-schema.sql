-- Drop existing tables and recreate with correct schema
DROP TABLE IF EXISTS practice_feature_overrides CASCADE;
DROP TABLE IF EXISTS feature_flags CASCADE;

-- Create feature_flags table for managing app menu items and features
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key VARCHAR(255) UNIQUE NOT NULL,
  feature_name VARCHAR(255) NOT NULL,
  feature_type VARCHAR(50) NOT NULL CHECK (feature_type IN ('frontend', 'backend')),
  parent_key VARCHAR(255) NULL,
  icon_name VARCHAR(100) NULL,
  route_path VARCHAR(500) NULL,
  is_enabled BOOLEAN DEFAULT true NOT NULL,
  is_beta BOOLEAN DEFAULT false NOT NULL,
  is_protected BOOLEAN DEFAULT false NOT NULL,
  allow_practice_override BOOLEAN DEFAULT true NOT NULL,
  display_order INTEGER DEFAULT 0 NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_by UUID NULL
);

-- Create practice_feature_overrides table for practice-specific feature settings
CREATE TABLE practice_feature_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  feature_key VARCHAR(255) NOT NULL,
  is_enabled BOOLEAN NULL,
  is_beta BOOLEAN NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_by UUID NULL,
  UNIQUE(practice_id, feature_key)
);

-- Create indexes for better query performance
CREATE INDEX idx_feature_flags_feature_type ON feature_flags(feature_type);
CREATE INDEX idx_feature_flags_parent_key ON feature_flags(parent_key);
CREATE INDEX idx_feature_flags_is_enabled ON feature_flags(is_enabled);
CREATE INDEX idx_practice_feature_overrides_practice_id ON practice_feature_overrides(practice_id);
CREATE INDEX idx_practice_feature_overrides_feature_key ON practice_feature_overrides(feature_key);

-- Enable RLS on both tables
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_feature_overrides ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (super admin check happens in API)
CREATE POLICY "Allow all feature_flags access" ON feature_flags FOR ALL USING (true);
CREATE POLICY "Allow all practice_feature_overrides access" ON practice_feature_overrides FOR ALL USING (true);

-- Insert default feature flags
INSERT INTO feature_flags (feature_key, feature_name, feature_type, icon_name, route_path, is_enabled, is_protected, display_order) VALUES
  ('nav.dashboard', 'Dashboard', 'frontend', 'LayoutDashboard', '/dashboard', true, true, 1),
  ('nav.analytics', 'Analytics', 'frontend', 'BarChart3', '/analytics', true, false, 2),
  ('nav.team', 'Team', 'frontend', 'Users', '/team', true, false, 3),
  ('nav.zeiterfassung', 'Zeiterfassung', 'frontend', 'Clock', '/zeiterfassung', true, false, 4),
  ('nav.documents', 'Dokumente', 'frontend', 'FileText', '/documents', true, false, 5),
  ('nav.calendar', 'Kalender', 'frontend', 'Calendar', '/calendar', true, false, 6),
  ('nav.tasks', 'Aufgaben', 'frontend', 'CheckSquare', '/tasks', true, false, 7),
  ('nav.tickets', 'Tickets', 'frontend', 'Ticket', '/super-admin/tickets', true, false, 8),
  ('nav.settings', 'Einstellungen', 'frontend', 'Settings', '/settings', true, true, 99);
