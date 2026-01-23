-- Initialize favorites column for existing users
-- Set NULL values to empty array

UPDATE user_sidebar_preferences 
SET favorites = '{}'::text[] 
WHERE favorites IS NULL;
