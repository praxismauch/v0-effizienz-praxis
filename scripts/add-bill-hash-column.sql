-- Add file_hash column to inventory_bills table for duplicate detection
ALTER TABLE inventory_bills 
ADD COLUMN IF NOT EXISTS file_hash TEXT;

-- Create index for faster duplicate lookups
CREATE INDEX IF NOT EXISTS idx_inventory_bills_file_hash 
ON inventory_bills(practice_id, file_hash) 
WHERE file_hash IS NOT NULL AND deleted_at IS NULL;

-- Create index for file name + size lookup
CREATE INDEX IF NOT EXISTS idx_inventory_bills_file_meta 
ON inventory_bills(practice_id, file_name, file_size) 
WHERE deleted_at IS NULL;
