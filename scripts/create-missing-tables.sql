-- Migration: Create missing tables for Effizienz Praxis
-- Run this in your Supabase SQL Editor

-- 1. Contract Files Table
CREATE TABLE IF NOT EXISTS public.contract_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contract_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contract_files
CREATE POLICY "Users can view contract files for their practice" ON public.contract_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      JOIN public.practices p ON c.practice_id = p.id
      JOIN public.practice_users pu ON p.id = pu.practice_id
      WHERE c.id = contract_files.contract_id
      AND pu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert contract files for their practice" ON public.contract_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contracts c
      JOIN public.practices p ON c.practice_id = p.id
      JOIN public.practice_users pu ON p.id = pu.practice_id
      WHERE c.id = contract_files.contract_id
      AND pu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contract files for their practice" ON public.contract_files
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      JOIN public.practices p ON c.practice_id = p.id
      JOIN public.practice_users pu ON p.id = pu.practice_id
      WHERE c.id = contract_files.contract_id
      AND pu.user_id = auth.uid()
    )
  );

-- 2. Skill Definitions Table
CREATE TABLE IF NOT EXISTS public.skill_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id UUID REFERENCES public.practices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_global BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.skill_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view skill definitions for their practice" ON public.skill_definitions
  FOR SELECT USING (
    is_global = TRUE OR
    EXISTS (
      SELECT 1 FROM public.practice_users pu
      WHERE pu.practice_id = skill_definitions.practice_id
      AND pu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage skill definitions for their practice" ON public.skill_definitions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.practice_users pu
      WHERE pu.practice_id = skill_definitions.practice_id
      AND pu.user_id = auth.uid()
    )
  );

-- 3. Team Member Skills History Table
CREATE TABLE IF NOT EXISTS public.team_member_skills_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  skill_definition_id UUID REFERENCES public.skill_definitions(id) ON DELETE SET NULL,
  skill_name TEXT NOT NULL,
  skill_level INTEGER CHECK (skill_level >= 1 AND skill_level <= 5),
  assessed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  assessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.team_member_skills_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view skills history for their practice" ON public.team_member_skills_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      JOIN public.practice_users pu ON tm.practice_id = pu.practice_id
      WHERE tm.id = team_member_skills_history.team_member_id
      AND pu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage skills history for their practice" ON public.team_member_skills_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      JOIN public.practice_users pu ON tm.practice_id = pu.practice_id
      WHERE tm.id = team_member_skills_history.team_member_id
      AND pu.user_id = auth.uid()
    )
  );

-- 4. Cockpit Card Settings Table
CREATE TABLE IF NOT EXISTS public.cockpit_card_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_id UUID REFERENCES public.practices(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  position INTEGER,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, practice_id, card_id)
);

ALTER TABLE public.cockpit_card_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cockpit settings" ON public.cockpit_card_settings
  FOR ALL USING (user_id = auth.uid());

-- 5. Landing Chat Logs Table
CREATE TABLE IF NOT EXISTS public.landing_chat_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  user_message TEXT NOT NULL,
  assistant_response TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.landing_chat_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view chat logs (no public access)
CREATE POLICY "Admins can view landing chat logs" ON public.landing_chat_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
  );

-- Allow anonymous inserts for chat logging
CREATE POLICY "Anyone can insert chat logs" ON public.landing_chat_logs
  FOR INSERT WITH CHECK (TRUE);

-- 6. Schedule Templates Table
CREATE TABLE IF NOT EXISTS public.schedule_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id UUID NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.schedule_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view schedule templates for their practice" ON public.schedule_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.practice_users pu
      WHERE pu.practice_id = schedule_templates.practice_id
      AND pu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage schedule templates for their practice" ON public.schedule_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.practice_users pu
      WHERE pu.practice_id = schedule_templates.practice_id
      AND pu.user_id = auth.uid()
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_contract_files_contract_id ON public.contract_files(contract_id);
CREATE INDEX IF NOT EXISTS idx_skill_definitions_practice_id ON public.skill_definitions(practice_id);
CREATE INDEX IF NOT EXISTS idx_team_member_skills_history_member_id ON public.team_member_skills_history(team_member_id);
CREATE INDEX IF NOT EXISTS idx_cockpit_card_settings_user_practice ON public.cockpit_card_settings(user_id, practice_id);
CREATE INDEX IF NOT EXISTS idx_landing_chat_logs_created_at ON public.landing_chat_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_schedule_templates_practice_id ON public.schedule_templates(practice_id);

-- Grant permissions
GRANT ALL ON public.contract_files TO authenticated;
GRANT ALL ON public.skill_definitions TO authenticated;
GRANT ALL ON public.team_member_skills_history TO authenticated;
GRANT ALL ON public.cockpit_card_settings TO authenticated;
GRANT INSERT ON public.landing_chat_logs TO anon;
GRANT SELECT ON public.landing_chat_logs TO authenticated;
GRANT ALL ON public.schedule_templates TO authenticated;
