import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")

// Mode: "v0-only" removes only [v0] prefixed logs, "all" removes all console.log/debug/info
const mode = process.argv[2] || "v0-only"

// Patterns for v0-only mode
const v0DebugPatterns = [
  /^\s*console\.log\(\s*["']\[v0\].*?\)\s*;?\s*$/gm,
  /^\s*console\.debug\(\s*["']\[v0\].*?\)\s*;?\s*$/gm,
  /^\s*console\.info\(\s*["']\[v0\].*?\)\s*;?\s*$/gm,
]

// Patterns for all mode - removes ALL console.log/debug statements (keeps console.error/warn)
const allDebugPatterns = [
  /^\s*console\.log\([\s\S]*?\)\s*;?\s*$/gm,
  /^\s*console\.debug\([\s\S]*?\)\s*;?\s*$/gm,
  /^\s*console\.info\([\s\S]*?\)\s*;?\s*$/gm,
]

// Additional multi-line pattern for template literals
const v0MultiLinePattern = /^\s*console\.log\(\s*`\[v0\][^`]*`[^)]*\)\s*;?\s*$/gm

let totalRemoved = 0
let filesModified = 0

// Files/patterns to skip (important logs we want to keep)
const skipPatterns = [
  /console\.(error|warn)\(/,  // Keep errors and warnings
  /\.catch\(/,                 // Keep catch block logs
]

function removeDebugLogs(filePath) {
  const content = fs.readFileSync(filePath, "utf8")
  let modified = content
  let localRemoved = 0

  const patterns = mode === "all" ? allDebugPatterns : v0DebugPatterns

  // Apply all patterns
  for (const pattern of patterns) {
    const matches = modified.match(pattern)
    if (matches) {
      // Filter out matches we want to keep
      const filteredMatches = matches.filter(match => 
        !skipPatterns.some(skip => skip.test(match))
      )
      localRemoved += filteredMatches.length
      modified = modified.replace(pattern, (match) => {
        if (skipPatterns.some(skip => skip.test(match))) {
          return match // Keep this one
        }
        return "" // Remove
      })
    }
  }

  // Apply multi-line pattern (v0 only)
  if (mode === "v0-only") {
    const multiMatches = modified.match(v0MultiLinePattern)
    if (multiMatches) {
      localRemoved += multiMatches.length
      modified = modified.replace(v0MultiLinePattern, "")
    }
  }

  // Remove excessive blank lines (more than 2 consecutive)
  modified = modified.replace(/\n\n\n+/g, "\n\n")

  if (modified !== content) {
    fs.writeFileSync(filePath, modified, "utf8")
    totalRemoved += localRemoved
    filesModified++
    console.log(`✓ ${filePath}: Removed ${localRemoved} debug log(s)`)
  }
}

function walkDirectory(dir, extensions = [".ts", ".tsx", ".js", ".jsx"]) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!["node_modules", ".next", "dist", "build", ".git"].includes(file)) {
        walkDirectory(filePath, extensions)
      }
    } else if (extensions.some((ext) => file.endsWith(ext))) {
      removeDebugLogs(filePath)
    }
  }
}

console.log(`Starting debug log removal (mode: ${mode})...`)
console.log(`Mode "v0-only" removes only [v0] prefixed logs`)
console.log(`Mode "all" removes ALL console.log/debug/info (keeps errors/warnings)`)
console.log(`Usage: node scripts/remove-debug-logs.mjs [v0-only|all]`)
console.log("")
console.log("Scanning directories: app/api, lib, components")
console.log("")

// Process specific directories
const dirsToProcess = [
  path.join(rootDir, "app", "api"),
  path.join(rootDir, "lib"),
  path.join(rootDir, "components"),
]

for (const dir of dirsToProcess) {
  if (fs.existsSync(dir)) {
    walkDirectory(dir)
  }
}

console.log("")
console.log("=" .repeat(50))
console.log(`✓ Complete!`)
console.log(`  Files modified: ${filesModified}`)
console.log(`  Debug logs removed: ${totalRemoved}`)
console.log("=" .repeat(50))
