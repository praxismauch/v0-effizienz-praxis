-- Fix RLS policies for practice isolation
-- This script enables RLS on all tables with practice_id and adds proper policies

-- Part 1: Enable RLS on all tables with practice_id that don't have it
ALTER TABLE IF EXISTS academy_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS academy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS academy_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS academy_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS academy_user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS academy_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS arbeitsschutz_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS birthday_celebrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cirs_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cirs_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cirs_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS decision_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS default_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS device_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employee_check_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employee_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS homeoffice_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS medical_device_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS meeting_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS parameter_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS patient_satisfaction_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payroll_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS practice_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profitability_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quality_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS self_check_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shift_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_self_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workflow_tasks ENABLE ROW LEVEL SECURITY;

-- Part 2: Create a helper function to get user's practice_id (if not exists)
CREATE OR REPLACE FUNCTION auth.get_user_practice_id()
RETURNS TEXT AS $$
  SELECT practice_id FROM users WHERE id = auth.uid()::text LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Part 3: Drop problematic "allow all" policies
DROP POLICY IF EXISTS "Allow all on google_ratings" ON google_ratings;
DROP POLICY IF EXISTS "Allow all on jameda_ratings" ON jameda_ratings;
DROP POLICY IF EXISTS "Allow all operations on igel_analyses" ON igel_analyses;
DROP POLICY IF EXISTS "Allow all operations on employee_appraisals" ON employee_appraisals;

-- Part 4: Add standard practice isolation policies for tables missing them
-- Template: Only show/modify data from user's own practice

-- Academy tables
CREATE POLICY IF NOT EXISTS academy_badges_practice_isolation ON academy_badges
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS academy_enrollments_practice_isolation ON academy_enrollments
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS academy_lesson_progress_practice_isolation ON academy_lesson_progress
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS academy_module_progress_practice_isolation ON academy_module_progress
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS academy_user_badges_practice_isolation ON academy_user_badges
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS academy_user_progress_practice_isolation ON academy_user_progress
  FOR ALL USING (practice_id = auth.get_user_practice_id());

-- Other critical tables
CREATE POLICY IF NOT EXISTS cirs_incidents_practice_isolation ON cirs_incidents
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS cirs_analyses_practice_isolation ON cirs_analyses
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS cirs_categories_practice_isolation ON cirs_categories
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS team_members_practice_isolation ON team_members
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS teams_practice_isolation ON teams
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS workflows_practice_isolation ON workflows
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS workflow_tasks_practice_isolation ON workflow_tasks
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS todos_practice_isolation ON todos
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS meetings_practice_isolation ON meetings
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS meeting_protocols_practice_isolation ON meeting_protocols
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS projects_practice_isolation ON projects
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS user_self_checks_practice_isolation ON user_self_checks
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS audit_logs_practice_isolation ON audit_logs
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS practices_own_practice ON practices
  FOR ALL USING (id = auth.get_user_practice_id());

-- Financial tables
CREATE POLICY IF NOT EXISTS bank_accounts_practice_isolation ON bank_accounts
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS bank_transactions_practice_isolation ON bank_transactions
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS billing_invoices_practice_isolation ON billing_invoices
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS financial_reports_practice_isolation ON financial_reports
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS payroll_data_practice_isolation ON payroll_data
  FOR ALL USING (practice_id = auth.get_user_practice_id());

-- HR/Employee tables
CREATE POLICY IF NOT EXISTS homeoffice_requests_practice_isolation ON homeoffice_requests
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS employee_checks_practice_isolation ON employee_checks
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS employee_check_templates_practice_isolation ON employee_check_templates
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS birthday_celebrations_practice_isolation ON birthday_celebrations
  FOR ALL USING (practice_id = auth.get_user_practice_id());

-- Medical/Quality tables
CREATE POLICY IF NOT EXISTS medical_device_maintenance_practice_isolation ON medical_device_maintenance
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS device_maintenance_practice_isolation ON device_maintenance
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS quality_indicators_practice_isolation ON quality_indicators
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS patient_satisfaction_surveys_practice_isolation ON patient_satisfaction_surveys
  FOR ALL USING (practice_id = auth.get_user_practice_id());

-- Scheduling tables
CREATE POLICY IF NOT EXISTS practice_shifts_practice_isolation ON practice_shifts
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS shift_swaps_practice_isolation ON shift_swaps
  FOR ALL USING (practice_id = auth.get_user_practice_id());

-- Other tables
CREATE POLICY IF NOT EXISTS decision_logs_practice_isolation ON decision_logs
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS arbeitsschutz_inspections_practice_isolation ON arbeitsschutz_inspections
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS self_check_categories_practice_isolation ON self_check_categories
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS parameter_groups_practice_isolation ON parameter_groups
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS profitability_analyses_practice_isolation ON profitability_analyses
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS onboarding_progress_practice_isolation ON onboarding_progress
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS default_teams_practice_isolation ON default_teams
  FOR ALL USING (practice_id = auth.get_user_practice_id());

-- Ratings tables with proper isolation (replacing "allow all" policies)
CREATE POLICY IF NOT EXISTS google_ratings_practice_isolation ON google_ratings
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS jameda_ratings_practice_isolation ON jameda_ratings
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS igel_analyses_practice_isolation ON igel_analyses
  FOR ALL USING (practice_id = auth.get_user_practice_id());

CREATE POLICY IF NOT EXISTS employee_appraisals_practice_isolation ON employee_appraisals
  FOR ALL USING (practice_id = auth.get_user_practice_id());

-- Comment
COMMENT ON FUNCTION auth.get_user_practice_id IS 'Returns the practice_id for the currently authenticated user';
