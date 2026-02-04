-- Remove the foreign key constraint on responsible_user_id if it exists
-- This allows responsible_user_id to reference any user, not just team_members

DO $$ 
BEGIN
  -- Drop the constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'medical_devices_responsible_user_id_fkey'
    AND table_name = 'medical_devices'
  ) THEN
    ALTER TABLE medical_devices DROP CONSTRAINT medical_devices_responsible_user_id_fkey;
  END IF;
END $$;
