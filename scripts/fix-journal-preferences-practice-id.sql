-- Create journal_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS journal_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id text,
  user_id uuid,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Add practice_id column if table existed but column was missing
ALTER TABLE journal_preferences ADD COLUMN IF NOT EXISTS practice_id text;
ALTER TABLE journal_preferences ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Create index
CREATE INDEX IF NOT EXISTS idx_journal_preferences_practice_id ON journal_preferences(practice_id);
