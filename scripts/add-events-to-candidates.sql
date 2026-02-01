-- Add events column to candidates table for storing interview and trial work day dates
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS events JSONB DEFAULT '[]'::jsonb;

-- Add index for events column
CREATE INDEX IF NOT EXISTS idx_candidates_events ON candidates USING GIN (events);

-- Add comment
COMMENT ON COLUMN candidates.events IS 'Array of candidate events: interviews (1. Bewerbungsgespräch, 2. Bewerbungsgespräch), trial days (1. Probearbeitstag, 2. Probearbeitstag), etc.';
