-- Robust migration to add all missing columns
-- Uses DO blocks for proper conditional column addition

-- 1. Add sort_order to user_favorites
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_favorites' AND column_name = 'sort_order') THEN
        ALTER TABLE public.user_favorites ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Add avatar_url to team_members
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'team_members' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.team_members ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- 3. Add is_open to time_blocks
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'time_blocks' AND column_name = 'is_open') THEN
        ALTER TABLE public.time_blocks ADD COLUMN is_open BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 4. Add comment to time_stamps
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'time_stamps' AND column_name = 'comment') THEN
        ALTER TABLE public.time_stamps ADD COLUMN comment TEXT DEFAULT '';
    END IF;
END $$;

-- 5. Add description to practices
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'practices' AND column_name = 'description') THEN
        ALTER TABLE public.practices ADD COLUMN description TEXT;
    END IF;
END $$;

-- Force PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
