-- Create roadmap_items table
CREATE TABLE IF NOT EXISTS roadmap_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled', 'on_hold')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  effort TEXT CHECK (effort IN ('small', 'medium', 'large', 'xlarge')),
  impact TEXT CHECK (impact IN ('low', 'medium', 'high', 'critical')),
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  target_date DATE,
  target_quarter TEXT,
  assigned_to UUID,
  created_by UUID,
  metadata JSONB DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  votes INTEGER DEFAULT 0,
  is_ai_generated BOOLEAN DEFAULT false,
  ai_reasoning TEXT,
  ai_suggested_quarter TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_roadmap_items_status ON roadmap_items(status);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_priority ON roadmap_items(priority);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_category ON roadmap_items(category);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_deleted_at ON roadmap_items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_display_order ON roadmap_items(display_order);

-- Enable RLS
ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Allow authenticated read" ON roadmap_items
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

-- Allow all authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON roadmap_items
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow all authenticated users to update
CREATE POLICY "Allow authenticated update" ON roadmap_items
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access" ON roadmap_items
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
