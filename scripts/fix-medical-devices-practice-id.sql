-- Fix practice_id type in medical_devices table
-- Change from TEXT to INTEGER to match practices table

ALTER TABLE medical_devices 
  ALTER COLUMN practice_id TYPE INTEGER USING practice_id::INTEGER;

ALTER TABLE device_rooms 
  ALTER COLUMN practice_id TYPE INTEGER USING practice_id::INTEGER;
