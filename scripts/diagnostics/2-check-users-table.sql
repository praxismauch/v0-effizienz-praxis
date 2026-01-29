-- ========================================
-- DIAGNOSTIC SCRIPT 2: Check Users Table
-- ========================================
-- This script checks if there are any users in the users table

-- Count total users
SELECT COUNT(*) AS total_users FROM users;

-- Show first 5 users (without sensitive data)
SELECT 
  id,
  email,
  name,
  role,
  practice_id,
  is_active,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;

-- Check if there are any users with NULL ids
SELECT COUNT(*) AS users_with_null_id 
FROM users 
WHERE id IS NULL;

-- Check for any data integrity issues
SELECT 
  COUNT(*) AS total,
  COUNT(DISTINCT id) AS unique_ids,
  COUNT(DISTINCT email) AS unique_emails,
  COUNT(CASE WHEN id IS NULL THEN 1 END) AS null_ids,
  COUNT(CASE WHEN email IS NULL THEN 1 END) AS null_emails
FROM users;

-- EXPECTED RESULTS:
-- 1. Should see at least one user if someone has signed up
-- 2. All users should have non-NULL ids
-- 3. unique_ids should equal total (no duplicate IDs)
-- 4. null_ids should be 0
