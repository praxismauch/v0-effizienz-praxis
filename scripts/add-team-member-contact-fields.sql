-- Add email and phone columns to team_members table for contact information
-- This allows storing direct contact info for team members

ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS mobile VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN team_members.email IS 'Direct email address of the team member';
COMMENT ON COLUMN team_members.phone IS 'Direct phone number of the team member';
COMMENT ON COLUMN team_members.mobile IS 'Mobile phone number of the team member';
