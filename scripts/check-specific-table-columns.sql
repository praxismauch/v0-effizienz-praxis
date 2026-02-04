-- Check columns for specific tables that may need updates
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('calendar_events', 'holiday_requests', 'workflows', 'teams', 'team_members')
ORDER BY table_name, ordinal_position;
