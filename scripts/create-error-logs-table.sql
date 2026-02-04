-- Error Logs Table for Super Admin Logging View
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Error Information
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Error Details
  error_name TEXT,
  error_message TEXT,
  stack_trace TEXT,
  
  -- Source Information
  source TEXT, -- 'client', 'server', 'api', 'cron'
  url TEXT,
  method TEXT,
  user_agent TEXT,
  ip_address TEXT,
  
  -- User Context
  user_id TEXT,
  practice_id INTEGER,
  
  -- Request Context
  request_id TEXT,
  
  -- Additional Context
  metadata JSONB DEFAULT '{}',
  
  -- Resolution Tracking
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'investigating', 'resolved', 'ignored')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,
  resolution_notes TEXT,
  
  -- Indexing
  fingerprint TEXT -- Hash for grouping similar errors
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_category ON error_logs(category);
CREATE INDEX IF NOT EXISTS idx_error_logs_status ON error_logs(status);
CREATE INDEX IF NOT EXISTS idx_error_logs_practice_id ON error_logs(practice_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_fingerprint ON error_logs(fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_logs_source ON error_logs(source);

-- RLS Policies
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations (super admin check done in API)
CREATE POLICY "Allow all for error logs" ON error_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);
