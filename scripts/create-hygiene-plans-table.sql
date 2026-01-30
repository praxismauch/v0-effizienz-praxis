-- Create hygiene_plans table for managing practice hygiene plans
CREATE TABLE IF NOT EXISTS hygiene_plans (
  id BIGSERIAL PRIMARY KEY,
  practice_id BIGINT NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- e.g., 'surface_disinfection', 'hand_hygiene', 'sterilization', 'waste_management'
  frequency VARCHAR(50), -- e.g., 'daily', 'weekly', 'monthly', 'as_needed'
  responsible_role VARCHAR(100),
  content JSONB NOT NULL DEFAULT '{}', -- Structured content including steps, materials, protocols
  is_rki_template BOOLEAN DEFAULT FALSE, -- Indicates if it's based on RKI guidelines
  rki_reference_url TEXT, -- Link to RKI guidelines
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'draft', 'archived'
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_hygiene_plans_practice_id ON hygiene_plans(practice_id);
CREATE INDEX IF NOT EXISTS idx_hygiene_plans_category ON hygiene_plans(category);
CREATE INDEX IF NOT EXISTS idx_hygiene_plans_status ON hygiene_plans(status);
CREATE INDEX IF NOT EXISTS idx_hygiene_plans_is_rki_template ON hygiene_plans(is_rki_template);

-- Create hygiene_plan_tasks table for tracking completion
CREATE TABLE IF NOT EXISTS hygiene_plan_tasks (
  id BIGSERIAL PRIMARY KEY,
  hygiene_plan_id BIGINT NOT NULL REFERENCES hygiene_plans(id) ON DELETE CASCADE,
  practice_id BIGINT NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  assigned_to BIGINT REFERENCES users(id),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by BIGINT REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hygiene_plan_tasks_hygiene_plan_id ON hygiene_plan_tasks(hygiene_plan_id);
CREATE INDEX IF NOT EXISTS idx_hygiene_plan_tasks_practice_id ON hygiene_plan_tasks(practice_id);
CREATE INDEX IF NOT EXISTS idx_hygiene_plan_tasks_assigned_to ON hygiene_plan_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_hygiene_plan_tasks_due_date ON hygiene_plan_tasks(due_date);

-- Enable RLS
ALTER TABLE hygiene_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE hygiene_plan_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hygiene_plans
CREATE POLICY "Users can view hygiene plans of their practice"
  ON hygiene_plans FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert hygiene plans for their practice"
  ON hygiene_plans FOR INSERT
  WITH CHECK (
    practice_id IN (
      SELECT practice_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'practice_owner')
    )
  );

CREATE POLICY "Admins can update hygiene plans of their practice"
  ON hygiene_plans FOR UPDATE
  USING (
    practice_id IN (
      SELECT practice_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'practice_owner')
    )
  );

CREATE POLICY "Admins can delete hygiene plans of their practice"
  ON hygiene_plans FOR DELETE
  USING (
    practice_id IN (
      SELECT practice_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'practice_owner')
    )
  );

-- RLS Policies for hygiene_plan_tasks
CREATE POLICY "Users can view tasks of their practice"
  ON hygiene_plan_tasks FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks for their practice"
  ON hygiene_plan_tasks FOR INSERT
  WITH CHECK (
    practice_id IN (
      SELECT practice_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their assigned tasks"
  ON hygiene_plan_tasks FOR UPDATE
  USING (
    assigned_to = auth.uid() OR
    practice_id IN (
      SELECT practice_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'practice_owner')
    )
  );
