-- Create goal_assignments table for assigning team members to goals
CREATE TABLE IF NOT EXISTS goal_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL,
  team_member_id UUID NOT NULL,
  assigned_by UUID,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_goal_assignments_goal_id ON goal_assignments(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_assignments_team_member_id ON goal_assignments(team_member_id);
CREATE INDEX IF NOT EXISTS idx_goal_assignments_assigned_by ON goal_assignments(assigned_by);

-- Add unique constraint to prevent duplicate assignments
CREATE UNIQUE INDEX IF NOT EXISTS idx_goal_assignments_unique ON goal_assignments(goal_id, team_member_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_goal_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_goal_assignments_updated_at
  BEFORE UPDATE ON goal_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_assignments_updated_at();
