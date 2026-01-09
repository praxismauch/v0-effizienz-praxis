-- Check practice 1 data status
-- Run this to see what data exists for practice_id = 1

-- Check teams
SELECT 'teams' as table_name, COUNT(*) as count FROM teams WHERE practice_id = '1' OR practice_id::text = '1';

-- Check team_assignments
SELECT 'team_assignments' as table_name, COUNT(*) as count FROM team_assignments WHERE practice_id = '1' OR practice_id::text = '1';

-- Check users (if exists)
SELECT 'users in practice' as table_name, COUNT(*) as count FROM auth.users;

-- Check shift_schedules
SELECT 'shift_schedules' as table_name, COUNT(*) as count FROM shift_schedules WHERE practice_id = '1' OR practice_id::text = '1';

-- Check shift_types
SELECT 'shift_types' as table_name, COUNT(*) as count FROM shift_types WHERE practice_id = '1' OR practice_id::text = '1';

-- Check todos
SELECT 'todos' as table_name, COUNT(*) as count FROM todos WHERE practice_id = 1;

-- Check goals
SELECT 'goals' as table_name, COUNT(*) as count FROM goals WHERE practice_id = 1;

-- Show actual teams data
SELECT * FROM teams WHERE practice_id = '1' OR practice_id::text = '1' LIMIT 10;

-- Show actual team_assignments data  
SELECT * FROM team_assignments WHERE practice_id = '1' OR practice_id::text = '1' LIMIT 10;
