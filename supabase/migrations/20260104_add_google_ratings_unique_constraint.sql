-- Add unique constraint on google_ratings for upsert operations
-- This fixes: "there is no unique or exclusion constraint matching the ON CONFLICT specification"

-- First check if the constraint already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'google_ratings_practice_id_google_review_id_key'
    ) THEN
        -- Add unique constraint on practice_id and google_review_id
        ALTER TABLE google_ratings 
        ADD CONSTRAINT google_ratings_practice_id_google_review_id_key 
        UNIQUE (practice_id, google_review_id);
        
        RAISE NOTICE 'Unique constraint added successfully';
    ELSE
        RAISE NOTICE 'Constraint already exists, skipping';
    END IF;
END $$;

-- Create index to support the unique constraint if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_google_ratings_practice_review 
ON google_ratings(practice_id, google_review_id);
