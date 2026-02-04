/**
 * Script to migrate console.log statements to Logger utility
 * 
 * Usage: node scripts/migrate-console-to-logger.mjs
 * 
 * This script will:
 * 1. Find all console.log/error/warn statements
 * 2. Replace them with appropriate Logger calls
 * 3. Add Logger import if not present
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")

// Track statistics
let totalConverted = 0
let filesModified = 0
let skippedFiles = 0

// Patterns to convert
const consolePatterns = {
  // console.log with [v0] prefix - these are debug statements
  v0Debug: /console\.log\(\s*["'`]\[v0\]/g,
  // console.error - convert to Logger.error
  error: /console\.error\(\s*["'`]([^"'`]+)["'`]\s*,?\s*(.*?)\s*\)/g,
  // console.warn - convert to Logger.warn  
  warn: /console\.warn\(\s*["'`]([^"'`]+)["'`]\s*,?\s*(.*?)\s*\)/g,
  // console.log with Error text - likely error logging
  logError: /console\.log\(\s*["'`]Error[^"'`]*["'`]/g,
  // console.log with debug/info text
  logDebug: /console\.log\(\s*["'`](?:Debug|INFO|Loading|Fetching|Processing|Starting|Completed)[^"'`]*["'`]/gi,
}

// Determine category from file path
function getCategoryFromPath(filePath) {
  if (filePath.includes("/api/")) return '"api"'
  if (filePath.includes("/auth/")) return '"auth"'
  if (filePath.includes("/components/")) return '"ui"'
  if (filePath.includes("/lib/supabase")) return '"supabase"'
  if (filePath.includes("/lib/")) return '"other"'
  if (filePath.includes("/cron/")) return '"cron"'
  if (filePath.includes("/email/")) return '"email"'
  if (filePath.includes("/ai/")) return '"ai"'
  return '"other"'
}

function needsLoggerImport(content) {
  return !content.includes('import Logger from') && 
         !content.includes('import { Logger }') &&
         !content.includes("import Logger from '@/lib/logger'") &&
         !content.includes('import Logger from "@/lib/logger"')
}

function addLoggerImport(content) {
  // Add import after the last import statement
  const importRegex = /^import .+ from .+$/gm
  let lastImportIndex = -1
  let match
  
  while ((match = importRegex.exec(content)) !== null) {
    lastImportIndex = match.index + match[0].length
  }
  
  if (lastImportIndex > -1) {
    return content.slice(0, lastImportIndex) + 
           '\nimport Logger from "@/lib/logger"' + 
           content.slice(lastImportIndex)
  }
  
  // No imports found, add at the beginning
  return 'import Logger from "@/lib/logger"\n\n' + content
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8")
  const originalContent = content
  let localConverted = 0
  const category = getCategoryFromPath(filePath)
  
  // Skip files that are already using Logger extensively
  const loggerUsageCount = (content.match(/Logger\.(debug|info|warn|error)/g) || []).length
  const consoleUsageCount = (content.match(/console\.(log|error|warn|debug)/g) || []).length
  
  // If file already uses Logger more than console, skip detailed conversion
  if (loggerUsageCount > consoleUsageCount * 2) {
    return 0
  }
  
  // Remove [v0] debug statements entirely (temporary debug logs)
  const v0Matches = content.match(/console\.log\(\s*["'`]\[v0\][^)]+\)\s*;?/g) || []
  if (v0Matches.length > 0) {
    content = content.replace(/console\.log\(\s*["'`]\[v0\][^)]+\)\s*;?\n?/g, '')
    localConverted += v0Matches.length
  }
  
  // Convert console.error to Logger.error
  content = content.replace(
    /console\.error\(\s*["'`]([^"'`]+)["'`]\s*(?:,\s*([^)]+))?\s*\)/g,
    (match, message, details) => {
      localConverted++
      if (details) {
        return `Logger.error(${category}, "${message}", ${details})`
      }
      return `Logger.error(${category}, "${message}")`
    }
  )
  
  // If content changed, add Logger import if needed
  if (content !== originalContent) {
    if (needsLoggerImport(content)) {
      content = addLoggerImport(content)
    }
    
    // Clean up excessive blank lines
    content = content.replace(/\n\n\n+/g, '\n\n')
    
    fs.writeFileSync(filePath, content, "utf8")
    totalConverted += localConverted
    filesModified++
    console.log(`✓ ${filePath.replace(rootDir, '')}: Converted ${localConverted} statement(s)`)
  }
  
  return localConverted
}

function walkDirectory(dir, extensions = [".ts", ".tsx"]) {
  if (!fs.existsSync(dir)) return
  
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      // Skip certain directories
      if (!["node_modules", ".next", "dist", "build", ".git", "scripts"].includes(file)) {
        walkDirectory(filePath, extensions)
      }
    } else if (extensions.some((ext) => file.endsWith(ext))) {
      // Skip test files and type definition files
      if (!file.includes(".test.") && !file.includes(".spec.") && !file.endsWith(".d.ts")) {
        processFile(filePath)
      }
    }
  }
}

console.log("Starting console to Logger migration...")
console.log("This will convert console.error to Logger.error and remove [v0] debug logs")
console.log("")

// Process directories
const dirsToProcess = [
  path.join(rootDir, "app", "api"),
  path.join(rootDir, "lib"),
]

for (const dir of dirsToProcess) {
  console.log(`Processing: ${dir.replace(rootDir, '')}`)
  walkDirectory(dir)
}

console.log("")
console.log("=".repeat(50))
console.log(`✓ Migration complete!`)
console.log(`  Files modified: ${filesModified}`)
console.log(`  Statements converted: ${totalConverted}`)
console.log("")
console.log("Next steps:")
console.log("  1. Review changes with: git diff")
console.log("  2. Run tests to ensure nothing broke")
console.log("  3. Commit the changes")
console.log("=".repeat(50))
