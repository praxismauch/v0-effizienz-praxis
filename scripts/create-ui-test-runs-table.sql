-- Create ui_test_runs table for storing UI test results
CREATE TABLE IF NOT EXISTS ui_test_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '{}',
  summary JSONB NOT NULL DEFAULT '{}',
  ui_items_version TEXT,
  ui_items_snapshot JSONB,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ui_test_runs_created_at ON ui_test_runs(created_at DESC);

-- Enable RLS
ALTER TABLE ui_test_runs ENABLE ROW LEVEL SECURITY;

-- Allow super admins to read and write
CREATE POLICY "Super admins can manage ui_test_runs" ON ui_test_runs
  FOR ALL
  USING (true)
  WITH CHECK (true);
