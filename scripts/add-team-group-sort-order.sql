-- Add sort_order column to team_group_templates table for ordering
ALTER TABLE team_group_templates 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Set initial sort_order based on created_at
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 as new_order
  FROM team_group_templates
)
UPDATE team_group_templates t
SET sort_order = o.new_order
FROM ordered o
WHERE t.id = o.id;
