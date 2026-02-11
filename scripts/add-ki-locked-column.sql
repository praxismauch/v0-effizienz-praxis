-- Add is_locked_for_ai column to feature_flags table
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS is_locked_for_ai BOOLEAN DEFAULT false;

-- Add is_locked_for_ai to practice_feature_overrides table as well
ALTER TABLE practice_feature_overrides ADD COLUMN IF NOT EXISTS is_locked_for_ai BOOLEAN DEFAULT NULL;
