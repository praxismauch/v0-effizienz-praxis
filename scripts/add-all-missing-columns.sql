-- Add all missing columns identified from error logs

-- 1. Add sort_order to user_favorites
ALTER TABLE user_favorites ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. Add is_open to time_blocks  
ALTER TABLE time_blocks ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;

-- 3. Add comment to time_stamps
ALTER TABLE time_stamps ADD COLUMN IF NOT EXISTS comment TEXT;

-- 4. Add description to practices
ALTER TABLE practices ADD COLUMN IF NOT EXISTS description TEXT;

-- 5. Add avatar_url to team_members (for consistency)
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
