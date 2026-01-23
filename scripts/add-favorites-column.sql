-- Add favorites column to user_sidebar_preferences if it doesn't exist
-- This column stores an array of menu item IDs that the user has marked as favorites

DO $$ 
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_sidebar_preferences' 
        AND column_name = 'favorites'
    ) THEN
        -- Add the favorites column
        ALTER TABLE public.user_sidebar_preferences 
        ADD COLUMN favorites TEXT[] DEFAULT '{}';
        
        RAISE NOTICE 'Added favorites column to user_sidebar_preferences';
    ELSE
        RAISE NOTICE 'favorites column already exists';
    END IF;
END $$;

-- Ensure the column has the correct default
ALTER TABLE public.user_sidebar_preferences 
ALTER COLUMN favorites SET DEFAULT '{}';

-- Update any NULL values to empty array
UPDATE public.user_sidebar_preferences 
SET favorites = '{}' 
WHERE favorites IS NULL;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
