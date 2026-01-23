-- Add bundesland column to practices table
ALTER TABLE practices 
ADD COLUMN IF NOT EXISTS bundesland VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN practices.bundesland IS 'German federal state (Bundesland) of the practice';
