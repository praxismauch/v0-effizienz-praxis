/**
 * API Database Column Audit Script
 * 
 * This script audits all API routes and checks:
 * 1. Which database columns each API accesses
 * 2. Which columns are missing from their respective tables
 * 3. Which API routes are potentially unused
 * 
 * Run with: npx tsx scripts/audit-api-database-columns.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as glob from 'glob'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface ColumnAccess {
  apiFile: string
  tableName: string
  columns: string[]
  lineNumber?: number
}

interface MissingColumn {
  table: string
  column: string
  usedInFiles: string[]
}

interface UnusedAPI {
  file: string
  reason: string
}

async function getTableColumns() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  const { data, error } = await supabase.rpc('get_table_columns')
  
  if (error) {
    console.error('Error fetching columns:', error)
    return {}
  }
  
  const tableColumns: Record<string, Set<string>> = {}
  
  if (data) {
    data.forEach((row: any) => {
      if (!tableColumns[row.table_name]) {
        tableColumns[row.table_name] = new Set()
      }
      tableColumns[row.table_name].add(row.column_name)
    })
  }
  
  return tableColumns
}

function extractSupabaseQueries(fileContent: string, filePath: string): ColumnAccess[] {
  const accesses: ColumnAccess[] = []
  const lines = fileContent.split('\n')
  
  // Match .from('table_name') or .from("table_name")
  const fromRegex = /\.from\(['"](\w+)['"]\)/g
  
  // Match .select('col1, col2') or .select('*, !excluded')
  const selectRegex = /\.select\(['"]([^'"]+)['"]\)/g
  
  // Match .insert({ col: val }) or .update({ col: val })
  const insertUpdateRegex = /\.(insert|update)\(\s*\{([^}]+)\}/g
  
  lines.forEach((line, index) => {
    let match: RegExpExecArray | null
    
    // Find table names
    const tableMatches: string[] = []
    while ((match = fromRegex.exec(line)) !== null) {
      tableMatches.push(match[1])
    }
    
    // Find column names in select
    while ((match = selectRegex.exec(line)) !== null) {
      const selectCols = match[1]
        .split(',')
        .map(col => col.trim())
        .filter(col => col !== '*' && !col.startsWith('!') && col !== '')
      
      tableMatches.forEach(table => {
        accesses.push({
          apiFile: filePath,
          tableName: table,
          columns: selectCols,
          lineNumber: index + 1
        })
      })
    }
    
    // Find column names in insert/update
    while ((match = insertUpdateRegex.exec(line)) !== null) {
      const objContent = match[2]
      const colMatches = objContent.match(/(\w+):/g)
      if (colMatches) {
        const cols = colMatches.map(m => m.replace(':', ''))
        tableMatches.forEach(table => {
          accesses.push({
            apiFile: filePath,
            tableName: table,
            columns: cols,
            lineNumber: index + 1
          })
        })
      }
    }
  })
  
  return accesses
}

async function auditAPIs() {
  console.log('🔍 Starting API Database Column Audit...\n')
  
  // Get all database table columns
  console.log('📊 Fetching database schema...')
  const tableColumns = await getTableColumns()
  console.log(`Found ${Object.keys(tableColumns).length} tables in database\n`)
  
  // Find all API route files
  const apiFiles = glob.sync('app/api/**/*.ts', { 
    ignore: ['**/node_modules/**', '**/*.test.ts'] 
  })
  console.log(`Found ${apiFiles.length} API files to audit\n`)
  
  const allAccesses: ColumnAccess[] = []
  const missingColumns: MissingColumn[] = []
  const filesWithErrors: string[] = []
  
  // Analyze each API file
  for (const file of apiFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8')
      const accesses = extractSupabaseQueries(content, file)
      allAccesses.push(...accesses)
      
      // Check for missing columns
      accesses.forEach(access => {
        const tableCols = tableColumns[access.tableName]
        if (!tableCols) {
          // Table doesn't exist
          return
        }
        
        access.columns.forEach(col => {
          if (!tableCols.has(col)) {
            const existing = missingColumns.find(
              m => m.table === access.tableName && m.column === col
            )
            if (existing) {
              existing.usedInFiles.push(file)
            } else {
              missingColumns.push({
                table: access.tableName,
                column: col,
                usedInFiles: [file]
              })
            }
          }
        })
      })
    } catch (error) {
      filesWithErrors.push(file)
      console.error(`Error processing ${file}:`, error)
    }
  }
  
  // Generate report
  console.log('📝 === AUDIT REPORT ===\n')
  
  console.log(`✅ Total API files analyzed: ${apiFiles.length}`)
  console.log(`✅ Total database accesses found: ${allAccesses.length}`)
  console.log(`❌ Missing columns found: ${missingColumns.length}\n`)
  
  if (missingColumns.length > 0) {
    console.log('🚨 MISSING COLUMNS (APIs requesting non-existent columns):\n')
    missingColumns.forEach((missing, i) => {
      console.log(`${i + 1}. Table: ${missing.table}, Column: ${missing.column}`)
      console.log(`   Used in ${missing.usedInFiles.length} file(s):`)
      missing.usedInFiles.slice(0, 3).forEach(file => {
        console.log(`   - ${file}`)
      })
      if (missing.usedInFiles.length > 3) {
        console.log(`   ... and ${missing.usedInFiles.length - 3} more`)
      }
      console.log()
    })
  }
  
  // Write detailed report to file
  const report = {
    summary: {
      totalAPIFiles: apiFiles.length,
      totalAccesses: allAccesses.length,
      missingColumns: missingColumns.length,
      filesWithErrors: filesWithErrors.length
    },
    missingColumns,
    allAccesses: allAccesses.slice(0, 100), // First 100 for brevity
    filesWithErrors
  }
  
  fs.writeFileSync(
    'API_COLUMN_AUDIT_REPORT.json',
    JSON.stringify(report, null, 2)
  )
  
  console.log('📄 Full report written to: API_COLUMN_AUDIT_REPORT.json')
  console.log('\n✨ Audit complete!')
}

// Run audit
auditAPIs().catch(console.error)
