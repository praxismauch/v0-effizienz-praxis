-- Enable RLS on journal tables
ALTER TABLE public.practice_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_action_items ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
DROP POLICY IF EXISTS "Allow all" ON public.practice_journals;
CREATE POLICY "Allow all" ON public.practice_journals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON public.journal_preferences;
CREATE POLICY "Allow all" ON public.journal_preferences FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON public.journal_action_items;
CREATE POLICY "Allow all" ON public.journal_action_items FOR ALL USING (true) WITH CHECK (true);
