-- =====================================================================
-- DATABASE SCHEMA VERIFICATION SCRIPT
-- =====================================================================
-- Purpose: Verify all critical tables and columns exist
-- Date: February 2026
-- =====================================================================

DO $$
DECLARE
  missing_tables TEXT[] := ARRAY[]::TEXT[];
  missing_columns TEXT[] := ARRAY[]::TEXT[];
  table_count INTEGER := 0;
  column_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=====================================================================';
  RAISE NOTICE 'DATABASE SCHEMA VERIFICATION';
  RAISE NOTICE '=====================================================================';
  RAISE NOTICE '';

  -- =====================================================================
  -- CHECK CRITICAL TABLES
  -- =====================================================================
  RAISE NOTICE '1. CHECKING CRITICAL TABLES...';
  RAISE NOTICE '---------------------------------------------------------------------';
  
  -- Check users table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    RAISE NOTICE '✓ users table exists';
    table_count := table_count + 1;
  ELSE
    RAISE NOTICE '✗ users table MISSING';
    missing_tables := array_append(missing_tables, 'users');
  END IF;
  
  -- Check practices table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practices') THEN
    RAISE NOTICE '✓ practices table exists';
    table_count := table_count + 1;
  ELSE
    RAISE NOTICE '✗ practices table MISSING';
    missing_tables := array_append(missing_tables, 'practices');
  END IF;
  
  -- Check team_members table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
    RAISE NOTICE '✓ team_members table exists';
    table_count := table_count + 1;
  ELSE
    RAISE NOTICE '✗ team_members table MISSING';
    missing_tables := array_append(missing_tables, 'team_members');
  END IF;
  
  -- Check feature_flags table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flags') THEN
    RAISE NOTICE '✓ feature_flags table exists';
    table_count := table_count + 1;
  ELSE
    RAISE NOTICE '✗ feature_flags table MISSING';
    missing_tables := array_append(missing_tables, 'feature_flags');
  END IF;
  
  -- Check contracts table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contracts') THEN
    RAISE NOTICE '✓ contracts table exists';
    table_count := table_count + 1;
  ELSE
    RAISE NOTICE '✗ contracts table MISSING';
    missing_tables := array_append(missing_tables, 'contracts');
  END IF;
  
  -- Check device_trainings table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'device_trainings') THEN
    RAISE NOTICE '✓ device_trainings table exists';
    table_count := table_count + 1;
  ELSE
    RAISE NOTICE '✗ device_trainings table MISSING';
    missing_tables := array_append(missing_tables, 'device_trainings');
  END IF;
  
  -- Check notifications table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    RAISE NOTICE '✓ notifications table exists';
    table_count := table_count + 1;
  ELSE
    RAISE NOTICE '✗ notifications table MISSING';
    missing_tables := array_append(missing_tables, 'notifications');
  END IF;
  
  -- Check global_parameter_templates table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'global_parameter_templates') THEN
    RAISE NOTICE '✓ global_parameter_templates table exists';
    table_count := table_count + 1;
  ELSE
    RAISE NOTICE '✗ global_parameter_templates table MISSING';
    missing_tables := array_append(missing_tables, 'global_parameter_templates');
  END IF;
  
  -- Check global_parameter_groups table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'global_parameter_groups') THEN
    RAISE NOTICE '✓ global_parameter_groups table exists';
    table_count := table_count + 1;
  ELSE
    RAISE NOTICE '✗ global_parameter_groups table MISSING';
    missing_tables := array_append(missing_tables, 'global_parameter_groups');
  END IF;
  
  -- Check cirs_incidents table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cirs_incidents') THEN
    RAISE NOTICE '✓ cirs_incidents table exists';
    table_count := table_count + 1;
  ELSE
    RAISE NOTICE '✗ cirs_incidents table MISSING';
    missing_tables := array_append(missing_tables, 'cirs_incidents');
  END IF;
  
  -- Check inventory_items table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_items') THEN
    RAISE NOTICE '✓ inventory_items table exists';
    table_count := table_count + 1;
  ELSE
    RAISE NOTICE '✗ inventory_items table MISSING';
    missing_tables := array_append(missing_tables, 'inventory_items');
  END IF;
  
  -- Check responsibilities table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'responsibilities') THEN
    RAISE NOTICE '✓ responsibilities table exists';
    table_count := table_count + 1;
  ELSE
    RAISE NOTICE '✗ responsibilities table MISSING';
    missing_tables := array_append(missing_tables, 'responsibilities');
  END IF;
  
  -- Check practice_journals table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_journals') THEN
    RAISE NOTICE '✓ practice_journals table exists';
    table_count := table_count + 1;
  ELSE
    RAISE NOTICE '✗ practice_journals table MISSING';
    missing_tables := array_append(missing_tables, 'practice_journals');
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '---------------------------------------------------------------------';
  RAISE NOTICE 'Total tables verified: %', table_count;
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE NOTICE 'Missing tables: %', array_to_string(missing_tables, ', ');
  END IF;
  RAISE NOTICE '';

  -- =====================================================================
  -- CHECK CRITICAL COLUMNS
  -- =====================================================================
  RAISE NOTICE '2. CHECKING CRITICAL COLUMNS...';
  RAISE NOTICE '---------------------------------------------------------------------';
  
  -- Check global_parameter_groups.display_order
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'global_parameter_groups' AND column_name = 'display_order'
  ) THEN
    RAISE NOTICE '✓ global_parameter_groups.display_order exists';
    column_count := column_count + 1;
  ELSE
    RAISE NOTICE '✗ global_parameter_groups.display_order MISSING';
    missing_columns := array_append(missing_columns, 'global_parameter_groups.display_order');
  END IF;
  
  -- Check users.is_super_admin
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_super_admin'
  ) THEN
    RAISE NOTICE '✓ users.is_super_admin exists';
    column_count := column_count + 1;
  ELSE
    RAISE NOTICE '✗ users.is_super_admin MISSING';
    missing_columns := array_append(missing_columns, 'users.is_super_admin');
  END IF;
  
  -- Check practices.bundesland
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'practices' AND column_name = 'bundesland'
  ) THEN
    RAISE NOTICE '✓ practices.bundesland exists';
    column_count := column_count + 1;
  ELSE
    RAISE NOTICE '✗ practices.bundesland MISSING';
    missing_columns := array_append(missing_columns, 'practices.bundesland');
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '---------------------------------------------------------------------';
  RAISE NOTICE 'Total columns verified: %', column_count;
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE NOTICE 'Missing columns: %', array_to_string(missing_columns, ', ');
  END IF;
  RAISE NOTICE '';

  -- =====================================================================
  -- COUNT ALL TABLES
  -- =====================================================================
  DECLARE
    total_tables INTEGER;
  BEGIN
    SELECT COUNT(*) INTO total_tables
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    RAISE NOTICE '3. TOTAL DATABASE TABLES: %', total_tables;
    RAISE NOTICE '';
  END;

  -- =====================================================================
  -- SAMPLE DATA CHECK
  -- =====================================================================
  RAISE NOTICE '4. CHECKING SAMPLE DATA...';
  RAISE NOTICE '---------------------------------------------------------------------';
  
  -- Check if feature_flags has data
  DECLARE
    ff_count INTEGER;
  BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flags') THEN
      SELECT COUNT(*) INTO ff_count FROM feature_flags;
      RAISE NOTICE 'feature_flags records: %', ff_count;
    END IF;
  END;
  
  -- Check if global_parameter_templates has data
  DECLARE
    gpt_count INTEGER;
  BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'global_parameter_templates') THEN
      SELECT COUNT(*) INTO gpt_count FROM global_parameter_templates;
      RAISE NOTICE 'global_parameter_templates records: %', gpt_count;
    END IF;
  END;
  
  -- Check if users has data
  DECLARE
    users_count INTEGER;
  BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
      SELECT COUNT(*) INTO users_count FROM users;
      RAISE NOTICE 'users records: %', users_count;
    END IF;
  END;

  RAISE NOTICE '';
  RAISE NOTICE '=====================================================================';
  
  IF array_length(missing_tables, 1) > 0 OR array_length(missing_columns, 1) > 0 THEN
    RAISE NOTICE 'VERIFICATION FAILED - Missing schema elements';
  ELSE
    RAISE NOTICE 'VERIFICATION SUCCESSFUL - All critical elements exist';
  END IF;
  
  RAISE NOTICE '=====================================================================';
END $$;
