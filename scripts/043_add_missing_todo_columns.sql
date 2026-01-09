-- Add missing columns to todos table for team assignment and priority flags
-- Only adds columns if they don't already exist

-- assigned_user_ids: Array of user IDs for multiple assignees
ALTER TABLE todos ADD COLUMN IF NOT EXISTS assigned_user_ids UUID[] DEFAULT '{}';

-- assigned_team_ids: Array of team IDs for team-based assignment
ALTER TABLE todos ADD COLUMN IF NOT EXISTS assigned_team_ids UUID[] DEFAULT '{}';

-- dringend: Urgent flag
ALTER TABLE todos ADD COLUMN IF NOT EXISTS dringend BOOLEAN DEFAULT false;

-- wichtig: Important flag  
ALTER TABLE todos ADD COLUMN IF NOT EXISTS wichtig BOOLEAN DEFAULT false;

-- recurrence_type: Type of recurrence (none, daily, weekly, monthly, yearly)
ALTER TABLE todos ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(50) DEFAULT 'none';

-- recurrence_end_date: When the recurrence should end
ALTER TABLE todos ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;

-- last_generated_date already exists, no need to add

-- Create index for assigned_user_ids for better query performance
CREATE INDEX IF NOT EXISTS idx_todos_assigned_user_ids ON todos USING GIN(assigned_user_ids);

-- Create index for assigned_team_ids for better query performance
CREATE INDEX IF NOT EXISTS idx_todos_assigned_team_ids ON todos USING GIN(assigned_team_ids);
