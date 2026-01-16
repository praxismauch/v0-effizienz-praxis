-- =====================================================
-- BATCH 2: Context Race Condition - Database Verification
-- Run these queries to check data state
-- =====================================================

-- =====================================================
-- 1. ORGANIGRAMM - Check org_chart_positions table
-- =====================================================

-- 1.1 Check if table exists and has data
SELECT 
  'org_chart_positions' as table_name,
  COUNT(*) as total_rows
FROM org_chart_positions;

-- 1.2 Check positions by practice (to see if data is linked correctly)
SELECT 
  practice_id,
  COUNT(*) as position_count,
  COUNT(DISTINCT parent_id) as unique_parents
FROM org_chart_positions
GROUP BY practice_id
ORDER BY practice_id;

-- 1.3 Check for orphaned positions (parent_id pointing to non-existent position)
SELECT 
  ocp.id,
  ocp.title,
  ocp.practice_id,
  ocp.parent_id
FROM org_chart_positions ocp
LEFT JOIN org_chart_positions parent ON ocp.parent_id = parent.id
WHERE ocp.parent_id IS NOT NULL 
  AND parent.id IS NULL;

-- =====================================================
-- 2. GOALS - Check goals table
-- =====================================================

-- 2.1 Check if table exists and has data
SELECT 
  'goals' as table_name,
  COUNT(*) as total_rows
FROM goals;

-- 2.2 Check goals by practice
SELECT 
  practice_id,
  COUNT(*) as goal_count,
  COUNT(CASE WHEN target_value IS NOT NULL THEN 1 END) as with_target,
  COUNT(CASE WHEN current_value IS NOT NULL THEN 1 END) as with_current,
  COUNT(CASE WHEN unit IS NOT NULL THEN 1 END) as with_unit
FROM goals
GROUP BY practice_id
ORDER BY practice_id;

-- 2.3 Check goals with missing critical fields (potential save bug)
SELECT 
  id,
  title,
  practice_id,
  target_value,
  current_value,
  unit,
  created_at
FROM goals
WHERE target_value IS NULL 
   OR unit IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- =====================================================
-- 3. CALENDAR - Check calendar_events table
-- =====================================================

-- 3.1 Check if table exists and has data
SELECT 
  'calendar_events' as table_name,
  COUNT(*) as total_rows
FROM calendar_events;

-- 3.2 Check events by practice
SELECT 
  practice_id,
  COUNT(*) as event_count,
  MIN(start_date) as earliest_event,
  MAX(start_date) as latest_event
FROM calendar_events
GROUP BY practice_id
ORDER BY practice_id;

-- 3.3 Check date format consistency (looking for format mismatches)
SELECT DISTINCT
  pg_typeof(start_date) as start_date_type,
  pg_typeof(end_date) as end_date_type,
  LENGTH(start_date::text) as start_date_length,
  LEFT(start_date::text, 20) as start_date_sample
FROM calendar_events
LIMIT 10;

-- 3.4 Check recent events (to verify they're being saved)
SELECT 
  id,
  title,
  practice_id,
  start_date,
  end_date,
  all_day,
  created_at
FROM calendar_events
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- 4. PRACTICES - Check practice data linkage
-- =====================================================

-- 4.1 List all practices with their linked data counts
SELECT 
  p.id as practice_id,
  p.name as practice_name,
  (SELECT COUNT(*) FROM org_chart_positions WHERE practice_id = p.id) as org_positions,
  (SELECT COUNT(*) FROM goals WHERE practice_id = p.id) as goals,
  (SELECT COUNT(*) FROM calendar_events WHERE practice_id = p.id) as calendar_events
FROM practices p
ORDER BY p.id;

-- =====================================================
-- 5. USER-PRACTICE RELATIONSHIPS
-- =====================================================

-- 5.1 Check if users are properly linked to practices
SELECT 
  u.id as user_id,
  u.email,
  u.current_practice_id,
  p.name as current_practice_name
FROM users u
LEFT JOIN practices p ON u.current_practice_id = p.id
ORDER BY u.id
LIMIT 20;

-- 5.2 Check for users with NULL current_practice_id (potential cause of "no practice selected")
SELECT 
  COUNT(*) as users_without_practice
FROM users
WHERE current_practice_id IS NULL;
