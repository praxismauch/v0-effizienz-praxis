-- Add sort_order column to user_favorites table for reordering
ALTER TABLE user_favorites 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update existing rows to have sequential sort_order based on created_at
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, practice_id ORDER BY created_at) as rn
  FROM user_favorites
)
UPDATE user_favorites 
SET sort_order = numbered.rn 
FROM numbered 
WHERE user_favorites.id = numbered.id;

-- Create index for faster ordering
CREATE INDEX IF NOT EXISTS idx_user_favorites_sort 
ON user_favorites(user_id, practice_id, sort_order);
