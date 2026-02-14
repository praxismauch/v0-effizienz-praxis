import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface ColumnMismatch {
  file: string
  table: string
  missingColumns: string[]
  query: string
}

interface TableSchema {
  table_name: string
  column_name: string
  data_type: string
}

async function getTableSchemas(): Promise<Map<string, Set<string>>> {
  const { data, error } = await supabase.rpc('get_table_columns')
  
  // If RPC doesn't exist, query directly
  const { data: rawData, error: rawError } = await supabase
    .from('information_schema.columns')
    .select('table_name, column_name, data_type')
    .eq('table_schema', 'public')
  
  const schemaMap = new Map<string, Set<string>>()
  
  if (rawData) {
    rawData.forEach((row: TableSchema) => {
      if (!schemaMap.has(row.table_name)) {
        schemaMap.set(row.table_name, new Set())
      }
      schemaMap.get(row.table_name)!.add(row.column_name)
    })
  }
  
  return schemaMap
}

function extractSelectColumns(content: string, tableName: string): string[] {
  const columns: string[] = []
  
  // Match .select('columns') or .select("columns") or .select(`columns`)
  const selectRegex = new RegExp(`\\.from\\(['"\`]${tableName}['"\`]\\)\\s*\\.select\\(['"\`]([^'"\`]+)['"\`]\\)`, 'g')
  let match
  
  while ((match = selectRegex.exec(content)) !== null) {
    const columnList = match[1]
    if (columnList && columnList !== '*') {
      // Split by comma and clean up
      columnList.split(',').forEach(col => {
        const cleaned = col.trim().split('(')[0].split(':')[0]
        if (cleaned && !cleaned.includes('*')) {
          columns.push(cleaned)
        }
      })
    }
  }
  
  return columns
}

function extractInsertColumns(content: string, tableName: string): string[] {
  const columns: string[] = []
  
  // Find insert/upsert operations
  const insertRegex = new RegExp(`\\.from\\(['"\`]${tableName}['"\`]\\)\\s*\\.(insert|upsert)\\(\\s*{([^}]+)}`, 'g')
  let match
  
  while ((match = insertRegex.exec(content)) !== null) {
    const objContent = match[2]
    // Extract keys from object
    const keyRegex = /(\w+):/g
    let keyMatch
    while ((keyMatch = keyRegex.exec(objContent)) !== null) {
      columns.push(keyMatch[1])
    }
  }
  
  return columns
}

async function scanApiFiles(schemasMap: Map<string, Set<string>>): Promise<ColumnMismatch[]> {
  const mismatches: ColumnMismatch[] = []
  const apiDir = path.join(process.cwd(), 'app', 'api')
  
  function walkDir(dir: string) {
    const files = fs.readdirSync(dir)
    
    files.forEach(file => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory()) {
        walkDir(filePath)
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf-8')
        
        // Check each table
        schemasMap.forEach((columns, tableName) => {
          const selectCols = extractSelectColumns(content, tableName)
          const insertCols = extractInsertColumns(content, tableName)
          const allRequestedCols = [...new Set([...selectCols, ...insertCols])]
          
          const missing = allRequestedCols.filter(col => !columns.has(col))
          
          if (missing.length > 0) {
            // Extract the actual query for context
            const queryMatch = content.match(new RegExp(`.from\\(['"\`]${tableName}['"\`]\\)[^;]+`, 'g'))
            
            mismatches.push({
              file: filePath.replace(process.cwd(), ''),
              table: tableName,
              missingColumns: missing,
              query: queryMatch ? queryMatch[0].substring(0, 200) : 'N/A'
            })
          }
        })
      }
    })
  }
  
  walkDir(apiDir)
  return mismatches
}

async function main() {
  console.log('Fetching database schemas...')
  const schemas = await getTableSchemas()
  console.log(`Found ${schemas.size} tables in database`)
  
  console.log('\nScanning API files for mismatches...')
  const mismatches = await scanApiFiles(schemas)
  
  console.log(`\nFound ${mismatches.length} potential issues:\n`)
  
  // Group by table
  const byTable = new Map<string, ColumnMismatch[]>()
  mismatches.forEach(m => {
    if (!byTable.has(m.table)) {
      byTable.set(m.table, [])
    }
    byTable.get(m.table)!.push(m)
  })
  
  byTable.forEach((issues, table) => {
    console.log(`\n## Table: ${table}`)
    const allMissingCols = new Set<string>()
    issues.forEach(issue => {
      issue.missingColumns.forEach(col => allMissingCols.add(col))
    })
    console.log(`Missing columns: ${Array.from(allMissingCols).join(', ')}`)
    console.log(`Affected files: ${issues.length}`)
    issues.forEach(issue => {
      console.log(`  - ${issue.file}`)
    })
  })
  
  // Write to file
  fs.writeFileSync(
    'api-db-mismatches.json',
    JSON.stringify({ mismatches, byTable: Array.from(byTable.entries()) }, null, 2)
  )
  console.log('\n\nResults written to api-db-mismatches.json')
}

main().catch(console.error)
