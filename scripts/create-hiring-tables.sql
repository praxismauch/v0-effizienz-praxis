-- Create hiring tables if they don't exist

-- Create candidates table
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
  deleted_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE
);

-- Create job_postings table
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  title VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  description TEXT,
  requirements TEXT,
  benefits TEXT,
  location VARCHAR(255),
  employment_type VARCHAR(100),
  salary_range_min NUMERIC,
  salary_range_max NUMERIC,
  status VARCHAR(50) DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_posting_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'new',
  stage VARCHAR(100) DEFAULT 'new',
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create pipeline_stages table
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  stage_order INTEGER NOT NULL DEFAULT 0,
  color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_candidates_practice_id ON candidates(practice_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_candidates_events ON candidates USING GIN (events) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_job_postings_practice_id ON job_postings(practice_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_applications_practice_id ON applications(practice_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_applications_job_posting_id ON applications(job_posting_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_practice_id ON pipeline_stages(practice_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_job_posting_id ON pipeline_stages(job_posting_id);

-- Add comment for events column
COMMENT ON COLUMN candidates.events IS 'Array of candidate events: interviews (1. Bewerbungsgespräch, 2. Bewerbungsgespräch), trial work days (1. Probearbeitstag, 2. Probearbeitstag), etc.';
