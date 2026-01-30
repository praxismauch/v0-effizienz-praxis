-- Create CIRS tables without RLS

DROP TABLE IF EXISTS cirs_incident_comments CASCADE;
DROP TABLE IF EXISTS cirs_incidents CASCADE;

CREATE TABLE cirs_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  severity TEXT,
  status TEXT DEFAULT 'open',
  reported_by UUID,
  reported_date TIMESTAMPTZ DEFAULT NOW(),
  incident_date TIMESTAMPTZ,
  location TEXT,
  affected_area TEXT,
  immediate_actions TEXT,
  root_cause_analysis TEXT,
  preventive_measures TEXT,
  assigned_to UUID,
  resolved_date TIMESTAMPTZ,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cirs_incident_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES cirs_incidents(id) ON DELETE CASCADE,
  user_id UUID,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cirs_incidents_practice_id ON cirs_incidents(practice_id);
CREATE INDEX idx_cirs_incidents_status ON cirs_incidents(status);
CREATE INDEX idx_cirs_incidents_created_at ON cirs_incidents(created_at DESC);
CREATE INDEX idx_cirs_incident_comments_incident_id ON cirs_incident_comments(incident_id);
