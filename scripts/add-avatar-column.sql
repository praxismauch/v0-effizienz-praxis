-- Add avatar column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'avatar'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar TEXT;
    RAISE NOTICE 'Added avatar column to users table';
  ELSE
    RAISE NOTICE 'Avatar column already exists in users table';
  END IF;
END $$;
