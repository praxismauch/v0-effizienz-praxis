-- Add recurring_costs and total_recurring_cost columns to igel_analyses table
ALTER TABLE igel_analyses
ADD COLUMN IF NOT EXISTS recurring_costs jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS total_recurring_cost numeric DEFAULT 0;
