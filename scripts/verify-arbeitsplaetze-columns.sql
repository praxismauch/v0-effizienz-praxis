-- Check if arbeitsplaetze table has all expected columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'arbeitsplaetze'
ORDER BY ordinal_position;
