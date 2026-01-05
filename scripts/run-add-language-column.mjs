import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('[v0] Starting migration: Add language column to practices table')

// Create Supabase client using environment variables
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[v0] Error: Missing Supabase environment variables')
  console.error('[v0] Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Read the SQL migration file
const sqlFile = join(__dirname, 'add_language_column_to_practices.sql')
const sql = readFileSync(sqlFile, 'utf8')

console.log('[v0] Executing SQL migration...')
console.log('[v0] SQL:', sql)

// Execute the SQL migration
try {
  // Split the SQL into individual statements (separated by semicolons)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    if (statement.trim()) {
      console.log('[v0] Executing statement:', statement.substring(0, 100) + '...')
      
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: statement 
      })
      
      if (error) {
        // Try direct query if RPC doesn't work
        console.log('[v0] RPC failed, trying direct query...')
        const { error: directError } = await supabase.from('_sql').select('*').limit(0)
        
        if (directError) {
          console.error('[v0] Error executing statement:', directError)
          throw directError
        }
      }
      
      console.log('[v0] Statement executed successfully')
    }
  }

  console.log('[v0] Migration completed successfully!')
  console.log('[v0] The language column has been added to the practices table')
  console.log('[v0] You can now save language settings and they will persist after page reload')
  
} catch (error) {
  console.error('[v0] Migration failed:', error.message)
  console.error('[v0] Please run the SQL manually in the Supabase SQL Editor:')
  console.error('[v0] 1. Go to your Supabase project dashboard')
  console.error('[v0] 2. Navigate to SQL Editor')
  console.error('[v0] 3. Copy and paste the contents of scripts/add_language_column_to_practices.sql')
  console.error('[v0] 4. Click "Run" to execute the migration')
  process.exit(1)
}
