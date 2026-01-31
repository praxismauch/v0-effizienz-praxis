-- Check if favorites are being saved in the database
SELECT 
  user_id,
  practice_id,
  favorites,
  updated_at,
  created_at
FROM user_sidebar_preferences
WHERE user_id = '36883b61-34e4-4b9e-8a11-eb1a9656d2a0'
  AND practice_id = '1'
ORDER BY updated_at DESC;
