-- Add old_price columns to subscription_plans table for showing discounted prices
-- These columns store the original/strikethrough prices

-- Add old_price_monthly column if it doesn't exist
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS old_price_monthly numeric;

-- Add old_price_yearly column if it doesn't exist
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS old_price_yearly numeric;

-- Update existing plans with old prices (showing a discount)
-- Starter: old price 99€, new price 79€
UPDATE subscription_plans 
SET old_price_monthly = 9900, old_price_yearly = 94800
WHERE name = 'Starter' AND old_price_monthly IS NULL;

-- Professional: old price 199€, new price 149€  
UPDATE subscription_plans 
SET old_price_monthly = 19900, old_price_yearly = 190800
WHERE name = 'Professional' AND old_price_monthly IS NULL;

-- Premium: no old price (custom pricing)
UPDATE subscription_plans 
SET old_price_monthly = NULL, old_price_yearly = NULL
WHERE name = 'Premium';

-- Verify the updates
SELECT name, price_monthly, old_price_monthly, price_yearly, old_price_yearly, is_active
FROM subscription_plans
WHERE is_active = true
ORDER BY display_order;
