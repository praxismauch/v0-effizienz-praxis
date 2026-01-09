-- Practice-specific feature flag overrides
-- This allows individual practices to have different feature settings than the global defaults

-- Changed practice_id to INTEGER to match the actual practices table schema
CREATE TABLE IF NOT EXISTS practice_feature_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL,
  feature_key VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN, -- NULL means use global setting
  is_beta BOOLEAN, -- NULL means use global setting
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT,
  UNIQUE(practice_id, feature_key)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_practice_feature_overrides_practice ON practice_feature_overrides(practice_id);
CREATE INDEX IF NOT EXISTS idx_practice_feature_overrides_feature ON practice_feature_overrides(feature_key);

-- Enable RLS
ALTER TABLE practice_feature_overrides ENABLE ROW LEVEL SECURITY;

-- Policy for super admins and practice admins
DROP POLICY IF EXISTS "practice_feature_overrides_policy" ON practice_feature_overrides;
CREATE POLICY "practice_feature_overrides_policy" ON practice_feature_overrides
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_practice_feature_overrides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS practice_feature_overrides_updated_at ON practice_feature_overrides;
CREATE TRIGGER practice_feature_overrides_updated_at
  BEFORE UPDATE ON practice_feature_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_practice_feature_overrides_updated_at();

-- Add a column to feature_flags to track if per-practice override is allowed
ALTER TABLE feature_flags 
ADD COLUMN IF NOT EXISTS allow_practice_override BOOLEAN NOT NULL DEFAULT true;

-- Feature-Verwaltung should not be overridable per practice
UPDATE feature_flags 
SET allow_practice_override = false 
WHERE feature_key = 'backend_feature_verwaltung';
