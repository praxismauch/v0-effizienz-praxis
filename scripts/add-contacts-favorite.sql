-- Add is_favorite column to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_contacts_is_favorite ON contacts(practice_id, is_favorite) WHERE is_favorite = true;
