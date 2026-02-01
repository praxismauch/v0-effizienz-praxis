-- Fix user_favorites table - add sort_order column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_favorites' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE user_favorites ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create index for sort_order if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_favorites_sort_order ON user_favorites(user_id, sort_order);

-- Fix user_sidebar_preferences table - add favorites column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sidebar_preferences' AND column_name = 'favorites'
  ) THEN
    ALTER TABLE user_sidebar_preferences ADD COLUMN favorites JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add collapsed_sections column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sidebar_preferences' AND column_name = 'collapsed_sections'
  ) THEN
    ALTER TABLE user_sidebar_preferences ADD COLUMN collapsed_sections JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add single_group_mode column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sidebar_preferences' AND column_name = 'single_group_mode'
  ) THEN
    ALTER TABLE user_sidebar_preferences ADD COLUMN single_group_mode BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Notify schema cache to refresh (helps with Supabase PostgREST cache)
NOTIFY pgrst, 'reload schema';
