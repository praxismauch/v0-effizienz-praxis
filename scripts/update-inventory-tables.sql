-- Add missing columns to inventory_items if they don't exist
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS last_restocked_at TIMESTAMPTZ;

-- Create inventory_consumption table for tracking stock movements
CREATE TABLE IF NOT EXISTS inventory_consumption (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id UUID NOT NULL,
  item_id UUID NOT NULL,
  
  -- Consumption details
  quantity INTEGER NOT NULL,
  consumption_type TEXT DEFAULT 'usage',
  notes TEXT,
  
  -- Source reference
  bill_id UUID,
  user_id UUID,
  
  -- Timestamps
  consumed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inventory_consumption_practice 
ON inventory_consumption(practice_id);

CREATE INDEX IF NOT EXISTS idx_inventory_consumption_item 
ON inventory_consumption(item_id);
