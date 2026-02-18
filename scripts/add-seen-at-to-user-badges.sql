-- Add seen_at column to academy_user_badges for tracking badge notification dismissal
ALTER TABLE academy_user_badges ADD COLUMN IF NOT EXISTS seen_at timestamptz DEFAULT NULL;
