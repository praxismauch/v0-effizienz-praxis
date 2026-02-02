-- Comprehensive fix for time tracking tables
-- This script ensures all required columns exist and creates tables if missing

-- First, ensure time_stamps table exists with correct schema
CREATE TABLE IF NOT EXISTS time_stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  practice_id INTEGER NOT NULL,
  stamp_type TEXT NOT NULL,
  work_location TEXT DEFAULT 'office',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add comment column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'time_stamps' AND column_name = 'comment') THEN
    ALTER TABLE time_stamps ADD COLUMN comment TEXT DEFAULT '';
  END IF;
END $$;

-- Ensure time_blocks table exists
CREATE TABLE IF NOT EXISTS time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  practice_id INTEGER NOT NULL,
  date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  start_stamp_id UUID,
  end_stamp_id UUID,
  work_location TEXT DEFAULT 'office',
  break_minutes INTEGER DEFAULT 0,
  gross_minutes INTEGER DEFAULT 0,
  net_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add is_open column if it doesn't exist  
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'time_blocks' AND column_name = 'is_open') THEN
    ALTER TABLE time_blocks ADD COLUMN is_open BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Ensure user_favorites has sort_order
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_favorites' AND column_name = 'sort_order') THEN
    ALTER TABLE user_favorites ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- Ensure team_members has avatar_url
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'team_members' AND column_name = 'avatar_url') THEN
    ALTER TABLE team_members ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Ensure practices has description
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'practices' AND column_name = 'description') THEN
    ALTER TABLE practices ADD COLUMN description TEXT;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_stamps_user_id ON time_stamps(user_id);
CREATE INDEX IF NOT EXISTS idx_time_stamps_practice_id ON time_stamps(practice_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date ON time_blocks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_time_blocks_practice_id ON time_blocks(practice_id);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
