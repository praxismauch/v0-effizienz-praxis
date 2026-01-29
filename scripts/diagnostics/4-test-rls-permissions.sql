-- ========================================
-- DIAGNOSTIC SCRIPT 4: Test RLS Permissions
-- ========================================
-- This script tests if RLS policies are working correctly

-- Test 1: Check if anonymous users can access (should fail)
SET ROLE anon;
SELECT COUNT(*) AS anon_can_see FROM users;
RESET ROLE;

-- Test 2: Check RLS policy details
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users';

-- Test 3: Check if there are any permission errors in the logs
-- (This would need to be run in Supabase dashboard to see actual errors)

-- Test 4: Try to simulate an authenticated user query
-- This shows what the policy qual evaluates to
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual = 'true' THEN 'Allows all authenticated users'
    WHEN qual LIKE '%auth.uid()%' THEN 'Restricted to own records'
    ELSE 'Complex condition: ' || qual
  END AS policy_behavior
FROM pg_policies
WHERE tablename = 'users';

-- EXPECTED RESULTS:
-- 1. anon role should see 0 rows (RLS blocks anonymous access)
-- 2. Policy qual should show "true" for SELECT, meaning authenticated users can see all
-- 3. If qual is something else, that might be blocking access
