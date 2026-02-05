-- Add display_order column to global_parameter_groups table
-- Simple ALTER TABLE without DO blocks for better compatibility

ALTER TABLE global_parameter_groups 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Update existing rows with sequential order based on name
UPDATE global_parameter_groups 
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as row_num
  FROM global_parameter_groups
) AS subquery
WHERE global_parameter_groups.id = subquery.id
AND global_parameter_groups.display_order = 0;
