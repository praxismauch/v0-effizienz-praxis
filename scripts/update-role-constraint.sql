-- Update users table role constraint to support all 7 roles
-- Drop the old constraint and create a new one with all valid roles

-- Drop the existing check constraint on the role column
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new check constraint with all 7 valid roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role = ANY (ARRAY[
    'superadmin'::text, 
    'practiceadmin'::text, 
    'admin'::text, 
    'manager'::text, 
    'member'::text, 
    'viewer'::text, 
    'extern'::text
  ]));

-- Update any legacy role values to new standard
-- Convert 'user' to 'member' (legacy alias)
UPDATE users SET role = 'member' WHERE role = 'user';

-- Convert 'poweruser' to 'manager' (legacy alias)
UPDATE users SET role = 'manager' WHERE role = 'poweruser';

-- Convert 'practice_admin' to 'practiceadmin' (legacy alias)
UPDATE users SET role = 'practiceadmin' WHERE role = 'practice_admin';

-- Convert 'super_admin' to 'superadmin' (legacy alias)
UPDATE users SET role = 'superadmin' WHERE role = 'super_admin';

-- Update team_members table to match
UPDATE team_members SET role = 'member' WHERE role = 'user';
UPDATE team_members SET role = 'manager' WHERE role = 'poweruser';
UPDATE team_members SET role = 'practiceadmin' WHERE role = 'practice_admin';
UPDATE team_members SET role = 'superadmin' WHERE role = 'super_admin';

-- Verify all users have valid roles
SELECT 
  role, 
  COUNT(*) as count,
  CASE 
    WHEN role IN ('superadmin', 'practiceadmin', 'admin', 'manager', 'member', 'viewer', 'extern') 
    THEN '✓ Valid' 
    ELSE '✗ Invalid' 
  END as status
FROM users 
GROUP BY role 
ORDER BY 
  CASE role
    WHEN 'superadmin' THEN 1
    WHEN 'practiceadmin' THEN 2
    WHEN 'admin' THEN 3
    WHEN 'manager' THEN 4
    WHEN 'member' THEN 5
    WHEN 'viewer' THEN 6
    WHEN 'extern' THEN 7
    ELSE 99
  END;
