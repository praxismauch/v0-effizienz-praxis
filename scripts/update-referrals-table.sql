-- Migration: Update referrals table to support subscription-based rewards
-- New concept: "Einladen – und beide erhalten 3 Monate Effizienz-Praxis kostenlos"

-- Add reward_months column if it doesn't exist
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS reward_months INTEGER DEFAULT 3;

-- Add column to track if referred user also got their reward
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS referred_reward_applied BOOLEAN DEFAULT FALSE;

-- Add column to track if referrer got their reward
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS referrer_reward_applied BOOLEAN DEFAULT FALSE;

-- Update existing referrals to have 3 months reward (migrate from money-based to month-based)
UPDATE referrals 
SET reward_months = 3 
WHERE reward_months IS NULL;

-- Add comment to document the new reward structure
COMMENT ON COLUMN referrals.reward_months IS 'Number of free months both referrer and referred user receive (default: 3)';
COMMENT ON COLUMN referrals.referred_reward_applied IS 'Whether the referred user has received their free months';
COMMENT ON COLUMN referrals.referrer_reward_applied IS 'Whether the referrer has received their free months';
