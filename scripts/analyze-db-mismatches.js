import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

// All actual DB table names from Supabase (queried directly)
const DB_TABLES = new Set([
  "absences","academy_badges","academy_courses","academy_enrollments","academy_lessons",
  "academy_modules","academy_quiz_options","academy_quiz_questions","academy_quizzes",
  "academy_user_badges","ai_analysis_history","analytics_parameters","analytics_parameters_backup",
  "anonymous_mood_responses","anonymous_mood_surveys","applications","arbeitsmittel",
  "arbeitsplaetze","arbeitsplatz_anweisungen","backup_schedules","backups",
  "bank_transaction_categories","blog_posts","calendar_events","candidates","certifications",
  "changelogs","cirs_incident_comments","cirs_incidents","cockpit_card_settings",
  "competitor_analyses","compliance_violations","contacts","contract_files","contracts",
  "custom_forms","dashboard_preferences","default_teams","departments",
  "device_maintenance_reports","device_maintenances","device_rooms","device_trainings",
  "document_folders","document_permissions","document_signatures","documents",
  "employee_appraisals","employee_availability","equipment","external_calendar_subscriptions",
  "feature_flags","form_db_sync_history","form_fields","global_parameter_groups",
  "global_parameter_templates","goal_assignments","goal_attachments","goal_templates","goals",
  "google_ratings","hiring_pipeline_stages","holiday_blocked_periods","holiday_requests",
  "homeoffice_policies","hygiene_plan_comments","hygiene_plan_executions","hygiene_plans",
  "igel_analyses","interview_templates","inventory_bills","inventory_items","jameda_ratings",
  "job_postings","journal_action_items","journal_preferences","knowledge_base",
  "knowledge_base_articles","knowledge_base_versions","knowledge_confirmations",
  "knowledge_entries","kudos","kv_abrechnung","leitbild","medical_devices","messages",
  "migration_history","monthly_time_reports","notifications","onboarding_progress",
  "org_chart_positions","orga_categories","overtime_accounts","overtime_transactions",
  "parameter_template_usage","parameter_values","parameter_values_backup","perma_assessments",
  "popups","practice_feature_overrides","practice_integrations","practice_invites",
  "practice_journals","practice_locations","practice_members","practice_settings",
  "practice_subscriptions","practice_templates","practice_types","practice_users",
  "practice_widgets","practices","protocols","quality_benchmarks","quality_circle_sessions",
  "questionnaire_responses","questionnaires","recruiting_form_fields","recruiting_positions",
  "responsibilities","responsibility_arbeitsplaetze","responsibility_shifts",
  "responsibility_templates","review_campaigns","review_imports","review_platform_config",
  "roadmap_idea_feedback","roadmap_items","roi_analyses","role_colors","role_permissions",
  "rooms","sanego_ratings","screenshot_results","screenshot_runs","seo_keywords",
  "shift_schedules","shift_schedules_history","shift_swap_requests","shift_templates",
  "shift_types","sick_leaves","sick_leaves_backup","sidebar_permissions","skill_definitions",
  "smtp_settings","specialty_groups","staffing_plan","staffing_plans","subscription_plans",
  "survey_answers","survey_questions","survey_responses","survey_templates","surveys",
  "system_changes","system_logs","system_settings","tasks","team_assignments",
  "team_availability","team_member_arbeitsmittel","team_member_certifications","team_members",
  "teams","template_skills","test_checklist_items","test_checklist_templates","test_checklists",
  "testing_categories","ticket_comments","ticket_priorities","ticket_statuses","ticket_types",
  "tickets","time_audit_log","time_block_breaks","time_blocks","time_correction_requests",
  "time_plausibility_checks","time_stamps","todos","training_budget_usage","training_budgets",
  "training_courses","training_event_registrations","training_events","translations",
  "trusted_devices","user_favorites","user_goal_order","user_preferences","user_profiles",
  "user_self_checks","user_sidebar_preferences","userprofiles","users","waitlist",
  "weekly_summary_history","weekly_summary_settings","wellbeing_suggestions","workflow_steps",
  "workflows","workload_analysis","wunschpatient_profiles"
]);

function walkDir(dir, extensions, exclude = []) {
  let files = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      if (exclude.some(e => fullPath.includes(e))) continue;
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          files = files.concat(walkDir(fullPath, extensions, exclude));
        } else if (extensions.includes(extname(fullPath))) {
          files.push(fullPath);
        }
      } catch(e) {}
    }
  } catch(e) {}
  return files;
}

const codeFiles = walkDir('.', ['.ts', '.tsx'], ['node_modules', '.next', 'user_read_only_context', 'scripts']);
const codeTableUsage = new Map();

for (const file of codeFiles) {
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const fromMatches = [...lines[i].matchAll(/\.from\(["']([^"']+)["']\)/g)];
    for (const fromMatch of fromMatches) {
      const tableName = fromMatch[1];
      if (!codeTableUsage.has(tableName)) {
        codeTableUsage.set(tableName, []);
      }
      codeTableUsage.get(tableName).push({ file, lineNum: i + 1, line: lines[i].trim() });
    }
  }
}

// 1. Tables in code but NOT in DB
console.log("========================================");
console.log("TABLES REFERENCED IN CODE BUT MISSING FROM DATABASE");
console.log("========================================");
const missingFromDB = [...codeTableUsage.entries()]
  .filter(([table]) => !DB_TABLES.has(table))
  .sort((a, b) => b[1].length - a[1].length);

for (const [table, usages] of missingFromDB) {
  console.log(`\n  TABLE: "${table}" (${usages.length} reference(s))`);
  for (const u of usages.slice(0, 8)) {
    console.log(`    - ${u.file}:${u.lineNum}`);
    console.log(`      ${u.line.substring(0, 120)}`);
  }
  if (usages.length > 8) console.log(`    ... and ${usages.length - 8} more`);
}

// 2. All code table usage summary
console.log("\n\n========================================");
console.log("ALL CODE TABLE REFERENCES (sorted by frequency)");
console.log("========================================");
const sortedUsage = [...codeTableUsage.entries()].sort((a, b) => b[1].length - a[1].length);
for (const [table, usages] of sortedUsage) {
  const exists = DB_TABLES.has(table) ? 'EXISTS' : '*** MISSING ***';
  console.log(`  ${table}: ${usages.length} ref(s) [${exists}]`);
}

console.log(`\n\nSummary: ${codeTableUsage.size} unique tables in code, ${DB_TABLES.size} tables in DB, ${missingFromDB.length} missing from DB`);
