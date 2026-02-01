-- Create global_parameter_templates table for managing global KPIs
CREATE TABLE IF NOT EXISTS global_parameter_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('number', 'percentage', 'currency', 'boolean', 'text', 'select', 'date', 'time')),
  category TEXT NOT NULL DEFAULT 'general',
  unit TEXT,
  interval TEXT DEFAULT 'monthly' CHECK (interval IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'once')),
  default_value TEXT,
  options JSONB,
  formula TEXT,
  dependencies JSONB,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_template BOOLEAN DEFAULT true NOT NULL,
  group_ids TEXT[],
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create global_parameter_groups table for organizing KPIs
CREATE TABLE IF NOT EXISTS global_parameter_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'bg-blue-500',
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_template BOOLEAN DEFAULT true NOT NULL,
  practice_id TEXT,
  parameters TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add missing columns if table already exists
ALTER TABLE global_parameter_groups ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE global_parameter_groups ADD COLUMN IF NOT EXISTS practice_id TEXT;
ALTER TABLE global_parameter_groups ADD COLUMN IF NOT EXISTS parameters TEXT[] DEFAULT '{}';
ALTER TABLE global_parameter_groups ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Update color format to use Tailwind classes
UPDATE global_parameter_groups SET color = 'bg-emerald-500' WHERE color = '#10B981';
UPDATE global_parameter_groups SET color = 'bg-blue-500' WHERE color = '#3B82F6';
UPDATE global_parameter_groups SET color = 'bg-violet-500' WHERE color = '#8B5CF6';
UPDATE global_parameter_groups SET color = 'bg-amber-500' WHERE color = '#F59E0B';
UPDATE global_parameter_groups SET color = 'bg-pink-500' WHERE color = '#EC4899';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_global_parameter_templates_category ON global_parameter_templates(category);
CREATE INDEX IF NOT EXISTS idx_global_parameter_templates_is_active ON global_parameter_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_global_parameter_templates_is_template ON global_parameter_templates(is_template);
CREATE INDEX IF NOT EXISTS idx_global_parameter_groups_is_active ON global_parameter_groups(is_active);

-- Enable RLS
ALTER TABLE global_parameter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_parameter_groups ENABLE ROW LEVEL SECURITY;

-- Allow all operations (super admin check happens in API)
DROP POLICY IF EXISTS "Allow all global_parameter_templates access" ON global_parameter_templates;
CREATE POLICY "Allow all global_parameter_templates access" ON global_parameter_templates FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all global_parameter_groups access" ON global_parameter_groups;
CREATE POLICY "Allow all global_parameter_groups access" ON global_parameter_groups FOR ALL USING (true);

-- Seed default parameter groups
INSERT INTO global_parameter_groups (id, name, description, color, icon, display_order, is_template, practice_id, parameters, usage_count) VALUES
  ('group-finanzen', 'Finanzen', 'Finanzielle Kennzahlen und Umsatzmetriken', 'bg-emerald-500', 'euro', 1, true, NULL, ARRAY['kpi-umsatz-monat', 'kpi-umsatz-pro-patient', 'kpi-privatanteil', 'kpi-igel-quote'], 0),
  ('group-patienten', 'Patienten', 'Patientenbezogene Metriken und Zufriedenheit', 'bg-blue-500', 'users', 2, true, NULL, ARRAY['kpi-patienten-tag', 'kpi-neupatient-quote', 'kpi-wartezeit', 'kpi-zufriedenheit', 'kpi-terminauslastung'], 0),
  ('group-personal', 'Personal', 'Mitarbeiter- und Teamkennzahlen', 'bg-violet-500', 'user-check', 3, true, NULL, ARRAY['kpi-krankenstand', 'kpi-fortbildungsstunden', 'kpi-mitarbeiter-zufriedenheit', 'kpi-fluktuation'], 0),
  ('group-qualitaet', 'Qualität', 'Qualitätsindikatoren und Standards', 'bg-amber-500', 'award', 4, true, NULL, ARRAY['kpi-hygienekontrollen', 'kpi-dokumentation-vollstaendig', 'kpi-beschwerden', 'kpi-qm-massnahmen'], 0),
  ('group-effizienz', 'Effizienz', 'Prozess- und Arbeitsablaufmetriken', 'bg-pink-500', 'zap', 5, true, NULL, ARRAY['kpi-behandlungsdauer', 'kpi-no-show-rate', 'kpi-digitalisierungsgrad', 'kpi-verwaltungszeit'], 0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order,
  is_template = EXCLUDED.is_template,
  parameters = EXCLUDED.parameters,
  updated_at = NOW();

-- Seed default global KPI templates
INSERT INTO global_parameter_templates (id, name, description, type, category, unit, interval, default_value, is_active, is_template, group_ids) VALUES
  -- Finanzen
  ('kpi-umsatz-monat', 'Monatsumsatz', 'Gesamtumsatz pro Monat', 'currency', 'finanzen', 'EUR', 'monthly', '0', true, true, ARRAY['group-finanzen']),
  ('kpi-umsatz-pro-patient', 'Umsatz pro Patient', 'Durchschnittlicher Umsatz pro Patientenbesuch', 'currency', 'finanzen', 'EUR', 'monthly', '0', true, true, ARRAY['group-finanzen']),
  ('kpi-privatanteil', 'Privatpatientenanteil', 'Anteil der Privatpatienten am Gesamtumsatz', 'percentage', 'finanzen', '%', 'monthly', '0', true, true, ARRAY['group-finanzen']),
  ('kpi-igel-quote', 'IGeL-Quote', 'Anteil der IGeL-Leistungen am Umsatz', 'percentage', 'finanzen', '%', 'monthly', '0', true, true, ARRAY['group-finanzen']),
  
  -- Patienten
  ('kpi-patienten-tag', 'Patienten pro Tag', 'Durchschnittliche Anzahl Patienten pro Tag', 'number', 'patienten', 'Patienten', 'daily', '0', true, true, ARRAY['group-patienten']),
  ('kpi-neupatient-quote', 'Neupatienten-Quote', 'Anteil der Neupatienten an Gesamtpatienten', 'percentage', 'patienten', '%', 'monthly', '0', true, true, ARRAY['group-patienten']),
  ('kpi-wartezeit', 'Durchschnittliche Wartezeit', 'Mittlere Wartezeit der Patienten', 'number', 'patienten', 'Minuten', 'daily', '15', true, true, ARRAY['group-patienten']),
  ('kpi-zufriedenheit', 'Patientenzufriedenheit', 'Durchschnittliche Bewertung der Patientenzufriedenheit', 'number', 'patienten', 'Sterne (1-5)', 'monthly', '4', true, true, ARRAY['group-patienten']),
  ('kpi-terminauslastung', 'Terminauslastung', 'Prozentsatz der gebuchten vs. verfügbaren Termine', 'percentage', 'patienten', '%', 'daily', '85', true, true, ARRAY['group-patienten']),
  
  -- Personal
  ('kpi-krankenstand', 'Krankenstand', 'Durchschnittlicher Krankenstand des Personals', 'percentage', 'personal', '%', 'monthly', '5', true, true, ARRAY['group-personal']),
  ('kpi-fortbildungsstunden', 'Fortbildungsstunden', 'Durchschnittliche Fortbildungsstunden pro Mitarbeiter', 'number', 'personal', 'Stunden', 'yearly', '20', true, true, ARRAY['group-personal']),
  ('kpi-mitarbeiter-zufriedenheit', 'Mitarbeiterzufriedenheit', 'Durchschnittliche Mitarbeiterzufriedenheit', 'number', 'personal', 'Punkte (1-10)', 'quarterly', '7', true, true, ARRAY['group-personal']),
  ('kpi-fluktuation', 'Fluktuationsrate', 'Jährliche Mitarbeiterfluktuation', 'percentage', 'personal', '%', 'yearly', '10', true, true, ARRAY['group-personal']),
  
  -- Qualität
  ('kpi-hygienekontrollen', 'Hygienekontrollen bestanden', 'Anteil bestandener Hygienekontrollen', 'percentage', 'qualitaet', '%', 'monthly', '100', true, true, ARRAY['group-qualitaet']),
  ('kpi-dokumentation-vollstaendig', 'Dokumentationsvollständigkeit', 'Anteil vollständig dokumentierter Behandlungen', 'percentage', 'qualitaet', '%', 'monthly', '95', true, true, ARRAY['group-qualitaet']),
  ('kpi-beschwerden', 'Beschwerdequote', 'Anzahl Beschwerden pro 1000 Patienten', 'number', 'qualitaet', 'pro 1000', 'monthly', '2', true, true, ARRAY['group-qualitaet']),
  ('kpi-qm-massnahmen', 'QM-Maßnahmen umgesetzt', 'Anteil umgesetzter QM-Maßnahmen', 'percentage', 'qualitaet', '%', 'quarterly', '90', true, true, ARRAY['group-qualitaet']),
  
  -- Effizienz
  ('kpi-behandlungsdauer', 'Durchschnittliche Behandlungsdauer', 'Mittlere Dauer einer Behandlung', 'number', 'effizienz', 'Minuten', 'daily', '20', true, true, ARRAY['group-effizienz']),
  ('kpi-no-show-rate', 'No-Show-Rate', 'Anteil nicht erschienener Patienten', 'percentage', 'effizienz', '%', 'monthly', '5', true, true, ARRAY['group-effizienz']),
  ('kpi-digitalisierungsgrad', 'Digitalisierungsgrad', 'Anteil digitalisierter Prozesse', 'percentage', 'effizienz', '%', 'quarterly', '60', true, true, ARRAY['group-effizienz']),
  ('kpi-verwaltungszeit', 'Verwaltungszeit pro Patient', 'Durchschnittliche administrative Zeit pro Patient', 'number', 'effizienz', 'Minuten', 'daily', '5', true, true, ARRAY['group-effizienz'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  category = EXCLUDED.category,
  unit = EXCLUDED.unit,
  interval = EXCLUDED.interval,
  default_value = EXCLUDED.default_value,
  group_ids = EXCLUDED.group_ids,
  updated_at = NOW();
