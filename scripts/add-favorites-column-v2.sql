-- Add favorites column to user_sidebar_preferences table
-- This column stores an array of favorite menu item IDs for each user

-- Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_sidebar_preferences' 
        AND column_name = 'favorites'
    ) THEN
        ALTER TABLE user_sidebar_preferences 
        ADD COLUMN favorites TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Set default value for existing rows
UPDATE user_sidebar_preferences 
SET favorites = '{}'
WHERE favorites IS NULL;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
