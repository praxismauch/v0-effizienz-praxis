-- Add sort_order to user_favorites
ALTER TABLE user_favorites ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add avatar_url to team_members
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add is_open to time_blocks
ALTER TABLE time_blocks ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;

-- Add comment to time_stamps
ALTER TABLE time_stamps ADD COLUMN IF NOT EXISTS comment TEXT;

-- Add description to practices
ALTER TABLE practices ADD COLUMN IF NOT EXISTS description TEXT;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
