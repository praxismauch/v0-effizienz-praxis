-- Add warranty_until column to arbeitsmittel table
ALTER TABLE arbeitsmittel
ADD COLUMN IF NOT EXISTS warranty_until DATE;

-- Add comment for documentation
COMMENT ON COLUMN arbeitsmittel.warranty_until IS 'Date when warranty expires';
