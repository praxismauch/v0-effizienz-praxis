-- =============================================
-- Create waitlist table for early access signups
-- =============================================

-- Create waitlist table if it doesn't exist
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  practice_name VARCHAR(255),
  practice_type VARCHAR(100),
  phone VARCHAR(50),
  message TEXT,
  source VARCHAR(100) DEFAULT 'coming_soon_page',
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  contacted_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- Add index on status for filtering
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);

-- Add index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow super admins to manage waitlist
CREATE POLICY IF NOT EXISTS waitlist_superadmin_policy ON waitlist
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE waitlist IS 'Stores early access waitlist signups from coming soon page';
