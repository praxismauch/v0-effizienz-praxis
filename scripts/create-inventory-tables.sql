-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id UUID NOT NULL,
  
  -- Item details
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  category TEXT DEFAULT 'general',
  description TEXT,
  
  -- Stock levels
  current_stock INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 5,
  reorder_point INTEGER DEFAULT 10,
  optimal_stock INTEGER DEFAULT 20,
  
  -- Pricing
  unit TEXT DEFAULT 'Stück',
  unit_cost DECIMAL(10, 2),
  
  -- Supplier
  supplier_id UUID,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'discontinued')),
  is_active BOOLEAN DEFAULT true,
  last_restocked_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_practice 
ON inventory_items(practice_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_items_status 
ON inventory_items(practice_id, status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_items_category 
ON inventory_items(practice_id, category) WHERE deleted_at IS NULL;

-- Create inventory_consumption table for tracking stock movements
CREATE TABLE IF NOT EXISTS inventory_consumption (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id UUID NOT NULL,
  item_id UUID NOT NULL,
  
  -- Consumption details
  quantity INTEGER NOT NULL, -- positive = consumed, negative = restocked
  consumption_type TEXT DEFAULT 'usage' CHECK (consumption_type IN ('usage', 'restock', 'adjustment', 'waste', 'return')),
  notes TEXT,
  
  -- Source reference
  bill_id UUID,
  user_id UUID,
  
  -- Timestamps
  consumed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for consumption tracking
CREATE INDEX IF NOT EXISTS idx_inventory_consumption_practice 
ON inventory_consumption(practice_id);

CREATE INDEX IF NOT EXISTS idx_inventory_consumption_item 
ON inventory_consumption(item_id);

CREATE INDEX IF NOT EXISTS idx_inventory_consumption_date 
ON inventory_consumption(practice_id, consumed_at DESC);
