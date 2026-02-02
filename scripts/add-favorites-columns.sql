-- Add sort_order column to user_favorites table
ALTER TABLE user_favorites 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add favorites column to user_sidebar_preferences table
ALTER TABLE user_sidebar_preferences 
ADD COLUMN IF NOT EXISTS favorites JSONB DEFAULT '[]'::jsonb;

-- Add single_group_mode column if not exists
ALTER TABLE user_sidebar_preferences 
ADD COLUMN IF NOT EXISTS single_group_mode BOOLEAN DEFAULT true;

-- Create index for sort_order
CREATE INDEX IF NOT EXISTS idx_user_favorites_sort_order ON user_favorites(user_id, sort_order);
