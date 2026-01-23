-- Create practices table if it doesn't exist
CREATE TABLE IF NOT EXISTS practices (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  timezone VARCHAR(50) DEFAULT 'Europe/Berlin',
  currency VARCHAR(10) DEFAULT 'EUR',
  color VARCHAR(20),
  logo_url TEXT,
  bundesland VARCHAR(50),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Add bundesland column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'practices' AND column_name = 'bundesland') THEN
    ALTER TABLE practices ADD COLUMN bundesland VARCHAR(50);
  END IF;
END $$;

-- Add RLS policy
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;

-- Create policy if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'practices' AND policyname = 'Allow all on practices') THEN
    CREATE POLICY "Allow all on practices" ON practices FOR ALL USING (true);
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN practices.bundesland IS 'German federal state (Bundesland) of the practice - required field';
