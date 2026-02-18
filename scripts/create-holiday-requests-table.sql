-- Holiday Requests table
CREATE TABLE IF NOT EXISTS holiday_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'wish' CHECK (status IN ('wish', 'requested', 'approved', 'rejected', 'cancelled')),
  priority INTEGER NOT NULL DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  reason TEXT,
  notes TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  ai_suggested BOOLEAN DEFAULT FALSE,
  ai_score NUMERIC(3,2),
  ai_reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for holiday_requests
CREATE INDEX IF NOT EXISTS idx_holiday_requests_practice_id ON holiday_requests(practice_id);
CREATE INDEX IF NOT EXISTS idx_holiday_requests_team_member_id ON holiday_requests(team_member_id);
CREATE INDEX IF NOT EXISTS idx_holiday_requests_status ON holiday_requests(status);
CREATE INDEX IF NOT EXISTS idx_holiday_requests_dates ON holiday_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_holiday_requests_year ON holiday_requests(practice_id, EXTRACT(YEAR FROM start_date));

-- Holiday Blocked Periods table
CREATE TABLE IF NOT EXISTS holiday_blocked_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  max_absent_percentage INTEGER DEFAULT 0,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_holiday_blocked_periods_practice ON holiday_blocked_periods(practice_id);

-- Enable RLS
ALTER TABLE holiday_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_blocked_periods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for holiday_requests
CREATE POLICY "Users can view holiday requests in their practice"
  ON holiday_requests FOR SELECT
  USING (
    practice_id IN (
      SELECT tm.practice_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE u.id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Users can insert holiday requests in their practice"
  ON holiday_requests FOR INSERT
  WITH CHECK (
    practice_id IN (
      SELECT tm.practice_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE u.id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Admins can update holiday requests"
  ON holiday_requests FOR UPDATE
  USING (
    practice_id IN (
      SELECT tm.practice_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE u.id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Admins can delete holiday requests"
  ON holiday_requests FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('super_admin', 'admin', 'practice_admin'))
    OR
    user_id = auth.uid()
  );

-- RLS Policies for holiday_blocked_periods
CREATE POLICY "Users can view blocked periods in their practice"
  ON holiday_blocked_periods FOR SELECT
  USING (
    practice_id IN (
      SELECT tm.practice_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE u.id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Admins can manage blocked periods"
  ON holiday_blocked_periods FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('super_admin', 'admin', 'practice_admin'))
  );
