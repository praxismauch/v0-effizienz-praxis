-- Add color and images columns to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS images TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN rooms.color IS 'Color identifier for room card display (e.g., green, blue, purple)';
COMMENT ON COLUMN rooms.images IS 'Array of image URLs for the room';
