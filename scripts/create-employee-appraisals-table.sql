-- Employee Appraisals Table for professional Mitarbeitergespräche
CREATE TABLE IF NOT EXISTS employee_appraisals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL,
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appraiser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Appraisal metadata
  appraisal_type VARCHAR(50) NOT NULL DEFAULT 'annual', -- annual, probation, interim, development, exit
  appraisal_date DATE NOT NULL,
  period_start DATE,
  period_end DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'draft', -- draft, scheduled, in_progress, completed, signed
  
  -- Performance ratings (1-5 scale)
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  
  -- Performance categories (JSON with scores and comments)
  performance_areas JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ area: string, rating: 1-5, weight: number, comments: string }]
  
  -- Competency assessment
  competencies JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ competency: string, current_level: 1-5, target_level: 1-5, gap: number, development_notes: string }]
  
  -- Goals review
  goals_review JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ goal: string, target: string, achieved: string, rating: 1-5, comments: string }]
  
  -- New goals for next period
  new_goals JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ goal: string, target: string, deadline: date, priority: string, success_criteria: string }]
  
  -- Development plan
  development_plan JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ area: string, action: string, timeline: string, resources: string, status: string }]
  
  -- Feedback sections
  strengths TEXT,
  areas_for_improvement TEXT,
  achievements TEXT,
  challenges TEXT,
  
  -- Employee self-assessment
  employee_self_rating INTEGER CHECK (employee_self_rating >= 1 AND employee_self_rating <= 5),
  employee_comments TEXT,
  employee_goals TEXT,
  employee_development_wishes TEXT,
  
  -- Manager notes
  manager_summary TEXT,
  manager_recommendations TEXT,
  
  -- Career development
  career_aspirations TEXT,
  promotion_readiness VARCHAR(30), -- not_ready, developing, ready, overdue
  succession_potential VARCHAR(30), -- low, medium, high
  
  -- Compensation review
  salary_review_notes TEXT,
  salary_recommendation VARCHAR(30), -- no_change, increase, significant_increase
  bonus_recommendation TEXT,
  
  -- Signatures and completion
  employee_signed_at TIMESTAMP WITH TIME ZONE,
  manager_signed_at TIMESTAMP WITH TIME ZONE,
  hr_reviewed_at TIMESTAMP WITH TIME ZONE,
  hr_reviewer_id UUID REFERENCES auth.users(id),
  
  -- Follow-up
  next_review_date DATE,
  follow_up_actions JSONB DEFAULT '[]'::jsonb,
  
  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- AI insights
  ai_summary TEXT,
  ai_recommendations JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_appraisals_practice ON employee_appraisals(practice_id);
CREATE INDEX IF NOT EXISTS idx_employee_appraisals_employee ON employee_appraisals(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_appraisals_date ON employee_appraisals(appraisal_date);
CREATE INDEX IF NOT EXISTS idx_employee_appraisals_status ON employee_appraisals(status);
CREATE INDEX IF NOT EXISTS idx_employee_appraisals_deleted ON employee_appraisals(deleted_at) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE employee_appraisals ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "employee_appraisals_policy" ON employee_appraisals FOR ALL USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_employee_appraisals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_employee_appraisals_updated_at ON employee_appraisals;
CREATE TRIGGER trigger_employee_appraisals_updated_at
  BEFORE UPDATE ON employee_appraisals
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_appraisals_updated_at();
