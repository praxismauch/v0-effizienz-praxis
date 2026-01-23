-- Create responsibilities table with is_practice_goal field
CREATE TABLE IF NOT EXISTS responsibilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  group_name VARCHAR(255),
  responsible_user_id UUID,
  deputy_user_id UUID,
  team_member_ids UUID[] DEFAULT '{}',
  assigned_teams UUID[] DEFAULT '{}',
  priority VARCHAR(50) DEFAULT 'medium',
  suggested_hours_per_week NUMERIC,
  estimated_time_amount NUMERIC,
  estimated_time_period VARCHAR(50),
  cannot_complete_during_consultation BOOLEAN DEFAULT false,
  calculate_time_automatically BOOLEAN DEFAULT false,
  optimization_suggestions TEXT,
  is_practice_goal BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_responsibilities_practice_id ON responsibilities(practice_id);
CREATE INDEX IF NOT EXISTS idx_responsibilities_responsible_user ON responsibilities(responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_responsibilities_is_practice_goal ON responsibilities(is_practice_goal) WHERE is_practice_goal = true;

-- Enable RLS
ALTER TABLE responsibilities ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (can be restricted later)
DROP POLICY IF EXISTS "Allow all on responsibilities" ON responsibilities;
CREATE POLICY "Allow all on responsibilities" ON responsibilities FOR ALL USING (true) WITH CHECK (true);

-- Add comment for documentation
COMMENT ON COLUMN responsibilities.is_practice_goal IS 'Indicates if this responsibility is a personal practice goal (Persönliches Praxisziel)';
