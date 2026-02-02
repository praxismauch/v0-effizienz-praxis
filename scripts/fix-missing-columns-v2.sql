-- Comprehensive migration to add all missing columns
-- Using simple ALTER TABLE statements with IF NOT EXISTS

-- 1. Add sort_order to user_favorites (for ordering favorites)
ALTER TABLE user_favorites ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. Add avatar_url to team_members (for profile pictures)  
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Add is_open to time_blocks (for tracking active time blocks)
ALTER TABLE time_blocks ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;

-- 4. Add comment to time_stamps (for timestamp comments)
ALTER TABLE time_stamps ADD COLUMN IF NOT EXISTS comment TEXT;

-- 5. Add description to practices (for practice descriptions)
ALTER TABLE practices ADD COLUMN IF NOT EXISTS description TEXT;

-- 6. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_sort ON user_favorites(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_time_blocks_open ON time_blocks(is_open) WHERE is_open = true;

-- 7. Notify PostgREST to reload schema cache immediately
NOTIFY pgrst, 'reload schema';
