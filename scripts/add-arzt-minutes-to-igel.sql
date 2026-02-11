ALTER TABLE igel_analyses ADD COLUMN IF NOT EXISTS arzt_minutes numeric DEFAULT 0;
ALTER TABLE igel_analyses ADD COLUMN IF NOT EXISTS mfa_minutes numeric DEFAULT 0;
ALTER TABLE igel_analyses ADD COLUMN IF NOT EXISTS honorar_goal numeric DEFAULT 500;
ALTER TABLE igel_analyses ADD COLUMN IF NOT EXISTS arzt_hourly_rate numeric DEFAULT 150;
ALTER TABLE igel_analyses ADD COLUMN IF NOT EXISTS mfa_hourly_rate numeric DEFAULT 22;
