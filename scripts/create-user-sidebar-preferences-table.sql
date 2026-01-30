-- Create user_sidebar_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_sidebar_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_id TEXT NOT NULL,
  expanded_groups TEXT[] DEFAULT '{}',
  expanded_items JSONB DEFAULT '{}',
  is_collapsed BOOLEAN DEFAULT false,
  favorites TEXT[] DEFAULT '{}',
  collapsed_sections TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, practice_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sidebar_preferences_user_id 
  ON user_sidebar_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_sidebar_preferences_practice_id 
  ON user_sidebar_preferences(practice_id);

CREATE INDEX IF NOT EXISTS idx_user_sidebar_preferences_user_practice 
  ON user_sidebar_preferences(user_id, practice_id);

-- Add RLS policies
ALTER TABLE user_sidebar_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own preferences
CREATE POLICY IF NOT EXISTS "Users can view their own sidebar preferences"
  ON user_sidebar_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own sidebar preferences"
  ON user_sidebar_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own sidebar preferences"
  ON user_sidebar_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own sidebar preferences"
  ON user_sidebar_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE user_sidebar_preferences IS 'Stores user-specific sidebar UI preferences including expanded sections, favorites, and collapse state';
COMMENT ON COLUMN user_sidebar_preferences.expanded_groups IS 'Array of expanded navigation group keys';
COMMENT ON COLUMN user_sidebar_preferences.expanded_items IS 'JSON object storing expanded state for nested items';
COMMENT ON COLUMN user_sidebar_preferences.is_collapsed IS 'Whether the sidebar is collapsed or not';
COMMENT ON COLUMN user_sidebar_preferences.favorites IS 'Array of favorited sidebar menu item hrefs';
COMMENT ON COLUMN user_sidebar_preferences.collapsed_sections IS 'Array of collapsed section identifiers';
