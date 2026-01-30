-- Create CIRS (Critical Incident Reporting System) tables
-- This allows tracking of incidents and improvement suggestions in medical practices

-- Main incidents table
CREATE TABLE IF NOT EXISTS cirs_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  reported_by UUID REFERENCES auth.users(id),
  reported_date TIMESTAMPTZ DEFAULT NOW(),
  incident_date TIMESTAMPTZ,
  location TEXT,
  affected_area TEXT,
  immediate_actions TEXT,
  root_cause_analysis TEXT,
  preventive_measures TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  resolved_date TIMESTAMPTZ,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table for incidents
CREATE TABLE IF NOT EXISTS cirs_incident_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES cirs_incidents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cirs_incidents_practice_id ON cirs_incidents(practice_id);
CREATE INDEX IF NOT EXISTS idx_cirs_incidents_status ON cirs_incidents(status);
CREATE INDEX IF NOT EXISTS idx_cirs_incidents_severity ON cirs_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_cirs_incidents_reported_by ON cirs_incidents(reported_by);
CREATE INDEX IF NOT EXISTS idx_cirs_incidents_created_at ON cirs_incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cirs_incident_comments_incident_id ON cirs_incident_comments(incident_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_cirs_incidents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cirs_incidents_updated_at
  BEFORE UPDATE ON cirs_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_cirs_incidents_updated_at();

-- Enable Row Level Security
ALTER TABLE cirs_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE cirs_incident_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cirs_incidents
CREATE POLICY "Users can view incidents in their practice"
  ON cirs_incidents FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create incidents in their practice"
  ON cirs_incidents FOR INSERT
  WITH CHECK (
    practice_id IN (
      SELECT practice_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update incidents in their practice"
  ON cirs_incidents FOR UPDATE
  USING (
    practice_id IN (
      SELECT practice_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for cirs_incident_comments
CREATE POLICY "Users can view comments on incidents they can see"
  ON cirs_incident_comments FOR SELECT
  USING (
    incident_id IN (
      SELECT id FROM cirs_incidents WHERE practice_id IN (
        SELECT practice_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create comments on incidents they can see"
  ON cirs_incident_comments FOR INSERT
  WITH CHECK (
    incident_id IN (
      SELECT id FROM cirs_incidents WHERE practice_id IN (
        SELECT practice_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );
