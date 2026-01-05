import postgres from 'postgres'

console.log('[v0] Starting migration: Add interval column to analytics_parameters table')

const databaseUrl = process.env.POSTGRES_URL

if (!databaseUrl) {
  console.error('[v0] Error: Missing POSTGRES_URL environment variable')
  process.exit(1)
}

const sql = postgres(databaseUrl)

console.log('[v0] Executing SQL migration...')

// Execute the SQL migration
try {
  // Add interval column with default value and constraint
  await sql`
    ALTER TABLE analytics_parameters
    ADD COLUMN IF NOT EXISTS interval TEXT DEFAULT 'monthly' 
    CHECK (interval IN ('weekly', 'monthly', 'quarterly', 'yearly'))
  `

  console.log('[v0] Migration completed successfully!')
  console.log('[v0] The interval column has been added to the analytics_parameters table')
  console.log('[v0] KPIs can now have weekly, monthly, quarterly, or yearly intervals')
  
  await sql.end()
  
} catch (error) {
  console.error('[v0] Migration failed:', error.message)
  console.error('[v0] Error details:', error)
  
  // Check if column already exists
  if (error.message.includes('already exists')) {
    console.log('[v0] Column already exists - migration not needed')
  } else {
    console.error('[v0] Please check your database connection and try again')
    process.exit(1)
  }
  
  await sql.end()
}
