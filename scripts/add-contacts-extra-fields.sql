-- Add extra fields to contacts table for Ansprechpartner, Direktnummer, and Erreichbarkeit
-- These fields help track contact persons, direct phone numbers, and availability info

-- Add contact_person column (Ansprechpartner)
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);

-- Add direct_phone column (Direktnummer)
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS direct_phone VARCHAR(50);

-- Add availability column (Erreichbarkeit - e.g., "nur vormittags", "24/7")
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS availability VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN contacts.contact_person IS 'Name of the contact person (Ansprechpartner)';
COMMENT ON COLUMN contacts.direct_phone IS 'Direct phone number (Direktnummer)';
COMMENT ON COLUMN contacts.availability IS 'Availability info like "nur vormittags", "24/7" (Erreichbarkeit)';
