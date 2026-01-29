-- Create Analytics Tables for Praxis-Auswertung
-- These tables support the Analytics page functionality

-- 1. Analytics Parameters Table (master data for KPIs)
CREATE TABLE IF NOT EXISTS analytics_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('financial', 'operational', 'quality', 'hr', 'custom')),
  unit TEXT,
  data_type TEXT DEFAULT 'number' CHECK (data_type IN ('number', 'percentage', 'currency', 'text')),
  description TEXT,
  target_value NUMERIC(15, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Parameter Values Table (actual recorded values)
CREATE TABLE IF NOT EXISTS parameter_values (
  id TEXT PRIMARY KEY,
  practice_id TEXT NOT NULL,
  parameter_id UUID NOT NULL,
  value TEXT NOT NULL,
  recorded_date DATE NOT NULL,
  recorded_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Sick Leaves Table (employee sick leave tracking)
CREATE TABLE IF NOT EXISTS sick_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  notes TEXT,
  certificate_required BOOLEAN DEFAULT false,
  certificate_received BOOLEAN DEFAULT false,
  created_by UUID,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Bank Transactions Table (financial transaction tracking)
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  category TEXT,
  account_name TEXT,
  account_number TEXT,
  reference TEXT,
  type TEXT CHECK (type IN ('income', 'expense', 'transfer')),
  is_recurring BOOLEAN DEFAULT false,
  notes TEXT,
  imported_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_parameters_practice ON analytics_parameters(practice_id);
CREATE INDEX IF NOT EXISTS idx_analytics_parameters_category ON analytics_parameters(category);
CREATE INDEX IF NOT EXISTS idx_analytics_parameters_active ON analytics_parameters(is_active);

CREATE INDEX IF NOT EXISTS idx_parameter_values_practice ON parameter_values(practice_id);
CREATE INDEX IF NOT EXISTS idx_parameter_values_parameter ON parameter_values(parameter_id);
CREATE INDEX IF NOT EXISTS idx_parameter_values_date ON parameter_values(recorded_date);
CREATE INDEX IF NOT EXISTS idx_parameter_values_recorded_by ON parameter_values(recorded_by);

CREATE INDEX IF NOT EXISTS idx_sick_leaves_practice ON sick_leaves(practice_id);
CREATE INDEX IF NOT EXISTS idx_sick_leaves_user ON sick_leaves(user_id);
CREATE INDEX IF NOT EXISTS idx_sick_leaves_dates ON sick_leaves(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_sick_leaves_status ON sick_leaves(status);
CREATE INDEX IF NOT EXISTS idx_sick_leaves_deleted ON sick_leaves(deleted_at);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_practice ON bank_transactions(practice_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_category ON bank_transactions(category);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_type ON bank_transactions(type);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_analytics_parameters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_parameter_values_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_sick_leaves_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_bank_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS analytics_parameters_updated_at ON analytics_parameters;
CREATE TRIGGER analytics_parameters_updated_at
  BEFORE UPDATE ON analytics_parameters
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_parameters_updated_at();

DROP TRIGGER IF EXISTS parameter_values_updated_at ON parameter_values;
CREATE TRIGGER parameter_values_updated_at
  BEFORE UPDATE ON parameter_values
  FOR EACH ROW
  EXECUTE FUNCTION update_parameter_values_updated_at();

DROP TRIGGER IF EXISTS sick_leaves_updated_at ON sick_leaves;
CREATE TRIGGER sick_leaves_updated_at
  BEFORE UPDATE ON sick_leaves
  FOR EACH ROW
  EXECUTE FUNCTION update_sick_leaves_updated_at();

DROP TRIGGER IF EXISTS bank_transactions_updated_at ON bank_transactions;
CREATE TRIGGER bank_transactions_updated_at
  BEFORE UPDATE ON bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_transactions_updated_at();
