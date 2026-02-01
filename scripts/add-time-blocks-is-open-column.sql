-- Add missing is_open column to time_blocks table
ALTER TABLE time_blocks ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;

-- Add index for faster queries on open blocks
CREATE INDEX IF NOT EXISTS idx_time_blocks_is_open ON time_blocks(is_open) WHERE is_open = true;
