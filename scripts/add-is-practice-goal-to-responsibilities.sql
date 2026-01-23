-- Add is_practice_goal column to responsibilities table
-- This allows admins to mark responsibilities as "Persönliches Praxisziel"

ALTER TABLE responsibilities 
ADD COLUMN IF NOT EXISTS is_practice_goal BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN responsibilities.is_practice_goal IS 'Indicates if this responsibility is a personal practice goal (Persönliches Praxisziel)';
