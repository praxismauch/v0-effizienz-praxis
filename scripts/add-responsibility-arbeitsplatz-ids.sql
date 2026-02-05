-- Add arbeitsplatz_ids column to responsibilities table
-- This allows associating responsibilities with specific workplaces

ALTER TABLE responsibilities
ADD COLUMN IF NOT EXISTS arbeitsplatz_ids UUID[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN responsibilities.arbeitsplatz_ids IS 'Array of arbeitsplatz IDs this responsibility is associated with';

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
