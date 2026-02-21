CREATE TABLE IF NOT EXISTS roi_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  practice_id TEXT,
  analysis_type TEXT NOT NULL DEFAULT 'practice',
  title TEXT NOT NULL,
  summary TEXT,
  full_analysis JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roi_analyses_user_id ON roi_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_roi_analyses_practice_id ON roi_analyses(practice_id);
CREATE INDEX IF NOT EXISTS idx_roi_analyses_created_at ON roi_analyses(created_at DESC);
