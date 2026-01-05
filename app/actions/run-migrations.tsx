"use server"

export async function runMigrations() {
  const migrationSQL = `
-- Add interval column to analytics_parameters table
ALTER TABLE analytics_parameters
ADD COLUMN IF NOT EXISTS interval VARCHAR(20) DEFAULT 'monthly'
CHECK (interval IN ('weekly', 'monthly', 'quarterly', 'yearly'));

-- Add comment to explain the column
COMMENT ON COLUMN analytics_parameters.interval IS 'Reporting interval for the KPI: weekly, monthly, quarterly, or yearly';
  `.trim()

  return {
    success: true,
    message: "Please run the following SQL in your Supabase SQL Editor:",
    sql: migrationSQL,
  }
}
