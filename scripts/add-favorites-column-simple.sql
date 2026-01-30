-- Simple script to add favorites column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_sidebar_preferences' 
    AND column_name = 'favorites'
  ) THEN
    ALTER TABLE user_sidebar_preferences ADD COLUMN favorites TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Added favorites column to user_sidebar_preferences';
  ELSE
    RAISE NOTICE 'favorites column already exists';
  END IF;
END
$$;

-- Update any NULL values to empty array
UPDATE user_sidebar_preferences SET favorites = '{}' WHERE favorites IS NULL;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
