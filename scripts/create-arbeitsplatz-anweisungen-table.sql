-- Create arbeitsplatz_anweisungen table for workstation instructions
CREATE TABLE IF NOT EXISTS arbeitsplatz_anweisungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arbeitsplatz_id UUID NOT NULL REFERENCES arbeitsplaetze(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_arbeitsplatz_anweisungen_arbeitsplatz_id ON arbeitsplatz_anweisungen(arbeitsplatz_id);
CREATE INDEX IF NOT EXISTS idx_arbeitsplatz_anweisungen_sort_order ON arbeitsplatz_anweisungen(sort_order);

-- Enable RLS
ALTER TABLE arbeitsplatz_anweisungen ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies - allow all operations for authenticated users
-- The API uses admin client which bypasses RLS anyway
CREATE POLICY "Allow all for authenticated users" ON arbeitsplatz_anweisungen
  FOR ALL
  USING (true)
  WITH CHECK (true);
