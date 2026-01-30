-- Create practice journals table
CREATE TABLE IF NOT EXISTS public.practice_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  title TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  content TEXT,
  summary TEXT,
  insights TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
);

-- Create journal preferences table
CREATE TABLE IF NOT EXISTS public.journal_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL UNIQUE,
  auto_generate BOOLEAN DEFAULT false,
  generation_frequency TEXT DEFAULT 'weekly',
  include_kpis BOOLEAN DEFAULT true,
  include_goals BOOLEAN DEFAULT true,
  include_team BOOLEAN DEFAULT true,
  include_finances BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT false,
  notification_emails TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create journal action items table
CREATE TABLE IF NOT EXISTS public.journal_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID REFERENCES public.practice_journals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  assigned_to UUID,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_practice_journals_practice_id ON public.practice_journals(practice_id);
CREATE INDEX IF NOT EXISTS idx_practice_journals_deleted_at ON public.practice_journals(deleted_at);
CREATE INDEX IF NOT EXISTS idx_journal_preferences_practice_id ON public.journal_preferences(practice_id);
CREATE INDEX IF NOT EXISTS idx_journal_action_items_journal_id ON public.journal_action_items(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_action_items_status ON public.journal_action_items(status);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_practice_journals_updated_at
  BEFORE UPDATE ON public.practice_journals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_preferences_updated_at
  BEFORE UPDATE ON public.journal_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_action_items_updated_at
  BEFORE UPDATE ON public.journal_action_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
