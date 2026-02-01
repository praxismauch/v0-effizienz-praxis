-- Create candidates table for hiring system
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(100),
  mobile VARCHAR(100),
  date_of_birth DATE,
  address TEXT,
  city VARCHAR(255),
  postal_code VARCHAR(20),
  current_position TEXT,
  current_company VARCHAR(255),
  years_of_experience INTEGER,
  education TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  cover_letter TEXT,
  status VARCHAR(50) DEFAULT 'new',
  rating INTEGER DEFAULT 0,
  notes TEXT,
  source VARCHAR(255),
  image_url TEXT,
  documents JSONB DEFAULT '{}'::jsonb,
  salary_expectation NUMERIC,
  weekly_hours NUMERIC,
  first_contact_date DATE,
  availability_date DATE,
  converted_to_team_member BOOLEAN DEFAULT false,
  events JSONB DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_candidates_practice_id ON candidates(practice_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);

-- Add comment for events column
COMMENT ON COLUMN candidates.events IS 'Array of candidate events: interviews (1. Bewerbungsgespräch, 2. Bewerbungsgespräch), trial work days (1. Probearbeitstag, 2. Probearbeitstag), etc.';
