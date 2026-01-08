-- ============================================================================
-- HOTFIX: Fix Login RLS Policies
-- ============================================================================
-- Problem: Users cannot read their own record during login because
-- get_user_practice_id() creates a circular dependency
-- 
-- Solution: Users can ALWAYS read their OWN record (id = auth.uid())
-- Practice isolation still applies for reading OTHER users
-- ============================================================================

-- STEP 1: Drop problematic policies on users table
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
DROP POLICY IF EXISTS "users_delete" ON public.users;

-- STEP 2: Create fixed policies for users table
-- SELECT: User can read their OWN record OR users in same practice
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (
    auth.role() = 'authenticated' 
    AND (
      id = auth.uid()::text  -- Always allow reading own record
      OR practice_id = get_user_practice_id()  -- Allow reading same practice
    )
  );

-- INSERT: Only allow inserting own record (during signup)
CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND id = auth.uid()::text
  );

-- UPDATE: Only allow updating own record
CREATE POLICY "users_update" ON public.users
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND id = auth.uid()::text
  ) WITH CHECK (
    auth.role() = 'authenticated'
    AND id = auth.uid()::text
  );

-- DELETE: Only allow deleting own record (rare, but consistent)
CREATE POLICY "users_delete" ON public.users
  FOR DELETE USING (
    auth.role() = 'authenticated'
    AND id = auth.uid()::text
  );

-- ============================================================================
-- STEP 3: Fix user_profiles table (same issue)
-- ============================================================================
DROP POLICY IF EXISTS "user_profiles_select" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete" ON public.user_profiles;

CREATE POLICY "user_profiles_select" ON public.user_profiles
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (
      user_id = auth.uid()::text  -- Always allow reading own profile
      OR user_id IN (SELECT id FROM public.users WHERE practice_id = get_user_practice_id())
    )
  );

CREATE POLICY "user_profiles_insert" ON public.user_profiles
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()::text
  );

CREATE POLICY "user_profiles_update" ON public.user_profiles
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()::text
  ) WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()::text
  );

CREATE POLICY "user_profiles_delete" ON public.user_profiles
  FOR DELETE USING (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()::text
  );

-- ============================================================================
-- STEP 4: Fix the helper function to handle the bootstrap case
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_practice_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT practice_id FROM public.users WHERE id = auth.uid()::text LIMIT 1),
    ''  -- Return empty string instead of NULL to avoid issues
  )
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_practice_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_practice_id() TO anon;

-- ============================================================================
-- VERIFICATION: Test that you can read your own user
-- ============================================================================
-- After running this script, login should work again.
-- Run this query while authenticated to verify:
-- 
-- SELECT id, email, practice_id FROM users WHERE id = auth.uid()::text;
-- ============================================================================
