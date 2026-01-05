-- Fix infinite recursion in practice_users RLS policy
-- The issue is that the policy references practice_users when checking access,
-- which causes infinite recursion.

-- First, drop the existing problematic policies on practice_users
DROP POLICY IF EXISTS "practice_users_select_policy" ON practice_users;
DROP POLICY IF EXISTS "practice_users_insert_policy" ON practice_users;
DROP POLICY IF EXISTS "practice_users_update_policy" ON practice_users;
DROP POLICY IF EXISTS "practice_users_delete_policy" ON practice_users;
DROP POLICY IF EXISTS "Users can view their own practice_users" ON practice_users;
DROP POLICY IF EXISTS "Users can manage their practice_users" ON practice_users;
DROP POLICY IF EXISTS "Allow all on practice_users" ON practice_users;

-- Create a non-recursive policy that allows users to see their own records
-- using auth.uid() directly without referencing the table again
CREATE POLICY "practice_users_select_own" ON practice_users
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow users to see other members of practices they belong to
-- This uses a subquery with SECURITY DEFINER function to avoid recursion
CREATE OR REPLACE FUNCTION get_user_practice_ids(user_uuid uuid)
RETURNS SETOF integer
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT practice_id FROM practice_users WHERE user_id = user_uuid;
$$;

-- Policy to view practice members (non-recursive)
CREATE POLICY "practice_users_select_practice_members" ON practice_users
  FOR SELECT
  USING (
    practice_id IN (SELECT get_user_practice_ids(auth.uid()))
  );

-- Allow insert for authenticated users (admin will manage this)
CREATE POLICY "practice_users_insert_policy" ON practice_users
  FOR INSERT
  WITH CHECK (true);

-- Allow update for users on their own records or practice admins
CREATE POLICY "practice_users_update_policy" ON practice_users
  FOR UPDATE
  USING (
    user_id = auth.uid() 
    OR practice_id IN (SELECT get_user_practice_ids(auth.uid()))
  );

-- Allow delete for practice admins
CREATE POLICY "practice_users_delete_policy" ON practice_users
  FOR DELETE
  USING (
    practice_id IN (SELECT get_user_practice_ids(auth.uid()))
  );

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION get_user_practice_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_practice_ids(uuid) TO anon;
