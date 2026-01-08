-- =====================================================
-- RLS FIX: Login Circular Dependency
-- =====================================================
-- Problem: The users table RLS policy calls get_user_practice_id()
-- which queries the users table, creating infinite recursion.
-- 
-- Solution: Users need a special policy that allows reading
-- their OWN record by auth.uid() without practice check.
-- =====================================================

-- Step 1: Drop the problematic users policies
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
DROP POLICY IF EXISTS "users_delete" ON public.users;

-- Step 2: Recreate the helper function with SECURITY DEFINER
-- This allows the function to bypass RLS when querying users table
CREATE OR REPLACE FUNCTION get_user_practice_id()
RETURNS TEXT AS $$
DECLARE
  practice TEXT;
BEGIN
  SELECT practice_id INTO practice
  FROM public.users
  WHERE id = auth.uid()::text;
  
  RETURN practice;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_practice_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_practice_id() TO anon;

-- Step 3: Create NEW users policies
-- Users can read their OWN record (needed for login/auth)
CREATE POLICY "users_select_own"
ON public.users FOR SELECT
TO authenticated
USING (id = auth.uid()::text);

-- Users can read OTHER users in their practice (for team views)
CREATE POLICY "users_select_practice"
ON public.users FOR SELECT
TO authenticated
USING (practice_id = get_user_practice_id());

-- Users can only insert if they match auth.uid() 
CREATE POLICY "users_insert"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid()::text);

-- Users can update their own record
CREATE POLICY "users_update_own"
ON public.users FOR UPDATE
TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text);

-- Practice admins can update users in their practice
CREATE POLICY "users_update_practice"
ON public.users FOR UPDATE
TO authenticated
USING (
  practice_id = get_user_practice_id()
  AND EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid()::text 
    AND u.role IN ('superadmin', 'super_admin', 'practiceadmin', 'practice_admin', 'admin')
  )
);

-- Only admins can delete users in their practice
CREATE POLICY "users_delete"
ON public.users FOR DELETE
TO authenticated
USING (
  practice_id = get_user_practice_id()
  AND id != auth.uid()::text  -- Can't delete yourself
  AND EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid()::text 
    AND u.role IN ('superadmin', 'super_admin', 'practiceadmin', 'practice_admin', 'admin')
  )
);

-- =====================================================
-- VERIFICATION: Test the fix
-- =====================================================
-- Run this after applying the fix to verify it works:
-- 
-- SELECT 
--   policyname, 
--   tablename,
--   cmd
-- FROM pg_policies 
-- WHERE tablename = 'users' 
-- ORDER BY policyname;
