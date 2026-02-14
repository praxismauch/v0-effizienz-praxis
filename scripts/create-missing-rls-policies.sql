-- Create RLS Policies for Tables Missing Protection
-- This script adds practice-based isolation for all tables that have practice_id

-- Helper function to get user's practice_id
CREATE OR REPLACE FUNCTION auth.user_practice_id() RETURNS TEXT AS $$
  SELECT practice_id FROM users WHERE id = auth.uid()::text LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- CRITICAL PRIORITY: Tables with sensitive data
-- ============================================================================

-- absences (HR data)
CREATE POLICY absences_practice_isolation ON absences
  FOR ALL USING (practice_id = auth.user_practice_id());

-- holiday_requests (HR data)  
CREATE POLICY holiday_requests_practice_isolation ON holiday_requests
  FOR ALL USING (practice_id = auth.user_practice_id());

-- contract_files (confidential documents)
CREATE POLICY contract_files_practice_isolation ON contract_files
  FOR ALL USING (practice_id = auth.user_practice_id());

-- document_signatures (legal documents)
CREATE POLICY document_signatures_practice_isolation ON document_signatures
  FOR ALL USING (practice_id = auth.user_practice_id());

-- messages (internal communications)
CREATE POLICY messages_practice_isolation ON messages
  FOR ALL USING (practice_id = auth.user_practice_id());

-- kudos (employee recognition)
CREATE POLICY kudos_practice_isolation ON kudos
  FOR ALL USING (practice_id = auth.user_practice_id());

-- notifications (user-specific)
CREATE POLICY notifications_practice_isolation ON notifications
  FOR ALL USING (practice_id = auth.user_practice_id());

-- ============================================================================
-- HIGH PRIORITY: Tables with practice_id needing policies
-- ============================================================================

-- anonymous_mood_responses
CREATE POLICY anonymous_mood_responses_practice_isolation ON anonymous_mood_responses
  FOR ALL USING (practice_id = auth.user_practice_id());

-- anonymous_mood_surveys
CREATE POLICY anonymous_mood_surveys_practice_isolation ON anonymous_mood_surveys
  FOR ALL USING (practice_id = auth.user_practice_id());

-- custom_forms
CREATE POLICY custom_forms_practice_isolation ON custom_forms
  FOR ALL USING (practice_id = auth.user_practice_id());

-- device_maintenance_reports
CREATE POLICY device_maintenance_reports_practice_isolation ON device_maintenance_reports
  FOR ALL USING (practice_id = auth.user_practice_id());

-- equipment
CREATE POLICY equipment_practice_isolation ON equipment
  FOR ALL USING (practice_id = auth.user_practice_id());

-- external_calendar_subscriptions
CREATE POLICY external_calendar_subscriptions_practice_isolation ON external_calendar_subscriptions
  FOR ALL USING (practice_id = auth.user_practice_id());

-- holiday_blocked_periods
CREATE POLICY holiday_blocked_periods_practice_isolation ON holiday_blocked_periods
  FOR ALL USING (practice_id = auth.user_practice_id());

-- hygiene_plan_comments
CREATE POLICY hygiene_plan_comments_practice_isolation ON hygiene_plan_comments
  FOR ALL USING (practice_id = auth.user_practice_id());

-- hygiene_plan_executions
CREATE POLICY hygiene_plan_executions_practice_isolation ON hygiene_plan_executions
  FOR ALL USING (practice_id = auth.user_practice_id());

-- hygiene_plans
CREATE POLICY hygiene_plans_practice_isolation ON hygiene_plans
  FOR ALL USING (practice_id = auth.user_practice_id());

-- practice_subscriptions
CREATE POLICY practice_subscriptions_practice_isolation ON practice_subscriptions
  FOR ALL USING (practice_id = auth.user_practice_id());

-- practice_users
CREATE POLICY practice_users_practice_isolation ON practice_users
  FOR ALL USING (practice_id = auth.user_practice_id());

-- practice_widgets
CREATE POLICY practice_widgets_practice_isolation ON practice_widgets
  FOR ALL USING (practice_id = auth.user_practice_id());

-- recruiting_positions
CREATE POLICY recruiting_positions_practice_isolation ON recruiting_positions
  FOR ALL USING (practice_id = auth.user_practice_id());

-- review_campaigns
CREATE POLICY review_campaigns_practice_isolation ON review_campaigns
  FOR ALL USING (practice_id = auth.user_practice_id());

-- review_imports
CREATE POLICY review_imports_practice_isolation ON review_imports
  FOR ALL USING (practice_id = auth.user_practice_id());

-- review_platform_config
CREATE POLICY review_platform_config_practice_isolation ON review_platform_config
  FOR ALL USING (practice_id = auth.user_practice_id());

-- shift_templates
CREATE POLICY shift_templates_practice_isolation ON shift_templates
  FOR ALL USING (practice_id = auth.user_practice_id());

-- survey_responses
CREATE POLICY survey_responses_practice_isolation ON survey_responses
  FOR ALL USING (practice_id = auth.user_practice_id());

-- tasks
CREATE POLICY tasks_practice_isolation ON tasks
  FOR ALL USING (practice_id = auth.user_practice_id());

-- team_member_arbeitsmittel
CREATE POLICY team_member_arbeitsmittel_practice_isolation ON team_member_arbeitsmittel
  FOR ALL USING (practice_id = auth.user_practice_id());

-- user_favorites
CREATE POLICY user_favorites_practice_isolation ON user_favorites
  FOR ALL USING (practice_id = auth.user_practice_id());

-- weekly_summary_history
CREATE POLICY weekly_summary_history_practice_isolation ON weekly_summary_history
  FOR ALL USING (practice_id = auth.user_practice_id());

-- weekly_summary_settings
CREATE POLICY weekly_summary_settings_practice_isolation ON weekly_summary_settings
  FOR ALL USING (practice_id = auth.user_practice_id());

-- workload_analysis
CREATE POLICY workload_analysis_practice_isolation ON workload_analysis
  FOR ALL USING (practice_id = auth.user_practice_id());

-- workflow_steps
CREATE POLICY workflow_steps_practice_isolation ON workflow_steps
  FOR ALL USING (practice_id = auth.user_practice_id());

-- ============================================================================
-- FIX: Tables with RLS enabled but 0 policies
-- ============================================================================

-- academy_enrollments (has practice_id)
CREATE POLICY academy_enrollments_practice_isolation ON academy_enrollments
  FOR ALL USING (practice_id = auth.user_practice_id());

-- academy_user_badges (has practice_id)
CREATE POLICY academy_user_badges_practice_isolation ON academy_user_badges
  FOR ALL USING (practice_id = auth.user_practice_id());

-- cirs_incidents (has practice_id)
CREATE POLICY cirs_incidents_practice_isolation ON cirs_incidents
  FOR ALL USING (practice_id = auth.user_practice_id());

-- cirs_incident_comments (no practice_id - join through cirs_incidents)
CREATE POLICY cirs_incident_comments_isolation ON cirs_incident_comments
  FOR ALL USING (
    incident_id IN (
      SELECT id FROM cirs_incidents WHERE practice_id = auth.user_practice_id()
    )
  );

-- ============================================================================
-- GLOBAL CONTENT TABLES (no practice_id needed - specific policies)
-- ============================================================================

-- journal_preferences (user-specific, not practice-specific)
CREATE POLICY journal_preferences_user_isolation ON journal_preferences
  FOR ALL USING (user_id = auth.uid()::text);

-- recruiting_form_fields (linked to recruiting_positions)
CREATE POLICY recruiting_form_fields_isolation ON recruiting_form_fields
  FOR ALL USING (
    position_id IN (
      SELECT id FROM recruiting_positions WHERE practice_id = auth.user_practice_id()
    )
  );

-- survey_questions (linked to surveys)
CREATE POLICY survey_questions_isolation ON survey_questions
  FOR ALL USING (
    survey_id IN (
      SELECT id FROM surveys WHERE practice_id = auth.user_practice_id()
    )
  );

-- survey_answers (linked to survey_responses)
CREATE POLICY survey_answers_isolation ON survey_answers
  FOR ALL USING (
    response_id IN (
      SELECT id FROM survey_responses WHERE practice_id = auth.user_practice_id()
    )
  );

-- knowledge_confirmations
CREATE POLICY knowledge_confirmations_practice_isolation ON knowledge_confirmations
  FOR ALL USING (practice_id = auth.user_practice_id());

-- knowledge_base_articles (if used)
CREATE POLICY knowledge_base_articles_practice_isolation ON knowledge_base_articles
  FOR ALL USING (practice_id = auth.user_practice_id());

-- knowledge_base_versions (linked to articles - if used)
-- CREATE POLICY knowledge_base_versions_isolation ON knowledge_base_versions
--   FOR ALL USING (
--     article_id IN (
--       SELECT id FROM knowledge_base_articles WHERE practice_id = auth.user_practice_id()
--     )
--   );

-- ============================================================================
-- DEVELOPMENT/TESTING TABLES (consider deletion instead)
-- ============================================================================

-- form_db_sync_history (global admin tool - no practice_id)
-- Should be accessible only to super admins via application-level checks

-- screenshot_results (dev tool - no practice_id)
-- Should be accessible only to super admins via application-level checks

-- screenshot_runs (dev tool - no practice_id)
-- Should be accessible only to super admins via application-level checks

-- ============================================================================
-- Summary
-- ============================================================================
-- Created RLS policies for:
-- - 28 tables with practice_id but no RLS policies
-- - 4 tables with RLS enabled but 0 policies
-- - 4 tables without practice_id that need join-based policies
-- - 1 user-specific table (journal_preferences)
--
-- Total: 37 new policies created
