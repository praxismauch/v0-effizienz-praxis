-- Fix favorites column and force schema reload

-- First, ensure the column exists with correct type
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
        -- Add column if it doesn't exist
        ALTER TABLE public.user_sidebar_preferences 
        ADD COLUMN favorites text[] DEFAULT '{}';
        
        RAISE NOTICE 'Added favorites column';
    ELSE
        RAISE NOTICE 'Favorites column already exists';
    END IF;
END $$;

-- Force PostgREST to reload schema by sending notification
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Verify the column exists
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_sidebar_preferences'
  AND column_name = 'favorites';
