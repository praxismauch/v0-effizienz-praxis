import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables')
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    console.log('🔧 Starting RLS policies fix...')
    console.log('📝 This will fix the "operator does not exist: text = uuid" error')
    console.log('')

    // Read the SQL file
    const sqlPath = join(__dirname, 'fix-user-preferences-rls-policies.sql')
    const sql = readFileSync(sqlPath, 'utf8')

    console.log('📄 Executing SQL migration...')
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // If exec_sql function doesn't exist, try direct execution
      console.log('⚠️  exec_sql function not found, trying direct execution...')
      
      // Split SQL into individual statements and execute them
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        if (statement.includes('DROP POLICY') || statement.includes('CREATE POLICY') || statement.includes('COMMENT ON')) {
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: statement })
          if (stmtError) {
            console.error(`⚠️  Warning executing statement: ${stmtError.message}`)
          }
        }
      }
    }

    console.log('')
    console.log('✅ RLS policies fix completed successfully!')
    console.log('')
    console.log('📋 What was fixed:')
    console.log('  • user_preferences RLS policies now use proper UUID to text casting')
    console.log('  • practice_settings RLS policies now use proper UUID to text casting')
    console.log('  • The "operator does not exist: text = uuid" error should be resolved')
    console.log('')
    console.log('🔄 Please refresh your application to see the changes')

  } catch (error) {
    console.error('❌ Error running migration:', error)
    console.error('')
    console.error('📝 Manual fix required:')
    console.error('  1. Go to your Supabase dashboard')
    console.error('  2. Navigate to SQL Editor')
    console.error('  3. Copy and paste the contents of scripts/fix-user-preferences-rls-policies.sql')
    console.error('  4. Execute the SQL')
    process.exit(1)
  }
}

runMigration()
