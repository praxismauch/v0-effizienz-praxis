-- Create contracts table without foreign key constraints initially
CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id UUID NOT NULL,
  team_member_id UUID NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'Vollzeit',
  start_date DATE NOT NULL,
  end_date DATE,
  hours_per_week DECIMAL(5,2),
  salary DECIMAL(10,2),
  salary_currency TEXT DEFAULT 'EUR',
  bonus_personal_goal DECIMAL(5,2),
  bonus_practice_goal DECIMAL(5,2),
  bonus_employee_discussion DECIMAL(5,2),
  has_13th_salary BOOLEAN DEFAULT false,
  vacation_bonus DECIMAL(10,2),
  additional_payments JSONB DEFAULT '[]'::jsonb,
  holiday_days_fulltime INTEGER DEFAULT 30,
  working_days_fulltime INTEGER DEFAULT 5,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_contracts_practice_id ON contracts(practice_id);
CREATE INDEX IF NOT EXISTS idx_contracts_team_member_id ON contracts(team_member_id);

-- Verify the table was created
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contracts' 
ORDER BY ordinal_position;
