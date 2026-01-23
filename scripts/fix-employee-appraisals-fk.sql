-- Fix employee_appraisals foreign key constraints
-- The employee_id should reference team_members(id) as UUID

-- First, check if the table exists and drop the constraint if it references wrong table
DO $$ 
BEGIN
  -- Drop existing foreign key if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_employee_appraisals_employee' 
    AND table_name = 'employee_appraisals'
  ) THEN
    ALTER TABLE employee_appraisals DROP CONSTRAINT fk_employee_appraisals_employee;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_employee_appraisals_appraiser' 
    AND table_name = 'employee_appraisals'
  ) THEN
    ALTER TABLE employee_appraisals DROP CONSTRAINT fk_employee_appraisals_appraiser;
  END IF;
END $$;

-- Re-add the foreign key constraints referencing team_members table
ALTER TABLE employee_appraisals 
ADD CONSTRAINT fk_employee_appraisals_employee 
FOREIGN KEY (employee_id) REFERENCES team_members(id) ON DELETE CASCADE;

ALTER TABLE employee_appraisals 
ADD CONSTRAINT fk_employee_appraisals_appraiser 
FOREIGN KEY (appraiser_id) REFERENCES team_members(id) ON DELETE SET NULL;

-- If the table doesn't exist at all, create it
CREATE TABLE IF NOT EXISTS employee_appraisals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL,
  employee_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  appraiser_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  appraisal_type VARCHAR(50) DEFAULT 'annual',
  appraisal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'scheduled',
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
  potential_rating INTEGER CHECK (potential_rating >= 1 AND potential_rating <= 5),
  strengths TEXT,
  areas_for_improvement TEXT,
  goals_set TEXT,
  development_plan TEXT,
  employee_comments TEXT,
  manager_comments TEXT,
  notes JSONB DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  next_review_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_appraisals_practice ON employee_appraisals(practice_id);
CREATE INDEX IF NOT EXISTS idx_employee_appraisals_employee ON employee_appraisals(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_appraisals_date ON employee_appraisals(appraisal_date);
CREATE INDEX IF NOT EXISTS idx_employee_appraisals_status ON employee_appraisals(status);

-- Enable RLS
ALTER TABLE employee_appraisals ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS "Allow all on employee_appraisals" ON employee_appraisals;
CREATE POLICY "Allow all on employee_appraisals" ON employee_appraisals FOR ALL USING (true) WITH CHECK (true);
