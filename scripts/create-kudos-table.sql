-- Create Kudos Table for Employee Recognition
-- This table stores peer-to-peer recognition messages

CREATE TABLE IF NOT EXISTS kudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_kudos_practice_id ON kudos(practice_id);
CREATE INDEX IF NOT EXISTS idx_kudos_sender_id ON kudos(sender_id);
CREATE INDEX IF NOT EXISTS idx_kudos_recipient_id ON kudos(recipient_id);
CREATE INDEX IF NOT EXISTS idx_kudos_created_at ON kudos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kudos_category ON kudos(category);

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_kudos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kudos_updated_at_trigger
  BEFORE UPDATE ON kudos
  FOR EACH ROW
  EXECUTE FUNCTION update_kudos_updated_at();

-- Add comment to table
COMMENT ON TABLE kudos IS 'Stores peer recognition messages (kudos) between team members';
