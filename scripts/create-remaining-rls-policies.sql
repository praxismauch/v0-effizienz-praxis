-- Create RLS policies for all 25 remaining tables
-- Generated to complete RLS policy coverage

-- anonymous_mood_responses
CREATE POLICY anonymous_mood_responses_select ON anonymous_mood_responses FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY anonymous_mood_responses_insert ON anonymous_mood_responses FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- anonymous_mood_surveys
CREATE POLICY anonymous_mood_surveys_select ON anonymous_mood_surveys FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY anonymous_mood_surveys_insert ON anonymous_mood_surveys FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY anonymous_mood_surveys_update ON anonymous_mood_surveys FOR UPDATE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- custom_forms
CREATE POLICY custom_forms_select ON custom_forms FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY custom_forms_insert ON custom_forms FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY custom_forms_update ON custom_forms FOR UPDATE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY custom_forms_delete ON custom_forms FOR DELETE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- device_maintenance_reports
CREATE POLICY device_maintenance_reports_select ON device_maintenance_reports FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY device_maintenance_reports_insert ON device_maintenance_reports FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- document_signatures
CREATE POLICY document_signatures_select ON document_signatures FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY document_signatures_insert ON document_signatures FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- external_calendar_subscriptions
CREATE POLICY external_calendar_subscriptions_select ON external_calendar_subscriptions FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY external_calendar_subscriptions_insert ON external_calendar_subscriptions FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY external_calendar_subscriptions_update ON external_calendar_subscriptions FOR UPDATE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY external_calendar_subscriptions_delete ON external_calendar_subscriptions FOR DELETE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- holiday_blocked_periods
CREATE POLICY holiday_blocked_periods_select ON holiday_blocked_periods FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY holiday_blocked_periods_insert ON holiday_blocked_periods FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY holiday_blocked_periods_update ON holiday_blocked_periods FOR UPDATE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY holiday_blocked_periods_delete ON holiday_blocked_periods FOR DELETE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- hygiene_plan_comments
CREATE POLICY hygiene_plan_comments_select ON hygiene_plan_comments FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY hygiene_plan_comments_insert ON hygiene_plan_comments FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- hygiene_plan_executions
CREATE POLICY hygiene_plan_executions_select ON hygiene_plan_executions FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY hygiene_plan_executions_insert ON hygiene_plan_executions FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY hygiene_plan_executions_update ON hygiene_plan_executions FOR UPDATE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- knowledge_base_articles
CREATE POLICY knowledge_base_articles_select ON knowledge_base_articles FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY knowledge_base_articles_insert ON knowledge_base_articles FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY knowledge_base_articles_update ON knowledge_base_articles FOR UPDATE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY knowledge_base_articles_delete ON knowledge_base_articles FOR DELETE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- knowledge_confirmations
CREATE POLICY knowledge_confirmations_select ON knowledge_confirmations FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY knowledge_confirmations_insert ON knowledge_confirmations FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- practice_subscriptions
CREATE POLICY practice_subscriptions_select ON practice_subscriptions FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY practice_subscriptions_insert ON practice_subscriptions FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY practice_subscriptions_update ON practice_subscriptions FOR UPDATE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- practice_users
CREATE POLICY practice_users_select ON practice_users FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY practice_users_insert ON practice_users FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY practice_users_update ON practice_users FOR UPDATE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY practice_users_delete ON practice_users FOR DELETE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- practice_widgets
CREATE POLICY practice_widgets_select ON practice_widgets FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY practice_widgets_insert ON practice_widgets FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY practice_widgets_update ON practice_widgets FOR UPDATE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY practice_widgets_delete ON practice_widgets FOR DELETE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- review_imports
CREATE POLICY review_imports_select ON review_imports FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY review_imports_insert ON review_imports FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- review_platform_config
CREATE POLICY review_platform_config_select ON review_platform_config FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY review_platform_config_insert ON review_platform_config FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY review_platform_config_update ON review_platform_config FOR UPDATE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY review_platform_config_delete ON review_platform_config FOR DELETE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- shift_templates
CREATE POLICY shift_templates_select ON shift_templates FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY shift_templates_insert ON shift_templates FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY shift_templates_update ON shift_templates FOR UPDATE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY shift_templates_delete ON shift_templates FOR DELETE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- survey_responses
CREATE POLICY survey_responses_select ON survey_responses FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY survey_responses_insert ON survey_responses FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- team_member_arbeitsmittel
CREATE POLICY team_member_arbeitsmittel_select ON team_member_arbeitsmittel FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY team_member_arbeitsmittel_insert ON team_member_arbeitsmittel FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY team_member_arbeitsmittel_update ON team_member_arbeitsmittel FOR UPDATE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY team_member_arbeitsmittel_delete ON team_member_arbeitsmittel FOR DELETE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- test_checklists
CREATE POLICY test_checklists_select ON test_checklists FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY test_checklists_insert ON test_checklists FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY test_checklists_update ON test_checklists FOR UPDATE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY test_checklists_delete ON test_checklists FOR DELETE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- user_favorites
CREATE POLICY user_favorites_select ON user_favorites FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY user_favorites_insert ON user_favorites FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY user_favorites_delete ON user_favorites FOR DELETE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- weekly_summary_history
CREATE POLICY weekly_summary_history_select ON weekly_summary_history FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY weekly_summary_history_insert ON weekly_summary_history FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- weekly_summary_settings
CREATE POLICY weekly_summary_settings_select ON weekly_summary_settings FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY weekly_summary_settings_insert ON weekly_summary_settings FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY weekly_summary_settings_update ON weekly_summary_settings FOR UPDATE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- workflow_steps
CREATE POLICY workflow_steps_select ON workflow_steps FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY workflow_steps_insert ON workflow_steps FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY workflow_steps_update ON workflow_steps FOR UPDATE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY workflow_steps_delete ON workflow_steps FOR DELETE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));

-- workload_analysis
CREATE POLICY workload_analysis_select ON workload_analysis FOR SELECT 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY workload_analysis_insert ON workload_analysis FOR INSERT 
  WITH CHECK (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
CREATE POLICY workload_analysis_update ON workload_analysis FOR UPDATE 
  USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()::text));
