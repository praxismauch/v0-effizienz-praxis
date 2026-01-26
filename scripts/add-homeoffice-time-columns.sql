-- Add missing time columns to homeoffice_policies table
-- These columns track when homeoffice work is allowed

ALTER TABLE homeoffice_policies 
ADD COLUMN IF NOT EXISTS allowed_start_time TIME DEFAULT NULL;

ALTER TABLE homeoffice_policies 
ADD COLUMN IF NOT EXISTS allowed_end_time TIME DEFAULT NULL;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'homeoffice_policies' 
AND column_name IN ('allowed_start_time', 'allowed_end_time');
