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

-- Create RLS policies
CREATE POLICY "Users can view anweisungen for their practice arbeitsplaetze" ON arbeitsplatz_anweisungen
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM arbeitsplaetze a
      JOIN users u ON u.practice_id = a.practice_id
      WHERE a.id = arbeitsplatz_anweisungen.arbeitsplatz_id
      AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert anweisungen for their practice arbeitsplaetze" ON arbeitsplatz_anweisungen
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM arbeitsplaetze a
      JOIN users u ON u.practice_id = a.practice_id
      WHERE a.id = arbeitsplatz_anweisungen.arbeitsplatz_id
      AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can update anweisungen for their practice arbeitsplaetze" ON arbeitsplatz_anweisungen
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM arbeitsplaetze a
      JOIN users u ON u.practice_id = a.practice_id
      WHERE a.id = arbeitsplatz_anweisungen.arbeitsplatz_id
      AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete anweisungen for their practice arbeitsplaetze" ON arbeitsplatz_anweisungen
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM arbeitsplaetze a
      JOIN users u ON u.practice_id = a.practice_id
      WHERE a.id = arbeitsplatz_anweisungen.arbeitsplatz_id
      AND u.id = auth.uid()
    )
  );
