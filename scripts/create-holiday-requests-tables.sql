-- Create holiday_requests table for vacation/time-off requests
-- Also creates holiday_blocked_periods for blocked periods and holidays for bank holidays

-- Create holiday_requests table
CREATE TABLE IF NOT EXISTS holiday_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  user_id UUID,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL DEFAULT 1,
  priority INTEGER DEFAULT 1,
  reason TEXT,
  notes TEXT,
  status TEXT DEFAULT 'wish' CHECK (status IN ('wish', 'pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for holiday_requests
CREATE INDEX IF NOT EXISTS idx_holiday_requests_practice_id ON holiday_requests(practice_id);
CREATE INDEX IF NOT EXISTS idx_holiday_requests_team_member_id ON holiday_requests(team_member_id);
CREATE INDEX IF NOT EXISTS idx_holiday_requests_user_id ON holiday_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_holiday_requests_status ON holiday_requests(status);
CREATE INDEX IF NOT EXISTS idx_holiday_requests_dates ON holiday_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_holiday_requests_deleted_at ON holiday_requests(deleted_at);

-- Enable RLS for holiday_requests
ALTER TABLE holiday_requests ENABLE ROW LEVEL SECURITY;

-- RLS policy for holiday_requests
DROP POLICY IF EXISTS "Allow all access to holiday_requests" ON holiday_requests;
CREATE POLICY "Allow all access to holiday_requests"
  ON holiday_requests FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create holiday_blocked_periods table for periods when no vacations are allowed
CREATE TABLE IF NOT EXISTS holiday_blocked_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for holiday_blocked_periods
CREATE INDEX IF NOT EXISTS idx_holiday_blocked_periods_practice_id ON holiday_blocked_periods(practice_id);
CREATE INDEX IF NOT EXISTS idx_holiday_blocked_periods_dates ON holiday_blocked_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_holiday_blocked_periods_deleted_at ON holiday_blocked_periods(deleted_at);

-- Enable RLS for holiday_blocked_periods
ALTER TABLE holiday_blocked_periods ENABLE ROW LEVEL SECURITY;

-- RLS policy for holiday_blocked_periods
DROP POLICY IF EXISTS "Allow all access to holiday_blocked_periods" ON holiday_blocked_periods;
CREATE POLICY "Allow all access to holiday_blocked_periods"
  ON holiday_blocked_periods FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create holidays table for bank holidays / public holidays
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for holidays
CREATE INDEX IF NOT EXISTS idx_holidays_practice_id ON holidays(practice_id);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_holidays_deleted_at ON holidays(deleted_at);

-- Enable RLS for holidays
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- RLS policy for holidays
DROP POLICY IF EXISTS "Allow all access to holidays" ON holidays;
CREATE POLICY "Allow all access to holidays"
  ON holidays FOR ALL
  USING (true)
  WITH CHECK (true);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
