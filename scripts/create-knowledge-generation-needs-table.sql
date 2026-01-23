-- Create table to store "needed" knowledge items for AI generation
-- This table stores topics/items that admins define as needed for the knowledge base
-- AI can then use these items to generate content

CREATE TABLE IF NOT EXISTS knowledge_generation_needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL,
  
  -- Basic info
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  
  -- Priority and status
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'generated', 'reviewed', 'published', 'rejected')),
  
  -- AI generation guidance
  target_audience VARCHAR(100), -- e.g., 'MFA', 'Arzt', 'Alle Mitarbeiter'
  content_type VARCHAR(50), -- e.g., 'procedure', 'guideline', 'faq', 'training', 'compliance'
  keywords JSONB DEFAULT '[]', -- keywords to include in generation
  tone VARCHAR(50) DEFAULT 'professional', -- e.g., 'professional', 'friendly', 'formal'
  min_word_count INTEGER DEFAULT 200,
  max_word_count INTEGER DEFAULT 2000,
  include_examples BOOLEAN DEFAULT true,
  include_checklist BOOLEAN DEFAULT false,
  include_references BOOLEAN DEFAULT false,
  
  -- Additional context for AI
  context_notes TEXT, -- Additional context the admin wants to provide
  related_documents JSONB DEFAULT '[]', -- References to existing documents
  external_references JSONB DEFAULT '[]', -- External URLs or sources
  
  -- Generation tracking
  generated_article_id UUID REFERENCES knowledge_base(id),
  generated_at TIMESTAMP WITH TIME ZONE,
  generation_attempts INTEGER DEFAULT 0,
  last_generation_error TEXT,
  
  -- Metadata
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_to UUID, -- Team member assigned to review
  due_date DATE,
  
  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_knowledge_generation_needs_practice ON knowledge_generation_needs(practice_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_generation_needs_status ON knowledge_generation_needs(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_generation_needs_priority ON knowledge_generation_needs(priority);
CREATE INDEX IF NOT EXISTS idx_knowledge_generation_needs_category ON knowledge_generation_needs(category);

-- Enable RLS
ALTER TABLE knowledge_generation_needs ENABLE ROW LEVEL SECURITY;

-- Create policy for access
DROP POLICY IF EXISTS "Allow all on knowledge_generation_needs" ON knowledge_generation_needs;
CREATE POLICY "Allow all on knowledge_generation_needs" ON knowledge_generation_needs FOR ALL USING (true) WITH CHECK (true);

-- Add comment
COMMENT ON TABLE knowledge_generation_needs IS 'Stores topics/items that admins define as needed for AI-generated knowledge base content';
