-- Add approval_status column to users table if it doesn't exist
-- This column is needed by the super-admin user creation flow
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'approval_status'
    ) THEN
        ALTER TABLE users ADD COLUMN approval_status TEXT DEFAULT 'approved';
        
        -- Set all existing users to approved
        UPDATE users SET approval_status = 'approved' WHERE approval_status IS NULL;
    END IF;
END $$;
