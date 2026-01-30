-- Create vaccination records table for team members
-- This tracks vaccination status for medical practice employees

CREATE TABLE IF NOT EXISTS public.vaccination_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  practice_id INTEGER NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  vaccination_type TEXT NOT NULL, -- e.g., 'hepatitis_b', 'measles', 'tetanus', etc.
  vaccination_name TEXT NOT NULL, -- Display name in German
  date_administered DATE,
  expiry_date DATE,
  next_due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, up_to_date, overdue, not_required
  titer_control_done BOOLEAN DEFAULT FALSE, -- Specifically for Hepatitis B
  titer_control_date DATE,
  titer_control_result TEXT,
  proof_document_url TEXT, -- Link to uploaded proof document
  notes TEXT,
  is_required BOOLEAN DEFAULT FALSE, -- Required by IfSG (Infektionsschutzgesetz)
  batch_number TEXT,
  administered_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_vaccination_records_team_member_id ON public.vaccination_records(team_member_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_records_practice_id ON public.vaccination_records(practice_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_records_status ON public.vaccination_records(status);
CREATE INDEX IF NOT EXISTS idx_vaccination_records_vaccination_type ON public.vaccination_records(vaccination_type);
CREATE INDEX IF NOT EXISTS idx_vaccination_records_next_due_date ON public.vaccination_records(next_due_date);

-- Enable RLS
ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view vaccination records in their practice"
  ON public.vaccination_records
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM public.team_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage vaccination records in their practice"
  ON public.vaccination_records
  FOR ALL
  USING (
    practice_id IN (
      SELECT practice_id FROM public.team_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'practiceadmin')
    )
  );

-- Create view for vaccination overview
CREATE OR REPLACE VIEW public.vaccination_overview AS
SELECT 
  vr.id,
  vr.team_member_id,
  vr.practice_id,
  vr.vaccination_type,
  vr.vaccination_name,
  vr.status,
  vr.next_due_date,
  vr.is_required,
  vr.titer_control_done,
  tm.first_name,
  tm.last_name,
  tm.email,
  CASE
    WHEN vr.next_due_date < CURRENT_DATE THEN 'overdue'
    WHEN vr.next_due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'due_soon'
    WHEN vr.next_due_date > CURRENT_DATE + INTERVAL '30 days' THEN 'up_to_date'
    ELSE 'pending'
  END as urgency_status
FROM public.vaccination_records vr
JOIN public.team_members tm ON vr.team_member_id = tm.id
WHERE tm.status = 'active';

-- Add comment
COMMENT ON TABLE public.vaccination_records IS 'Stores vaccination status and records for team members in medical practices';
