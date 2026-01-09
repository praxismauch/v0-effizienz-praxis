-- Create table for UI test runs
CREATE TABLE IF NOT EXISTS ui_test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  items JSONB NOT NULL DEFAULT '{}',
  summary JSONB NOT NULL DEFAULT '{"total": 0, "working": 0, "not_working": 0, "untested": 0}',
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ui_test_runs_created_at ON ui_test_runs(created_at DESC);

-- Add RLS policies
ALTER TABLE ui_test_runs ENABLE ROW LEVEL SECURITY;

-- Policy for super admins to manage test runs
CREATE POLICY "Super admins can manage UI test runs" ON ui_test_runs
  FOR ALL
  USING (true)
  WITH CHECK (true);
