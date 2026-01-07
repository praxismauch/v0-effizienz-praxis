-- Create user_self_checks table for storing Selbsteinschätzung data
CREATE TABLE IF NOT EXISTS user_self_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  practice_id INTEGER NOT NULL,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Dimensions (1-10 scale)
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  work_satisfaction INTEGER CHECK (work_satisfaction >= 1 AND work_satisfaction <= 10),
  team_harmony INTEGER CHECK (team_harmony >= 1 AND team_harmony <= 10),
  work_life_balance INTEGER CHECK (work_life_balance >= 1 AND work_life_balance <= 10),
  motivation INTEGER CHECK (motivation >= 1 AND motivation <= 10),
  overall_wellbeing INTEGER CHECK (overall_wellbeing >= 1 AND overall_wellbeing <= 10),
  
  -- Calculated score
  overall_score NUMERIC(4,2),
  
  -- AI recommendations (stored as JSONB)
  ai_recommendations JSONB,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Unique constraint for one assessment per user per day
  CONSTRAINT user_self_checks_unique_daily UNIQUE (user_id, assessment_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_self_checks_user_id ON user_self_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_self_checks_practice_id ON user_self_checks(practice_id);
CREATE INDEX IF NOT EXISTS idx_user_self_checks_assessment_date ON user_self_checks(assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_self_checks_user_date ON user_self_checks(user_id, assessment_date DESC);

-- Enable RLS
ALTER TABLE user_self_checks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all on user_self_checks" ON user_self_checks FOR ALL USING (true) WITH CHECK (true);

-- Add comment
COMMENT ON TABLE user_self_checks IS 'Stores weekly self-assessment (Selbsteinschätzung) data for users';
