-- Fix infinite recursion in practicemembers RLS policies
-- The issue: practicemembers policies call user_has_practice_access() which queries practicemembers (infinite loop)
-- Solution: Use simple direct checks on practicemembers, make user_has_practice_access() SECURITY DEFINER

BEGIN;

-- Step 1: Drop ALL policies on practicemembers to stop the recursion
DROP POLICY IF EXISTS "practicemembers_select" ON practicemembers;
DROP POLICY IF EXISTS "practicemembers_insert" ON practicemembers;
DROP POLICY IF EXISTS "practicemembers_update" ON practicemembers;
DROP POLICY IF EXISTS "practicemembers_delete" ON practicemembers;
DROP POLICY IF EXISTS "Allow all" ON practicemembers;
DROP POLICY IF EXISTS "Enable read access for all users" ON practicemembers;

-- Step 2: Create SIMPLE policies on practicemembers that DO NOT call any functions
-- Users can only see their own practice memberships
CREATE POLICY "practicemembers_read_own"
ON practicemembers
FOR SELECT
USING (userid = auth.uid());

-- Only super admins can insert/update/delete practice memberships
-- Check role directly from users table without calling functions
CREATE POLICY "practicemembers_insert_admin"
ON practicemembers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

CREATE POLICY "practicemembers_update_admin"
ON practicemembers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

CREATE POLICY "practicemembers_delete_admin"
ON practicemembers
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Step 3: Recreate user_has_practice_access() as SECURITY DEFINER
-- This bypasses RLS when checking practicemembers, breaking the recursion
CREATE OR REPLACE FUNCTION user_has_practice_access(practice_id_param integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Super admins have access to everything
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user is a member of this practice
  -- SECURITY DEFINER means this bypasses RLS on practicemembers
  RETURN EXISTS (
    SELECT 1 
    FROM practicemembers 
    WHERE userid = auth.uid() 
    AND practiceid = practice_id_param::text
  );
END;
$$;

-- Overload for TEXT practice_id
CREATE OR REPLACE FUNCTION user_has_practice_access(practice_id_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  ) THEN
    RETURN true;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 
    FROM practicemembers 
    WHERE userid = auth.uid() 
    AND practiceid = practice_id_param
  );
END;
$$;

-- Overload for UUID practice_id
CREATE OR REPLACE FUNCTION user_has_practice_access(practice_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  ) THEN
    RETURN true;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 
    FROM practicemembers 
    WHERE userid = auth.uid() 
    AND practiceid = practice_id_param::text
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION user_has_practice_access(integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION user_has_practice_access(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION user_has_practice_access(uuid) TO authenticated, anon;

COMMIT;

-- Verify the fix
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'practicemembers'
ORDER BY policyname;
