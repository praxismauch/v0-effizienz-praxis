-- Fix global_parameter_groups table
ALTER TABLE global_parameter_groups ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE global_parameter_groups ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE global_parameter_groups ADD COLUMN IF NOT EXISTS color TEXT;

-- Fix users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Add unique constraint on name if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'global_parameter_groups_name_key'
  ) THEN
    ALTER TABLE global_parameter_groups ADD CONSTRAINT global_parameter_groups_name_key UNIQUE (name);
  END IF;
END $$;

-- Insert default KPI categories with generated UUIDs
INSERT INTO global_parameter_groups (id, name, description, icon, color, display_order, created_at, updated_at) 
VALUES 
  (gen_random_uuid(), 'Finanzen', 'Finanzielle Kennzahlen', 'euro', '#22c55e', 1, NOW(), NOW()),
  (gen_random_uuid(), 'Patienten', 'Patientenbezogene Kennzahlen', 'users', '#3b82f6', 2, NOW(), NOW()),
  (gen_random_uuid(), 'Personal', 'Mitarbeiterbezogene Kennzahlen', 'user-cog', '#f59e0b', 3, NOW(), NOW()),
  (gen_random_uuid(), 'Qualitaet', 'Qualitaetskennzahlen', 'award', '#8b5cf6', 4, NOW(), NOW()),
  (gen_random_uuid(), 'Effizienz', 'Effizienz Kennzahlen', 'zap', '#ef4444', 5, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
