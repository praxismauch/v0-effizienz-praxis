-- Create feature_flags table for managing app menu items and features
CREATE TABLE IF NOT EXISTS feature_flags (
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
CREATE TABLE IF NOT EXISTS practice_feature_overrides (
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
CREATE INDEX IF NOT EXISTS idx_feature_flags_feature_type ON feature_flags(feature_type);
CREATE INDEX IF NOT EXISTS idx_feature_flags_parent_key ON feature_flags(parent_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_is_enabled ON feature_flags(is_enabled);
CREATE INDEX IF NOT EXISTS idx_practice_feature_overrides_practice_id ON practice_feature_overrides(practice_id);
CREATE INDEX IF NOT EXISTS idx_practice_feature_overrides_feature_key ON practice_feature_overrides(feature_key);

-- Enable RLS on both tables
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_feature_overrides ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (super admin check happens in API)
DROP POLICY IF EXISTS "Allow all feature_flags access" ON feature_flags;
CREATE POLICY "Allow all feature_flags access" ON feature_flags FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all practice_feature_overrides access" ON practice_feature_overrides;
CREATE POLICY "Allow all practice_feature_overrides access" ON practice_feature_overrides FOR ALL USING (true);
