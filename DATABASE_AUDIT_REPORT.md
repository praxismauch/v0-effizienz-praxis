# Database Audit Report
*Generated: 2024*

## Executive Summary

**Total Tables:** 148  
**Tables with RLS Enabled:** 107 (72%)  
**Tables WITHOUT RLS:** 41 (28%)  
**Tables with practice_id:** 124  
**Tables needing RLS policies:** 41+

## 🚨 Critical Security Issues

### 1. Tables with practice_id but NO RLS (41 tables)
These tables contain practice-specific data but have ZERO protection:

```
absences, analytics_parameters_backup, anonymous_mood_responses, anonymous_mood_surveys,
contract_files, custom_forms, device_maintenance_reports, document_signatures,
equipment, external_calendar_subscriptions, form_db_sync_history, holiday_blocked_periods,
holiday_requests, hygiene_plan_comments, hygiene_plan_executions, hygiene_plans,
journal_preferences, knowledge_base_articles, knowledge_base_versions,
knowledge_confirmations, kudos, messages, notifications, parameter_values_backup,
practice_subscriptions, practice_users, practice_widgets, recruiting_form_fields,
recruiting_positions, review_campaigns, review_imports, review_platform_config,
screenshot_results, screenshot_runs, shift_templates, sick_leaves_backup,
survey_answers, survey_questions, survey_responses, tasks, user_favorites,
weekly_summary_history, weekly_summary_settings, workload_analysis
```

### 2. Tables with RLS Enabled but 0 Policies (6 tables)
RLS is turned on but there are NO policies = complete lockout:

- `academy_enrollments` - has practice_id
- `academy_user_badges` - has practice_id  
- `cirs_incident_comments` - NO practice_id (needs join)
- `cirs_incidents` - has practice_id
- `processed_emails` - NO practice_id (global)

### 3. Tables with Weak/Broken Policies
Tables with "allow all" policies that bypass practice isolation:

- `certifications` - 2 policies (needs audit)
- `employee_appraisals` - 4 policies (needs audit)
- `google_ratings` - 5 policies (needs audit)
- `jameda_ratings` - 5 policies (needs audit)
- `igel_analyses` - 5 policies (needs audit)
- `sanego_ratings` - 5 policies (needs audit)

## 📋 Tables by Category

### Academy System (13 tables)
- ✅ `academy_badges` - RLS enabled, 1 policy (NO practice_id - global content)
- ✅ `academy_courses` - RLS enabled, 4 policies, has practice_id
- ❌ `academy_enrollments` - RLS enabled but 0 policies, has practice_id
- ✅ `academy_lessons` - RLS enabled, 1 policy (NO practice_id - global)
- ✅ `academy_modules` - RLS enabled, 1 policy (NO practice_id - global)
- ✅ `academy_quiz_options` - RLS enabled, 1 policy (NO practice_id - global)
- ✅ `academy_quiz_questions` - RLS enabled, 1 policy (NO practice_id - global)
- ✅ `academy_quizzes` - RLS enabled, 1 policy (NO practice_id - global)
- ❌ `academy_user_badges` - RLS enabled but 0 policies, has practice_id

### Time Tracking (8 tables)
- ✅ `time_audit_log` - RLS enabled, 3 policies, has practice_id
- ✅ `time_block_breaks` - RLS enabled, 5 policies (NO practice_id - linked to time_blocks)
- ✅ `time_blocks` - RLS enabled, 6 policies, has practice_id
- ✅ `time_correction_requests` - RLS enabled, 5 policies, has practice_id
- ✅ `time_plausibility_checks` - RLS enabled, 4 policies, has practice_id
- ✅ `time_stamps` - RLS enabled, 6 policies, has practice_id
- ✅ `monthly_time_reports` - RLS enabled, 2 policies, has practice_id
- ✅ `overtime_accounts` - RLS enabled, 4 policies, has practice_id
- ✅ `overtime_transactions` - RLS enabled, 2 policies, has practice_id

### HR & Team (12 tables)
- ❌ `absences` - NO RLS, has practice_id ⚠️
- ✅ `team_members` - RLS enabled, 9 policies, has practice_id
- ✅ `teams` - RLS enabled, 9 policies, has practice_id
- ✅ `team_assignments` - RLS enabled, 4 policies, has practice_id
- ✅ `team_member_certifications` - RLS enabled, 2 policies, has practice_id
- ✅ `employee_availability` - RLS enabled, 4 policies, has practice_id
- ⚠️ `employee_appraisals` - RLS enabled, 4 policies (needs audit)
- ✅ `contracts` - RLS enabled, 4 policies, has practice_id
- ❌ `contract_files` - NO RLS, has practice_id ⚠️
- ✅ `sick_leaves` - RLS enabled, 4 policies, has practice_id
- ❌ `sick_leaves_backup` - NO RLS, has practice_id (DELETE?)
- ❌ `holiday_requests` - NO RLS, has practice_id ⚠️

### Scheduling (7 tables)
- ✅ `shift_schedules` - RLS enabled, 6 policies, has practice_id
- ✅ `shift_schedules_history` - RLS enabled, 2 policies, has practice_id
- ✅ `shift_swap_requests` - RLS enabled, 7 policies, has practice_id
- ❌ `shift_templates` - NO RLS, has practice_id ⚠️
- ✅ `shift_types` - RLS enabled, 6 policies, has practice_id
- ✅ `team_availability` - RLS enabled, 2 policies, has practice_id
- ✅ `compliance_violations` - RLS enabled, 4 policies, has practice_id

### Documents (5 tables)
- ✅ `documents` - RLS enabled, 4 policies, has practice_id
- ✅ `document_folders` - RLS enabled, 4 policies, has practice_id
- ✅ `document_permissions` - RLS enabled, 4 policies (NO practice_id)
- ❌ `document_signatures` - NO RLS, has practice_id ⚠️

### Inventory & Devices (8 tables)
- ✅ `medical_devices` - RLS enabled, 4 policies, has practice_id
- ✅ `arbeitsmittel` - RLS enabled, 8 policies, has practice_id
- ❌ `team_member_arbeitsmittel` - NO RLS, has practice_id ⚠️
- ✅ `inventory_items` - RLS enabled, 2 policies, has practice_id
- ✅ `inventory_bills` - RLS enabled, 1 policy, has practice_id
- ❌ `device_maintenance_reports` - NO RLS, has practice_id ⚠️
- ✅ `device_maintenances` - RLS enabled, 2 policies (NO practice_id)
- ✅ `device_trainings` - RLS enabled, 2 policies (NO practice_id)

### Recruiting (5 tables)
- ✅ `candidates` - RLS enabled, 4 policies, has practice_id
- ✅ `applications` - RLS enabled, 4 policies, has practice_id
- ✅ `job_postings` - RLS enabled, 4 policies, has practice_id
- ✅ `hiring_pipeline_stages` - RLS enabled, 4 policies, has practice_id
- ❌ `recruiting_positions` - NO RLS, has practice_id ⚠️
- ❌ `recruiting_form_fields` - NO RLS, NO practice_id (links to positions)

### Likely Unused/Deprecated Tables (candidates for deletion)
- `analytics_parameters_backup` - backup table
- `parameter_values_backup` - backup table  
- `sick_leaves_backup` - backup table
- `form_db_sync_history` - sync tracking
- `screenshot_results` - testing/dev tool
- `screenshot_runs` - testing/dev tool
- `userprofiles` - duplicate of user_profiles?
- `practice_users` - duplicate of practice_members?
- `knowledge_base_articles` - duplicate of knowledge_base?
- `knowledge_base_versions` - versioning system not used?
- `template_skills` - orphaned template system?
- `test_checklist_items` - testing table?
- `test_checklist_templates` - testing table?
- `test_checklists` - testing table?

## 🎯 Action Plan

### Phase 1: Critical Security Fixes (URGENT)
1. Add RLS policies to 41 tables without protection
2. Fix 6 tables with RLS but no policies  
3. Audit/fix weak policies on ratings tables

### Phase 2: Cleanup (IMPORTANT)
1. Delete backup tables (3 tables)
2. Delete testing/dev tables (6 tables)
3. Delete duplicate/unused tables (5+ tables)
4. Consolidate redundant systems

### Phase 3: Verification (REQUIRED)
1. Test each RLS policy with different users
2. Verify practice isolation works correctly
3. Performance test with policies enabled
4. Document all policies for maintenance

## 📝 Notes

- **Global content tables** (academy content, feature flags, etc.) don't need practice_id
- **User-specific tables** (preferences, profiles) need RLS but filter by user_id
- **Backup tables** should be deleted - use database-level backups instead
- **Testing tables** should be in separate test database, not production
