import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

// 1. Extract all DB table names from the schema dump
const schemaContent = readFileSync('user_read_only_context/tool_content/listing-all-db-tables-supabase-list-tables-fc1u.txt', 'utf8');
const schema = JSON.parse(schemaContent);

const dbTables = new Map();
for (const table of schema) {
  const cols = table.columns.map(c => c.name);
  dbTables.set(table.name, {
    columns: cols,
    rls: table.rls_enabled,
    rows: table.rows,
  });
}

console.log("=== DATABASE TABLES (" + dbTables.size + ") ===");
console.log([...dbTables.keys()].sort().join('\n'));

// 2. Extract all .from("table") calls from code
function walkDir(dir, extensions, exclude = []) {
  let files = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      if (exclude.some(e => fullPath.includes(e))) continue;
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          files = files.concat(walkDir(fullPath, extensions, exclude));
        } else if (extensions.includes(extname(fullPath))) {
          files.push(fullPath);
        }
      } catch(e) {}
    }
  } catch(e) {}
  return files;
}

const codeFiles = walkDir('.', ['.ts', '.tsx'], ['node_modules', '.next', 'user_read_only_context', 'scripts']);
const fromRegex = /\.from\(["']([^"']+)["']\)/g;
const selectRegex = /\.select\(["'`]([^"'`]+)["'`]\)/g;
const eqRegex = /\.eq\(["']([^"']+)["']/g;
const insertRegex = /\.insert\(\{([^}]+)\}\)/gs;
const updateRegex = /\.update\(\{([^}]+)\}\)/gs;

const codeTableUsage = new Map(); // tableName -> [{file, line, columns_referenced}]
const missingTables = new Set();
const columnMismatches = [];

for (const file of codeFiles) {
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fromMatch = line.match(/\.from\(["']([^"']+)["']\)/);
    if (fromMatch) {
      const tableName = fromMatch[1];
      if (!codeTableUsage.has(tableName)) {
        codeTableUsage.set(tableName, []);
      }
      codeTableUsage.get(tableName).push({ file, lineNum: i + 1 });
      
      if (!dbTables.has(tableName)) {
        missingTables.add(tableName);
      }
    }
    
    // Check .eq() column references
    const eqMatches = [...line.matchAll(/\.eq\(["']([^"']+)["']/g)];
    for (const eqMatch of eqMatches) {
      const colName = eqMatch[1];
      // Find which table this belongs to by looking at preceding lines
      for (let j = i; j >= Math.max(0, i - 15); j--) {
        const prevFromMatch = lines[j].match(/\.from\(["']([^"']+)["']\)/);
        if (prevFromMatch) {
          const tbl = prevFromMatch[1];
          if (dbTables.has(tbl)) {
            const dbCols = dbTables.get(tbl).columns;
            if (!dbCols.includes(colName)) {
              columnMismatches.push({
                file,
                lineNum: i + 1,
                table: tbl,
                column: colName,
                type: 'eq_filter'
              });
            }
          }
          break;
        }
      }
    }
  }
  
  // Check insert/update column names
  const fullContent = content;
  const insertMatches = [...fullContent.matchAll(/\.from\(["']([^"']+)["']\)[\s\S]*?\.(?:insert|upsert)\(\s*(?:\[?\s*\{([^}]+)\})/g)];
  for (const match of insertMatches) {
    const tableName = match[1];
    const body = match[2];
    if (dbTables.has(tableName)) {
      const dbCols = dbTables.get(tableName).columns;
      const insertCols = [...body.matchAll(/(\w+)\s*:/g)].map(m => m[1]);
      for (const col of insertCols) {
        if (!dbCols.includes(col) && !['true', 'false', 'null', 'undefined', 'new', 'Date'].includes(col)) {
          columnMismatches.push({
            file: file,
            table: tableName,
            column: col,
            type: 'insert/upsert'
          });
        }
      }
    }
  }
}

console.log("\n\n=== TABLES REFERENCED IN CODE BUT NOT IN DATABASE ===");
for (const t of [...missingTables].sort()) {
  const usages = codeTableUsage.get(t) || [];
  console.log(`\n  TABLE: "${t}" (${usages.length} usage(s))`);
  for (const u of usages.slice(0, 5)) {
    console.log(`    - ${u.file}:${u.lineNum}`);
  }
  if (usages.length > 5) console.log(`    ... and ${usages.length - 5} more`);
}

console.log("\n\n=== COLUMN MISMATCHES (column referenced in code but not in DB table) ===");
// Deduplicate
const seen = new Set();
for (const m of columnMismatches) {
  const key = `${m.table}.${m.column}`;
  if (seen.has(key)) continue;
  seen.add(key);
  console.log(`  TABLE "${m.table}" - column "${m.column}" NOT FOUND (used in ${m.file}:${m.lineNum || '?'} via ${m.type})`);
}

console.log("\n\n=== CODE TABLE USAGE SUMMARY ===");
const sortedUsage = [...codeTableUsage.entries()].sort((a, b) => b[1].length - a[1].length);
for (const [table, usages] of sortedUsage.slice(0, 40)) {
  const exists = dbTables.has(table) ? 'OK' : 'MISSING';
  console.log(`  ${table}: ${usages.length} usage(s) [${exists}]`);
}
