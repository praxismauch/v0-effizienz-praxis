-- Create schedule_templates table for storing reusable weekly plan templates
CREATE TABLE IF NOT EXISTS schedule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  shifts JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for practice_id lookups
CREATE INDEX IF NOT EXISTS idx_schedule_templates_practice_id ON schedule_templates(practice_id);

-- Enable RLS
ALTER TABLE schedule_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all for schedule_templates" ON schedule_templates;

-- Create permissive policy (API handles authorization)
CREATE POLICY "Allow all for schedule_templates" ON schedule_templates
  FOR ALL USING (true) WITH CHECK (true);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
