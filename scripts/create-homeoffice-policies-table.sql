CREATE TABLE IF NOT EXISTS homeoffice_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  user_id TEXT,
  is_allowed BOOLEAN NOT NULL DEFAULT true,
  allowed_days TEXT[] DEFAULT ARRAY['monday','tuesday','wednesday','thursday','friday'],
  allowed_start_time TEXT DEFAULT '08:00',
  allowed_end_time TEXT DEFAULT '18:00',
  max_days_per_week INTEGER DEFAULT 2,
  requires_reason BOOLEAN DEFAULT false,
  requires_location_verification BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique constraint to prevent duplicate policies per user per practice
-- user_id NULL means it's the default policy for the practice
CREATE UNIQUE INDEX IF NOT EXISTS homeoffice_policies_practice_user_unique
  ON homeoffice_policies (practice_id, COALESCE(user_id, '__default__'));

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS homeoffice_policies_practice_id_idx
  ON homeoffice_policies (practice_id);
