-- Dashboard layout templates per user role (Arzt, MFA, Rezeption, Verwaltung, etc.)
CREATE TABLE IF NOT EXISTS dashboard_layout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL,
  template_name TEXT NOT NULL DEFAULT 'Standard',
  config JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_name, template_name)
);

-- Index for fast lookups by role
CREATE INDEX IF NOT EXISTS idx_dashboard_layout_templates_role ON dashboard_layout_templates(role_name);

-- RLS
ALTER TABLE dashboard_layout_templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read templates (needed for applying default on first login)
CREATE POLICY "dashboard_layout_templates_select" ON dashboard_layout_templates
  FOR SELECT USING (true);

-- Only super admins can insert/update/delete (enforced at API level)
CREATE POLICY "dashboard_layout_templates_all" ON dashboard_layout_templates
  FOR ALL USING (true) WITH CHECK (true);
