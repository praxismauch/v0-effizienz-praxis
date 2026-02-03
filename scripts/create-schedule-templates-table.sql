-- Create schedule_templates table for storing reusable weekly plan templates
CREATE TABLE IF NOT EXISTS schedule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  shifts JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for practice_id lookups
CREATE INDEX IF NOT EXISTS idx_schedule_templates_practice_id ON schedule_templates(practice_id);

-- Enable RLS
ALTER TABLE schedule_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all for schedule_templates" ON schedule_templates;
DROP POLICY IF EXISTS "Users can view schedule templates for their practice" ON schedule_templates;
DROP POLICY IF EXISTS "Users can insert schedule templates for their practice" ON schedule_templates;
DROP POLICY IF EXISTS "Users can update schedule templates for their practice" ON schedule_templates;
DROP POLICY IF EXISTS "Users can delete schedule templates for their practice" ON schedule_templates;

-- Create RLS policies that restrict access to user's practice
CREATE POLICY "Users can view schedule templates for their practice" ON schedule_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.practice_id = schedule_templates.practice_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert schedule templates for their practice" ON schedule_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.practice_id = schedule_templates.practice_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update schedule templates for their practice" ON schedule_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.practice_id = schedule_templates.practice_id
      AND team_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.practice_id = schedule_templates.practice_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete schedule templates for their practice" ON schedule_templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.practice_id = schedule_templates.practice_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
