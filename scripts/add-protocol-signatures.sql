-- Add required_signers and signatures columns to practice_journals
ALTER TABLE practice_journals
ADD COLUMN IF NOT EXISTS required_signers jsonb DEFAULT '[]'::jsonb;

ALTER TABLE practice_journals
ADD COLUMN IF NOT EXISTS signatures jsonb DEFAULT '[]'::jsonb;
