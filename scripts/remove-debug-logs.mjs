import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")

let totalRemoved = 0
let filesModified = 0

const skipDirs = new Set(["node_modules", ".next", "dist", "build", ".git", ".vercel", "scripts"])
const extensions = new Set([".ts", ".tsx", ".js", ".jsx"])

function processFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8")
  const lines = content.split("\n")
  const filtered = []
  let removed = 0
  let skipUntilClosing = false
  let braceDepth = 0

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()

    // Handle continuation of multi-line console.log("[v0]...", { ... })
    if (skipUntilClosing) {
      for (const ch of lines[i]) {
        if (ch === "{") braceDepth++
        if (ch === "}") braceDepth--
      }
      // Check for closing paren too
      if (braceDepth <= 0 || trimmed.endsWith(")") || trimmed.endsWith(");")) {
        skipUntilClosing = false
        braceDepth = 0
      }
      removed++
      continue
    }

    // Match: console.log("[v0] ..."), console.debug("[v0] ..."), console.info("[v0] ...")
    if (trimmed.match(/^console\.(log|debug|info)\(\s*["'`]\[v0\]/)) {
      // Check if statement spans multiple lines (unbalanced braces/parens)
      const openBraces = (lines[i].match(/[{(]/g) || []).length
      const closeBraces = (lines[i].match(/[})]/g) || []).length
      if (openBraces > closeBraces) {
        skipUntilClosing = true
        braceDepth = openBraces - closeBraces
      }
      removed++
      continue
    }

    filtered.push(lines[i])
  }

  if (removed > 0) {
    // Clean up consecutive blank lines left behind
    const cleaned = []
    for (let i = 0; i < filtered.length; i++) {
      if (i > 0 && filtered[i].trim() === "" && filtered[i - 1].trim() === "") {
        continue
      }
      cleaned.push(filtered[i])
    }
    fs.writeFileSync(filePath, cleaned.join("\n"), "utf8")
    totalRemoved += removed
    filesModified++
  }
}

function walkDir(dir) {
  let entries
  try {
    entries = fs.readdirSync(dir)
  } catch {
    return
  }

  for (const entry of entries) {
    if (skipDirs.has(entry)) continue
    const fullPath = path.join(dir, entry)
    try {
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        walkDir(fullPath)
      } else if (stat.isFile() && extensions.has(path.extname(fullPath))) {
        processFile(fullPath)
      }
    } catch {
      // skip inaccessible
    }
  }
}

console.log('Removing console.log("[v0]...") debug statements...')
walkDir(rootDir)
console.log(`Removed ${totalRemoved} debug log(s) from ${filesModified} file(s).`)
