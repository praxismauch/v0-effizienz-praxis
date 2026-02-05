-- Add arbeitsplatz_ids column to responsibilities table
-- This column stores an array of UUIDs referencing the arbeitsplaetze table

ALTER TABLE responsibilities 
ADD COLUMN IF NOT EXISTS arbeitsplatz_ids UUID[] DEFAULT '{}';

-- Add a comment to document the column
COMMENT ON COLUMN responsibilities.arbeitsplatz_ids IS 'Array of arbeitsplatz IDs associated with this responsibility';
