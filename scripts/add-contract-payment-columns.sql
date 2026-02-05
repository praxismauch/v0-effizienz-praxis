-- Add vacation_bonus and additional_payments columns to contracts table
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS vacation_bonus DECIMAL(10,2) DEFAULT NULL;

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS additional_payments JSONB DEFAULT '[]'::jsonb;

-- Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contracts' 
AND column_name IN ('vacation_bonus', 'additional_payments');
