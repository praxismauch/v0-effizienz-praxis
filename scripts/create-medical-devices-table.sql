-- Create medical_devices table
CREATE TABLE IF NOT EXISTS medical_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  manufacturer VARCHAR(255),
  model VARCHAR(255),
  serial_number VARCHAR(255),
  inventory_number VARCHAR(255),
  purchase_date DATE,
  purchase_price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'EUR',
  supplier_name VARCHAR(255),
  supplier_contact TEXT,
  warranty_end_date DATE,
  location VARCHAR(255),
  room VARCHAR(255),
  responsible_user_id UUID,
  image_url TEXT,
  handbook_url TEXT,
  ce_certificate_url TEXT,
  maintenance_interval_days INTEGER,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  maintenance_service_partner VARCHAR(255),
  maintenance_service_contact TEXT,
  maintenance_service_phone VARCHAR(50),
  maintenance_service_email VARCHAR(255),
  consumables_supplier VARCHAR(255),
  consumables_order_url TEXT,
  consumables_notes TEXT,
  cleaning_instructions TEXT,
  maintenance_instructions TEXT,
  short_sop TEXT,
  status VARCHAR(50) DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_medical_devices_practice_id ON medical_devices(practice_id);
CREATE INDEX IF NOT EXISTS idx_medical_devices_status ON medical_devices(status);
CREATE INDEX IF NOT EXISTS idx_medical_devices_category ON medical_devices(category);
CREATE INDEX IF NOT EXISTS idx_medical_devices_next_maintenance ON medical_devices(next_maintenance_date);

-- Create device_rooms junction table for room associations
CREATE TABLE IF NOT EXISTS device_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES medical_devices(id) ON DELETE CASCADE,
  room_id UUID NOT NULL,
  practice_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  UNIQUE(device_id, room_id)
);

CREATE INDEX IF NOT EXISTS idx_device_rooms_device_id ON device_rooms(device_id);
CREATE INDEX IF NOT EXISTS idx_device_rooms_room_id ON device_rooms(room_id);

-- Enable RLS
ALTER TABLE medical_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_rooms ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies - allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON medical_devices
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON device_rooms
  FOR ALL
  USING (true)
  WITH CHECK (true);
