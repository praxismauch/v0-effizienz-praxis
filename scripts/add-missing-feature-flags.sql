-- Add missing feature flags to align Feature-Verwaltung with sidebar navigation
-- Adds: frontend_quality group, hygieneplan, training

-- 1. Add Qualitäts-Management parent group (between frontend_team and frontend_praxis)
INSERT INTO feature_flags (
  feature_key, feature_name, feature_type, parent_key, icon_name, route_path,
  is_enabled, is_beta, is_protected, allow_practice_override, display_order, description
) VALUES (
  'frontend_quality', 'Qualitäts-Management', 'frontend', NULL, 'Shield', NULL,
  true, false, false, true, 6, 'Qualitätsmanagement und Hygiene'
) ON CONFLICT (feature_key) DO NOTHING;

-- 2. Add Hygieneplan under Qualitäts-Management
INSERT INTO feature_flags (
  feature_key, feature_name, feature_type, parent_key, icon_name, route_path,
  is_enabled, is_beta, is_protected, allow_practice_override, display_order, description
) VALUES (
  'hygieneplan', 'Hygieneplan', 'frontend', 'frontend_quality', 'Shield', '/hygieneplan',
  true, false, false, true, 1, 'Hygieneplan und QM-Dokumentation'
) ON CONFLICT (feature_key) DO NOTHING;

-- 3. Add Fortbildung (Training) under Team & Personal
INSERT INTO feature_flags (
  feature_key, feature_name, feature_type, parent_key, icon_name, route_path,
  is_enabled, is_beta, is_protected, allow_practice_override, display_order, description
) VALUES (
  'training', 'Fortbildung', 'frontend', 'frontend_team', 'Award', '/training',
  true, false, false, true, 7, 'Fortbildungsverwaltung'
) ON CONFLICT (feature_key) DO NOTHING;

-- 4. Update display_order for frontend_praxis to make room for frontend_quality
UPDATE feature_flags SET display_order = 7 WHERE feature_key = 'frontend_praxis' AND parent_key IS NULL;
