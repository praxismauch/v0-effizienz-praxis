-- Delete Unused/Backup Tables
-- CAUTION: This will permanently delete these tables and all their data
-- Make sure to backup data if needed before running

-- BACKUP TABLES (confirmed unused in codebase - use database backups instead)
-- These are manual backup copies that should not exist in production
DROP TABLE IF EXISTS analytics_parameters_backup CASCADE;
DROP TABLE IF EXISTS parameter_values_backup CASCADE;
DROP TABLE IF EXISTS sick_leaves_backup CASCADE;

-- POTENTIALLY DUPLICATE TABLES (need manual verification before deletion)
-- userprofiles vs user_profiles - check if one is actually used
-- DROP TABLE IF EXISTS userprofiles CASCADE;

-- practice_users vs practice_members - check which one is the source of truth  
-- DROP TABLE IF EXISTS practice_users CASCADE;

-- knowledge_base_articles vs knowledge_base - check if articles table is legacy
-- DROP TABLE IF EXISTS knowledge_base_articles CASCADE;
-- DROP TABLE IF EXISTS knowledge_base_versions CASCADE;

-- template_skills - orphaned template system (no references found)
-- DROP TABLE IF EXISTS template_skills CASCADE;

-- Summary of deletions:
-- - 3 backup tables removed (analytics_parameters_backup, parameter_values_backup, sick_leaves_backup)
-- - Duplicates and orphaned tables commented out for manual verification
