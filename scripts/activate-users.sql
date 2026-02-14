-- Activate specific user accounts
-- This bypasses RLS policies by using security definer

-- Activate daniel.mauch@effizienz-praxis.de
UPDATE public.users 
SET is_active = true, updated_at = NOW()
WHERE email = 'daniel.mauch@effizienz-praxis.de';

-- Activate yahya.abdari@protonmail.com
UPDATE public.users 
SET is_active = true, updated_at = NOW()
WHERE email = 'yahya.abdari@protonmail.com';

-- Verify the changes
SELECT email, role, is_active, updated_at
FROM public.users 
WHERE email IN (
  'daniel.mauch@effizienz-praxis.de',
  'yahya.abdari@protonmail.com',
  'mauch.daniel@googlemail.com',
  'lamy000@protonmail.com'
)
ORDER BY email;
