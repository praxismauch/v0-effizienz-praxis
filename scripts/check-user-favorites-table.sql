-- Check if user_favorites table exists and its structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_favorites'
ORDER BY ordinal_position;
