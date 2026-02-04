-- Add color column to arbeitsplaetze table
ALTER TABLE arbeitsplaetze ADD COLUMN IF NOT EXISTS color VARCHAR(50);

-- Add use_room_color column to arbeitsplaetze table
ALTER TABLE arbeitsplaetze ADD COLUMN IF NOT EXISTS use_room_color BOOLEAN DEFAULT true;
