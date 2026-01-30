-- Create practice_widgets table for storing dashboard widgets and charts
CREATE TABLE IF NOT EXISTS practice_widgets (
  id TEXT PRIMARY KEY,
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('chart', 'stat', 'table', 'custom')),
  chart_type TEXT CHECK (chart_type IN ('bar', 'line', 'pie', 'area', 'radar')),
  category TEXT NOT NULL,
  data_source TEXT,
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_practice_widgets_practice_id ON practice_widgets(practice_id);
CREATE INDEX IF NOT EXISTS idx_practice_widgets_enabled ON practice_widgets(enabled);
CREATE INDEX IF NOT EXISTS idx_practice_widgets_category ON practice_widgets(category);

-- Enable RLS
ALTER TABLE practice_widgets ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can view widgets for their practice"
  ON practice_widgets FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage widgets"
  ON practice_widgets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE user_id = auth.uid() 
      AND practice_id = practice_widgets.practice_id
      AND role IN ('admin', 'owner', 'super_admin')
    )
  );
