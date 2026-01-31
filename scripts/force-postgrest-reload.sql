-- Force PostgREST to reload schema cache aggressively
-- This script sends multiple signals to ensure PostgREST recognizes schema changes

-- First, verify the favorites column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_sidebar_preferences'
  AND column_name = 'favorites';

-- Send multiple reload notifications
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst;

-- Wait a moment
SELECT pg_sleep(1);

-- Send again to be sure
NOTIFY pgrst, 'reload schema';

-- Show confirmation
SELECT 'Schema cache reload notifications sent successfully' as status;
