-- Create missing holiday-related tables and add missing columns
-- Based on API requirements from the codebase

-- Create holiday_blocked_periods table
CREATE TABLE IF NOT EXISTS holiday_blocked_periods (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  practice_id TEXT NOT NULL,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  max_absent_percentage INTEGER DEFAULT 0,
  is_recurring BOOLEAN DEFAULT false,
  created_by TEXT,
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

-- Create holidays table (bank/public holidays)
CREATE TABLE IF NOT EXISTS holidays (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  practice_id TEXT NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  created_by TEXT,
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
