-- =====================================================
-- FIX DIENSTPLAN RLS POLICIES TO AVOID RECURSION
-- =====================================================
-- The issue: shift_schedules and related tables have RLS policies 
-- that call user_has_practice_access(), which queries practicemembers,
-- causing infinite recursion if practicemembers also has RLS.

-- =====================================================
-- STEP 1: Create a SECURITY DEFINER function for Dienstplan
-- This bypasses RLS when checking practice access
-- =====================================================

CREATE OR REPLACE FUNCTION public.dienstplan_user_has_practice_access(p_practice_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is superadmin (bypass all checks)
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('superadmin', 'super_admin')
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check practicemembers table (without RLS - SECURITY DEFINER)
  RETURN EXISTS (
    SELECT 1 FROM practicemembers 
    WHERE userid = auth.uid() 
    AND practiceid = p_practice_id
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.dienstplan_user_has_practice_access(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dienstplan_user_has_practice_access(TEXT) TO anon;

-- =====================================================
-- STEP 2: Drop ALL existing RLS policies on Dienstplan tables
-- =====================================================

-- shift_types
DROP POLICY IF EXISTS "shift_types_select" ON shift_types;
DROP POLICY IF EXISTS "shift_types_insert" ON shift_types;
DROP POLICY IF EXISTS "shift_types_update" ON shift_types;
DROP POLICY IF EXISTS "shift_types_delete" ON shift_types;
DROP POLICY IF EXISTS "shift_types_all" ON shift_types;
DROP POLICY IF EXISTS "Allow all" ON shift_types;

-- shift_schedules
DROP POLICY IF EXISTS "shift_schedules_select" ON shift_schedules;
DROP POLICY IF EXISTS "shift_schedules_insert" ON shift_schedules;
DROP POLICY IF EXISTS "shift_schedules_update" ON shift_schedules;
DROP POLICY IF EXISTS "shift_schedules_delete" ON shift_schedules;
DROP POLICY IF EXISTS "shift_schedules_all" ON shift_schedules;
DROP POLICY IF EXISTS "Allow all" ON shift_schedules;

-- shift_schedules_history
DROP POLICY IF EXISTS "shift_history_select" ON shift_schedules_history;
DROP POLICY IF EXISTS "shift_history_insert" ON shift_schedules_history;
DROP POLICY IF EXISTS "shift_history_all" ON shift_schedules_history;
DROP POLICY IF EXISTS "Allow all" ON shift_schedules_history;

-- employee_availability
DROP POLICY IF EXISTS "availability_select" ON employee_availability;
DROP POLICY IF EXISTS "availability_insert" ON employee_availability;
DROP POLICY IF EXISTS "availability_update" ON employee_availability;
DROP POLICY IF EXISTS "availability_delete" ON employee_availability;
DROP POLICY IF EXISTS "availability_all" ON employee_availability;
DROP POLICY IF EXISTS "Allow all" ON employee_availability;

-- shift_swap_requests
DROP POLICY IF EXISTS "swap_requests_select" ON shift_swap_requests;
DROP POLICY IF EXISTS "swap_requests_insert" ON shift_swap_requests;
DROP POLICY IF EXISTS "swap_requests_update" ON shift_swap_requests;
DROP POLICY IF EXISTS "swap_requests_delete" ON shift_swap_requests;
DROP POLICY IF EXISTS "swap_requests_all" ON shift_swap_requests;
DROP POLICY IF EXISTS "Allow all" ON shift_swap_requests;

-- compliance_violations
DROP POLICY IF EXISTS "violations_select" ON compliance_violations;
DROP POLICY IF EXISTS "violations_insert" ON compliance_violations;
DROP POLICY IF EXISTS "violations_update" ON compliance_violations;
DROP POLICY IF EXISTS "violations_delete" ON compliance_violations;
DROP POLICY IF EXISTS "violations_all" ON compliance_violations;
DROP POLICY IF EXISTS "Allow all" ON compliance_violations;

-- =====================================================
-- STEP 3: Create NEW RLS policies using SECURITY DEFINER function
-- =====================================================

-- shift_types policies
CREATE POLICY "shift_types_select" ON shift_types FOR SELECT
USING (public.dienstplan_user_has_practice_access(practice_id));

CREATE POLICY "shift_types_insert" ON shift_types FOR INSERT
WITH CHECK (public.dienstplan_user_has_practice_access(practice_id));

CREATE POLICY "shift_types_update" ON shift_types FOR UPDATE
USING (public.dienstplan_user_has_practice_access(practice_id));

CREATE POLICY "shift_types_delete" ON shift_types FOR DELETE
USING (public.dienstplan_user_has_practice_access(practice_id));

-- shift_schedules policies
CREATE POLICY "shift_schedules_select" ON shift_schedules FOR SELECT
USING (public.dienstplan_user_has_practice_access(practice_id));

CREATE POLICY "shift_schedules_insert" ON shift_schedules FOR INSERT
WITH CHECK (public.dienstplan_user_has_practice_access(practice_id));

CREATE POLICY "shift_schedules_update" ON shift_schedules FOR UPDATE
USING (public.dienstplan_user_has_practice_access(practice_id));

CREATE POLICY "shift_schedules_delete" ON shift_schedules FOR DELETE
USING (public.dienstplan_user_has_practice_access(practice_id));

-- shift_schedules_history policies
CREATE POLICY "shift_history_select" ON shift_schedules_history FOR SELECT
USING (public.dienstplan_user_has_practice_access(practice_id));

CREATE POLICY "shift_history_insert" ON shift_schedules_history FOR INSERT
WITH CHECK (public.dienstplan_user_has_practice_access(practice_id));

-- employee_availability policies
CREATE POLICY "availability_select" ON employee_availability FOR SELECT
USING (public.dienstplan_user_has_practice_access(practice_id));

CREATE POLICY "availability_insert" ON employee_availability FOR INSERT
WITH CHECK (public.dienstplan_user_has_practice_access(practice_id));

CREATE POLICY "availability_update" ON employee_availability FOR UPDATE
USING (public.dienstplan_user_has_practice_access(practice_id));

CREATE POLICY "availability_delete" ON employee_availability FOR DELETE
USING (public.dienstplan_user_has_practice_access(practice_id));

-- shift_swap_requests policies
CREATE POLICY "swap_requests_select" ON shift_swap_requests FOR SELECT
USING (public.dienstplan_user_has_practice_access(practice_id));

CREATE POLICY "swap_requests_insert" ON shift_swap_requests FOR INSERT
WITH CHECK (public.dienstplan_user_has_practice_access(practice_id));

CREATE POLICY "swap_requests_update" ON shift_swap_requests FOR UPDATE
USING (public.dienstplan_user_has_practice_access(practice_id));

CREATE POLICY "swap_requests_delete" ON shift_swap_requests FOR DELETE
USING (public.dienstplan_user_has_practice_access(practice_id));

-- compliance_violations policies
CREATE POLICY "violations_select" ON compliance_violations FOR SELECT
USING (public.dienstplan_user_has_practice_access(practice_id));

CREATE POLICY "violations_insert" ON compliance_violations FOR INSERT
WITH CHECK (public.dienstplan_user_has_practice_access(practice_id));

CREATE POLICY "violations_update" ON compliance_violations FOR UPDATE
USING (public.dienstplan_user_has_practice_access(practice_id));

CREATE POLICY "violations_delete" ON compliance_violations FOR DELETE
USING (public.dienstplan_user_has_practice_access(practice_id));

-- =====================================================
-- STEP 4: Ensure RLS is enabled on all tables
-- =====================================================
ALTER TABLE shift_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_schedules_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_violations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this to verify the function works:
-- SELECT public.dienstplan_user_has_practice_access('your-practice-id');
