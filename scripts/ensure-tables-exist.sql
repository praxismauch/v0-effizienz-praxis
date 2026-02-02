-- Ensure all required tables exist with correct columns

-- Create user_favorites table if not exists
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    practice_id UUID,
    item_type TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_name TEXT,
    item_path TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_type, item_id)
);

-- Create time_stamps table if not exists
CREATE TABLE IF NOT EXISTS public.time_stamps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    practice_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type TEXT NOT NULL,
    location TEXT,
    comment TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create time_blocks table if not exists
CREATE TABLE IF NOT EXISTS public.time_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    practice_id UUID NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    start_stamp_id UUID,
    end_stamp_id UUID,
    status TEXT DEFAULT 'active',
    is_open BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Now add any missing columns to existing tables
ALTER TABLE public.user_favorites ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.time_blocks ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;
ALTER TABLE public.time_stamps ADD COLUMN IF NOT EXISTS comment TEXT DEFAULT '';
ALTER TABLE public.practices ADD COLUMN IF NOT EXISTS description TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_stamps_user_practice ON public.time_stamps(user_id, practice_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_practice ON public.time_blocks(user_id, practice_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON public.user_favorites(user_id);

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
