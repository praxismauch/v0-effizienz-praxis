-- Create tickets table for super-admin support system
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  practice_id TEXT,
  user_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT,
  assigned_to TEXT,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for tickets
CREATE INDEX IF NOT EXISTS idx_tickets_practice_id ON tickets(practice_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_deleted_at ON tickets(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tickets_practice_status ON tickets(practice_id, status) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tickets
-- Super admins can see all tickets
CREATE POLICY "Super admins can view all tickets"
  ON tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'super_admin')
    )
  );

-- Super admins can create tickets
CREATE POLICY "Super admins can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'super_admin')
    )
  );

-- Super admins can update tickets
CREATE POLICY "Super admins can update tickets"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'super_admin')
    )
  );

-- Super admins can delete tickets (soft delete)
CREATE POLICY "Super admins can delete tickets"
  ON tickets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'super_admin')
    )
  );

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  USING (
    user_id = auth.uid()::text
    AND deleted_at IS NULL
  );

-- Users can create their own tickets
CREATE POLICY "Users can create own tickets"
  ON tickets FOR INSERT
  WITH CHECK (
    user_id = auth.uid()::text
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_updated_at_trigger
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_tickets_updated_at();
