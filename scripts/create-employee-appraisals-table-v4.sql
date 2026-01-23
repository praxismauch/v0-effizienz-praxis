-- Create employee_appraisals table (without role-specific grants or users table reference)
CREATE TABLE IF NOT EXISTS employee_appraisals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  appraiser_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  appraisal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  appraisal_type VARCHAR(50) DEFAULT 'regular',
  status VARCHAR(50) DEFAULT 'draft',
  
  -- Performance ratings
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  performance_data JSONB DEFAULT '{}'::jsonb,
  skills_data JSONB DEFAULT '{}'::jsonb,
  goals_data JSONB DEFAULT '{}'::jsonb,
  development_data JSONB DEFAULT '{}'::jsonb,
  feedback_data JSONB DEFAULT '{}'::jsonb,
  
  -- Summary
  strengths TEXT,
  areas_for_improvement TEXT,
  action_items TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_employee_appraisals_practice_id ON employee_appraisals(practice_id);
CREATE INDEX IF NOT EXISTS idx_employee_appraisals_employee_id ON employee_appraisals(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_appraisals_appraiser_id ON employee_appraisals(appraiser_id);
CREATE INDEX IF NOT EXISTS idx_employee_appraisals_status ON employee_appraisals(status);
CREATE INDEX IF NOT EXISTS idx_employee_appraisals_date ON employee_appraisals(appraisal_date);
