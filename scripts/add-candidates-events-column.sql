-- Add events column to candidates table
-- This stores interview dates and trial work day dates as a JSON array

ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS events JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN candidates.events IS 'Array of candidate events: interviews (1. Bewerbungsgespräch, 2. Bewerbungsgespräch), trial work days (1. Probearbeitstag, 2. Probearbeitstag), etc.';
