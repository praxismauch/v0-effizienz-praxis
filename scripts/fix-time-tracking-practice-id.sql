-- Fix time tracking tables to use INTEGER for practice_id instead of UUID
-- This aligns with the practices table which uses SERIAL PRIMARY KEY (INTEGER)

-- Drop existing tables if they have the wrong type
-- This is safe if the tables are empty or just created

-- Alter time_stamps table
ALTER TABLE time_stamps 
  DROP COLUMN IF EXISTS practice_id CASCADE;

ALTER TABLE time_stamps 
  ADD COLUMN practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE;

-- Alter time_blocks table
ALTER TABLE time_blocks 
  DROP COLUMN IF EXISTS practice_id CASCADE;

ALTER TABLE time_blocks 
  ADD COLUMN practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE;

-- Alter time_block_breaks table
ALTER TABLE time_block_breaks 
  DROP COLUMN IF EXISTS practice_id CASCADE;

ALTER TABLE time_block_breaks 
  ADD COLUMN practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE;

-- Alter time_corrections table
ALTER TABLE time_corrections 
  DROP COLUMN IF EXISTS practice_id CASCADE;

ALTER TABLE time_corrections 
  ADD COLUMN practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE;

-- Alter plausibility_checks table
ALTER TABLE plausibility_checks 
  DROP COLUMN IF EXISTS practice_id CASCADE;

ALTER TABLE plausibility_checks 
  ADD COLUMN practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE;

-- Recreate indexes with the correct column type
DROP INDEX IF EXISTS idx_time_stamps_user_practice;
CREATE INDEX idx_time_stamps_user_practice ON time_stamps(user_id, practice_id);

DROP INDEX IF EXISTS idx_time_stamps_practice_timestamp;
CREATE INDEX idx_time_stamps_practice_timestamp ON time_stamps(practice_id, timestamp DESC);

DROP INDEX IF EXISTS idx_time_blocks_user_practice;
CREATE INDEX idx_time_blocks_user_practice ON time_blocks(user_id, practice_id);

DROP INDEX IF EXISTS idx_time_blocks_practice_date;
CREATE INDEX idx_time_blocks_practice_date ON time_blocks(practice_id, date DESC);

DROP INDEX IF EXISTS idx_time_blocks_practice_open;
CREATE INDEX idx_time_blocks_practice_open ON time_blocks(practice_id, is_open) WHERE is_open = true;

DROP INDEX IF EXISTS idx_time_block_breaks_user_practice;
CREATE INDEX idx_time_block_breaks_user_practice ON time_block_breaks(user_id, practice_id);

DROP INDEX IF EXISTS idx_time_corrections_user_practice;
CREATE INDEX idx_time_corrections_user_practice ON time_corrections(user_id, practice_id);

DROP INDEX IF EXISTS idx_plausibility_checks_user_practice;
CREATE INDEX idx_plausibility_checks_user_practice ON plausibility_checks(user_id, practice_id);
