-- Create job_postings table for hiring system
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_postings_practice_id ON job_postings(practice_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
