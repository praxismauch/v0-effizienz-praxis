-- Create test_checklist_items table
-- This table stores individual checklist items linked to checklists and templates

CREATE TABLE IF NOT EXISTS test_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES test_checklists(id) ON DELETE CASCADE,
  template_id UUID REFERENCES test_checklist_templates(id) ON DELETE SET NULL,
  category_id UUID REFERENCES testing_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_test_checklist_items_checklist_id ON test_checklist_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_test_checklist_items_template_id ON test_checklist_items(template_id);
CREATE INDEX IF NOT EXISTS idx_test_checklist_items_category_id ON test_checklist_items(category_id);
CREATE INDEX IF NOT EXISTS idx_test_checklist_items_is_completed ON test_checklist_items(is_completed);
CREATE INDEX IF NOT EXISTS idx_test_checklist_items_completed_at ON test_checklist_items(completed_at);

-- Enable RLS
ALTER TABLE test_checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view checklist items" ON test_checklist_items
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert checklist items" ON test_checklist_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update checklist items" ON test_checklist_items
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete checklist items" ON test_checklist_items
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_test_checklist_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_test_checklist_items_updated_at ON test_checklist_items;
CREATE TRIGGER trigger_update_test_checklist_items_updated_at
  BEFORE UPDATE ON test_checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_test_checklist_items_updated_at();
