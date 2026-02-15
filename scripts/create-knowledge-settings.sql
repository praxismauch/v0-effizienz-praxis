-- Create knowledge_base_settings table
CREATE TABLE IF NOT EXISTS knowledge_base_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL,
  require_review_before_publish BOOLEAN DEFAULT false,
  auto_versioning BOOLEAN DEFAULT true,
  default_category TEXT DEFAULT 'general',
  allowed_categories JSONB DEFAULT '["general","protocol","guideline","template","faq","training"]'::jsonb,
  max_versions_to_keep INTEGER DEFAULT 10,
  require_change_summary BOOLEAN DEFAULT true,
  notify_on_publish BOOLEAN DEFAULT false,
  notify_on_update BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(practice_id)
);

-- Add created_by to versions if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'knowledge_base_versions' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE knowledge_base_versions ADD COLUMN created_by UUID;
  END IF;
END $$;
