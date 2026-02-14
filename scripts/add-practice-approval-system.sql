-- Add approval_status to practices table if not exists
ALTER TABLE practices ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';

-- Add created_by to track who created the practice
ALTER TABLE practices ADD COLUMN IF NOT EXISTS created_by TEXT REFERENCES users(id);

-- Create index for faster pending practice queries
CREATE INDEX IF NOT EXISTS idx_practices_approval_status ON practices(approval_status);

-- Update existing practices to 'approved' status
UPDATE practices SET approval_status = 'approved' WHERE approval_status IS NULL;

-- Add NOT NULL constraint after setting defaults
ALTER TABLE practices ALTER COLUMN approval_status SET NOT NULL;

-- Add comment
COMMENT ON COLUMN practices.approval_status IS 'Practice approval status: pending, approved, rejected';
COMMENT ON COLUMN practices.created_by IS 'User ID who created this practice (for self-registration tracking)';
