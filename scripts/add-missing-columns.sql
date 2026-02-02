-- Add missing columns to various tables

-- Add sort_order to user_favorites
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_favorites' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE user_favorites ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add avatar_url to team_members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_members' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE team_members ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Add is_open to time_blocks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_blocks' AND column_name = 'is_open'
  ) THEN
    ALTER TABLE time_blocks ADD COLUMN is_open BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add comment to time_stamps
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_stamps' AND column_name = 'comment'
  ) THEN
    ALTER TABLE time_stamps ADD COLUMN comment TEXT;
  END IF;
END $$;

-- Add description to practices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'practices' AND column_name = 'description'
  ) THEN
    ALTER TABLE practices ADD COLUMN description TEXT;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_sort_order ON user_favorites(sort_order);
CREATE INDEX IF NOT EXISTS idx_time_blocks_is_open ON time_blocks(is_open);
