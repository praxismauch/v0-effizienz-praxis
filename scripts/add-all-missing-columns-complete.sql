-- Add ALL missing columns identified from error logs
-- This script fixes PGRST204 and 42703 errors

-- 1. user_favorites.sort_order - for ordering favorites
ALTER TABLE user_favorites ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. team_members.avatar_url - for profile pictures
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. time_blocks.is_open - for tracking active time blocks
ALTER TABLE time_blocks ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;

-- 4. time_stamps.comment - for timestamp comments (THIS CAUSES THE CLOCK IN FAILURE)
ALTER TABLE time_stamps ADD COLUMN IF NOT EXISTS comment TEXT;

-- 5. practices.description - for practice descriptions
ALTER TABLE practices ADD COLUMN IF NOT EXISTS description TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_sort_order ON user_favorites(sort_order);
CREATE INDEX IF NOT EXISTS idx_time_blocks_is_open ON time_blocks(is_open);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
