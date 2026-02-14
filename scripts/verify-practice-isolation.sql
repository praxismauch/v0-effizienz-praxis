-- Verification script to test practice data isolation
-- This script checks RLS policies and data boundaries

-- 1. Check all tables with practice_id have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    SELECT DISTINCT table_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND column_name = 'practice_id'
  )
ORDER BY tablename;

-- 2. List all RLS policies involving practice_id
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual LIKE '%practice_id%' 
    OR with_check LIKE '%practice_id%'
  )
ORDER BY tablename, policyname;

-- 3. Check for tables with practice_id but no RLS policies
SELECT 
  c.table_name,
  COUNT(DISTINCT p.policyname) as policy_count
FROM information_schema.columns c
LEFT JOIN pg_policies p ON 
  c.table_name = p.tablename 
  AND p.schemaname = 'public'
  AND (p.qual LIKE '%practice_id%' OR p.with_check LIKE '%practice_id%')
WHERE c.table_schema = 'public'
  AND c.column_name = 'practice_id'
GROUP BY c.table_name
HAVING COUNT(DISTINCT p.policyname) = 0
ORDER BY c.table_name;

-- 4. Verify all practice_id columns are TEXT type
SELECT 
  table_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'practice_id'
  AND data_type != 'text'
ORDER BY table_name;

-- 5. Check practices table has approval system
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'practices'
  AND column_name IN ('approval_status', 'created_by', 'id')
ORDER BY column_name;

-- 6. Count records per practice to identify data distribution
SELECT 
  p.id as practice_id,
  p.name as practice_name,
  p.approval_status,
  (SELECT COUNT(*) FROM users WHERE practice_id = p.id::text) as user_count,
  (SELECT COUNT(*) FROM team_members WHERE practice_id = p.id::text) as team_member_count
FROM practices p
ORDER BY p.name;
