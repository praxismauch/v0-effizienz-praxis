-- Add favorites column to user_sidebar_preferences table
-- Uses standard PostgreSQL ALTER TABLE syntax

ALTER TABLE user_sidebar_preferences 
ADD COLUMN IF NOT EXISTS favorites TEXT[] DEFAULT '{}';

-- Set default value for existing rows that might have NULL
UPDATE user_sidebar_preferences 
SET favorites = '{}'
WHERE favorites IS NULL;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
