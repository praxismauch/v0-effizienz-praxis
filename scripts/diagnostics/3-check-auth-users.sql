-- ========================================
-- DIAGNOSTIC SCRIPT 3: Check Auth Users
-- ========================================
-- This script checks Supabase auth.users and compares with public.users

-- Note: This requires access to the auth schema
-- If you don't have access, you'll need to run this in Supabase SQL Editor

-- Count auth users
SELECT COUNT(*) AS total_auth_users 
FROM auth.users;

-- Show recent auth users
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Compare auth.users with public.users
-- Find auth users that don't have a profile in public.users
SELECT 
  au.id,
  au.email,
  au.created_at AS auth_created_at,
  pu.id AS profile_id,
  pu.created_at AS profile_created_at
FROM auth.users au
LEFT JOIN users pu ON au.id = pu.id
ORDER BY au.created_at DESC
LIMIT 10;

-- Count orphaned auth users (in auth.users but not in public.users)
SELECT COUNT(*) AS orphaned_auth_users
FROM auth.users au
LEFT JOIN users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- EXPECTED RESULTS:
-- 1. Should see auth users if anyone has signed up
-- 2. orphaned_auth_users shows how many auth users are missing profiles
-- 3. If orphaned_auth_users > 0, that's the problem - auth exists but no profile
