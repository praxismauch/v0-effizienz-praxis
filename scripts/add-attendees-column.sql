-- Add attendees column to practice_journals table for tracking meeting attendance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practice_journals' AND column_name = 'attendees'
  ) THEN
    ALTER TABLE practice_journals ADD COLUMN attendees jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
