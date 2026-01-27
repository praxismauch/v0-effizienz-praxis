-- Add joint execution fields to responsibilities table
ALTER TABLE responsibilities 
ADD COLUMN IF NOT EXISTS joint_execution BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS joint_execution_user_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS joint_execution_team_group TEXT;

-- Add index for joint execution queries
CREATE INDEX IF NOT EXISTS idx_responsibilities_joint_execution ON responsibilities(joint_execution) WHERE joint_execution = TRUE;

COMMENT ON COLUMN responsibilities.joint_execution IS 'Whether this responsibility requires joint execution with another team member or group';
COMMENT ON COLUMN responsibilities.joint_execution_user_id IS 'Team member who should co-execute this responsibility';
COMMENT ON COLUMN responsibilities.joint_execution_team_group IS 'Team group that should co-execute this responsibility';
