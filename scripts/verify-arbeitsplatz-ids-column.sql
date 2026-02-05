-- Verify that arbeitsplatz_ids column exists in responsibilities table
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'responsibilities' 
AND column_name = 'arbeitsplatz_ids';
