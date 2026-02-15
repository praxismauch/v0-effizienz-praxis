-- Fix users table RLS INSERT policy to allow admin user creation
-- This fixes the "Database error creating new user" issue

-- Drop the existing overly restrictive policy
DROP POLICY IF EXISTS users_insert ON public.users;

-- Create new policy that allows:
-- 1. Self-registration (user creating their own record)
-- 2. Super admin creation (super admins can create other users)
-- Note: Service role automatically bypasses RLS, so no special handling needed
CREATE POLICY users_insert ON public.users
  FOR INSERT
  WITH CHECK (
    -- Allow self-registration: user's ID matches the authenticated user
    id = auth.uid()::text
    OR
    -- Allow if the requester is an active super admin
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()::text
      AND u.role IN ('super_admin', 'system_admin')
      AND u.is_active = true
    )
  );

-- Add helpful comment
COMMENT ON POLICY users_insert ON public.users IS 
  'Allows self-registration and super admin user creation. Service role bypasses this policy automatically.';
