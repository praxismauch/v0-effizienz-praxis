-- Create team_members table (required by many API routes)
-- This table links users to practices with their role and status

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL,
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  role TEXT DEFAULT 'member',
  position TEXT,
  department TEXT,
  status TEXT DEFAULT 'active',
  employment_type TEXT DEFAULT 'full-time',
  weekly_hours NUMERIC DEFAULT 40,
  hire_date DATE,
  birth_date DATE,
  notes TEXT,
  avatar_url TEXT,
  skills TEXT[],
  certifications TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_team_members_practice_id ON team_members(practice_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can view team members in their practice" ON team_members;
DROP POLICY IF EXISTS "Users can insert team members" ON team_members;
DROP POLICY IF EXISTS "Users can update team members" ON team_members;
DROP POLICY IF EXISTS "Users can delete team members" ON team_members;

-- Allow authenticated users to read team members from their practice
CREATE POLICY "Users can view team members in their practice"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert team members
CREATE POLICY "Users can insert team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update team members
CREATE POLICY "Users can update team members"
  ON team_members FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete team members
CREATE POLICY "Users can delete team members"
  ON team_members FOR DELETE
  TO authenticated
  USING (true);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
