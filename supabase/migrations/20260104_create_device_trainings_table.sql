-- Create device_trainings table if it doesn't exist
CREATE TABLE IF NOT EXISTS device_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  team_member_id TEXT NOT NULL,
  team_member_name TEXT,
  training_date DATE NOT NULL,
  trainer_name TEXT,
  trainer_role TEXT DEFAULT 'internal',
  training_type TEXT DEFAULT 'initial',
  valid_until DATE,
  is_valid BOOLEAN DEFAULT true,
  notes TEXT,
  certificate_url TEXT,
  signature_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_device_trainings_practice_id ON device_trainings(practice_id);
CREATE INDEX IF NOT EXISTS idx_device_trainings_device_id ON device_trainings(device_id);
CREATE INDEX IF NOT EXISTS idx_device_trainings_team_member_id ON device_trainings(team_member_id);
CREATE INDEX IF NOT EXISTS idx_device_trainings_training_date ON device_trainings(training_date);
CREATE INDEX IF NOT EXISTS idx_device_trainings_valid_until ON device_trainings(valid_until);

-- Enable RLS
ALTER TABLE device_trainings ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS "device_trainings_policy" ON device_trainings;
CREATE POLICY "device_trainings_policy" ON device_trainings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_device_trainings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_device_trainings_updated_at ON device_trainings;
CREATE TRIGGER trigger_update_device_trainings_updated_at
  BEFORE UPDATE ON device_trainings
  FOR EACH ROW
  EXECUTE FUNCTION update_device_trainings_updated_at();
