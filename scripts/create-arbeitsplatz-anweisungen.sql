-- Create arbeitsplatz_anweisungen table for storing instructions/guides for each workplace
CREATE TABLE IF NOT EXISTS arbeitsplatz_anweisungen (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  arbeitsplatz_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups by arbeitsplatz
CREATE INDEX IF NOT EXISTS idx_arbeitsplatz_anweisungen_arbeitsplatz_id ON arbeitsplatz_anweisungen(arbeitsplatz_id);
