-- Create CIRS (Critical Incident Reporting System) table
-- This allows team members to report errors, near-errors, and critical incidents

CREATE TABLE IF NOT EXISTS cirs_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL,
  
  -- Incident details
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  incident_type VARCHAR(50) NOT NULL, -- 'error', 'near_error', 'adverse_event', 'complication'
  severity VARCHAR(50) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  category VARCHAR(100), -- e.g., 'Medikation', 'Hygiene', 'Geräte', 'Prozesse', 'Kommunikation'
  
  -- Location and timing
  incident_date TIMESTAMP WITH TIME ZONE,
  location VARCHAR(255), -- Where the incident occurred
  
  -- People involved (anonymized if needed)
  is_anonymous BOOLEAN DEFAULT false,
  reporter_id UUID, -- null if anonymous
  reporter_name VARCHAR(255), -- only if not anonymous
  affected_parties TEXT, -- Description of who was affected
  
  -- Impact assessment
  patient_harm VARCHAR(50), -- 'none', 'minor', 'moderate', 'severe', 'fatal'
  immediate_actions_taken TEXT, -- What was done immediately
  outcome TEXT, -- What was the result
  
  -- Root cause analysis
  root_cause TEXT,
  contributing_factors TEXT,
  
  -- Prevention and learning
  prevention_suggestions TEXT, -- User's suggestions
  ai_suggestions TEXT, -- AI-generated suggestions
  ai_analysis JSONB, -- Full AI analysis data
  corrective_actions TEXT, -- Actions to prevent recurrence
  
  -- Status and workflow
  status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'under_review', 'analyzed', 'resolved', 'closed'
  priority VARCHAR(50) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  assigned_to UUID, -- Team member responsible for review
  
  -- Knowledge base integration
  linked_to_knowledge BOOLEAN DEFAULT false,
  knowledge_article_id UUID, -- If converted to knowledge article
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  
  -- Attachments and evidence
  attachments JSONB DEFAULT '[]', -- Array of file URLs/paths
  
  -- Tags for better organization
  tags JSONB DEFAULT '[]'
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_cirs_practice_id ON cirs_incidents(practice_id);
CREATE INDEX IF NOT EXISTS idx_cirs_status ON cirs_incidents(status);
CREATE INDEX IF NOT EXISTS idx_cirs_incident_type ON cirs_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_cirs_severity ON cirs_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_cirs_category ON cirs_incidents(category);
CREATE INDEX IF NOT EXISTS idx_cirs_created_at ON cirs_incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cirs_reporter_id ON cirs_incidents(reporter_id);
CREATE INDEX IF NOT EXISTS idx_cirs_incident_date ON cirs_incidents(incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_cirs_anonymous ON cirs_incidents(is_anonymous);

-- Enable RLS
ALTER TABLE cirs_incidents ENABLE ROW LEVEL SECURITY;

-- Create policy for access (practice-based access)
DROP POLICY IF EXISTS "Allow all on cirs_incidents" ON cirs_incidents;
CREATE POLICY "Allow all on cirs_incidents" ON cirs_incidents FOR ALL USING (true) WITH CHECK (true);

-- Create comments table for incident discussions
CREATE TABLE IF NOT EXISTS cirs_incident_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES cirs_incidents(id) ON DELETE CASCADE,
  user_id UUID,
  user_name VARCHAR(255),
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Internal team notes vs visible to reporter
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cirs_comments_incident_id ON cirs_incident_comments(incident_id);
CREATE INDEX IF NOT EXISTS idx_cirs_comments_created_at ON cirs_incident_comments(created_at DESC);

ALTER TABLE cirs_incident_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on cirs_incident_comments" ON cirs_incident_comments;
CREATE POLICY "Allow all on cirs_incident_comments" ON cirs_incident_comments FOR ALL USING (true) WITH CHECK (true);

-- Create analytics view for CIRS reporting
CREATE OR REPLACE VIEW cirs_incident_stats AS
SELECT 
  practice_id,
  COUNT(*) as total_incidents,
  COUNT(*) FILTER (WHERE incident_type = 'error') as errors,
  COUNT(*) FILTER (WHERE incident_type = 'near_error') as near_errors,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_incidents,
  COUNT(*) FILTER (WHERE severity = 'high') as high_severity,
  COUNT(*) FILTER (WHERE patient_harm != 'none') as incidents_with_harm,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_incidents,
  COUNT(*) FILTER (WHERE linked_to_knowledge = true) as knowledge_conversions,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_resolution_hours
FROM cirs_incidents
GROUP BY practice_id;

-- Add comments
COMMENT ON TABLE cirs_incidents IS 'Critical Incident Reporting System - stores error and near-error reports';
COMMENT ON TABLE cirs_incident_comments IS 'Comments and discussions on CIRS incidents';
COMMENT ON COLUMN cirs_incidents.is_anonymous IS 'Whether the report was submitted anonymously';
COMMENT ON COLUMN cirs_incidents.ai_suggestions IS 'AI-generated suggestions for preventing similar incidents';
COMMENT ON COLUMN cirs_incidents.linked_to_knowledge IS 'Whether incident has been converted to knowledge base article';
