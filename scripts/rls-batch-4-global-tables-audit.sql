-- 5.1 Check for remaining hardcoded practice1_all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE '%practice1%'
ORDER BY tablename;

-- 5.2 List all tables with their RLS status
SELECT 
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  COUNT(p.polname) AS policy_count
FROM pg_class c
LEFT JOIN pg_policies p ON c.relname = p.tablename AND p.schemaname = 'public'
WHERE c.relnamespace = 'public'::regnamespace
  AND c.relkind = 'r'
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relname;

-- 5.3 Show all policies using get_user_practice_id() (should be most of them)
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND qual LIKE '%get_user_practice_id%'
ORDER BY tablename, cmd;

-- 5.4 Show remaining auth_all policies (should only be global/template tables)
SELECT 
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname = 'auth_all'
ORDER BY tablename;


-- ============================================================================
-- SECTION 6: SUMMARY OF GLOBAL TABLES (No Changes Needed)
-- ============================================================================
-- The following tables intentionally keep `auth_all` policy:
-- 
-- REFERENCE DATA:
--   - subscription_plans
--   - practice_types
--   - practice_templates
--   - specialty_groups
--   - default_teams
--
-- TEMPLATES:
--   - goal_templates
--   - responsibility_templates
--   - survey_templates
--   - global_parameter_templates
--   - interview_templates (practice-scoped in batch 3)
--
-- PUBLIC CONTENT:
--   - blog_posts
--   - changelogs
--   - roadmap_items
--   - seo_keywords
--   - popups
--   - translations
--
-- ACADEMY:
--   - academy_courses
--   - academy_lessons
--   - academy_progress
--   - academy_categories
--   - academy_enrollments
--   - academy_certificates
--   - academy_quiz_questions
--   - academy_quiz_attempts
--   - academy_lesson_progress
-- ============================================================================
