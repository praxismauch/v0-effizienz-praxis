-- Create user_sidebar_preferences table (fixed version)
DO $$
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_sidebar_preferences') THEN
    CREATE TABLE user_sidebar_preferences (
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
  END IF;

  -- Add favorites column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_sidebar_preferences' 
    AND column_name = 'favorites'
  ) THEN
    ALTER TABLE user_sidebar_preferences ADD COLUMN favorites TEXT[] DEFAULT '{}';
  END IF;

  -- Update NULL favorites to empty array
  UPDATE user_sidebar_preferences SET favorites = '{}' WHERE favorites IS NULL;
END
$$;

-- Add indexes for performance (IF NOT EXISTS is supported here)
CREATE INDEX IF NOT EXISTS idx_user_sidebar_preferences_user_id 
  ON user_sidebar_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_sidebar_preferences_practice_id 
  ON user_sidebar_preferences(practice_id);

CREATE INDEX IF NOT EXISTS idx_user_sidebar_preferences_user_practice 
  ON user_sidebar_preferences(user_id, practice_id);

-- Enable RLS
ALTER TABLE user_sidebar_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own sidebar preferences" ON user_sidebar_preferences;
DROP POLICY IF EXISTS "Users can insert their own sidebar preferences" ON user_sidebar_preferences;
DROP POLICY IF EXISTS "Users can update their own sidebar preferences" ON user_sidebar_preferences;
DROP POLICY IF EXISTS "Users can delete their own sidebar preferences" ON user_sidebar_preferences;

-- Create RLS policies
CREATE POLICY "Users can view their own sidebar preferences"
  ON user_sidebar_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sidebar preferences"
  ON user_sidebar_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sidebar preferences"
  ON user_sidebar_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sidebar preferences"
  ON user_sidebar_preferences
  FOR DELETE
  USING (auth.uid() = user_id);
