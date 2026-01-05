#!/usr/bin/env node

/**
 * Automatic UUID Comparison Fixer
 *
 * Fixes PostgreSQL "operator does not exist: text = uuid" errors by wrapping
 * dynamic parameters in String() conversion before .eq() calls.
 *
 * Usage:
 *   tsx scripts/fix-uuid-comparisons.ts --dry-run  # Preview changes
 *   tsx scripts/fix-uuid-comparisons.ts --fix      # Apply fixes
 *   tsx scripts/fix-uuid-comparisons.ts --stats    # Show statistics only
 */

import * as fs from "fs"
import * as path from "path"
import { glob } from "glob"

// Configuration
const API_DIR = "app/api"
const BACKUP_DIR = ".uuid-fix-backups"
const FILE_PATTERNS = ["**/*.ts", "**/*.tsx"]

// Track statistics
interface Stats {
  totalFiles: number
  filesScanned: number
  filesWithIssues: number
  filesFixed: number
  totalMatches: number
  fixesApplied: number
  errors: string[]
}

const stats: Stats = {
  totalFiles: 0,
  filesScanned: 0,
  filesWithIssues: 0,
  filesFixed: 0,
  totalMatches: 0,
  fixesApplied: 0,
  errors: [],
}

// Patterns to detect params that need String() wrapping
const PARAM_PATTERNS = [
  // Dynamic route params: params.id, params.practiceId, etc.
  /params\.(id|practiceId|userId|organizationId|memberId|contractId|documentId|goalId|todoId|eventId|folderId|formId|entryId|fileId|itemId|categoryId|goalId|attachmentId|stageId|candidateId|postingId|applicationId|questionnaireId|transactionId|departmentId|parameterId|groupId|token|typeId|checklistId|templateId|roomId|analysisId|versionId|postId|popupId)\b/,

  // searchParams.get() calls
  /searchParams\.get$$['"`](practiceId|id|userId|organizationId)['"``]$$/,

  // Variables ending with Id or UUID (common naming convention)
  /\b([a-z][a-zA-Z]*(?:Id|UUID))\b/,
]

// Pattern to detect .eq() calls that need fixing
const EQ_CALL_REGEX = /\.eq$$\s*(['"`])([^'"``]+)\1\s*,\s*([^)]+)$$/g

// Pattern to check if value is already wrapped
const ALREADY_WRAPPED_PATTERNS = [
  /^String\(/,
  /\.toString$$$$/,
  /^\s*['"`]/, // Already a string literal
  /^\s*\d+\s*$/, // Number literal
  /^true$|^false$/, // Boolean
  /^null$|^undefined$/, // Null/undefined
]

/**
 * Check if a value likely needs String() wrapping
 */
function needsStringWrapping(value: string): boolean {
  const trimmedValue = value.trim()

  // Skip if already wrapped
  if (ALREADY_WRAPPED_PATTERNS.some((pattern) => pattern.test(trimmedValue))) {
    return false
  }

  // Check if it matches param patterns
  return PARAM_PATTERNS.some((pattern) => pattern.test(trimmedValue))
}

/**
 * Parse and fix .eq() calls in a file
 */
function fixEqCalls(content: string, filePath: string): { fixed: string; changes: number } {
  let changes = 0
  let fixed = content

  // Find all .eq() calls
  const matches = Array.from(content.matchAll(EQ_CALL_REGEX))

  if (matches.length === 0) {
    return { fixed: content, changes: 0 }
  }

  stats.totalMatches += matches.length

  // Process matches in reverse to maintain string positions
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i]
    const [fullMatch, quote, columnName, value] = match
    const matchIndex = match.index!

    if (needsStringWrapping(value)) {
      // Extract any whitespace/comments before the value
      const leadingSpace = value.match(/^\s*/)?.[0] || ""
      const trailingSpace = value.match(/\s*$/)?.[0] || ""
      const cleanValue = value.trim()

      // Build the fixed version
      const fixedCall = `.eq(${quote}${columnName}${quote}, ${leadingSpace}String(${cleanValue})${trailingSpace})`

      // Replace in the string
      fixed = fixed.substring(0, matchIndex) + fixedCall + fixed.substring(matchIndex + fullMatch.length)
      changes++
      stats.fixesApplied++

      console.log(
        `  ✓ Fixed: .eq("${columnName}", ${cleanValue.substring(0, 30)}${cleanValue.length > 30 ? "..." : ""})`,
      )
    }
  }

  if (changes > 0) {
    stats.filesFixed++
  }

  return { fixed, changes }
}

/**
 * Check for similar issues beyond .eq() calls
 */
function detectSimilarIssues(content: string, filePath: string): string[] {
  const issues: string[] = []

  // Check for .in() calls with array of IDs
  const inCallRegex = /\.in$$\s*(['"`])([^'"``]+)\1\s*,\s*\[([^\]]+)\]\s*$$/g
  const inMatches = Array.from(content.matchAll(inCallRegex))

  for (const match of inMatches) {
    const [, , columnName, arrayContent] = match

    // Check if array contains param references
    if (PARAM_PATTERNS.some((pattern) => pattern.test(arrayContent))) {
      issues.push(`Potential .in() issue with column "${columnName}": ${arrayContent.substring(0, 50)}...`)
    }
  }

  return issues
}

/**
 * Create backup of a file
 */
function backupFile(filePath: string): void {
  const backupPath = path.join(BACKUP_DIR, filePath)
  const backupDir = path.dirname(backupPath)

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  fs.copyFileSync(filePath, backupPath)
}

/**
 * Process a single file
 */
async function processFile(filePath: string, mode: "scan" | "fix" | "stats"): Promise<void> {
  try {
    stats.filesScanned++

    const content = fs.readFileSync(filePath, "utf-8")

    // Skip files that don't have .eq() calls
    if (!content.includes(".eq(")) {
      return
    }

    const { fixed, changes } = fixEqCalls(content, filePath)

    if (changes > 0) {
      stats.filesWithIssues++

      console.log(`\n📄 ${filePath}`)
      console.log(`   Found ${changes} issue${changes === 1 ? "" : "s"}`)

      if (mode === "fix") {
        backupFile(filePath)
        fs.writeFileSync(filePath, fixed, "utf-8")
        console.log(`   ✅ Fixed and backed up`)
      } else if (mode === "scan") {
        console.log(`   ⚠️  Would fix in --fix mode`)
      }
    }

    // Detect other potential issues
    if (mode !== "stats") {
      const otherIssues = detectSimilarIssues(content, filePath)
      if (otherIssues.length > 0) {
        console.log(`\n   ℹ️  Additional issues detected:`)
        otherIssues.forEach((issue) => console.log(`      - ${issue}`))
      }
    }
  } catch (error) {
    const errorMsg = `Error processing ${filePath}: ${error}`
    stats.errors.push(errorMsg)
    console.error(`   ❌ ${errorMsg}`)
  }
}

/**
 * Find all files to process
 */
async function findFiles(): Promise<string[]> {
  const files: string[] = []

  for (const pattern of FILE_PATTERNS) {
    const matches = await glob(path.join(API_DIR, pattern), {
      ignore: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
    })
    files.push(...matches)
  }

  return Array.from(new Set(files))
}

/**
 * Print statistics
 */
function printStats(): void {
  console.log("\n" + "=".repeat(60))
  console.log("📊 SCAN RESULTS")
  console.log("=".repeat(60))
  console.log(`Total files scanned:      ${stats.filesScanned}`)
  console.log(`Files with .eq() calls:   ${stats.totalFiles}`)
  console.log(`Files needing fixes:      ${stats.filesWithIssues}`)
  console.log(`Files fixed:              ${stats.filesFixed}`)
  console.log(`Total .eq() matches:      ${stats.totalMatches}`)
  console.log(`Fixes applied:            ${stats.fixesApplied}`)

  if (stats.errors.length > 0) {
    console.log(`\n❌ Errors encountered:    ${stats.errors.length}`)
    stats.errors.forEach((error) => console.log(`   - ${error}`))
  }

  console.log("=".repeat(60))
}

/**
 * Print usage instructions
 */
function printUsage(): void {
  console.log(`
🔧 UUID Comparison Fixer
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Automatically fixes PostgreSQL "text = uuid" errors by wrapping
dynamic parameters in String() conversion.

PROBLEM:
  ❌ .eq("id", params.id)           → PostgreSQL type mismatch
  ✅ .eq("id", String(params.id))   → Explicit string conversion

USAGE:
  tsx scripts/fix-uuid-comparisons.ts --dry-run   Preview changes
  tsx scripts/fix-uuid-comparisons.ts --fix       Apply fixes (creates backups)
  tsx scripts/fix-uuid-comparisons.ts --stats     Show statistics only
  tsx scripts/fix-uuid-comparisons.ts --help      Show this help

SAFETY FEATURES:
  • Dry-run mode to preview changes
  • Automatic backups in ${BACKUP_DIR}
  • Smart detection (skips already-fixed code)
  • Comprehensive error handling

PATTERNS DETECTED:
  • params.id, params.practiceId, etc.
  • searchParams.get('id')
  • Variables ending with Id or UUID
  • Nested expressions like params.id || defaultId

FILES PROCESSED:
  • Directory: ${API_DIR}
  • Patterns: ${FILE_PATTERNS.join(", ")}
  `)
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)
  const mode = args.includes("--fix") ? "fix" : args.includes("--stats") ? "stats" : "scan"

  if (args.includes("--help") || args.includes("-h")) {
    printUsage()
    return
  }

  console.log("🔍 UUID Comparison Fixer Starting...\n")

  if (mode === "scan") {
    console.log("⚠️  DRY-RUN MODE - No files will be modified")
    console.log("   Use --fix to apply changes\n")
  } else if (mode === "fix") {
    console.log("✏️  FIX MODE - Files will be modified and backed up\n")
  } else {
    console.log("📊 STATS MODE - Collecting statistics only\n")
  }

  // Find all files
  console.log(`Scanning ${API_DIR} directory...`)
  const files = await findFiles()
  stats.totalFiles = files.length
  console.log(`Found ${files.length} TypeScript files\n`)

  // Process each file
  for (const file of files) {
    await processFile(file, mode)
  }

  // Print final statistics
  printStats()

  if (mode === "scan" && stats.filesWithIssues > 0) {
    console.log("\n💡 Run with --fix to apply these changes")
  } else if (mode === "fix" && stats.filesFixed > 0) {
    console.log(`\n✅ Fixed ${stats.filesFixed} files`)
    console.log(`📦 Backups saved to ${BACKUP_DIR}`)
    console.log("\n⚠️  NEXT STEPS:")
    console.log("   1. Test your API routes thoroughly")
    console.log("   2. Check for any new TypeScript errors")
    console.log("   3. Run your test suite")
    console.log("   4. Commit changes if everything works")
  }
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
