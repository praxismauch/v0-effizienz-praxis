-- Add image_url column to arbeitsmittel table
ALTER TABLE arbeitsmittel 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN arbeitsmittel.image_url IS 'URL to the uploaded image of the work equipment';
