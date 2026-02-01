-- Create applications table for hiring system
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_posting_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'new',
  stage UUID,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_applications_practice_id ON applications(practice_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_posting_id ON applications(job_posting_id);

-- Create pipeline_stages table for hiring system
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

-- Create indexes for pipeline_stages
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_practice_id ON pipeline_stages(practice_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_job_posting_id ON pipeline_stages(job_posting_id);
