-- Create team_member_documents table for storing member documents
CREATE TABLE IF NOT EXISTS team_member_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  team_member_id UUID NOT NULL REFERENCES practice_team_members(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'unknown',
  category TEXT DEFAULT 'other',
  file_url TEXT,
  file_size INTEGER,
  expiry_date DATE,
  notes TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_member_documents_team_member_id 
  ON team_member_documents(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_member_documents_practice_id 
  ON team_member_documents(practice_id);
CREATE INDEX IF NOT EXISTS idx_team_member_documents_category 
  ON team_member_documents(category);
CREATE INDEX IF NOT EXISTS idx_team_member_documents_expiry_date 
  ON team_member_documents(expiry_date);

-- Enable RLS
ALTER TABLE team_member_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for practice access
CREATE POLICY "Practice members can view documents" ON team_member_documents
  FOR SELECT USING (true);

CREATE POLICY "Practice admins can insert documents" ON team_member_documents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Practice admins can update documents" ON team_member_documents
  FOR UPDATE USING (true);

CREATE POLICY "Practice admins can delete documents" ON team_member_documents
  FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_team_member_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_team_member_documents_updated_at ON team_member_documents;
CREATE TRIGGER trigger_update_team_member_documents_updated_at
  BEFORE UPDATE ON team_member_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_team_member_documents_updated_at();
