-- =====================================================
-- SEED SUBSCRIPTION PLANS WITH PRICING DATA
-- This script creates the subscription_plans table if it doesn't exist
-- and seeds it with default pricing data for the public pricing page
-- =====================================================

-- First, create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly INTEGER, -- Price in cents (e.g., 7900 = 79€)
  price_yearly INTEGER,  -- Price in cents
  old_price_monthly INTEGER, -- Original price for showing discounts
  old_price_yearly INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  max_users INTEGER,
  max_team_members INTEGER,
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (for pricing page)
DROP POLICY IF EXISTS "Anyone can view active subscription_plans" ON subscription_plans;
CREATE POLICY "Anyone can view active subscription_plans" ON subscription_plans
  FOR SELECT USING (is_active = true);

-- Create policy for admin write access
DROP POLICY IF EXISTS "Admins can manage subscription_plans" ON subscription_plans;
CREATE POLICY "Admins can manage subscription_plans" ON subscription_plans
  FOR ALL USING (true) WITH CHECK (true);

-- Clear existing data to avoid duplicates
DELETE FROM subscription_plans WHERE name IN ('Starter', 'Professional', 'Premium');

-- Insert the three standard pricing plans
INSERT INTO subscription_plans (
  name,
  description,
  price_monthly,
  price_yearly,
  old_price_monthly,
  old_price_yearly,
  features,
  max_users,
  max_team_members,
  is_active,
  display_order
) VALUES
(
  'Starter',
  'Perfekt für kleine Praxen',
  7900,  -- 79€ pro Monat
  79000, -- 790€ pro Jahr (2 Monate kostenlos)
  NULL,  -- Kein alter Preis
  NULL,
  '["Bis zu 3 Benutzer", "Basis Kennzahlen Dashboard", "Standard Analytics", "Email Support", "5 GB Speicherplatz"]'::jsonb,
  3,
  10,
  true,
  1
),
(
  'Professional',
  'Für wachsende Praxen',
  14900,  -- 149€ pro Monat
  149000, -- 1.490€ pro Jahr (2 Monate kostenlos)
  NULL,   -- Kein alter Preis
  NULL,
  '["Bis zu 10 Benutzer", "Erweiterte Kennzahlen", "Premium Analytics", "Recruiting Pipeline", "Form Builder", "Priority Support", "50 GB Speicherplatz"]'::jsonb,
  10,
  50,
  true,
  2
),
(
  'Premium',
  'Für gehobene Ansprüche',
  NULL,   -- Individuell
  NULL,   -- Individuell
  NULL,
  NULL,
  '["Unbegrenzte Benutzer", "Alle Features", "Custom Integrationen", "Dedicated Account Manager", "24/7 Premium Support", "Unbegrenzter Speicher", "SLA Garantie"]'::jsonb,
  NULL,   -- Unbegrenzt
  NULL,   -- Unbegrenzt
  true,
  3
);

-- Also ensure the system_settings table has the annual discount percentage
INSERT INTO system_settings (key, value, description)
VALUES ('annual_discount_percentage', '17', 'Prozentuale Ersparnis bei jährlicher Zahlung')
ON CONFLICT (key) DO UPDATE SET value = '17';

-- Verify the data
SELECT 
  name,
  description,
  price_monthly / 100.0 as price_monthly_eur,
  price_yearly / 100.0 as price_yearly_eur,
  features,
  is_active,
  display_order
FROM subscription_plans
WHERE is_active = true
ORDER BY display_order;
