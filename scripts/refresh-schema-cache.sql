-- Refresh the schema cache to recognize new columns
-- This is needed when columns are added but PostgREST hasn't picked them up yet

NOTIFY pgrst, 'reload schema';

-- Also ensure the favorites column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sidebar_preferences' 
    AND column_name = 'favorites'
  ) THEN
    ALTER TABLE user_sidebar_preferences ADD COLUMN favorites TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;
END $$;

-- Verify the column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_sidebar_preferences'
AND column_name = 'favorites';
