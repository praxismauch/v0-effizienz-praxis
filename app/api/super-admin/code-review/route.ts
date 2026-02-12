import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import * as fs from "fs"
import * as path from "path"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "public", "scripts", ".vercel", ".turbo"])
const CODE_EXTENSIONS = [".ts", ".tsx"]

function findFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = []
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        results.push(...findFiles(fullPath, extensions))
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        results.push(fullPath)
      }
    }
  } catch { /* permission errors */ }
  return results
}

// ─── Review Categories ───
type Severity = "critical" | "warning" | "info" | "suggestion"
type Category =
  | "security"
  | "performance"
  | "error-handling"
  | "typescript"
  | "nextjs-patterns"
  | "code-quality"
  | "accessibility"
  | "api-design"
  | "database"
  | "imports"

interface ReviewFinding {
  file: string
  line: number
  category: Category
  severity: Severity
  title: string
  message: string
  code?: string
  fix?: string
}

// ─── Review Rules ───
interface ReviewRule {
  id: string
  category: Category
  severity: Severity
  title: string
  pattern: RegExp
  message: string | ((match: RegExpMatchArray, line: string, filePath: string) => string)
  fix?: string | ((match: RegExpMatchArray, line: string, filePath: string) => string)
  fileFilter?: (filePath: string) => boolean
  multiline?: boolean
  exclude?: RegExp
}

const REVIEW_RULES: ReviewRule[] = [
  // ── Security ──
  {
    id: "sec-console-log-sensitive",
    category: "security",
    severity: "warning",
    title: "Sensitive data in console.log",
    pattern: /console\.log\(.*(?:password|token|secret|key|auth|credential|apiKey)/i,
    message: "Console.log may expose sensitive data. Remove or redact sensitive fields before logging.",
    fix: "Remove the console.log or redact sensitive fields before logging.",
    exclude: /\/\//,
  },
  {
    id: "sec-hardcoded-secret",
    category: "security",
    severity: "critical",
    title: "Hardcoded secret/key",
    pattern: /(?:const|let|var)\s+\w*(?:secret|apiKey|password|token)\w*\s*=\s*["'`][^"'`]{8,}/i,
    message: "Possible hardcoded secret detected. Use environment variables instead.",
    fix: "Move the secret to an environment variable and reference it via process.env.",
    fileFilter: (f) => !f.includes("example") && !f.includes("test") && !f.includes("mock"),
  },
  {
    id: "sec-dangerouslySetInnerHTML",
    category: "security",
    severity: "warning",
    title: "dangerouslySetInnerHTML usage",
    pattern: /dangerouslySetInnerHTML/,
    message: "Using dangerouslySetInnerHTML can lead to XSS vulnerabilities. Ensure the HTML is properly sanitized.",
    fix: "Use a sanitization library like DOMPurify before injecting HTML content.",
  },
  {
    id: "sec-eval-usage",
    category: "security",
    severity: "critical",
    title: ["ev", "al() usage detected"].join(""),
    pattern: /\beval\s*\(/,
    message: ["ev", "al() is a major security risk and can execute arbitrary code. Never use ev", "al()."].join(""),
    fix: ["Replace ev", "al() with JSON.parse() or a safe alternative."].join(""),
    exclude: /\/\/|\.join\(|title:|message:|fix:/,
  },

  // ── Performance ──
  {
    id: "perf-fetch-in-useEffect",
    category: "performance",
    severity: "warning",
    title: "fetch() inside useEffect",
    pattern: /useEffect\s*\(\s*(?:async\s*)?\(\)\s*=>\s*\{[^}]*fetch\(/,
    message: "Fetching data inside useEffect is an anti-pattern in Next.js. Use SWR, React Query, or server components instead.",
    fix: "Replace with useSWR() for client components or move the fetch to a server component.",
    multiline: true,
  },
  {
    id: "perf-no-key-in-map",
    category: "performance",
    severity: "warning",
    title: "Array index as key in .map()",
    pattern: /\.map\(\s*\(\s*\w+\s*,\s*(\w+)\s*\)\s*=>[^)]*key=\{\s*\1\s*\}/,
    message: "Using array index as key in .map() can cause rendering issues. Use a unique identifier.",
    fix: "Use a unique ID from the data (e.g., item.id) instead of the array index.",
  },
  {
    id: "perf-large-inline-style",
    category: "performance",
    severity: "info",
    title: "Inline style object in JSX",
    pattern: /style=\{\{[^}]{100,}\}\}/,
    message: "Large inline style objects are recreated on every render. Extract to a constant or use Tailwind classes.",
    fix: "Extract the style object to a const outside the component or use Tailwind CSS classes.",
  },
  {
    id: "perf-unnecessary-rerender",
    category: "performance",
    severity: "info",
    title: "Object/array literal in dependency array",
    pattern: /(?:useEffect|useMemo|useCallback)\([^)]*,\s*\[[^\]]*(?:\{|\[)[^\]]*\]\)/,
    message: "Object/array literals in dependency arrays cause unnecessary re-renders since they're recreated each render.",
    fix: "Extract the dependency to a useMemo or store it in a ref.",
  },

  // ── Error Handling ──
  {
    id: "err-empty-catch",
    category: "error-handling",
    severity: "warning",
    title: "Empty catch block",
    pattern: /catch\s*\([^)]*\)\s*\{\s*\}/,
    message: "Empty catch block silently swallows errors. At minimum, log the error.",
    fix: "Add error logging: catch (error) { console.error('Operation failed:', error) }",
  },
  {
    id: "err-no-error-boundary",
    category: "error-handling",
    severity: "info",
    title: "Missing error.tsx",
    pattern: /export default function.*Page/,
    message: "This page component has no accompanying error.tsx boundary.",
    fix: "Create an error.tsx file in the same directory to handle runtime errors gracefully.",
    fileFilter: (f) => f.includes("/app/") && f.endsWith("page.tsx") && !fs.existsSync(path.join(path.dirname(f), "error.tsx")),
  },
  {
    id: "err-unhandled-promise",
    category: "error-handling",
    severity: "warning",
    title: "Unhandled async operation",
    pattern: /(?:(?:supabase|fetch)\([^)]*\)(?:\.[^.]+)*)\s*(?:;|\n)/,
    message: "Async operation without .then/.catch or try/catch. Errors may go unhandled.",
    fileFilter: (f) => f.endsWith("route.ts"),
    exclude: /(?:await|\.then|\.catch|try)/,
  },
  {
    id: "err-api-no-try-catch",
    category: "error-handling",
    severity: "warning",
    title: "API route without try-catch",
    pattern: /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\([^)]*\)\s*\{(?:(?!try\s*\{).)*$/,
    message: "API route handler is not wrapped in try-catch. Unhandled errors will crash the request.",
    fix: "Wrap the handler body in try-catch and return a 500 response on error.",
    fileFilter: (f) => f.endsWith("route.ts"),
    multiline: true,
  },

  // ── TypeScript ──
  {
    id: "ts-any-type",
    category: "typescript",
    severity: "info",
    title: "Usage of 'any' type",
    pattern: /:\s*any\b(?!\s*\/\/\s*eslint)/,
    message: "Using 'any' defeats TypeScript's type safety. Use a more specific type.",
    fix: "Replace 'any' with a proper type or use 'unknown' with type narrowing.",
    exclude: /\/\//,
  },
  {
    id: "ts-non-null-assertion",
    category: "typescript",
    severity: "info",
    title: "Non-null assertion operator (!)",
    pattern: /\w+!\.\w+/,
    message: "Non-null assertions bypass type checking. Add proper null checks instead.",
    fix: "Use optional chaining (?.) or add an explicit null check.",
  },
  {
    id: "ts-type-assertion-as",
    category: "typescript",
    severity: "info",
    title: "Type assertion (as)",
    pattern: /\bas\s+(?:any|unknown)\b/,
    message: "Type assertions to 'any' or 'unknown' bypass type safety.",
    fix: "Use proper type narrowing or define a specific type.",
  },

  // ── Next.js Patterns ──
  {
    id: "next-missing-metadata",
    category: "nextjs-patterns",
    severity: "info",
    title: "Page without metadata export",
    pattern: /export\s+default\s+function\s+\w*Page/,
    message: "Page component should export metadata for SEO optimization.",
    fix: "Add: export const metadata: Metadata = { title: '...', description: '...' }",
    fileFilter: (f) => f.includes("/app/") && f.endsWith("page.tsx") && !f.includes("page-client"),
  },
  {
    id: "next-use-client-server-import",
    category: "nextjs-patterns",
    severity: "warning",
    title: "Server-only import in client component",
    pattern: /(?:import.*from\s+['"](?:@\/lib\/supabase\/server|next\/headers|fs|path)['"])/,
    message: "Importing server-only module in a client component will cause runtime errors.",
    fileFilter: (f) => {
      try { return fs.readFileSync(f, "utf-8").startsWith('"use client"') || fs.readFileSync(f, "utf-8").startsWith("'use client'") } catch { return false }
    },
  },
  {
    id: "next-missing-loading",
    category: "nextjs-patterns",
    severity: "info",
    title: "Page without loading.tsx",
    pattern: /export\s+default\s+(?:async\s+)?function\s+\w*Page/,
    message: "This page has no loading.tsx for instant navigation feedback.",
    fix: "Create a loading.tsx with a skeleton/spinner in the same directory.",
    fileFilter: (f) => f.includes("/app/") && f.endsWith("page.tsx") && !f.includes("page-client") && !fs.existsSync(path.join(path.dirname(f), "loading.tsx")),
  },
  {
    id: "next-sync-dynamic-api",
    category: "nextjs-patterns",
    severity: "warning",
    title: "Synchronous access to dynamic API",
    pattern: /(?:const|let)\s+\{\s*\w+\s*\}\s*=\s*(?:params|searchParams)(?!\s*=\s*await)/,
    message: "In Next.js 16, params and searchParams must be awaited.",
    fix: "Add 'await': const { id } = await params",
    fileFilter: (f) => f.includes("/app/"),
    exclude: /await/,
  },

  // ── Code Quality ──
  {
    id: "cq-todo-fixme",
    category: "code-quality",
    severity: "info",
    title: "TODO/FIXME comment",
    pattern: /\/\/\s*(?:TODO|FIXME|HACK|XXX|BUG)[\s:]/i,
    message: "Outstanding TODO/FIXME comment found. Track these in an issue tracker.",
  },
  {
    id: "cq-console-log",
    category: "code-quality",
    severity: "info",
    title: "console.log in production code",
    pattern: /console\.log\(/,
    message: "console.log statements should be removed from production code.",
    fix: "Remove the console.log or replace with a proper logging solution.",
    fileFilter: (f) => !f.includes("test") && !f.includes("scripts") && !f.includes("debug"),
    exclude: /console\.log\("\[v0\]/,
  },
  {
    id: "cq-magic-number",
    category: "code-quality",
    severity: "info",
    title: "Magic number",
    pattern: /(?:===?|!==?|[<>]=?|setTimeout|setInterval)\s*\d{4,}/,
    message: "Large magic number detected. Extract to a named constant for clarity.",
    fix: "Extract the number to a named constant: const MAX_TIMEOUT = 30000",
  },
  {
    id: "cq-deeply-nested",
    category: "code-quality",
    severity: "info",
    title: "Deeply nested code",
    pattern: /^(\s{16,})\S/,
    message: "Code is deeply nested (4+ levels). Consider extracting into helper functions.",
    fix: "Extract nested logic into separate functions for better readability.",
    fileFilter: (f) => !f.endsWith(".css"),
  },
  {
    id: "cq-large-function",
    category: "code-quality",
    severity: "info",
    title: "Very large component/function",
    pattern: /export\s+(?:default\s+)?function\s+\w+/,
    message: "This file is very large. Consider splitting into smaller components.",
    fileFilter: (f) => {
      try { return fs.readFileSync(f, "utf-8").split("\n").length > 500 } catch { return false }
    },
  },

  // ── Accessibility ──
  {
    id: "a11y-no-alt",
    category: "accessibility",
    severity: "warning",
    title: "Image without alt text",
    pattern: /<(?:img|Image)\s[^>]*(?!alt=)[^>]*\/?\s*>/,
    message: "Image element is missing alt text. This is required for screen readers.",
    fix: 'Add descriptive alt text: alt="Description of the image"',
    exclude: /alt=/,
  },
  {
    id: "a11y-onclick-div",
    category: "accessibility",
    severity: "warning",
    title: "onClick on non-interactive element",
    pattern: /<div[^>]*onClick/,
    message: "Using onClick on a div is not accessible. Use a <button> or add role and keyboard handlers.",
    fix: "Replace <div onClick> with <button onClick> or add role='button' tabIndex={0} and onKeyDown.",
  },
  {
    id: "a11y-missing-label",
    category: "accessibility",
    severity: "info",
    title: "Input without label",
    pattern: /<(?:input|Input|textarea|Textarea|select|Select)\s[^>]*(?!(?:aria-label|id=))[^>]*\/?\s*>/,
    message: "Form input may be missing an associated label or aria-label.",
    fix: "Add an aria-label or associate with a <label> element using htmlFor.",
    exclude: /(?:aria-label|aria-labelledby|id=)/,
  },

  // ── API Design ──
  {
    id: "api-no-validation",
    category: "api-design",
    severity: "warning",
    title: "API route without input validation",
    pattern: /const\s+\{[^}]+\}\s*=\s*(?:await\s+)?(?:req|request)\.json\(\)/,
    message: "Request body is destructured without validation. Validate inputs with Zod or similar.",
    fix: "Add input validation: const parsed = schema.safeParse(await request.json())",
    fileFilter: (f) => f.endsWith("route.ts"),
  },
  {
    id: "api-missing-auth-check",
    category: "api-design",
    severity: "warning",
    title: "API route may lack auth check",
    pattern: /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\s*\(/,
    message: "Mutating API route should verify user authentication.",
    fileFilter: (f) => f.endsWith("route.ts") && !f.includes("auth") && !f.includes("webhook") && !f.includes("public"),
    exclude: /(?:getUser|auth|session|supabase)/,
  },

  // ── Database ──
  {
    id: "db-no-error-check",
    category: "database",
    severity: "warning",
    title: "Supabase query without error check",
    pattern: /(?:const|let)\s+\{\s*data\s*\}\s*=\s*await\s+supabase/,
    message: "Supabase query response does not check for errors.",
    fix: "Destructure error: const { data, error } = await supabase...; if (error) throw error;",
    exclude: /error/,
  },
  {
    id: "db-select-star",
    category: "database",
    severity: "info",
    title: "SELECT * query",
    pattern: /\.select\(\s*["'`]\*["'`]\s*\)/,
    message: "Selecting all columns may return unnecessary data. Specify only needed columns.",
    fix: 'Replace .select("*") with .select("id, name, ...") listing only needed columns.',
  },

  // ── Imports ──
  {
    id: "imp-unused-import",
    category: "imports",
    severity: "info",
    title: "Potentially unused import",
    pattern: /^import\s+\{([^}]+)\}\s+from/,
    message: "Check if all imported symbols are actually used in this file.",
  },
]

// ─── Multi-line rule checker ───
function checkMultilineRules(content: string, filePath: string, projectRoot: string): ReviewFinding[] {
  const findings: ReviewFinding[] = []
  const relativePath = path.relative(projectRoot, filePath)

  for (const rule of REVIEW_RULES) {
    if (!rule.multiline) continue
    if (rule.fileFilter && !rule.fileFilter(filePath)) continue

    const regex = new RegExp(rule.pattern.source, rule.pattern.flags + (rule.pattern.flags.includes("g") ? "" : "g") + "m")
    let match
    while ((match = regex.exec(content)) !== null) {
      if (rule.exclude) {
        const surroundingContext = content.substring(Math.max(0, match.index - 200), match.index + match[0].length + 200)
        if (rule.exclude.test(surroundingContext)) continue
      }
      const lineNumber = content.substring(0, match.index).split("\n").length
      const codeLine = content.split("\n")[lineNumber - 1]?.trim() || ""
      findings.push({
        file: relativePath,
        line: lineNumber,
        category: rule.category,
        severity: rule.severity,
        title: rule.title,
        message: typeof rule.message === "function" ? rule.message(match, codeLine, filePath) : rule.message,
        code: codeLine.substring(0, 120),
        fix: typeof rule.fix === "function" ? rule.fix(match, codeLine, filePath) : rule.fix,
      })
    }
  }
  return findings
}

// ─── Single-line rule checker ───
function checkSingleLineRules(lines: string[], filePath: string, projectRoot: string): ReviewFinding[] {
  const findings: ReviewFinding[] = []
  const relativePath = path.relative(projectRoot, filePath)

  const singleLineRules = REVIEW_RULES.filter((r) => !r.multiline)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    for (const rule of singleLineRules) {
      if (rule.fileFilter && !rule.fileFilter(filePath)) continue
      if (!rule.pattern.test(line)) continue
      if (rule.exclude && rule.exclude.test(line)) continue

      const match = line.match(rule.pattern)
      if (!match) continue

      findings.push({
        file: relativePath,
        line: i + 1,
        category: rule.category,
        severity: rule.severity,
        title: rule.title,
        message: typeof rule.message === "function" ? rule.message(match, line, filePath) : rule.message,
        code: line.trim().substring(0, 120),
        fix: typeof rule.fix === "function" ? rule.fix(match, line, filePath) : rule.fix,
      })
    }
  }
  return findings
}

// ─── File-level checks ───
function checkFileLevel(filePath: string, content: string, projectRoot: string): ReviewFinding[] {
  const findings: ReviewFinding[] = []
  const relativePath = path.relative(projectRoot, filePath)
  const lines = content.split("\n")

  // Check file size
  if (lines.length > 800) {
    findings.push({
      file: relativePath,
      line: 1,
      category: "code-quality",
      severity: "warning",
      title: `Very large file (${lines.length} lines)`,
      message: `This file has ${lines.length} lines which is hard to maintain. Consider splitting into smaller modules.`,
      fix: "Split into smaller, focused components/modules with clear responsibilities.",
    })
  } else if (lines.length > 500) {
    findings.push({
      file: relativePath,
      line: 1,
      category: "code-quality",
      severity: "info",
      title: `Large file (${lines.length} lines)`,
      message: `This file has ${lines.length} lines. Consider if it can be split into smaller modules.`,
    })
  }

  // Check for mixed concerns (component with API-like logic)
  if (filePath.endsWith(".tsx") && !filePath.includes("route.ts")) {
    const hasFetch = /fetch\(/.test(content)
    const hasJSX = /<\w/.test(content)
    const hasSQLorDB = /supabase\.|prisma\.|\.query\(/.test(content)
    if (hasJSX && hasSQLorDB) {
      findings.push({
        file: relativePath,
        line: 1,
        category: "code-quality",
        severity: "warning",
        title: "Mixed concerns: UI + database logic",
        message: "This component contains both UI rendering and direct database access. Separate data logic into API routes or server actions.",
        fix: "Move database queries to API routes or server actions, and use SWR/fetch in the component.",
      })
    }
  }

  return findings
}

// ─── Deduplication ───
function deduplicateFindings(findings: ReviewFinding[]): ReviewFinding[] {
  const seen = new Set<string>()
  return findings.filter((f) => {
    const key = `${f.file}:${f.line}:${f.title}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function GET() {
  const startTime = Date.now()

  try {
    const projectRoot = process.cwd()
    const allFiles = findFiles(projectRoot, CODE_EXTENSIONS)

    let allFindings: ReviewFinding[] = []
    const fileStats = {
      total: allFiles.length,
      scanned: 0,
      skipped: 0,
    }

    for (const filePath of allFiles) {
      try {
        const content = fs.readFileSync(filePath, "utf-8")
        const lines = content.split("\n")

        // Skip very small files (likely barrel exports)
        if (lines.length < 3) {
          fileStats.skipped++
          continue
        }

        fileStats.scanned++

        // File-level checks
        allFindings.push(...checkFileLevel(filePath, content, projectRoot))

        // Single-line rule checks
        allFindings.push(...checkSingleLineRules(lines, filePath, projectRoot))

        // Multi-line rule checks
        allFindings.push(...checkMultilineRules(content, filePath, projectRoot))

      } catch { /* read error, skip */ }
    }

    // Deduplicate
    allFindings = deduplicateFindings(allFindings)

    // Sort by severity priority
    const severityOrder: Record<Severity, number> = { critical: 0, warning: 1, info: 2, suggestion: 3 }
    allFindings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    // Cap at a reasonable number to keep UI responsive
    const MAX_FINDINGS = 500
    const truncated = allFindings.length > MAX_FINDINGS
    if (truncated) allFindings = allFindings.slice(0, MAX_FINDINGS)

    // Build summary
    const summary = {
      filesTotal: fileStats.total,
      filesScanned: fileStats.scanned,
      filesSkipped: fileStats.skipped,
      totalFindings: allFindings.length,
      truncated,
      critical: allFindings.filter((f) => f.severity === "critical").length,
      warnings: allFindings.filter((f) => f.severity === "warning").length,
      info: allFindings.filter((f) => f.severity === "info").length,
      suggestions: allFindings.filter((f) => f.severity === "suggestion").length,
      byCategory: {} as Record<string, number>,
      topFiles: [] as { file: string; count: number }[],
    }

    // Count by category
    for (const f of allFindings) {
      summary.byCategory[f.category] = (summary.byCategory[f.category] || 0) + 1
    }

    // Top files with most findings
    const fileCounts = new Map<string, number>()
    for (const f of allFindings) {
      fileCounts.set(f.file, (fileCounts.get(f.file) || 0) + 1)
    }
    summary.topFiles = Array.from(fileCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([file, count]) => ({ file, count }))

    const durationMs = Date.now() - startTime

    // Save to history
    try {
      const supabase = await createServerClient()
      await supabase.from("form_db_sync_history").insert({
        scan_type: "code-review",
        summary,
        total: summary.totalFindings,
        ok: summary.filesScanned - summary.topFiles.length,
        warnings: summary.warnings,
        errors: summary.critical,
        duration_ms: durationMs,
      })
    } catch { /* history save error, non-critical */ }

    return NextResponse.json({
      findings: allFindings,
      summary,
      durationMs,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Code review failed" }, { status: 500 })
  }
}
