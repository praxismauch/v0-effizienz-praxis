-- Create employee_appraisals table for storing Mitarbeitergespräche
-- This table stores employee performance appraisals/conversations

CREATE TABLE IF NOT EXISTS employee_appraisals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  appraiser_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  
  -- Appraisal metadata
  appraisal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  appraisal_type TEXT DEFAULT 'regular',
  status TEXT DEFAULT 'draft',
  
  -- Ratings (1-5 scale)
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
  teamwork_rating INTEGER CHECK (teamwork_rating >= 1 AND teamwork_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  initiative_rating INTEGER CHECK (initiative_rating >= 1 AND initiative_rating <= 5),
  reliability_rating INTEGER CHECK (reliability_rating >= 1 AND reliability_rating <= 5),
  
  -- Text fields
  strengths TEXT,
  areas_for_improvement TEXT,
  goals TEXT,
  notes TEXT,
  employee_feedback TEXT,
  
  -- Additional structured data
  competencies JSONB DEFAULT '[]'::jsonb,
  goals_data JSONB DEFAULT '[]'::jsonb,
  development_areas JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_employee_appraisals_practice_id ON employee_appraisals(practice_id);
CREATE INDEX IF NOT EXISTS idx_employee_appraisals_employee_id ON employee_appraisals(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_appraisals_appraiser_id ON employee_appraisals(appraiser_id);
CREATE INDEX IF NOT EXISTS idx_employee_appraisals_date ON employee_appraisals(appraisal_date DESC);
CREATE INDEX IF NOT EXISTS idx_employee_appraisals_status ON employee_appraisals(status);
