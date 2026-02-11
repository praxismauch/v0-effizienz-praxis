-- Add missing columns for protocol functionality to practice_journals table
-- The table was originally for journals (period_start/period_end) but is now also used for meeting protocols

-- Make period_start and period_end nullable since protocols use protocol_date instead
ALTER TABLE public.practice_journals ALTER COLUMN period_start DROP NOT NULL;
ALTER TABLE public.practice_journals ALTER COLUMN period_end DROP NOT NULL;

-- Add protocol-specific columns
ALTER TABLE public.practice_journals ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.practice_journals ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE public.practice_journals ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.practice_journals ADD COLUMN IF NOT EXISTS protocol_date TIMESTAMPTZ;
ALTER TABLE public.practice_journals ADD COLUMN IF NOT EXISTS action_items JSONB DEFAULT '[]'::jsonb;
