-- Diagnose favorites column issue
-- Check if the favorites column exists and can be used

-- 1. Check the column definition
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_sidebar_preferences'
ORDER BY ordinal_position;

-- 2. Check if we can directly insert/update favorites
-- First, let's see what data exists for this user
SELECT 
    id,
    user_id,
    practice_id,
    favorites,
    updated_at
FROM user_sidebar_preferences
WHERE user_id = '36883b61-34e4-4b9e-8a11-eb1a9656d2a0'
AND practice_id = '1';

-- 3. Try updating favorites directly to see if it works
UPDATE user_sidebar_preferences
SET favorites = ARRAY['/calendar']::text[],
    updated_at = NOW()
WHERE user_id = '36883b61-34e4-4b9e-8a11-eb1a9656d2a0'
AND practice_id = '1'
RETURNING *;

-- 4. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- 5. Verify the update worked
SELECT 
    id,
    user_id,
    practice_id,
    favorites,
    updated_at
FROM user_sidebar_preferences
WHERE user_id = '36883b61-34e4-4b9e-8a11-eb1a9656d2a0'
AND practice_id = '1';
