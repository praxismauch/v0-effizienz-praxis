-- =====================================================
-- DIENSTPLAN (SHIFT SCHEDULING) DATABASE TABLES
-- =====================================================
-- Creates all required tables for the shift scheduling system
-- Run this script to enable the Dienstplan page functionality

-- =====================================================
-- 1. SHIFT TYPES TABLE
-- Defines different types of shifts (morning, evening, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS shift_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT,
  description TEXT,
  start_time TIME NOT NULL DEFAULT '08:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  break_minutes INTEGER DEFAULT 30,
  color TEXT DEFAULT '#3b82f6',
  min_staff INTEGER DEFAULT 1,
  max_staff INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. SHIFT SCHEDULES TABLE
-- Actual shift assignments for team members
-- =====================================================
CREATE TABLE IF NOT EXISTS shift_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  team_member_id UUID NOT NULL,
  shift_type_id UUID REFERENCES shift_types(id) ON DELETE SET NULL,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'approved', 'cancelled', 'completed', 'no_show')),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. SHIFT SCHEDULES HISTORY TABLE
-- Audit trail for shift changes
-- =====================================================
CREATE TABLE IF NOT EXISTS shift_schedules_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_schedule_id UUID NOT NULL,
  practice_id TEXT NOT NULL,
  team_member_id UUID NOT NULL,
  shift_type_id UUID,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER,
  status TEXT,
  notes TEXT,
  changed_by UUID,
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'deleted')),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. EMPLOYEE AVAILABILITY TABLE
-- Tracks when employees are available/unavailable
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  team_member_id UUID NOT NULL,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  specific_date DATE,
  availability_type TEXT NOT NULL DEFAULT 'available' CHECK (availability_type IN ('available', 'unavailable', 'preferred', 'vacation', 'sick')),
  start_time TIME,
  end_time TIME,
  notes TEXT,
  is_recurring BOOLEAN DEFAULT true,
  valid_from DATE,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. SHIFT SWAP REQUESTS TABLE
-- Requests for employees to swap shifts
-- =====================================================
CREATE TABLE IF NOT EXISTS shift_swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  requester_id UUID NOT NULL,
  target_id UUID NOT NULL,
  requester_shift_id UUID NOT NULL REFERENCES shift_schedules(id) ON DELETE CASCADE,
  target_shift_id UUID REFERENCES shift_schedules(id) ON DELETE SET NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ai_recommendation TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. COMPLIANCE VIOLATIONS TABLE
-- Tracks labor law violations and warnings
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  team_member_id UUID NOT NULL,
  shift_id UUID REFERENCES shift_schedules(id) ON DELETE SET NULL,
  violation_type TEXT NOT NULL,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error')),
  description TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- shift_types indexes
CREATE INDEX IF NOT EXISTS idx_shift_types_practice_id ON shift_types(practice_id);
CREATE INDEX IF NOT EXISTS idx_shift_types_is_active ON shift_types(practice_id, is_active);

-- shift_schedules indexes
CREATE INDEX IF NOT EXISTS idx_shift_schedules_practice_id ON shift_schedules(practice_id);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_team_member ON shift_schedules(team_member_id);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_date ON shift_schedules(shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_practice_date ON shift_schedules(practice_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_member_date ON shift_schedules(team_member_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_status ON shift_schedules(practice_id, status);

-- shift_schedules_history indexes
CREATE INDEX IF NOT EXISTS idx_shift_history_schedule ON shift_schedules_history(shift_schedule_id);
CREATE INDEX IF NOT EXISTS idx_shift_history_practice ON shift_schedules_history(practice_id);

-- employee_availability indexes
CREATE INDEX IF NOT EXISTS idx_availability_practice_id ON employee_availability(practice_id);
CREATE INDEX IF NOT EXISTS idx_availability_team_member ON employee_availability(team_member_id);
CREATE INDEX IF NOT EXISTS idx_availability_day ON employee_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_availability_date ON employee_availability(specific_date);

-- shift_swap_requests indexes
CREATE INDEX IF NOT EXISTS idx_swap_requests_practice ON shift_swap_requests(practice_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_status ON shift_swap_requests(practice_id, status);
CREATE INDEX IF NOT EXISTS idx_swap_requests_requester ON shift_swap_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_target ON shift_swap_requests(target_id);

-- compliance_violations indexes
CREATE INDEX IF NOT EXISTS idx_violations_practice ON compliance_violations(practice_id);
CREATE INDEX IF NOT EXISTS idx_violations_member ON compliance_violations(team_member_id);
CREATE INDEX IF NOT EXISTS idx_violations_resolved ON compliance_violations(practice_id, resolved);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE shift_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_schedules_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_violations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shift_types
DROP POLICY IF EXISTS "shift_types_select" ON shift_types;
CREATE POLICY "shift_types_select" ON shift_types FOR SELECT
USING (public.user_has_practice_access(practice_id));

DROP POLICY IF EXISTS "shift_types_insert" ON shift_types;
CREATE POLICY "shift_types_insert" ON shift_types FOR INSERT
WITH CHECK (public.user_has_practice_access(practice_id));

DROP POLICY IF EXISTS "shift_types_update" ON shift_types;
CREATE POLICY "shift_types_update" ON shift_types FOR UPDATE
USING (public.user_has_practice_access(practice_id));

DROP POLICY IF EXISTS "shift_types_delete" ON shift_types;
CREATE POLICY "shift_types_delete" ON shift_types FOR DELETE
USING (public.user_has_practice_access(practice_id));

-- RLS Policies for shift_schedules
DROP POLICY IF EXISTS "shift_schedules_select" ON shift_schedules;
CREATE POLICY "shift_schedules_select" ON shift_schedules FOR SELECT
USING (public.user_has_practice_access(practice_id));

DROP POLICY IF EXISTS "shift_schedules_insert" ON shift_schedules;
CREATE POLICY "shift_schedules_insert" ON shift_schedules FOR INSERT
WITH CHECK (public.user_has_practice_access(practice_id));

DROP POLICY IF EXISTS "shift_schedules_update" ON shift_schedules;
CREATE POLICY "shift_schedules_update" ON shift_schedules FOR UPDATE
USING (public.user_has_practice_access(practice_id));

DROP POLICY IF EXISTS "shift_schedules_delete" ON shift_schedules;
CREATE POLICY "shift_schedules_delete" ON shift_schedules FOR DELETE
USING (public.user_has_practice_access(practice_id));

-- RLS Policies for shift_schedules_history
DROP POLICY IF EXISTS "shift_history_select" ON shift_schedules_history;
CREATE POLICY "shift_history_select" ON shift_schedules_history FOR SELECT
USING (public.user_has_practice_access(practice_id));

DROP POLICY IF EXISTS "shift_history_insert" ON shift_schedules_history;
CREATE POLICY "shift_history_insert" ON shift_schedules_history FOR INSERT
WITH CHECK (public.user_has_practice_access(practice_id));

-- RLS Policies for employee_availability
DROP POLICY IF EXISTS "availability_select" ON employee_availability;
CREATE POLICY "availability_select" ON employee_availability FOR SELECT
USING (public.user_has_practice_access(practice_id));

DROP POLICY IF EXISTS "availability_insert" ON employee_availability;
CREATE POLICY "availability_insert" ON employee_availability FOR INSERT
WITH CHECK (public.user_has_practice_access(practice_id));

DROP POLICY IF EXISTS "availability_update" ON employee_availability;
CREATE POLICY "availability_update" ON employee_availability FOR UPDATE
USING (public.user_has_practice_access(practice_id));

DROP POLICY IF EXISTS "availability_delete" ON employee_availability;
CREATE POLICY "availability_delete" ON employee_availability FOR DELETE
USING (public.user_has_practice_access(practice_id));

-- RLS Policies for shift_swap_requests
DROP POLICY IF EXISTS "swap_requests_select" ON shift_swap_requests;
CREATE POLICY "swap_requests_select" ON shift_swap_requests FOR SELECT
USING (public.user_has_practice_access(practice_id));

DROP POLICY IF EXISTS "swap_requests_insert" ON shift_swap_requests;
CREATE POLICY "swap_requests_insert" ON shift_swap_requests FOR INSERT
WITH CHECK (public.user_has_practice_access(practice_id));

DROP POLICY IF EXISTS "swap_requests_update" ON shift_swap_requests;
CREATE POLICY "swap_requests_update" ON shift_swap_requests FOR UPDATE
USING (public.user_has_practice_access(practice_id));

DROP POLICY IF EXISTS "swap_requests_delete" ON shift_swap_requests;
CREATE POLICY "swap_requests_delete" ON shift_swap_requests FOR DELETE
USING (public.user_has_practice_access(practice_id));

-- RLS Policies for compliance_violations
DROP POLICY IF EXISTS "violations_select" ON compliance_violations;
CREATE POLICY "violations_select" ON compliance_violations FOR SELECT
USING (public.user_has_practice_access(practice_id));

DROP POLICY IF EXISTS "violations_insert" ON compliance_violations;
CREATE POLICY "violations_insert" ON compliance_violations FOR INSERT
WITH CHECK (public.user_has_practice_access(practice_id));

DROP POLICY IF EXISTS "violations_update" ON compliance_violations;
CREATE POLICY "violations_update" ON compliance_violations FOR UPDATE
USING (public.user_has_practice_access(practice_id));

DROP POLICY IF EXISTS "violations_delete" ON compliance_violations;
CREATE POLICY "violations_delete" ON compliance_violations FOR DELETE
USING (public.user_has_practice_access(practice_id));

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_dienstplan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
DROP TRIGGER IF EXISTS shift_types_updated_at ON shift_types;
CREATE TRIGGER shift_types_updated_at
  BEFORE UPDATE ON shift_types
  FOR EACH ROW EXECUTE FUNCTION update_dienstplan_updated_at();

DROP TRIGGER IF EXISTS shift_schedules_updated_at ON shift_schedules;
CREATE TRIGGER shift_schedules_updated_at
  BEFORE UPDATE ON shift_schedules
  FOR EACH ROW EXECUTE FUNCTION update_dienstplan_updated_at();

DROP TRIGGER IF EXISTS employee_availability_updated_at ON employee_availability;
CREATE TRIGGER employee_availability_updated_at
  BEFORE UPDATE ON employee_availability
  FOR EACH ROW EXECUTE FUNCTION update_dienstplan_updated_at();

DROP TRIGGER IF EXISTS shift_swap_requests_updated_at ON shift_swap_requests;
CREATE TRIGGER shift_swap_requests_updated_at
  BEFORE UPDATE ON shift_swap_requests
  FOR EACH ROW EXECUTE FUNCTION update_dienstplan_updated_at();

-- =====================================================
-- HISTORY TRIGGER FOR SHIFT SCHEDULES
-- =====================================================
CREATE OR REPLACE FUNCTION log_shift_schedule_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO shift_schedules_history (
      shift_schedule_id, practice_id, team_member_id, shift_type_id,
      shift_date, start_time, end_time, break_minutes, status, notes,
      changed_by, change_type
    ) VALUES (
      NEW.id, NEW.practice_id, NEW.team_member_id, NEW.shift_type_id,
      NEW.shift_date, NEW.start_time, NEW.end_time, NEW.break_minutes,
      NEW.status, NEW.notes, NEW.created_by, 'created'
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO shift_schedules_history (
      shift_schedule_id, practice_id, team_member_id, shift_type_id,
      shift_date, start_time, end_time, break_minutes, status, notes,
      changed_by, change_type
    ) VALUES (
      NEW.id, NEW.practice_id, NEW.team_member_id, NEW.shift_type_id,
      NEW.shift_date, NEW.start_time, NEW.end_time, NEW.break_minutes,
      NEW.status, NEW.notes, NEW.created_by, 'updated'
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO shift_schedules_history (
      shift_schedule_id, practice_id, team_member_id, shift_type_id,
      shift_date, start_time, end_time, break_minutes, status, notes,
      changed_by, change_type
    ) VALUES (
      OLD.id, OLD.practice_id, OLD.team_member_id, OLD.shift_type_id,
      OLD.shift_date, OLD.start_time, OLD.end_time, OLD.break_minutes,
      OLD.status, OLD.notes, OLD.created_by, 'deleted'
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS shift_schedules_history_trigger ON shift_schedules;
CREATE TRIGGER shift_schedules_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON shift_schedules
  FOR EACH ROW EXECUTE FUNCTION log_shift_schedule_changes();

-- =====================================================
-- DEFAULT SHIFT TYPES (Optional - remove if not needed)
-- =====================================================
-- Uncomment the following to create default shift types for new practices:
/*
INSERT INTO shift_types (practice_id, name, short_name, start_time, end_time, break_minutes, color, min_staff)
SELECT p.id::text, 'Frühschicht', 'FS', '06:00', '14:00', 30, '#22c55e', 2
FROM practices p
WHERE NOT EXISTS (SELECT 1 FROM shift_types st WHERE st.practice_id = p.id::text AND st.name = 'Frühschicht');

INSERT INTO shift_types (practice_id, name, short_name, start_time, end_time, break_minutes, color, min_staff)
SELECT p.id::text, 'Spätschicht', 'SS', '14:00', '22:00', 30, '#3b82f6', 2
FROM practices p
WHERE NOT EXISTS (SELECT 1 FROM shift_types st WHERE st.practice_id = p.id::text AND st.name = 'Spätschicht');

INSERT INTO shift_types (practice_id, name, short_name, start_time, end_time, break_minutes, color, min_staff)
SELECT p.id::text, 'Tagschicht', 'TS', '08:00', '17:00', 60, '#f59e0b', 3
FROM practices p
WHERE NOT EXISTS (SELECT 1 FROM shift_types st WHERE st.practice_id = p.id::text AND st.name = 'Tagschicht');
*/

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify tables were created:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('shift_types', 'shift_schedules', 'shift_schedules_history', 
--                    'employee_availability', 'shift_swap_requests', 'compliance_violations');
