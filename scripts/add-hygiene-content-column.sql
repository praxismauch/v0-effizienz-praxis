-- Add content JSONB column to hygiene_plans table for storing AI-generated plan details
-- This column stores: objective, materials, steps, documentation, quality_indicators, references

ALTER TABLE hygiene_plans ADD COLUMN IF NOT EXISTS content jsonb DEFAULT '{}';
ALTER TABLE hygiene_plans ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE hygiene_plans ADD COLUMN IF NOT EXISTS responsible_role text;
ALTER TABLE hygiene_plans ADD COLUMN IF NOT EXISTS rki_reference_url text;
ALTER TABLE hygiene_plans ADD COLUMN IF NOT EXISTS is_rki_template boolean DEFAULT false;
ALTER TABLE hygiene_plans ADD COLUMN IF NOT EXISTS generated_at timestamptz;
ALTER TABLE hygiene_plans ADD COLUMN IF NOT EXISTS category text;
