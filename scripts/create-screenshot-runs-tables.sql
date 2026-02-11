-- Screenshot Runs: stores each execution session
CREATE TABLE IF NOT EXISTS screenshot_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  total_pages INTEGER NOT NULL DEFAULT 0,
  completed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  viewports TEXT[] NOT NULL DEFAULT '{"desktop"}',
  base_url TEXT NOT NULL DEFAULT '',
  triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Screenshot Results: stores each individual screenshot within a run
CREATE TABLE IF NOT EXISTS screenshot_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES screenshot_runs(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  page_name TEXT NOT NULL,
  viewport TEXT NOT NULL CHECK (viewport IN ('desktop', 'tablet', 'mobile')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'capturing', 'completed', 'failed')),
  image_url TEXT,
  error_message TEXT,
  captured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup of results by run
CREATE INDEX IF NOT EXISTS idx_screenshot_results_run_id ON screenshot_results(run_id);

-- Index for ordering runs by date
CREATE INDEX IF NOT EXISTS idx_screenshot_runs_started_at ON screenshot_runs(started_at DESC);
