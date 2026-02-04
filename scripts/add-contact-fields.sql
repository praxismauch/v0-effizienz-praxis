-- Add new contact fields for Ansprechpartner, Direktnummer, and Erreichbarkeit
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS direct_phone TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS availability TEXT;
