-- Add events column to candidates table for tracking interviews and trial work days
-- Events are stored as JSONB array with structure:
-- [{ id, type, date, time, notes, completed, created_at }]

ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS events JSONB DEFAULT '[]'::jsonb;

-- Add index for querying events
CREATE INDEX IF NOT EXISTS idx_candidates_events 
ON candidates USING GIN (events) 
WHERE deleted_at IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN candidates.events IS 'Array of candidate events: interviews, trial work days, etc. Each event has: id (uuid), type (interview_1, interview_2, trial_day_1, trial_day_2), date, time, notes, completed (boolean), created_at';
