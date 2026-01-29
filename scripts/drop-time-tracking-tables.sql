-- Drop existing time tracking tables to start fresh
DROP TABLE IF EXISTS plausibility_checks CASCADE;
DROP TABLE IF EXISTS time_corrections CASCADE;
DROP TABLE IF EXISTS time_block_breaks CASCADE;
DROP TABLE IF EXISTS time_blocks CASCADE;
DROP TABLE IF EXISTS time_stamps CASCADE;

-- Drop the trigger function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
