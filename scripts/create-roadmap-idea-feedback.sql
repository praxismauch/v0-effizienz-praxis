-- Create table for storing feedback on AI-generated roadmap ideas
CREATE TABLE IF NOT EXISTS roadmap_idea_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_title TEXT NOT NULL,
  idea_description TEXT,
  idea_category TEXT,
  idea_priority TEXT,
  idea_effort TEXT,
  idea_impact TEXT,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('good', 'bad', 'implemented')),
  feedback_reason TEXT,
  user_id TEXT,
  practice_id INTEGER,
  ai_reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_roadmap_idea_feedback_feedback_type ON roadmap_idea_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_roadmap_idea_feedback_category ON roadmap_idea_feedback(idea_category);
CREATE INDEX IF NOT EXISTS idx_roadmap_idea_feedback_created_at ON roadmap_idea_feedback(created_at);

-- Enable RLS
ALTER TABLE roadmap_idea_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Allow all operations on roadmap_idea_feedback" ON roadmap_idea_feedback
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE roadmap_idea_feedback IS 'Stores user feedback on AI-generated roadmap ideas to improve future suggestions';
