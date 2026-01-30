-- Add favorites column to user_sidebar_preferences table

ALTER TABLE user_sidebar_preferences
ADD COLUMN IF NOT EXISTS favorites TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add index for faster favorites queries
CREATE INDEX IF NOT EXISTS idx_user_sidebar_preferences_favorites 
ON user_sidebar_preferences USING GIN (favorites);

COMMENT ON COLUMN user_sidebar_preferences.favorites IS 'Array of favorite navigation item keys';
