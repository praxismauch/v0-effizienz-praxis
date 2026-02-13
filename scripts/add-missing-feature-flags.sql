-- Add missing feature flags to align Feature-Verwaltung with sidebar navigation
-- Adds: frontend_quality group, hygieneplan, training, journal, cirs

-- 1. Add Qualitaets-Management parent group
INSERT INTO feature_flags (id, feature_key, feature_name, feature_type, parent_key, icon_name, route_path, is_enabled, is_beta, is_protected, allow_practice_override, display_order, description)
VALUES (gen_random_uuid(), 'frontend_quality', 'Qualitäts-Management', 'frontend', NULL, 'Shield', NULL, true, false, false, true, 6, 'Qualitätsmanagement und Hygiene')
ON CONFLICT (feature_key) DO UPDATE SET feature_name = EXCLUDED.feature_name, description = EXCLUDED.description, display_order = EXCLUDED.display_order;

-- 2. Update display_order for frontend_praxis to make room
UPDATE feature_flags SET display_order = 7 WHERE feature_key = 'frontend_praxis' AND parent_key IS NULL;

-- 3. Add Hygieneplan under Qualitaets-Management
INSERT INTO feature_flags (id, feature_key, feature_name, feature_type, parent_key, icon_name, route_path, is_enabled, is_beta, is_protected, allow_practice_override, display_order, description)
VALUES (gen_random_uuid(), 'hygieneplan', 'Hygieneplan', 'frontend', 'frontend_quality', 'Shield', '/hygieneplan', true, false, false, true, 1, 'Hygieneplan und QM-Dokumentation')
ON CONFLICT (feature_key) DO UPDATE SET parent_key = EXCLUDED.parent_key, route_path = EXCLUDED.route_path, description = EXCLUDED.description, display_order = EXCLUDED.display_order;

-- 4. Add Fortbildung (Training) under Team & Personal
INSERT INTO feature_flags (id, feature_key, feature_name, feature_type, parent_key, icon_name, route_path, is_enabled, is_beta, is_protected, allow_practice_override, display_order, description)
VALUES (gen_random_uuid(), 'training', 'Fortbildung', 'frontend', 'frontend_team', 'Award', '/training', true, false, false, true, 7, 'Fortbildungsverwaltung')
ON CONFLICT (feature_key) DO UPDATE SET parent_key = EXCLUDED.parent_key, route_path = EXCLUDED.route_path, description = EXCLUDED.description, display_order = EXCLUDED.display_order;

-- 5. Add Journal (Praxis-Journal) under Daten & Dokumente
INSERT INTO feature_flags (id, feature_key, feature_name, feature_type, parent_key, icon_name, route_path, is_enabled, is_beta, is_protected, allow_practice_override, display_order, description)
VALUES (gen_random_uuid(), 'journal', 'Praxis-Journal', 'frontend', 'frontend_data', 'BookOpen', '/journal', true, false, false, true, 5, 'Praxis-Journal und Insights')
ON CONFLICT (feature_key) DO UPDATE SET parent_key = EXCLUDED.parent_key, route_path = EXCLUDED.route_path, description = EXCLUDED.description, display_order = EXCLUDED.display_order;

-- 6. Add CIRS (Verbesserungsmeldung) under Daten & Dokumente
INSERT INTO feature_flags (id, feature_key, feature_name, feature_type, parent_key, icon_name, route_path, is_enabled, is_beta, is_protected, allow_practice_override, display_order, description)
VALUES (gen_random_uuid(), 'cirs', 'Verbesserungsmeldung', 'frontend', 'frontend_data', 'AlertTriangle', '/cirs', true, false, false, true, 6, 'CIRS - Verbesserungsmeldungen')
ON CONFLICT (feature_key) DO UPDATE SET parent_key = EXCLUDED.parent_key, route_path = EXCLUDED.route_path, description = EXCLUDED.description, display_order = EXCLUDED.display_order;
