-- Add favorites column to user_sidebar_preferences table
-- This stores the user's favorited menu items (array of href paths)

ALTER TABLE user_sidebar_preferences 
ADD COLUMN IF NOT EXISTS favorites TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN user_sidebar_preferences.favorites IS 'Array of favorited sidebar menu item hrefs';
