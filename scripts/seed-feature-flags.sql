-- Seed feature_flags table with all frontend navigation items
-- This script populates the feature_flags table with real data from the app sidebar

-- First, clear existing feature flags (optional - comment out if you want to keep existing)
-- DELETE FROM feature_flags;

-- Insert parent categories (navigation groups)
INSERT INTO feature_flags (id, feature_key, feature_name, feature_type, parent_key, icon_name, route_path, is_enabled, is_beta, is_protected, allow_practice_override, display_order, description)
VALUES
  -- Frontend Navigation Groups
  (gen_random_uuid(), 'frontend_overview', 'Übersicht', 'frontend', NULL, 'LayoutDashboard', NULL, true, false, true, true, 1, 'Übersicht-Bereich mit Dashboard und Analysen'),
  (gen_random_uuid(), 'frontend_planning', 'Planung & Organisation', 'frontend', NULL, 'CalendarDays', NULL, true, false, false, true, 2, 'Planungs- und Organisationsbereich'),
  (gen_random_uuid(), 'frontend_data', 'Daten & Dokumente', 'frontend', NULL, 'FileText', NULL, true, false, false, true, 3, 'Daten- und Dokumentenverwaltung'),
  (gen_random_uuid(), 'frontend_strategy', 'Strategie & Führung', 'frontend', NULL, 'Compass', NULL, true, false, false, true, 4, 'Strategische Planung und Führungstools'),
  (gen_random_uuid(), 'frontend_team', 'Team & Personal', 'frontend', NULL, 'Users', NULL, true, false, false, true, 5, 'Team- und Personalverwaltung'),
  (gen_random_uuid(), 'frontend_praxis', 'Praxis & Einstellungen', 'frontend', NULL, 'Settings', NULL, true, false, false, true, 6, 'Praxiseinstellungen und Ressourcen'),
  
  -- Backend Feature Groups
  (gen_random_uuid(), 'backend_api', 'API-Funktionen', 'backend', NULL, 'Server', NULL, true, false, true, false, 1, 'Backend API-Funktionalitäten'),
  (gen_random_uuid(), 'backend_ai', 'KI-Funktionen', 'backend', NULL, 'Sparkles', NULL, true, false, false, true, 2, 'KI- und Analysefunktionen'),
  (gen_random_uuid(), 'backend_integrations', 'Integrationen', 'backend', NULL, 'Plug', NULL, true, false, false, true, 3, 'Externe Integrationen und Schnittstellen')
ON CONFLICT (feature_key) DO UPDATE SET
  feature_name = EXCLUDED.feature_name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- Insert frontend menu items (children of groups)
INSERT INTO feature_flags (id, feature_key, feature_name, feature_type, parent_key, icon_name, route_path, is_enabled, is_beta, is_protected, allow_practice_override, display_order, description)
VALUES
  -- Übersicht Items
  (gen_random_uuid(), 'dashboard', 'Dashboard', 'frontend', 'frontend_overview', 'LayoutDashboard', '/dashboard', true, false, true, true, 1, 'Haupt-Dashboard mit Übersicht'),
  (gen_random_uuid(), 'aiAnalysis', 'KI-Analyse', 'frontend', 'frontend_overview', 'BarChart3', '/analysis', true, false, false, true, 2, 'KI-gestützte Praxisanalyse'),
  (gen_random_uuid(), 'academy', 'Academy', 'frontend', 'frontend_overview', 'GraduationCap', '/academy', true, true, false, true, 3, 'Lernplattform und Schulungen'),
  
  -- Planung & Organisation Items
  (gen_random_uuid(), 'calendar', 'Kalender', 'frontend', 'frontend_planning', 'CalendarDays', '/calendar', true, false, false, true, 1, 'Praxiskalender'),
  (gen_random_uuid(), 'dienstplan', 'Dienstplan', 'frontend', 'frontend_planning', 'CalendarClock', '/dienstplan', true, false, false, true, 2, 'Dienstplanung und Schichten'),
  (gen_random_uuid(), 'zeiterfassung', 'Zeiterfassung', 'frontend', 'frontend_planning', 'Clock', '/zeiterfassung', true, false, false, true, 3, 'Arbeitszeit-Erfassung'),
  (gen_random_uuid(), 'tasks', 'Aufgaben', 'frontend', 'frontend_planning', 'ClipboardList', '/todos', true, false, false, true, 4, 'Aufgabenverwaltung'),
  (gen_random_uuid(), 'goals', 'Ziele', 'frontend', 'frontend_planning', 'Target', '/goals', true, false, false, true, 5, 'Zielverwaltung'),
  (gen_random_uuid(), 'workflows', 'Workflows', 'frontend', 'frontend_planning', 'Workflow', '/workflows', true, false, false, true, 6, 'Automatisierte Arbeitsabläufe'),
  (gen_random_uuid(), 'responsibilities', 'Zuständigkeiten', 'frontend', 'frontend_planning', 'ClipboardCheck', '/responsibilities', true, false, false, true, 7, 'Zuständigkeits-Matrix'),
  
  -- Daten & Dokumente Items
  (gen_random_uuid(), 'analytics', 'Kennzahlen', 'frontend', 'frontend_data', 'LineChart', '/analytics', true, false, false, true, 1, 'Praxis-Kennzahlen und Statistiken'),
  (gen_random_uuid(), 'documents', 'Dokumente', 'frontend', 'frontend_data', 'FileText', '/documents', true, false, false, true, 2, 'Dokumentenverwaltung'),
  (gen_random_uuid(), 'knowledge', 'Wissen', 'frontend', 'frontend_data', 'BookOpen', '/knowledge', true, false, false, true, 3, 'Wissensdatenbank'),
  (gen_random_uuid(), 'protocols', 'Protokolle', 'frontend', 'frontend_data', 'MessageSquare', '/protocols', true, false, false, true, 4, 'Besprechungsprotokolle'),
  
  -- Strategie & Führung Items
  (gen_random_uuid(), 'strategy_journey', 'Strategiepfad', 'frontend', 'frontend_strategy', 'Compass', '/strategy-journey', true, false, false, true, 1, 'Strategische Planung'),
  (gen_random_uuid(), 'leadership', 'Leadership', 'frontend', 'frontend_strategy', 'Crown', '/leadership', true, false, false, true, 2, 'Führungs-Dashboard'),
  (gen_random_uuid(), 'wellbeing', 'Mitarbeiter-Wellbeing', 'frontend', 'frontend_strategy', 'Heart', '/wellbeing', true, false, false, true, 3, 'Mitarbeiter-Wohlbefinden'),
  (gen_random_uuid(), 'qualitaetszirkel', 'Qualitätszirkel', 'frontend', 'frontend_strategy', 'CircleDot', '/qualitaetszirkel', true, true, false, true, 4, 'QM-Zirkel-Verwaltung'),
  (gen_random_uuid(), 'leitbild', 'Leitbild', 'frontend', 'frontend_strategy', 'Sparkles', '/leitbild', true, false, false, true, 5, 'Praxis-Leitbild'),
  (gen_random_uuid(), 'roi_analysis', 'Lohnt-es-sich-Analyse', 'frontend', 'frontend_strategy', 'LineChart', '/roi-analysis', true, false, false, true, 6, 'ROI-Analyse für Investitionen'),
  (gen_random_uuid(), 'igel', 'Selbstzahler-Analyse', 'frontend', 'frontend_strategy', 'Lightbulb', '/igel-analysis', true, false, false, true, 7, 'IGeL-Leistungen Analyse'),
  (gen_random_uuid(), 'competitor_analysis', 'Konkurrenzanalyse', 'frontend', 'frontend_strategy', 'Network', '/competitor-analysis', true, true, false, true, 8, 'Wettbewerbsanalyse'),
  (gen_random_uuid(), 'wunschpatient', 'Wunschpatient', 'frontend', 'frontend_strategy', 'Target', '/wunschpatient', true, false, false, true, 9, 'Zielgruppen-Definition'),
  
  -- Team & Personal Items
  (gen_random_uuid(), 'hiring', 'Personalsuche', 'frontend', 'frontend_team', 'BriefcaseBusiness', '/hiring', true, false, false, true, 1, 'Bewerbermanagement'),
  (gen_random_uuid(), 'team', 'Team', 'frontend', 'frontend_team', 'Users', '/team', true, false, true, true, 2, 'Teamverwaltung'),
  (gen_random_uuid(), 'mitarbeitergespraeche', 'Mitarbeitergespräche', 'frontend', 'frontend_team', 'MessageCircle', '/mitarbeitergespraeche', true, false, false, true, 3, 'Mitarbeitergespräche'),
  (gen_random_uuid(), 'selbst_check', 'Selbst-Check', 'frontend', 'frontend_team', 'Heart', '/selbst-check', true, true, false, true, 4, 'Selbsteinschätzung'),
  (gen_random_uuid(), 'skills', 'Kompetenzen', 'frontend', 'frontend_team', 'Award', '/skills', true, false, false, true, 5, 'Kompetenzmanagement'),
  (gen_random_uuid(), 'organigramm', 'Organigramm', 'frontend', 'frontend_team', 'FolderKanban', '/organigramm', true, false, false, true, 6, 'Organisationsstruktur'),
  
  -- Praxis & Einstellungen Items
  (gen_random_uuid(), 'contacts', 'Kontakte', 'frontend', 'frontend_praxis', 'Contact', '/contacts', true, false, false, true, 1, 'Kontaktverwaltung'),
  (gen_random_uuid(), 'surveys', 'Umfragen', 'frontend', 'frontend_praxis', 'ClipboardList', '/surveys', true, false, false, true, 2, 'Umfragen-Verwaltung'),
  (gen_random_uuid(), 'arbeitsplaetze', 'Arbeitsplätze', 'frontend', 'frontend_praxis', 'BriefcaseBusiness', '/arbeitsplaetze', true, false, false, true, 3, 'Arbeitsplätze-Verwaltung'),
  (gen_random_uuid(), 'rooms', 'Räume', 'frontend', 'frontend_praxis', 'Pin', '/rooms', true, false, false, true, 4, 'Raumverwaltung'),
  (gen_random_uuid(), 'arbeitsmittel', 'Arbeitsmittel', 'frontend', 'frontend_praxis', 'Wrench', '/arbeitsmittel', true, false, false, true, 5, 'Arbeitsmittel-Verwaltung'),
  (gen_random_uuid(), 'inventory', 'Material', 'frontend', 'frontend_praxis', 'Package', '/inventory', true, false, false, true, 6, 'Materialverwaltung'),
  (gen_random_uuid(), 'devices', 'Geräte', 'frontend', 'frontend_praxis', 'Stethoscope', '/devices', true, false, false, true, 7, 'Geräteverwaltung'),
  (gen_random_uuid(), 'settings', 'Einstellungen', 'frontend', 'frontend_praxis', 'Settings', '/settings', true, false, true, true, 8, 'Praxis-Einstellungen'),
  
  -- Backend API Features
  (gen_random_uuid(), 'api_auth', 'Authentifizierung', 'backend', 'backend_api', 'Shield', '/api/auth', true, false, true, false, 1, 'Authentifizierungs-API'),
  (gen_random_uuid(), 'api_users', 'Benutzer-API', 'backend', 'backend_api', 'Users', '/api/users', true, false, true, false, 2, 'Benutzerverwaltungs-API'),
  (gen_random_uuid(), 'api_practices', 'Praxis-API', 'backend', 'backend_api', 'Building2', '/api/practices', true, false, true, false, 3, 'Praxisverwaltungs-API'),
  (gen_random_uuid(), 'api_documents', 'Dokumente-API', 'backend', 'backend_api', 'FileText', '/api/documents', true, false, false, true, 4, 'Dokumenten-API'),
  (gen_random_uuid(), 'api_calendar', 'Kalender-API', 'backend', 'backend_api', 'Calendar', '/api/calendar', true, false, false, true, 5, 'Kalender-API'),
  
  -- Backend AI Features
  (gen_random_uuid(), 'ai_analysis', 'KI-Analyse', 'backend', 'backend_ai', 'BarChart3', '/api/ai/analysis', true, false, false, true, 1, 'KI-gestützte Analysen'),
  (gen_random_uuid(), 'ai_chat', 'KI-Chat', 'backend', 'backend_ai', 'MessageSquare', '/api/ai/chat', true, true, false, true, 2, 'KI-Assistent'),
  (gen_random_uuid(), 'ai_recommendations', 'KI-Empfehlungen', 'backend', 'backend_ai', 'Lightbulb', '/api/ai/recommendations', true, true, false, true, 3, 'KI-gestützte Empfehlungen'),
  (gen_random_uuid(), 'ai_document_analysis', 'Dokument-Analyse', 'backend', 'backend_ai', 'FileSearch', '/api/ai/documents', true, true, false, true, 4, 'KI-Dokumentenanalyse'),
  
  -- Backend Integration Features
  (gen_random_uuid(), 'integration_email', 'E-Mail-Integration', 'backend', 'backend_integrations', 'Mail', '/api/integrations/email', true, false, false, true, 1, 'E-Mail-Verarbeitung'),
  (gen_random_uuid(), 'integration_calendar', 'Kalender-Sync', 'backend', 'backend_integrations', 'CalendarSync', '/api/integrations/calendar', true, false, false, true, 2, 'Externe Kalender-Synchronisation'),
  (gen_random_uuid(), 'integration_stripe', 'Stripe-Integration', 'backend', 'backend_integrations', 'CreditCard', '/api/integrations/stripe', true, false, false, false, 3, 'Zahlungsabwicklung'),
  (gen_random_uuid(), 'integration_export', 'Daten-Export', 'backend', 'backend_integrations', 'Download', '/api/integrations/export', true, false, false, true, 4, 'Daten-Export-Funktionen')
ON CONFLICT (feature_key) DO UPDATE SET
  feature_name = EXCLUDED.feature_name,
  parent_key = EXCLUDED.parent_key,
  route_path = EXCLUDED.route_path,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_beta = EXCLUDED.is_beta;
