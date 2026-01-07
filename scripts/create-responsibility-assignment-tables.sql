-- Create table for responsibility-arbeitsplatz (workplace) assignments
CREATE TABLE IF NOT EXISTS responsibility_arbeitsplaetze (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  responsibility_id UUID NOT NULL REFERENCES responsibilities(id) ON DELETE CASCADE,
  arbeitsplatz_id UUID NOT NULL REFERENCES arbeitsplaetze(id) ON DELETE CASCADE,
  practice_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  UNIQUE(responsibility_id, arbeitsplatz_id)
);

-- Create table for responsibility-shift assignments
CREATE TABLE IF NOT EXISTS responsibility_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  responsibility_id UUID NOT NULL REFERENCES responsibilities(id) ON DELETE CASCADE,
  shift_type_id UUID NOT NULL REFERENCES shift_types(id) ON DELETE CASCADE,
  practice_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  UNIQUE(responsibility_id, shift_type_id)
);

-- Enable RLS
ALTER TABLE responsibility_arbeitsplaetze ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsibility_shifts ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "responsibility_arbeitsplaetze_policy" ON responsibility_arbeitsplaetze;
CREATE POLICY "responsibility_arbeitsplaetze_policy" ON responsibility_arbeitsplaetze FOR ALL USING (true);

DROP POLICY IF EXISTS "responsibility_shifts_policy" ON responsibility_shifts;
CREATE POLICY "responsibility_shifts_policy" ON responsibility_shifts FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_responsibility_arbeitsplaetze_responsibility ON responsibility_arbeitsplaetze(responsibility_id);
CREATE INDEX IF NOT EXISTS idx_responsibility_arbeitsplaetze_arbeitsplatz ON responsibility_arbeitsplaetze(arbeitsplatz_id);
CREATE INDEX IF NOT EXISTS idx_responsibility_arbeitsplaetze_practice ON responsibility_arbeitsplaetze(practice_id);

CREATE INDEX IF NOT EXISTS idx_responsibility_shifts_responsibility ON responsibility_shifts(responsibility_id);
CREATE INDEX IF NOT EXISTS idx_responsibility_shifts_shift ON responsibility_shifts(shift_type_id);
CREATE INDEX IF NOT EXISTS idx_responsibility_shifts_practice ON responsibility_shifts(practice_id);
