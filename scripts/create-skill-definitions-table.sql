-- Create skill_definitions table
CREATE TABLE IF NOT EXISTS skill_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  level_0_description TEXT DEFAULT 'Keine Erfahrung, benötigt vollständige Anleitung',
  level_1_description TEXT DEFAULT 'Kann einfache Aufgaben mit Anleitung ausführen',
  level_2_description TEXT DEFAULT 'Beherrscht Aufgaben sicher und zuverlässig ohne Hilfe',
  level_3_description TEXT DEFAULT 'Beherrscht komplexe Situationen, kann andere anleiten, optimiert Prozesse',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_skill_definitions_practice_id ON skill_definitions(practice_id);
CREATE INDEX IF NOT EXISTS idx_skill_definitions_team_id ON skill_definitions(team_id);
CREATE INDEX IF NOT EXISTS idx_skill_definitions_category ON skill_definitions(category);
CREATE INDEX IF NOT EXISTS idx_skill_definitions_is_active ON skill_definitions(is_active);

-- Enable RLS
ALTER TABLE skill_definitions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view skills in their practice" ON skill_definitions
  FOR SELECT USING (
    practice_id IN (
      SELECT practice_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Practice admins can insert skills" ON skill_definitions
  FOR INSERT WITH CHECK (
    practice_id IN (
      SELECT practice_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND (role = 'admin' OR role = 'owner')
    )
  );

CREATE POLICY "Practice admins can update skills" ON skill_definitions
  FOR UPDATE USING (
    practice_id IN (
      SELECT practice_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND (role = 'admin' OR role = 'owner')
    )
  );

CREATE POLICY "Practice admins can delete skills" ON skill_definitions
  FOR DELETE USING (
    practice_id IN (
      SELECT practice_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND (role = 'admin' OR role = 'owner')
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_skill_definitions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skill_definitions_updated_at
  BEFORE UPDATE ON skill_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_skill_definitions_updated_at();
