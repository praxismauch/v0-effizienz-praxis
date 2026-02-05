-- Add unique constraint on (user_id, favorite_path) for upsert operations
-- First, remove any duplicates keeping only the most recent one
DELETE FROM user_favorites a USING user_favorites b
WHERE a.user_id = b.user_id 
  AND a.favorite_path = b.favorite_path 
  AND a.created_at < b.created_at;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_favorites_user_id_favorite_path_key'
  ) THEN
    ALTER TABLE user_favorites 
    ADD CONSTRAINT user_favorites_user_id_favorite_path_key 
    UNIQUE (user_id, favorite_path);
  END IF;
END $$;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
