-- Create knowledge_base_versions table to store version history
-- This allows automatic versioning when QM Handbuch items are updated

CREATE TABLE IF NOT EXISTS knowledge_base_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES knowledge_base(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  tags JSONB DEFAULT '[]',
  status VARCHAR(50),
  attachments JSONB DEFAULT '[]',
  related_articles JSONB DEFAULT '[]',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  change_summary TEXT,
  change_type VARCHAR(50) DEFAULT 'update', -- 'create', 'update', 'publish', 'unpublish'
  
  -- Practice
  practice_id INTEGER
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_kb_versions_article_id ON knowledge_base_versions(article_id);
CREATE INDEX IF NOT EXISTS idx_kb_versions_version ON knowledge_base_versions(article_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_kb_versions_practice_id ON knowledge_base_versions(practice_id);
CREATE INDEX IF NOT EXISTS idx_kb_versions_created_at ON knowledge_base_versions(created_at DESC);

-- Enable RLS
ALTER TABLE knowledge_base_versions ENABLE ROW LEVEL SECURITY;

-- Create policy for access
DROP POLICY IF EXISTS "Allow all on knowledge_base_versions" ON knowledge_base_versions;
CREATE POLICY "Allow all on knowledge_base_versions" ON knowledge_base_versions FOR ALL USING (true) WITH CHECK (true);

-- Add comment
COMMENT ON TABLE knowledge_base_versions IS 'Stores version history for QM Handbuch articles';
