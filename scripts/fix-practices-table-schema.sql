-- Fix practices table schema
-- 1. Add bundesland column for German state/region
-- 2. Add UUID auto-generation default for id column

-- Add bundesland column if it doesn't exist
ALTER TABLE public.practices 
ADD COLUMN IF NOT EXISTS bundesland TEXT;

-- Add default UUID generation for id column
-- This ensures new records get an automatic UUID if none is provided
ALTER TABLE public.practices 
ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- Add comment for documentation
COMMENT ON COLUMN public.practices.bundesland IS 'German federal state/region (Bundesland)';
COMMENT ON COLUMN public.practices.id IS 'Primary key with automatic UUID generation';
