-- Migration: Create practice_locations table for multi-location support
-- Each practice can have multiple locations, but only ONE can be the main location

-- Create the practice_locations table
CREATE TABLE IF NOT EXISTS practice_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  street VARCHAR(255),
  city VARCHAR(255),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Deutschland',
  phone VARCHAR(50),
  email VARCHAR(255),
  fax VARCHAR(50),
  website VARCHAR(255),
  is_main BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  opening_hours JSONB DEFAULT '{}',
  notes TEXT,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  
  -- Ensure practice_id references practices table
  CONSTRAINT fk_practice
    FOREIGN KEY (practice_id) 
    REFERENCES practices(id) 
    ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_practice_locations_practice_id ON practice_locations(practice_id);
CREATE INDEX IF NOT EXISTS idx_practice_locations_is_main ON practice_locations(is_main);
CREATE INDEX IF NOT EXISTS idx_practice_locations_is_active ON practice_locations(is_active);

-- Function to ensure only one main location per practice
CREATE OR REPLACE FUNCTION ensure_single_main_location()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this location as main, unset all others for this practice
  IF NEW.is_main = true THEN
    UPDATE practice_locations 
    SET is_main = false, updated_at = NOW()
    WHERE practice_id = NEW.practice_id 
    AND id != NEW.id
    AND is_main = true;
  END IF;
  
  -- If this is the first location for the practice, make it main
  IF NEW.is_main IS NULL OR NEW.is_main = false THEN
    IF NOT EXISTS (
      SELECT 1 FROM practice_locations 
      WHERE practice_id = NEW.practice_id 
      AND is_main = true
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      NEW.is_main = true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS trigger_ensure_single_main_location_insert ON practice_locations;
CREATE TRIGGER trigger_ensure_single_main_location_insert
  BEFORE INSERT ON practice_locations
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_main_location();

-- Create trigger for UPDATE
DROP TRIGGER IF EXISTS trigger_ensure_single_main_location_update ON practice_locations;
CREATE TRIGGER trigger_ensure_single_main_location_update
  BEFORE UPDATE ON practice_locations
  FOR EACH ROW
  WHEN (OLD.is_main IS DISTINCT FROM NEW.is_main)
  EXECUTE FUNCTION ensure_single_main_location();

-- Function to prevent deletion of last main location
CREATE OR REPLACE FUNCTION prevent_delete_last_main_location()
RETURNS TRIGGER AS $$
BEGIN
  -- If deleting a main location, check if there are other locations
  IF OLD.is_main = true THEN
    -- Check if there are other active locations
    IF EXISTS (
      SELECT 1 FROM practice_locations 
      WHERE practice_id = OLD.practice_id 
      AND id != OLD.id
      AND is_active = true
    ) THEN
      -- Set another location as main
      UPDATE practice_locations 
      SET is_main = true, updated_at = NOW()
      WHERE practice_id = OLD.practice_id 
      AND id != OLD.id
      AND is_active = true
      ORDER BY created_at ASC
      LIMIT 1;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for DELETE
DROP TRIGGER IF EXISTS trigger_prevent_delete_last_main ON practice_locations;
CREATE TRIGGER trigger_prevent_delete_last_main
  BEFORE DELETE ON practice_locations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_delete_last_main_location();

-- Enable RLS
ALTER TABLE practice_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "practice_locations_select" ON practice_locations;
CREATE POLICY "practice_locations_select" ON practice_locations
  FOR SELECT
  USING (
    public.user_has_practice_access(practice_id)
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('superadmin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "practice_locations_insert" ON practice_locations;
CREATE POLICY "practice_locations_insert" ON practice_locations
  FOR INSERT
  WITH CHECK (
    public.user_has_practice_access(practice_id)
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('superadmin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "practice_locations_update" ON practice_locations;
CREATE POLICY "practice_locations_update" ON practice_locations
  FOR UPDATE
  USING (
    public.user_has_practice_access(practice_id)
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('superadmin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "practice_locations_delete" ON practice_locations;
CREATE POLICY "practice_locations_delete" ON practice_locations
  FOR DELETE
  USING (
    public.user_has_practice_access(practice_id)
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('superadmin', 'super_admin')
    )
  );

-- Migrate existing practice addresses to locations table
INSERT INTO practice_locations (practice_id, name, street, city, zip_code, phone, email, website, is_main, is_active, created_at)
SELECT 
  p.id as practice_id,
  COALESCE(p.name, 'Hauptstandort') || ' - Hauptstandort' as name,
  SPLIT_PART(p.address, ', ', 1) as street,
  SPLIT_PART(p.address, ', ', 2) as city,
  SPLIT_PART(p.address, ', ', 3) as zip_code,
  p.phone,
  p.email,
  p.website,
  true as is_main,
  true as is_active,
  COALESCE(p.created_at, NOW()) as created_at
FROM practices p
WHERE p.address IS NOT NULL 
AND p.address != ''
AND NOT EXISTS (
  SELECT 1 FROM practice_locations pl WHERE pl.practice_id = p.id
);

-- Add comment to table
COMMENT ON TABLE practice_locations IS 'Stores multiple locations for practices. Each practice can have multiple locations but only one can be marked as main (is_main = true).';
