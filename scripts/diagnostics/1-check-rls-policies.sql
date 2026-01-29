-- ========================================
-- DIAGNOSTIC SCRIPT 1: Check RLS Policies
-- ========================================
-- This script verifies that RLS policies are properly applied to the users table

-- Check if RLS is enabled on users table
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'users';

-- List all RLS policies on the users table
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
WHERE tablename = 'users'
ORDER BY policyname;

-- Check if the policies allow SELECT for authenticated users
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users' 
  AND cmd = 'SELECT';

-- EXPECTED RESULTS:
-- 1. RLS should be enabled (rls_enabled = true)
-- 2. Should see policies: "Users can view all profiles", "Users can update their own profile", "Users can insert their own profile"
-- 3. The SELECT policy should have qual = 'true' (meaning: allow all authenticated users to select)
