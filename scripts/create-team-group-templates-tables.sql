-- Create team_group_templates table
CREATE TABLE IF NOT EXISTS team_group_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(20) DEFAULT '#3b82f6',
  icon VARCHAR(50) DEFAULT 'users',
  sort_order INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_group_template_specialties junction table
CREATE TABLE IF NOT EXISTS team_group_template_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_group_template_id UUID NOT NULL REFERENCES team_group_templates(id) ON DELETE CASCADE,
  specialty_group_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_group_template_id, specialty_group_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_group_templates_sort_order ON team_group_templates(sort_order);
CREATE INDEX IF NOT EXISTS idx_team_group_template_specialties_template_id ON team_group_template_specialties(team_group_template_id);
CREATE INDEX IF NOT EXISTS idx_team_group_template_specialties_specialty_id ON team_group_template_specialties(specialty_group_id);

-- Enable RLS
ALTER TABLE team_group_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_group_template_specialties ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
DROP POLICY IF EXISTS "Allow all" ON team_group_templates;
CREATE POLICY "Allow all" ON team_group_templates
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON team_group_template_specialties;
CREATE POLICY "Allow all" ON team_group_template_specialties
  FOR ALL
  USING (true)
  WITH CHECK (true);
