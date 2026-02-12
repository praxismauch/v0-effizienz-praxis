-- ============================================================
-- Comprehensive migration: Fix all missing tables and columns
-- Fixes: contacts, medical_devices FK, inventory_bills,
--        arbeitsmittel, device_rooms, feature_flags
-- ============================================================

-- 1. CONTACTS TABLE - ensure all required columns exist
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id TEXT NOT NULL,
  salutation TEXT,
  title TEXT,
  first_name TEXT,
  last_name TEXT NOT NULL,
  company TEXT,
  position TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  fax TEXT,
  website TEXT,
  street TEXT,
  house_number TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT,
  category TEXT,
  notes TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Add any missing columns to contacts (safe: IF NOT EXISTS)
DO $$ BEGIN
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS salutation TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS title TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS first_name TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS position TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mobile TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS fax TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS website TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS street TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS house_number TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS postal_code TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS city TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS country TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS category TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS created_by UUID;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
END $$;


-- 2. MEDICAL DEVICES - fix FK constraint
-- The responsible_user_id references team_members.id via code,
-- but the FK was pointing to auth.users. Drop the bad FK.
-- ============================================================
DO $$ BEGIN
  ALTER TABLE medical_devices DROP CONSTRAINT IF EXISTS medical_devices_responsible_user_id_fkey;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Also add any missing columns to medical_devices
DO $$ BEGIN
  ALTER TABLE medical_devices ADD COLUMN IF NOT EXISTS consumables_supplier TEXT;
  ALTER TABLE medical_devices ADD COLUMN IF NOT EXISTS consumables_order_url TEXT;
  ALTER TABLE medical_devices ADD COLUMN IF NOT EXISTS consumables_notes TEXT;
  ALTER TABLE medical_devices ADD COLUMN IF NOT EXISTS cleaning_instructions TEXT;
  ALTER TABLE medical_devices ADD COLUMN IF NOT EXISTS maintenance_instructions TEXT;
  ALTER TABLE medical_devices ADD COLUMN IF NOT EXISTS short_sop TEXT;
  ALTER TABLE medical_devices ADD COLUMN IF NOT EXISTS ce_certificate_url TEXT;
  ALTER TABLE medical_devices ADD COLUMN IF NOT EXISTS handbook_url TEXT;
  ALTER TABLE medical_devices ADD COLUMN IF NOT EXISTS maintenance_service_partner TEXT;
  ALTER TABLE medical_devices ADD COLUMN IF NOT EXISTS maintenance_service_contact TEXT;
  ALTER TABLE medical_devices ADD COLUMN IF NOT EXISTS maintenance_service_phone TEXT;
  ALTER TABLE medical_devices ADD COLUMN IF NOT EXISTS maintenance_service_email TEXT;
  ALTER TABLE medical_devices ADD COLUMN IF NOT EXISTS image_url TEXT;
  ALTER TABLE medical_devices ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';
  ALTER TABLE medical_devices ADD COLUMN IF NOT EXISTS supplier_name TEXT;
  ALTER TABLE medical_devices ADD COLUMN IF NOT EXISTS supplier_contact TEXT;
  ALTER TABLE medical_devices ADD COLUMN IF NOT EXISTS room TEXT;
  ALTER TABLE medical_devices ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
  ALTER TABLE medical_devices ADD COLUMN IF NOT EXISTS created_by UUID;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 3. DEVICE_ROOMS junction table
-- ============================================================
CREATE TABLE IF NOT EXISTS device_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL,
  room_id UUID NOT NULL,
  practice_id TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(device_id, room_id)
);


-- 4. INVENTORY_BILLS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  file_hash TEXT,
  uploaded_by UUID,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  is_archived BOOLEAN DEFAULT false,
  supplier_name TEXT,
  invoice_number TEXT,
  invoice_date DATE,
  total_amount NUMERIC(10,2),
  extracted_items JSONB,
  extraction_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Add missing columns to inventory_bills
DO $$ BEGIN
  ALTER TABLE inventory_bills ADD COLUMN IF NOT EXISTS file_hash TEXT;
  ALTER TABLE inventory_bills ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
  ALTER TABLE inventory_bills ADD COLUMN IF NOT EXISTS supplier_name TEXT;
  ALTER TABLE inventory_bills ADD COLUMN IF NOT EXISTS invoice_number TEXT;
  ALTER TABLE inventory_bills ADD COLUMN IF NOT EXISTS invoice_date DATE;
  ALTER TABLE inventory_bills ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2);
  ALTER TABLE inventory_bills ADD COLUMN IF NOT EXISTS extracted_items JSONB;
  ALTER TABLE inventory_bills ADD COLUMN IF NOT EXISTS extraction_status TEXT;
  ALTER TABLE inventory_bills ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;


-- 5. ARBEITSMITTEL - add missing columns
-- ============================================================
DO $$ BEGIN
  ALTER TABLE arbeitsmittel ADD COLUMN IF NOT EXISTS warranty_until DATE;
  ALTER TABLE arbeitsmittel ADD COLUMN IF NOT EXISTS condition TEXT;
  ALTER TABLE arbeitsmittel ADD COLUMN IF NOT EXISTS purchase_date DATE;
  ALTER TABLE arbeitsmittel ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(10,2);
  ALTER TABLE arbeitsmittel ADD COLUMN IF NOT EXISTS assigned_to UUID;
  ALTER TABLE arbeitsmittel ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE arbeitsmittel ADD COLUMN IF NOT EXISTS serial_number TEXT;
  ALTER TABLE arbeitsmittel ADD COLUMN IF NOT EXISTS type TEXT;
  ALTER TABLE arbeitsmittel ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';
  ALTER TABLE arbeitsmittel ADD COLUMN IF NOT EXISTS image_url TEXT;
  ALTER TABLE arbeitsmittel ADD COLUMN IF NOT EXISTS created_by UUID;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;


-- 6. FEATURE_FLAGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id TEXT,
  flag_name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add a unique constraint on practice_id + flag_name
DO $$ BEGIN
  ALTER TABLE feature_flags ADD CONSTRAINT feature_flags_practice_flag_unique 
    UNIQUE (practice_id, flag_name);
EXCEPTION WHEN duplicate_table THEN NULL;
         WHEN duplicate_object THEN NULL;
END $$;


-- 7. Enable RLS on new tables
-- ============================================================
DO $$ BEGIN
  ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE device_rooms ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE inventory_bills ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Create permissive RLS policies for service role access
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for service role on contacts" ON contacts;
  CREATE POLICY "Allow all for service role on contacts" ON contacts FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for service role on device_rooms" ON device_rooms;
  CREATE POLICY "Allow all for service role on device_rooms" ON device_rooms FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for service role on inventory_bills" ON inventory_bills;
  CREATE POLICY "Allow all for service role on inventory_bills" ON inventory_bills FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for service role on feature_flags" ON feature_flags;
  CREATE POLICY "Allow all for service role on feature_flags" ON feature_flags FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN others THEN NULL;
END $$;
