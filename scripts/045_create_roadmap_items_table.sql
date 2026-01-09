-- =============================================
-- Create roadmap_items table for storing AI-generated and manual roadmap items
-- =============================================

CREATE TABLE IF NOT EXISTS roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'on_hold', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  effort VARCHAR(20) CHECK (effort IN ('low', 'medium', 'high')),
  impact VARCHAR(20) CHECK (impact IN ('low', 'medium', 'high')),
  category VARCHAR(100),
  tags JSONB DEFAULT '[]'::jsonb,
  target_date DATE,
  target_quarter VARCHAR(20),
  assigned_to UUID,
  created_by UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  display_order INTEGER DEFAULT 0,
  votes INTEGER DEFAULT 0,
  
  -- AI-specific fields
  is_ai_generated BOOLEAN DEFAULT false,
  ai_reasoning TEXT,
  ai_suggested_quarter VARCHAR(20),
  
  -- Tracking
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_roadmap_items_status ON roadmap_items(status);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_priority ON roadmap_items(priority);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_category ON roadmap_items(category);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_display_order ON roadmap_items(display_order);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_deleted_at ON roadmap_items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_is_ai_generated ON roadmap_items(is_ai_generated);

-- Enable RLS
ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (super admin feature)
CREATE POLICY "roadmap_items_policy" ON roadmap_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================
-- Create roadmap_idea_feedback table for AI improvement (if not exists)
-- =============================================

CREATE TABLE IF NOT EXISTS roadmap_idea_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_title VARCHAR(255) NOT NULL,
  idea_description TEXT,
  idea_category VARCHAR(100),
  idea_priority VARCHAR(20),
  idea_effort VARCHAR(20),
  idea_impact VARCHAR(20),
  ai_reasoning TEXT,
  feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('good', 'bad', 'implemented')),
  feedback_reason TEXT,
  user_id TEXT,
  practice_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for analytics
CREATE INDEX IF NOT EXISTS idx_roadmap_idea_feedback_type ON roadmap_idea_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_roadmap_idea_feedback_category ON roadmap_idea_feedback(idea_category);

-- Enable RLS
ALTER TABLE roadmap_idea_feedback ENABLE ROW LEVEL SECURITY;

-- Allow all operations
CREATE POLICY "roadmap_idea_feedback_policy" ON roadmap_idea_feedback
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comments
COMMENT ON TABLE roadmap_items IS 'Stores roadmap items including AI-generated suggestions';
COMMENT ON TABLE roadmap_idea_feedback IS 'Stores user feedback on AI-generated roadmap ideas for improving future suggestions';
