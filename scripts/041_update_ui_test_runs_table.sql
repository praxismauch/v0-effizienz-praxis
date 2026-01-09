-- Add columns to store UI items version and snapshot with each test run
-- This ensures each test has a record of what items existed at the time of testing

ALTER TABLE ui_test_runs 
ADD COLUMN IF NOT EXISTS ui_items_version TEXT,
ADD COLUMN IF NOT EXISTS ui_items_snapshot JSONB;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_ui_test_runs_version ON ui_test_runs(ui_items_version);
