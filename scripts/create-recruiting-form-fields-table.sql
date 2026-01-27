-- Create recruiting_form_fields table if it doesn't exist
CREATE TABLE IF NOT EXISTS recruiting_form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  field_key VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL,
  label VARCHAR(255) NOT NULL,
  required BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  options JSONB DEFAULT '[]',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recruiting_form_fields_practice_id ON recruiting_form_fields(practice_id);
CREATE INDEX IF NOT EXISTS idx_recruiting_form_fields_display_order ON recruiting_form_fields(practice_id, display_order);

-- Enable RLS
ALTER TABLE recruiting_form_fields ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and create new ones
DROP POLICY IF EXISTS "Allow all on recruiting_form_fields" ON recruiting_form_fields;
CREATE POLICY "Allow all on recruiting_form_fields" ON recruiting_form_fields FOR ALL USING (true) WITH CHECK (true);
