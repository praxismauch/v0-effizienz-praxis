-- Create a simple table for user favorites
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  practice_id TEXT NOT NULL DEFAULT '1',
  favorite_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure a user can only favorite the same path once per practice
  UNIQUE(user_id, practice_id, favorite_path)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_favorites_lookup 
ON user_favorites(user_id, practice_id);

-- Grant permissions
GRANT ALL ON user_favorites TO public;
