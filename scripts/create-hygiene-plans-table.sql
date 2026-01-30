-- Create Hygiene Plans table
-- This allows practices to manage hygiene plans based on RKI guidelines

CREATE TABLE IF NOT EXISTS hygiene_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL,
  
  -- Plan identification
  title VARCHAR(500) NOT NULL,
  description TEXT,
  plan_type VARCHAR(100) NOT NULL, -- 'general', 'hand_hygiene', 'instrument_hygiene', 'surface_disinfection', 'waste_management', 'water_hygiene', 'air_hygiene', 'laundry', 'patient_care'
  
  -- RKI compliance
  rki_guideline_reference VARCHAR(255), -- Reference to specific RKI guideline
  rki_compliant BOOLEAN DEFAULT true,
  rki_last_updated DATE, -- When RKI guideline was last updated
  
  -- Plan content
  content TEXT NOT NULL, -- Rich text/HTML content
  procedures JSONB DEFAULT '[]', -- Array of procedures: [{step, description, frequency, responsible}]
  requirements JSONB DEFAULT '[]', -- Array of requirements: [{requirement, type, importance}]
  products JSONB DEFAULT '[]', -- Array of products: [{name, manufacturer, usage, certification}]
  
  -- Scheduling and frequency
  frequency VARCHAR(100), -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'as_needed'
  schedule JSONB, -- Detailed schedule information
  last_executed TIMESTAMP WITH TIME ZONE,
  next_due TIMESTAMP WITH TIME ZONE,
  
  -- Responsibility and training
  responsible_person VARCHAR(255),
  responsible_role VARCHAR(100),
  required_training JSONB DEFAULT '[]', -- Array of required training
  training_valid_until DATE,
  
  -- Documentation and verification
  documentation_required BOOLEAN DEFAULT true,
  verification_method VARCHAR(100), -- 'checklist', 'signature', 'photo', 'lab_test'
  verification_frequency VARCHAR(100),
  
  -- Status and workflow
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'under_review', 'archived', 'expired'
  version INTEGER DEFAULT 1,
  is_template BOOLEAN DEFAULT false, -- Whether this is a reusable template
  template_id UUID, -- If derived from a template
  
  -- AI generation metadata
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT, -- The prompt used to generate this plan
  ai_model VARCHAR(100), -- The AI model used
  generation_metadata JSONB, -- Additional AI generation data
  
  -- Knowledge base integration
  linked_to_knowledge BOOLEAN DEFAULT false,
  knowledge_article_id UUID,
  
  -- Compliance tracking
  compliance_level VARCHAR(50) DEFAULT 'full', -- 'full', 'partial', 'non_compliant'
  last_audit_date TIMESTAMP WITH TIME ZONE,
  next_audit_date TIMESTAMP WITH TIME ZONE,
  audit_notes TEXT,
  
  -- Approval workflow
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  approval_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  
  -- Attachments
  attachments JSONB DEFAULT '[]', -- Array of file URLs/paths for supporting documents
  
  -- Tags for organization
  tags JSONB DEFAULT '[]',
  
  -- Custom fields
  custom_fields JSONB DEFAULT '{}'
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_hygiene_plans_practice_id ON hygiene_plans(practice_id);
CREATE INDEX IF NOT EXISTS idx_hygiene_plans_status ON hygiene_plans(status);
CREATE INDEX IF NOT EXISTS idx_hygiene_plans_plan_type ON hygiene_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_hygiene_plans_created_at ON hygiene_plans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hygiene_plans_next_due ON hygiene_plans(next_due);
CREATE INDEX IF NOT EXISTS idx_hygiene_plans_is_template ON hygiene_plans(is_template);
CREATE INDEX IF NOT EXISTS idx_hygiene_plans_rki_compliant ON hygiene_plans(rki_compliant);

-- Enable RLS
ALTER TABLE hygiene_plans ENABLE ROW LEVEL SECURITY;

-- Create policy for access (practice-based access)
DROP POLICY IF EXISTS "Allow all on hygiene_plans" ON hygiene_plans;
CREATE POLICY "Allow all on hygiene_plans" ON hygiene_plans FOR ALL USING (true) WITH CHECK (true);

-- Create execution logs table for tracking when plans are executed
CREATE TABLE IF NOT EXISTS hygiene_plan_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES hygiene_plans(id) ON DELETE CASCADE,
  practice_id INTEGER NOT NULL,
  
  -- Execution details
  executed_by UUID,
  executor_name VARCHAR(255),
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Completion tracking
  status VARCHAR(50) DEFAULT 'completed', -- 'completed', 'partial', 'failed', 'skipped'
  completion_notes TEXT,
  deviations TEXT, -- Any deviations from the plan
  
  -- Verification
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_result VARCHAR(50), -- 'pass', 'fail', 'conditional_pass'
  verification_notes TEXT,
  
  -- Documentation
  checklist_data JSONB DEFAULT '{}', -- Completed checklist items
  attachments JSONB DEFAULT '[]', -- Photos, documents, etc.
  
  -- Issues and follow-ups
  issues_found TEXT,
  corrective_actions TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hygiene_executions_plan_id ON hygiene_plan_executions(plan_id);
CREATE INDEX IF NOT EXISTS idx_hygiene_executions_practice_id ON hygiene_plan_executions(practice_id);
CREATE INDEX IF NOT EXISTS idx_hygiene_executions_executed_at ON hygiene_plan_executions(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_hygiene_executions_status ON hygiene_plan_executions(status);

ALTER TABLE hygiene_plan_executions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on hygiene_plan_executions" ON hygiene_plan_executions;
CREATE POLICY "Allow all on hygiene_plan_executions" ON hygiene_plan_executions FOR ALL USING (true) WITH CHECK (true);

-- Create comments table for hygiene plans
CREATE TABLE IF NOT EXISTS hygiene_plan_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES hygiene_plans(id) ON DELETE CASCADE,
  user_id UUID,
  user_name VARCHAR(255),
  comment TEXT NOT NULL,
  comment_type VARCHAR(50) DEFAULT 'general', -- 'general', 'suggestion', 'issue', 'question'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hygiene_comments_plan_id ON hygiene_plan_comments(plan_id);
CREATE INDEX IF NOT EXISTS idx_hygiene_comments_created_at ON hygiene_plan_comments(created_at DESC);

ALTER TABLE hygiene_plan_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on hygiene_plan_comments" ON hygiene_plan_comments;
CREATE POLICY "Allow all on hygiene_plan_comments" ON hygiene_plan_comments FOR ALL USING (true) WITH CHECK (true);

-- Create analytics view for hygiene plan compliance
CREATE OR REPLACE VIEW hygiene_plan_compliance_stats AS
SELECT 
  hp.practice_id,
  hp.plan_type,
  COUNT(DISTINCT hp.id) as total_plans,
  COUNT(DISTINCT CASE WHEN hp.status = 'active' THEN hp.id END) as active_plans,
  COUNT(DISTINCT CASE WHEN hp.rki_compliant = true THEN hp.id END) as rki_compliant_plans,
  COUNT(hpe.id) as total_executions,
  COUNT(CASE WHEN hpe.status = 'completed' THEN 1 END) as completed_executions,
  COUNT(CASE WHEN hpe.verification_result = 'pass' THEN 1 END) as passed_verifications,
  AVG(CASE WHEN hpe.status = 'completed' THEN 1 ELSE 0 END) as completion_rate,
  MAX(hpe.executed_at) as last_execution
FROM hygiene_plans hp
LEFT JOIN hygiene_plan_executions hpe ON hp.id = hpe.plan_id
GROUP BY hp.practice_id, hp.plan_type;

-- Add comments
COMMENT ON TABLE hygiene_plans IS 'Hygiene plans based on RKI guidelines for practice hygiene management';
COMMENT ON TABLE hygiene_plan_executions IS 'Logs of hygiene plan executions and completions';
COMMENT ON TABLE hygiene_plan_comments IS 'Comments and discussions on hygiene plans';
COMMENT ON COLUMN hygiene_plans.rki_guideline_reference IS 'Reference to specific RKI (Robert Koch Institute) guideline';
COMMENT ON COLUMN hygiene_plans.ai_generated IS 'Whether this plan was generated by AI based on RKI guidelines';
COMMENT ON COLUMN hygiene_plans.linked_to_knowledge IS 'Whether plan has been added to knowledge base';
