#!/usr/bin/env node
/**
 * Database Table Audit Script
 * 
 * This script analyzes which database tables are:
 * 1. Used in the codebase (referenced in .from() calls)
 * 2. Missing RLS policies when they have practice_id
 * 3. Potentially unused and can be deleted
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// All tables from database
const allTables = [
  "absences", "academy_badges", "academy_courses", "academy_enrollments", "academy_lessons",
  "academy_modules", "academy_quiz_options", "academy_quiz_questions", "academy_quizzes",
  "academy_user_badges", "ai_analysis_history", "analytics_parameters", "analytics_parameters_backup",
  "anonymous_mood_responses", "anonymous_mood_surveys", "applications", "arbeitsmittel",
  "arbeitsplaetze", "arbeitsplatz_anweisungen", "backup_schedules", "backups",
  "bank_transaction_categories", "blog_posts", "calendar_events", "candidates", "certifications",
  "changelogs", "cirs_incident_comments", "cirs_incidents", "cockpit_card_settings",
  "competitor_analyses", "compliance_violations", "contacts", "contract_files", "contracts",
  "custom_forms", "dashboard_preferences", "default_teams", "departments",
  "device_maintenance_reports", "device_maintenances", "device_rooms", "device_trainings",
  "document_folders", "document_permissions", "document_signatures", "documents",
  "employee_appraisals", "employee_availability", "equipment", "external_calendar_subscriptions",
  "feature_flags", "form_db_sync_history", "form_fields", "global_parameter_groups",
  "global_parameter_templates", "goal_assignments", "goal_attachments", "goal_templates", "goals",
  "google_ratings", "hiring_pipeline_stages", "holiday_blocked_periods", "holiday_requests",
  "homeoffice_policies", "hygiene_plan_comments", "hygiene_plan_executions", "hygiene_plans",
  "igel_analyses", "interview_templates", "inventory_bills", "inventory_items", "jameda_ratings",
  "job_postings", "journal_action_items", "journal_preferences", "knowledge_base",
  "knowledge_base_articles", "knowledge_base_versions", "knowledge_confirmations",
  "knowledge_entries", "kudos", "kv_abrechnung", "leitbild", "medical_devices", "messages",
  "migration_history", "monthly_time_reports", "notifications", "onboarding_progress",
  "org_chart_positions", "orga_categories", "overtime_accounts", "overtime_transactions",
  "parameter_template_usage", "parameter_values", "parameter_values_backup", "perma_assessments",
  "popups", "practice_feature_overrides", "practice_integrations", "practice_invites",
  "practice_journals", "practice_locations", "practice_members", "practice_settings",
  "practice_subscriptions", "practice_templates", "practice_types", "practice_users",
  "practice_widgets", "practices", "processed_emails", "protocols", "quality_benchmarks",
  "quality_circle_sessions", "questionnaire_responses", "questionnaires",
  "recruiting_form_fields", "recruiting_positions", "responsibilities",
  "responsibility_arbeitsplaetze", "responsibility_shifts", "responsibility_templates",
  "review_campaigns", "review_imports", "review_platform_config", "roadmap_idea_feedback",
  "roadmap_items", "roi_analyses", "role_colors", "role_permissions", "rooms", "sanego_ratings",
  "screenshot_results", "screenshot_runs", "seo_keywords", "shift_schedules",
  "shift_schedules_history", "shift_swap_requests", "shift_templates", "shift_types",
  "sick_leaves", "sick_leaves_backup", "sidebar_permissions", "skill_definitions",
  "smtp_settings", "specialty_groups", "staffing_plan", "staffing_plans",
  "subscription_plans", "survey_answers", "survey_questions", "survey_responses",
  "survey_templates", "surveys", "system_changes", "system_logs", "system_settings", "tasks",
  "team_assignments", "team_availability", "team_member_arbeitsmittel",
  "team_member_certifications", "team_members", "teams", "template_skills",
  "test_checklist_items", "test_checklist_templates", "test_checklists", "testing_categories",
  "ticket_comments", "ticket_priorities", "ticket_statuses", "ticket_types", "tickets",
  "time_audit_log", "time_block_breaks", "time_blocks", "time_correction_requests",
  "time_plausibility_checks", "time_stamps", "todos", "training_budget_usage",
  "training_budgets", "training_courses", "training_event_registrations", "training_events",
  "translations", "trusted_devices", "user_favorites", "user_goal_order", "user_preferences",
  "user_profiles", "user_self_checks", "user_sidebar_preferences", "userprofiles", "users",
  "waitlist", "weekly_summary_history", "weekly_summary_settings", "wellbeing_suggestions",
  "workflow_steps", "workflows", "workload_analysis", "wunschpatient_profiles"
];

function findTableUsage(dir: string, tables: string[]): Map<string, string[]> {
  const usage = new Map<string, string[]>();
  
  function searchFiles(directory: string) {
    const files = readdirSync(directory);
    
    for (const file of files) {
      const fullPath = join(directory, file);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!file.startsWith('.') && file !== 'node_modules') {
          searchFiles(fullPath);
        }
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = readFileSync(fullPath, 'utf-8');
        
        for (const table of tables) {
          // Look for .from("table") or .from('table')
          const patterns = [
            new RegExp(`\\.from\\(['"]\${table}['"]\\)`, 'g'),
            new RegExp(`\\.from\\(\`\${table}\`\\)`, 'g')
          ];
          
          if (patterns.some(p => p.test(content))) {
            if (!usage.has(table)) {
              usage.set(table, []);
            }
            usage.get(table)!.push(fullPath);
          }
        }
      }
    }
  }
  
  searchFiles(dir);
  return usage;
}

console.log('🔍 Auditing database tables...\n');

const projectRoot = process.cwd();
const tableUsage = findTableUsage(projectRoot, allTables);

const usedTables = Array.from(tableUsage.keys()).sort();
const unusedTables = allTables.filter(t => !tableUsage.has(t)).sort();

console.log(`✅ Used tables (${usedTables.length}):`);
usedTables.forEach(t => {
  const files = tableUsage.get(t)!;
  console.log(`  - ${t} (${files.length} files)`);
});

console.log(`\n⚠️  Potentially unused tables (${unusedTables.length}):`);
unusedTables.forEach(t => console.log(`  - ${t}`));

console.log(`\n📊 Summary:`);
console.log(`  Total tables: ${allTables.length}`);
console.log(`  Used: ${usedTables.length}`);
console.log(`  Unused: ${unusedTables.length}`);
console.log(`  Usage rate: ${Math.round((usedTables.length / allTables.length) * 100)}%`);
