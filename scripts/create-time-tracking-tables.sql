-- Create time tracking tables for Zeiterfassung (Time Tracking) system
-- This script creates the necessary tables for clock-in/clock-out functionality

-- Drop existing tables to recreate with correct types
DROP TABLE IF EXISTS plausibility_checks CASCADE;
DROP TABLE IF EXISTS time_corrections CASCADE;
DROP TABLE IF EXISTS time_block_breaks CASCADE;
DROP TABLE IF EXISTS time_blocks CASCADE;
DROP TABLE IF EXISTS time_stamps CASCADE;

-- 1. Time Stamps Table (for clock in/out events)
CREATE TABLE time_stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  stamp_type TEXT NOT NULL CHECK (stamp_type IN ('start', 'stop', 'pause_start', 'pause_end')),
  work_location TEXT NOT NULL CHECK (work_location IN ('office', 'homeoffice', 'external', 'mobile')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Time Blocks Table (for work sessions)
CREATE TABLE time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  start_stamp_id UUID REFERENCES time_stamps(id),
  end_stamp_id UUID REFERENCES time_stamps(id),
  work_location TEXT NOT NULL,
  is_open BOOLEAN DEFAULT true,
  break_minutes INTEGER DEFAULT 0,
  gross_minutes INTEGER DEFAULT 0,
  net_minutes INTEGER DEFAULT 0,
  actual_hours NUMERIC(5, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Time Block Breaks Table (for break periods within work blocks)
CREATE TABLE time_block_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID NOT NULL REFERENCES time_blocks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  break_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Time Corrections Table (for correction requests)
CREATE TABLE time_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  block_id UUID REFERENCES time_blocks(id) ON DELETE CASCADE,
  requested_start TIMESTAMPTZ NOT NULL,
  requested_end TIMESTAMPTZ NOT NULL,
  original_start TIMESTAMPTZ,
  original_end TIMESTAMPTZ,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Plausibility Checks Table (for validation issues)
CREATE TABLE plausibility_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  block_id UUID REFERENCES time_blocks(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error')),
  description TEXT NOT NULL,
  resolution_status TEXT DEFAULT 'open' CHECK (resolution_status IN ('open', 'resolved', 'ignored')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_time_stamps_user_practice ON time_stamps(user_id, practice_id);
CREATE INDEX IF NOT EXISTS idx_time_stamps_practice_timestamp ON time_stamps(practice_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_time_stamps_type ON time_stamps(stamp_type);

CREATE INDEX IF NOT EXISTS idx_time_blocks_user_practice ON time_blocks(user_id, practice_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_practice_date ON time_blocks(practice_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date ON time_blocks(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_time_blocks_is_open ON time_blocks(is_open) WHERE is_open = true;
CREATE INDEX IF NOT EXISTS idx_time_blocks_practice_open ON time_blocks(practice_id, is_open) WHERE is_open = true;

CREATE INDEX IF NOT EXISTS idx_time_block_breaks_block ON time_block_breaks(block_id);
CREATE INDEX IF NOT EXISTS idx_time_block_breaks_user_practice ON time_block_breaks(user_id, practice_id);

CREATE INDEX IF NOT EXISTS idx_time_corrections_user_practice ON time_corrections(user_id, practice_id);
CREATE INDEX IF NOT EXISTS idx_time_corrections_status ON time_corrections(status);
CREATE INDEX IF NOT EXISTS idx_time_corrections_block ON time_corrections(block_id);

CREATE INDEX IF NOT EXISTS idx_plausibility_checks_user_practice ON plausibility_checks(user_id, practice_id);
CREATE INDEX IF NOT EXISTS idx_plausibility_checks_status ON plausibility_checks(resolution_status);
CREATE INDEX IF NOT EXISTS idx_plausibility_checks_block ON plausibility_checks(block_id);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_time_stamps_updated_at BEFORE UPDATE ON time_stamps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_blocks_updated_at BEFORE UPDATE ON time_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_block_breaks_updated_at BEFORE UPDATE ON time_block_breaks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_time_corrections_updated_at ON time_corrections;
CREATE TRIGGER update_time_corrections_updated_at BEFORE UPDATE ON time_corrections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE time_stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_block_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE plausibility_checks ENABLE ROW LEVEL SECURITY;

-- Allow all access for now (API handles authorization)
CREATE POLICY "Allow all time_stamps access" ON time_stamps FOR ALL USING (true);
CREATE POLICY "Allow all time_blocks access" ON time_blocks FOR ALL USING (true);
CREATE POLICY "Allow all time_block_breaks access" ON time_block_breaks FOR ALL USING (true);
CREATE POLICY "Allow all time_corrections access" ON time_corrections FOR ALL USING (true);
CREATE POLICY "Allow all plausibility_checks access" ON plausibility_checks FOR ALL USING (true);
