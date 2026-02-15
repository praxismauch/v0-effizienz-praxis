-- ============================================================
-- Fix: User Creation Broken Trigger
-- Date: 2026-02-16
-- ============================================================
-- ROOT CAUSE:
-- The trigger "onauthusercreated" on auth.users called handlenewuser()
-- which tried to INSERT into public.userprofiles - a table that does NOT exist.
-- This caused EVERY auth user creation to fail with:
--   "Database error creating new user"
-- because the trigger crash rolled back the entire transaction.
--
-- ALSO:
-- The RLS INSERT policy on public.users only checked for role = 'super_admin'
-- but the actual admin user has role = 'superadmin' (no underscore).
-- ============================================================

-- Fix 1: Drop the broken trigger and its function
DROP TRIGGER IF EXISTS onauthusercreated ON auth.users;
DROP FUNCTION IF EXISTS public.handlenewuser();

-- Fix 2: Update RLS INSERT policy to accept both role formats
DROP POLICY IF EXISTS users_insert ON public.users;

CREATE POLICY users_insert ON public.users
  FOR INSERT
  WITH CHECK (
    id = (auth.uid())::text
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (auth.uid())::text
      AND (role = 'super_admin' OR role = 'superadmin')
    )
  );
