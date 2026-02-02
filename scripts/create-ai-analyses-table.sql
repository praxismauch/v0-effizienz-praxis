-- Create ai_analyses table for storing AI analysis history
CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  practice_id UUID,
  analysis_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  full_analysis JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_analyses_user_id ON ai_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_practice_id ON ai_analyses(practice_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON ai_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created_at ON ai_analyses(created_at DESC);

-- Enable RLS
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own analyses" ON ai_analyses;
DROP POLICY IF EXISTS "Users can insert own analyses" ON ai_analyses;
DROP POLICY IF EXISTS "Users can delete own analyses" ON ai_analyses;
DROP POLICY IF EXISTS "Allow all for ai_analyses" ON ai_analyses;

-- Create permissive policy (API handles authorization)
CREATE POLICY "Allow all for ai_analyses" ON ai_analyses
  FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_ai_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_analyses_updated_at ON ai_analyses;
CREATE TRIGGER ai_analyses_updated_at
  BEFORE UPDATE ON ai_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_analyses_updated_at();

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
