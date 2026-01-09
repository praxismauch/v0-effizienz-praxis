-- Feature Flags table for managing menu item visibility and beta status
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key VARCHAR(100) NOT NULL UNIQUE,
  feature_name VARCHAR(255) NOT NULL,
  feature_type VARCHAR(50) NOT NULL DEFAULT 'frontend', -- 'frontend' or 'backend'
  parent_key VARCHAR(100), -- For nested items (folder structure)
  icon_name VARCHAR(100),
  route_path VARCHAR(255),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_beta BOOLEAN NOT NULL DEFAULT false,
  is_protected BOOLEAN NOT NULL DEFAULT false, -- Protected items cannot be disabled (e.g., Feature-Verwaltung itself)
  display_order INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_feature_flags_type ON feature_flags(feature_type);
CREATE INDEX IF NOT EXISTS idx_feature_flags_parent ON feature_flags(parent_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Policy for super admins only
CREATE POLICY "feature_flags_superadmin_policy" ON feature_flags
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert Frontend Menu Items (from app-sidebar.tsx)
-- Overview Group
INSERT INTO feature_flags (feature_key, feature_name, feature_type, parent_key, icon_name, route_path, display_order, description) VALUES
('frontend_overview', 'Übersicht', 'frontend', NULL, 'FolderOpen', NULL, 100, 'Übersicht Gruppe'),
('dashboard', 'Dashboard', 'frontend', 'frontend_overview', 'LayoutDashboard', '/dashboard', 101, 'Haupt-Dashboard'),
('aiAnalysis', 'KI-Analyse', 'frontend', 'frontend_overview', 'BarChart3', '/analysis', 102, 'KI-basierte Analysen'),
('academy', 'Academy', 'frontend', 'frontend_overview', 'GraduationCap', '/academy', 103, 'Lernplattform')
ON CONFLICT (feature_key) DO NOTHING;

-- Planning & Organization Group
INSERT INTO feature_flags (feature_key, feature_name, feature_type, parent_key, icon_name, route_path, display_order, description) VALUES
('frontend_planning', 'Planung & Organisation', 'frontend', NULL, 'FolderOpen', NULL, 200, 'Planung & Organisation Gruppe'),
('calendar', 'Kalender', 'frontend', 'frontend_planning', 'CalendarDays', '/calendar', 201, 'Kalender'),
('dienstplan', 'Dienstplan', 'frontend', 'frontend_planning', 'CalendarClock', '/dienstplan', 202, 'Dienstplanung'),
('zeiterfassung', 'Zeiterfassung', 'frontend', 'frontend_planning', 'Clock', '/zeiterfassung', 203, 'Zeiterfassung'),
('tasks', 'Aufgaben', 'frontend', 'frontend_planning', 'ClipboardList', '/todos', 204, 'Aufgabenverwaltung'),
('goals', 'Ziele', 'frontend', 'frontend_planning', 'Target', '/goals', 205, 'Zielverwaltung'),
('workflows', 'Workflows', 'frontend', 'frontend_planning', 'Workflow', '/workflows', 206, 'Workflow-Management'),
('responsibilities', 'Zuständigkeiten', 'frontend', 'frontend_planning', 'ClipboardCheck', '/responsibilities', 207, 'Zuständigkeiten')
ON CONFLICT (feature_key) DO NOTHING;

-- Data & Documents Group
INSERT INTO feature_flags (feature_key, feature_name, feature_type, parent_key, icon_name, route_path, display_order, description) VALUES
('frontend_data', 'Daten & Dokumente', 'frontend', NULL, 'FolderOpen', NULL, 300, 'Daten & Dokumente Gruppe'),
('analytics', 'Kennzahlen', 'frontend', 'frontend_data', 'LineChart', '/analytics', 301, 'Kennzahlen & Analysen'),
('practice-journals', 'Praxis-Journal', 'frontend', 'frontend_data', 'BookOpen', '/practice-journals', 302, 'Praxis-Journal'),
('documents', 'Dokumente', 'frontend', 'frontend_data', 'FileText', '/documents', 303, 'Dokumentenverwaltung'),
('knowledge', 'Wissen', 'frontend', 'frontend_data', 'BookOpen', '/knowledge', 304, 'Wissensdatenbank'),
('protocols', 'Protokolle', 'frontend', 'frontend_data', 'MessageSquare', '/protocols', 305, 'Protokollverwaltung')
ON CONFLICT (feature_key) DO NOTHING;

-- Strategy & Leadership Group
INSERT INTO feature_flags (feature_key, feature_name, feature_type, parent_key, icon_name, route_path, display_order, description) VALUES
('frontend_strategy', 'Strategie & Führung', 'frontend', NULL, 'FolderOpen', NULL, 400, 'Strategie & Führung Gruppe'),
('strategy_journey', 'Strategiepfad', 'frontend', 'frontend_strategy', 'Compass', '/strategy-journey', 401, 'Strategischer Pfad'),
('leadership', 'Leadership', 'frontend', 'frontend_strategy', 'Crown', '/leadership', 402, 'Leadership-Bereich'),
('wellbeing', 'Mitarbeiter-Wellbeing', 'frontend', 'frontend_strategy', 'Heart', '/wellbeing', 403, 'Mitarbeiter-Wellbeing'),
('qualitaetszirkel', 'Qualitätszirkel', 'frontend', 'frontend_strategy', 'CircleDot', '/qualitaetszirkel', 404, 'Qualitätszirkel'),
('leitbild', 'Leitbild', 'frontend', 'frontend_strategy', 'Sparkles', '/leitbild', 405, 'Unternehmensleitbild'),
('roi_analysis', 'Lohnt-es-sich-Analyse', 'frontend', 'frontend_strategy', 'LineChart', '/roi-analysis', 406, 'ROI-Analyse'),
('igel', 'Selbstzahler-Analyse', 'frontend', 'frontend_strategy', 'Lightbulb', '/igel-analysis', 407, 'IGeL-Analyse'),
('competitor_analysis', 'Konkurrenzanalyse', 'frontend', 'frontend_strategy', 'Network', '/competitor-analysis', 408, 'Konkurrenzanalyse'),
('wunschpatient', 'Wunschpatient', 'frontend', 'frontend_strategy', 'Target', '/wunschpatient', 409, 'Wunschpatient-Definition')
ON CONFLICT (feature_key) DO NOTHING;

-- Team & Personal Group
INSERT INTO feature_flags (feature_key, feature_name, feature_type, parent_key, icon_name, route_path, display_order, description) VALUES
('frontend_team', 'Team & Personal', 'frontend', NULL, 'FolderOpen', NULL, 500, 'Team & Personal Gruppe'),
('hiring', 'Personalsuche', 'frontend', 'frontend_team', 'BriefcaseBusiness', '/hiring', 501, 'Personalsuche & Recruiting'),
('team', 'Team', 'frontend', 'frontend_team', 'Users', '/team', 502, 'Team-Übersicht'),
('mitarbeitergespraeche', 'Mitarbeitergespräche', 'frontend', 'frontend_team', 'MessageCircle', '/mitarbeitergespraeche', 503, 'Mitarbeitergespräche'),
('selbst_check', 'Selbst-Check', 'frontend', 'frontend_team', 'Heart', '/selbst-check', 504, 'Selbst-Check'),
('skills', 'Kompetenzen', 'frontend', 'frontend_team', 'Award', '/skills', 505, 'Kompetenzmanagement'),
('organigramm', 'Organigramm', 'frontend', 'frontend_team', 'FolderKanban', '/organigramm', 506, 'Organisationsstruktur')
ON CONFLICT (feature_key) DO NOTHING;

-- Practice & Settings Group
INSERT INTO feature_flags (feature_key, feature_name, feature_type, parent_key, icon_name, route_path, display_order, description) VALUES
('frontend_praxis', 'Praxis & Einstellungen', 'frontend', NULL, 'FolderOpen', NULL, 600, 'Praxis & Einstellungen Gruppe'),
('contacts', 'Kontakte', 'frontend', 'frontend_praxis', 'Contact', '/contacts', 601, 'Kontaktverwaltung'),
('surveys', 'Umfragen', 'frontend', 'frontend_praxis', 'ClipboardList', '/surveys', 602, 'Umfragen'),
('arbeitsplaetze', 'Arbeitsplätze', 'frontend', 'frontend_praxis', 'BriefcaseBusiness', '/arbeitsplaetze', 603, 'Arbeitsplätze'),
('rooms', 'Räume', 'frontend', 'frontend_praxis', 'Pin', '/rooms', 604, 'Raumverwaltung'),
('arbeitsmittel', 'Arbeitsmittel', 'frontend', 'frontend_praxis', 'Wrench', '/arbeitsmittel', 605, 'Arbeitsmittel'),
('inventory', 'Material', 'frontend', 'frontend_praxis', 'Package', '/inventory', 606, 'Materialverwaltung'),
('devices', 'Geräte', 'frontend', 'frontend_praxis', 'Stethoscope', '/devices', 607, 'Geräteverwaltung'),
('settings', 'Einstellungen', 'frontend', 'frontend_praxis', 'Settings', '/settings', 608, 'Einstellungen')
ON CONFLICT (feature_key) DO NOTHING;

-- Backend (Super-Admin) Menu Items
-- Overview
INSERT INTO feature_flags (feature_key, feature_name, feature_type, parent_key, icon_name, route_path, display_order, is_protected, description) VALUES
('backend_overview', 'Übersicht', 'backend', NULL, 'FolderOpen', NULL, 1000, false, 'Backend Übersicht Gruppe'),
('backend_dashboard', 'Dashboard', 'backend', 'backend_overview', 'LayoutGrid', '/super-admin', 1001, false, 'Super-Admin Dashboard')
ON CONFLICT (feature_key) DO NOTHING;

-- Management
INSERT INTO feature_flags (feature_key, feature_name, feature_type, parent_key, icon_name, route_path, display_order, is_protected, description) VALUES
('backend_management', 'Verwaltung', 'backend', NULL, 'FolderOpen', NULL, 1100, false, 'Verwaltung Gruppe'),
('backend_tickets', 'Tickets', 'backend', 'backend_management', 'Mail', '/super-admin/tickets', 1101, false, 'Support-Tickets'),
('backend_practices', 'Praxen', 'backend', 'backend_management', 'Building2', '/super-admin/verwaltung?tab=practices', 1102, false, 'Praxisverwaltung'),
('backend_users', 'Benutzer', 'backend', 'backend_management', 'Users', '/super-admin/verwaltung?tab=users', 1103, false, 'Benutzerverwaltung'),
('backend_vorlagen', 'Vorlagen', 'backend', 'backend_management', 'FolderKanban', NULL, 1104, false, 'Vorlagen Untermenü'),
('backend_vorlagen_skills', 'Skills', 'backend', 'backend_vorlagen', 'Award', '/super-admin/content?tab=skills', 1105, false, 'Skill-Vorlagen'),
('backend_vorlagen_workflows', 'Workflows', 'backend', 'backend_vorlagen', 'Workflow', '/super-admin/content?tab=workflows', 1106, false, 'Workflow-Vorlagen'),
('backend_vorlagen_checklisten', 'Checklisten', 'backend', 'backend_vorlagen', 'ClipboardCheck', '/super-admin/content?tab=checklisten', 1107, false, 'Checklisten-Vorlagen'),
('backend_vorlagen_dokumente', 'Dokumente', 'backend', 'backend_vorlagen', 'FileText', '/super-admin/content?tab=dokumente', 1108, false, 'Dokument-Vorlagen'),
('backend_vorlagen_teams', 'Teams / Gruppen', 'backend', 'backend_vorlagen', 'Users', '/super-admin/content?tab=teams', 1109, false, 'Team-Vorlagen')
ON CONFLICT (feature_key) DO NOTHING;

-- Content
INSERT INTO feature_flags (feature_key, feature_name, feature_type, parent_key, icon_name, route_path, display_order, is_protected, description) VALUES
('backend_content', 'Content', 'backend', NULL, 'FolderOpen', NULL, 1200, false, 'Content Gruppe'),
('backend_academy', 'Academy', 'backend', 'backend_content', 'GraduationCap', '/super-admin/academy', 1201, false, 'Academy-Verwaltung'),
('backend_waitlist', 'Warteliste', 'backend', 'backend_content', 'ListTodo', '/super-admin/academy?tab=waitlist', 1202, false, 'Warteliste')
ON CONFLICT (feature_key) DO NOTHING;

-- Finance
INSERT INTO feature_flags (feature_key, feature_name, feature_type, parent_key, icon_name, route_path, display_order, is_protected, description) VALUES
('backend_finance', 'Finanzen', 'backend', NULL, 'FolderOpen', NULL, 1300, false, 'Finanzen Gruppe'),
('backend_zahlungen', 'Zahlungen', 'backend', 'backend_finance', 'CreditCard', '/super-admin/zahlungen', 1301, false, 'Zahlungsverwaltung')
ON CONFLICT (feature_key) DO NOTHING;

-- Marketing
INSERT INTO feature_flags (feature_key, feature_name, feature_type, parent_key, icon_name, route_path, display_order, is_protected, description) VALUES
('backend_marketing', 'Marketing', 'backend', NULL, 'FolderOpen', NULL, 1400, false, 'Marketing Gruppe'),
('backend_roadmap', 'Roadmap', 'backend', 'backend_marketing', 'MapIcon', '/super-admin/marketing?tab=roadmap', 1401, false, 'Produkt-Roadmap')
ON CONFLICT (feature_key) DO NOTHING;

-- Pages
INSERT INTO feature_flags (feature_key, feature_name, feature_type, parent_key, icon_name, route_path, display_order, is_protected, description) VALUES
('backend_pages', 'Seiten', 'backend', NULL, 'FolderOpen', NULL, 1500, false, 'Seiten Gruppe'),
('backend_landingpages', 'Landingpages', 'backend', 'backend_pages', 'LayoutPanelLeft', '/super-admin/landingpages', 1501, false, 'Landingpage-Verwaltung')
ON CONFLICT (feature_key) DO NOTHING;

-- System
INSERT INTO feature_flags (feature_key, feature_name, feature_type, parent_key, icon_name, route_path, display_order, is_protected, description) VALUES
('backend_system', 'System', 'backend', NULL, 'FolderOpen', NULL, 1600, false, 'System Gruppe'),
('backend_systemverwaltung', 'Systemverwaltung', 'backend', 'backend_system', 'Settings', '/super-admin/system', 1601, false, 'Systemeinstellungen'),
('backend_feature_verwaltung', 'Feature-Verwaltung', 'backend', 'backend_system', 'ToggleLeft', '/super-admin/features', 1602, true, 'Feature-Verwaltung - GESCHÜTZT')
ON CONFLICT (feature_key) DO NOTHING;

-- Update the updated_at trigger
CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS feature_flags_updated_at ON feature_flags;
CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_flags_updated_at();
