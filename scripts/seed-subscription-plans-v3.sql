-- Seed subscription plans with pricing data
-- Version 3: Simplified without system_settings dependency and without old_price columns

-- First, create the subscription_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clear existing plans to avoid duplicates
DELETE FROM subscription_plans WHERE slug IN ('starter', 'professional', 'premium');

-- Insert Starter Plan
INSERT INTO subscription_plans (
  name, slug, description, price_monthly, price_yearly,
  features, limits, is_active, is_popular, display_order
) VALUES (
  'Starter',
  'starter',
  'Perfekt für kleine Praxen',
  79.00,
  758.40,
  '[
    "Bis zu 3 Benutzer",
    "Basis Kennzahlen-Dashboard",
    "Digitale Dokumentenverwaltung",
    "Kalender & Terminplanung",
    "E-Mail Support"
  ]'::jsonb,
  '{"max_users": 3, "max_team_members": 5}'::jsonb,
  true,
  false,
  1
);

-- Insert Professional Plan (Most Popular)
INSERT INTO subscription_plans (
  name, slug, description, price_monthly, price_yearly,
  features, limits, is_active, is_popular, display_order
) VALUES (
  'Professional',
  'professional',
  'Für wachsende Praxen',
  149.00,
  1430.40,
  '[
    "Bis zu 10 Benutzer",
    "Erweiterte Kennzahlen & Analytics",
    "KI-gestützte Analysen",
    "Workflow Automatisierung",
    "Team & Mitarbeiterverwaltung",
    "Prioritäts-Support"
  ]'::jsonb,
  '{"max_users": 10, "max_team_members": 15}'::jsonb,
  true,
  true,
  2
);

-- Insert Premium Plan
INSERT INTO subscription_plans (
  name, slug, description, price_monthly, price_yearly,
  features, limits, is_active, is_popular, display_order
) VALUES (
  'Premium',
  'premium',
  'Für gehobene Ansprüche',
  NULL,
  NULL,
  '[
    "Unbegrenzte Benutzer",
    "Alle Professional Features",
    "Dedizierter Success Manager",
    "Multi-Standort Unterstützung",
    "24/7 Premium Support",
    "Individuelle Anpassungen"
  ]'::jsonb,
  '{"max_users": -1, "max_team_members": -1}'::jsonb,
  true,
  false,
  3
);
