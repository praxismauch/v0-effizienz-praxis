-- Create certifications table (practice_id is INTEGER to match practices table)
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  issuing_authority TEXT,
  validity_months INTEGER,
  reminder_days_before INTEGER DEFAULT 30,
  is_mandatory BOOLEAN DEFAULT FALSE,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  team_id UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create training_courses table
CREATE TABLE IF NOT EXISTS training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  provider TEXT,
  category TEXT DEFAULT 'general',
  duration_hours NUMERIC,
  cost NUMERIC,
  currency TEXT DEFAULT 'EUR',
  location TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  registration_url TEXT,
  max_participants INTEGER,
  recurrence_months INTEGER,
  is_mandatory BOOLEAN DEFAULT FALSE,
  team_id UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create training_events table
CREATE TABLE IF NOT EXISTS training_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  training_course_id UUID REFERENCES training_courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  location TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  meeting_link TEXT,
  max_participants INTEGER,
  cost_per_person NUMERIC,
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'geplant',
  notes TEXT,
  team_id UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create team_member_certifications table
CREATE TABLE IF NOT EXISTS team_member_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL,
  certification_id UUID NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  status TEXT DEFAULT 'active',
  certificate_file_url TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(team_member_id, certification_id)
);

-- Create training_budgets table
CREATE TABLE IF NOT EXISTS training_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  team_member_id UUID,
  team_id UUID,
  year INTEGER NOT NULL,
  budget_amount NUMERIC DEFAULT 0,
  used_amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_certifications_practice_id ON certifications(practice_id);
CREATE INDEX IF NOT EXISTS idx_certifications_team_id ON certifications(team_id);
CREATE INDEX IF NOT EXISTS idx_training_courses_practice_id ON training_courses(practice_id);
CREATE INDEX IF NOT EXISTS idx_training_events_practice_id ON training_events(practice_id);
CREATE INDEX IF NOT EXISTS idx_training_events_start_date ON training_events(start_date);
CREATE INDEX IF NOT EXISTS idx_team_member_certifications_practice_id ON team_member_certifications(practice_id);
CREATE INDEX IF NOT EXISTS idx_team_member_certifications_team_member_id ON team_member_certifications(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_member_certifications_certification_id ON team_member_certifications(certification_id);
CREATE INDEX IF NOT EXISTS idx_training_budgets_practice_id ON training_budgets(practice_id);
CREATE INDEX IF NOT EXISTS idx_training_budgets_year ON training_budgets(year);

-- Add RLS policies
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_budgets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Allow service role full access on certifications" ON certifications;
DROP POLICY IF EXISTS "Allow service role full access on training_courses" ON training_courses;
DROP POLICY IF EXISTS "Allow service role full access on training_events" ON training_events;
DROP POLICY IF EXISTS "Allow service role full access on team_member_certifications" ON team_member_certifications;
DROP POLICY IF EXISTS "Allow service role full access on training_budgets" ON training_budgets;

-- Create policies for service role access
CREATE POLICY "Allow service role full access on certifications" 
ON certifications FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow service role full access on training_courses" 
ON training_courses FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow service role full access on training_events" 
ON training_events FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow service role full access on team_member_certifications" 
ON team_member_certifications FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow service role full access on training_budgets" 
ON training_budgets FOR ALL 
USING (true) 
WITH CHECK (true);
