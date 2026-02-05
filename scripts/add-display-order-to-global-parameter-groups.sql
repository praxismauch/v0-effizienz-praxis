-- Add display_order column to global_parameter_groups table
-- This column is required for proper ordering of KPI groups

DO $$ 
BEGIN
  -- Check if column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'global_parameter_groups' AND column_name = 'display_order'
  ) THEN
    -- Add the column
    ALTER TABLE global_parameter_groups ADD COLUMN display_order INTEGER DEFAULT 0;
    RAISE NOTICE '✓ Added display_order column to global_parameter_groups';
    
    -- Set initial display_order values based on existing order
    UPDATE global_parameter_groups SET display_order = 1 WHERE id = 1;
    UPDATE global_parameter_groups SET display_order = 2 WHERE id = 2;
    UPDATE global_parameter_groups SET display_order = 3 WHERE id = 3;
    UPDATE global_parameter_groups SET display_order = 4 WHERE id = 4;
    UPDATE global_parameter_groups SET display_order = 5 WHERE id = 5;
    
    RAISE NOTICE '✓ Initialized display_order values';
  ELSE
    RAISE NOTICE 'Column already exists: global_parameter_groups.display_order';
  END IF;
END $$;

-- Verify the column was added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'global_parameter_groups' AND column_name = 'display_order'
  ) THEN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'SUCCESS: display_order column verified';
    RAISE NOTICE '=====================================================';
  ELSE
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'ERROR: display_order column not found';
    RAISE NOTICE '=====================================================';
  END IF;
END $$;
