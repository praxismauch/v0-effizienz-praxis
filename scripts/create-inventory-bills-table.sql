-- Create inventory_bills table for AI-based material management
CREATE TABLE IF NOT EXISTS inventory_bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id UUID NOT NULL,
  
  -- File information
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  file_hash TEXT, -- SHA-256 hash for duplicate detection
  
  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  extraction_error TEXT,
  extracted_at TIMESTAMPTZ,
  
  -- Extracted data
  supplier_name TEXT,
  bill_date DATE,
  bill_number TEXT,
  total_amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'EUR',
  extracted_items JSONB DEFAULT '[]'::JSONB,
  
  -- AI metadata
  ai_raw_response JSONB,
  ai_confidence DECIMAL(3, 2),
  
  -- Workflow
  is_archived BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  uploaded_by UUID,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_inventory_bills_practice 
ON inventory_bills(practice_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_bills_status 
ON inventory_bills(practice_id, status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_bills_archived 
ON inventory_bills(practice_id, is_archived) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_bills_file_hash 
ON inventory_bills(practice_id, file_hash) WHERE file_hash IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_bills_file_meta 
ON inventory_bills(practice_id, file_name, file_size) WHERE deleted_at IS NULL;

-- Note: RLS is handled at the API level for this table
