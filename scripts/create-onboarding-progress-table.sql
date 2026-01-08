-- Create onboarding_progress table to track user onboarding journey
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL,
  user_id UUID NOT NULL,
  current_step INTEGER DEFAULT 0,
  steps JSONB DEFAULT '[]'::jsonb,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  team_size VARCHAR(50),
  practice_goals JSONB,
  practice_type VARCHAR(100),
  pain_points JSONB,
  skipped_steps JSONB DEFAULT '[]'::jsonb,
  time_spent_seconds INTEGER DEFAULT 0,
  interactions_count INTEGER DEFAULT 0,
  last_step_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(practice_id, user_id)
);

-- Enable RLS
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own onboarding progress
CREATE POLICY "Users can manage their own onboarding progress"
ON onboarding_progress
FOR ALL
USING (true)
WITH CHECK (true);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_practice_user 
ON onboarding_progress(practice_id, user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_practice 
ON onboarding_progress(practice_id);
