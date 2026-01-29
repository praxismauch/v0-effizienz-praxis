-- Sync existing team_members to users table
-- This creates user records for all team members that don't have a user profile yet

INSERT INTO users (id, email, first_name, last_name, name, role, practice_id, is_active, created_at)
SELECT 
  tm.user_id,
  tm.email,
  tm.first_name,
  tm.last_name,
  COALESCE(tm.first_name || ' ' || tm.last_name, tm.email) as name,
  CASE 
    WHEN tm.role = 'admin' THEN 'admin'
    WHEN tm.role = 'owner' THEN 'admin'
    ELSE 'member'
  END as role,
  tm.practice_id,
  CASE WHEN tm.status = 'active' THEN true ELSE false END as is_active,
  tm.created_at
FROM team_members tm
WHERE tm.user_id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  name = EXCLUDED.name,
  practice_id = EXCLUDED.practice_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
