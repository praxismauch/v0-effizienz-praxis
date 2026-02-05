-- Add color customization columns to arbeitsplaetze table
-- Allows workplaces to have custom colors or inherit from rooms

-- Add color column (hex color code)
ALTER TABLE arbeitsplaetze
ADD COLUMN IF NOT EXISTS color VARCHAR(7);

-- Add use_room_color column (boolean flag)
ALTER TABLE arbeitsplaetze
ADD COLUMN IF NOT EXISTS use_room_color BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN arbeitsplaetze.color IS 'Custom hex color code for workplace (e.g., #FF5733). Null if using room color.';
COMMENT ON COLUMN arbeitsplaetze.use_room_color IS 'If true, workplace inherits color from assigned room. If false, uses custom color.';
