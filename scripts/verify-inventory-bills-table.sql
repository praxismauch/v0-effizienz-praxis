-- Verify inventory_bills table exists and check its structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'inventory_bills' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
