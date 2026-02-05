-- Add additional_payments column to contracts table
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS additional_payments JSONB DEFAULT '[]'::jsonb;

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'contracts' 
AND column_name = 'additional_payments';
