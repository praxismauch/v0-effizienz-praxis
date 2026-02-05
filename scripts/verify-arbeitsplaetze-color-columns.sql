-- Verify color columns exist in arbeitsplaetze table
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'arbeitsplaetze' 
  AND column_name IN ('color', 'use_room_color')
ORDER BY column_name;
