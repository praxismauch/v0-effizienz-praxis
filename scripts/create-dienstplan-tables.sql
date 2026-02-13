-- Shift Types Table
CREATE TABLE IF NOT EXISTS shift_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 30,
  color TEXT DEFAULT '#3b82f6',
  description TEXT,
  min_staff INTEGER DEFAULT 1,
  max_staff INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shift Schedules Table
CREATE TABLE IF NOT EXISTS shift_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  team_member_id TEXT NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  shift_type_id UUID NOT NULL REFERENCES shift_types(id) ON DELETE RESTRICT,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Availability Table
CREATE TABLE IF NOT EXISTS team_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  team_member_id TEXT NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available BOOLEAN DEFAULT true,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_member_id, date)
);

-- Shift Swap Requests Table
CREATE TABLE IF NOT EXISTS shift_swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  requester_schedule_id UUID NOT NULL REFERENCES shift_schedules(id) ON DELETE CASCADE,
  target_schedule_id UUID REFERENCES shift_schedules(id) ON DELETE SET NULL,
  requester_id TEXT NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  target_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reason TEXT,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shift_types_practice ON shift_types(practice_id);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_practice ON shift_schedules(practice_id);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_date ON shift_schedules(shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_member ON shift_schedules(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_availability_practice ON team_availability(practice_id);
CREATE INDEX IF NOT EXISTS idx_team_availability_member ON team_availability(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_availability_date ON team_availability(date);
CREATE INDEX IF NOT EXISTS idx_shift_swap_requests_practice ON shift_swap_requests(practice_id);
CREATE INDEX IF NOT EXISTS idx_shift_swap_requests_status ON shift_swap_requests(status);

-- Enable Row Level Security
ALTER TABLE shift_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shift_types
CREATE POLICY "Users can view shift types for their practice"
  ON shift_types FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage shift types"
  ON shift_types FOR ALL
  USING (true);

-- RLS Policies for shift_schedules
CREATE POLICY "Users can view schedules for their practice"
  ON shift_schedules FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage schedules"
  ON shift_schedules FOR ALL
  USING (true);

-- RLS Policies for team_availability
CREATE POLICY "Users can view availability for their practice"
  ON team_availability FOR SELECT
  USING (true);

CREATE POLICY "Team members can manage their own availability"
  ON team_availability FOR ALL
  USING (true);

-- RLS Policies for shift_swap_requests
CREATE POLICY "Users can view swap requests for their practice"
  ON shift_swap_requests FOR SELECT
  USING (true);

CREATE POLICY "Team members can create swap requests"
  ON shift_swap_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage swap requests"
  ON shift_swap_requests FOR ALL
  USING (true);
