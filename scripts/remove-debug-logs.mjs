import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")

// Patterns to match and remove
const debugPatterns = [
  /^\s*console\.log$$\s*["']\[v0\].*?$$\s*;?\s*$/gm,
  /^\s*console\.debug$$\s*["']\[v0\].*?$$\s*;?\s*$/gm,
  /^\s*console\.info$$\s*["']\[v0\].*?$$\s*;?\s*$/gm,
]

// Additional multi-line pattern for template literals
const multiLinePattern = /^\s*console\.log$$\s*`\[v0\][^`]*`[^)]*$$\s*;?\s*$/gm

let totalRemoved = 0
let filesModified = 0

function removeDebugLogs(filePath) {
  const content = fs.readFileSync(filePath, "utf8")
  let modified = content
  let localRemoved = 0

  // Apply all patterns
  for (const pattern of debugPatterns) {
    const matches = modified.match(pattern)
    if (matches) {
      localRemoved += matches.length
      modified = modified.replace(pattern, "")
    }
  }

  // Apply multi-line pattern
  const multiMatches = modified.match(multiLinePattern)
  if (multiMatches) {
    localRemoved += multiMatches.length
    modified = modified.replace(multiLinePattern, "")
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

console.log("Starting debug log removal...")
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
