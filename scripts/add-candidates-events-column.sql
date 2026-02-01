-- Add events column to candidates table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'candidates' AND column_name = 'events'
  ) THEN
    ALTER TABLE candidates ADD COLUMN events JSONB DEFAULT '[]'::jsonb;
    COMMENT ON COLUMN candidates.events IS 'Array of candidate events: interviews, trial work days, etc.';
  END IF;
END $$;

-- Create an index on the events column for better query performance
CREATE INDEX IF NOT EXISTS idx_candidates_events ON candidates USING GIN (events) WHERE deleted_at IS NULL;
