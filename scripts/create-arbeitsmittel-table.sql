-- Create arbeitsmittel (work equipment) table
CREATE TABLE IF NOT EXISTS arbeitsmittel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  serial_number VARCHAR(100),
  purchase_date DATE,
  purchase_price DECIMAL(10, 2),
  condition VARCHAR(50) DEFAULT 'Neu',
  status VARCHAR(50) DEFAULT 'available',
  notes TEXT,
  image_url TEXT,
  assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
  assigned_date DATE,
  return_date DATE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_arbeitsmittel_practice_id ON arbeitsmittel(practice_id);
CREATE INDEX IF NOT EXISTS idx_arbeitsmittel_type ON arbeitsmittel(type);
CREATE INDEX IF NOT EXISTS idx_arbeitsmittel_status ON arbeitsmittel(status);
CREATE INDEX IF NOT EXISTS idx_arbeitsmittel_assigned_to ON arbeitsmittel(assigned_to);

-- Add comments for documentation
COMMENT ON TABLE arbeitsmittel IS 'Work equipment inventory for practices';
COMMENT ON COLUMN arbeitsmittel.type IS 'Type of equipment: Schlüssel, Dienstkleidung, Dienst Handy, Dienst Laptop, Sonstiges';
COMMENT ON COLUMN arbeitsmittel.condition IS 'Condition of equipment: Neu, Gut, Gebraucht, Defekt';
COMMENT ON COLUMN arbeitsmittel.status IS 'Status: available, assigned, maintenance, retired';
COMMENT ON COLUMN arbeitsmittel.image_url IS 'URL to the uploaded image of the work equipment';
