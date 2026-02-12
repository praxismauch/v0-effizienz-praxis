import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import * as fs from "fs"
import * as path from "path"

export const dynamic = "force-dynamic"
export const maxDuration = 30

// Directories to skip
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "public", "scripts", ".vercel"])

// Recursively find files matching extensions
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
  } catch {
    // Permission errors, etc.
  }
  return results
}

// Extract form submissions from a component file (.tsx)
interface FormSubmission {
  file: string
  relativePath: string
  method: string
  apiUrl: string       // The URL pattern e.g. /api/practices/${practiceId}/contacts
  apiUrlNormalized: string // Normalized e.g. /api/practices/[practiceId]/contacts
  bodyFields: string[]
  lineNumber: number
}

function extractFormSubmissions(filePath: string, projectRoot: string): FormSubmission[] {
  const submissions: FormSubmission[] = []
  try {
    const content = fs.readFileSync(filePath, "utf-8")
    const lines = content.split("\n")
    const relativePath = path.relative(projectRoot, filePath)

    // Pattern: fetch(`/api/...`, { method: "POST"/"PATCH"/"PUT", body: JSON.stringify({...}) })
    // We need to find fetch calls and extract the URL + method + body fields
    // Since these can span multiple lines, we'll work on the full content

    // First find all fetch calls with their positions
    const fetchRegex = /fetch\(\s*`([^`]+)`\s*,\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g
    let match

    while ((match = fetchRegex.exec(content)) !== null) {
      const url = match[1]
      const options = match[2]

      // Check if it's a mutating method
      const methodMatch = options.match(/method:\s*["'](\w+)["']/)
      if (!methodMatch) continue
      const method = methodMatch[1].toUpperCase()
      if (!["POST", "PUT", "PATCH"].includes(method)) continue

      // Skip non-API calls
      if (!url.includes("/api/")) continue

      // Find line number
      const lineNumber = content.substring(0, match.index).split("\n").length

      // Normalize URL: replace ${...} with [paramName]
      const normalizedUrl = url
        .replace(/\$\{[^}]+\}/g, (expr) => {
          const paramName = expr.replace(/\$\{|\}/g, "").split(".").pop() || "param"
          return `[${paramName}]`
        })
        .replace(/\?.*$/, "") // Remove query params

      // Extract body fields from JSON.stringify({...})
      const bodyFields = extractBodyFields(content, match.index)

      submissions.push({
        file: filePath,
        relativePath,
        method,
        apiUrl: url.replace(/\$\{[^}]*\}/g, "*"),
        apiUrlNormalized: normalizedUrl,
        bodyFields,
        lineNumber,
      })
    }
  } catch {
    // File read errors
  }
  return submissions
}

// Extract fields from JSON.stringify({...}) near a fetch call
function extractBodyFields(content: string, fetchIndex: number): string[] {
  // Look for JSON.stringify in the surrounding context (up to 500 chars after fetch)
  const searchArea = content.substring(fetchIndex, fetchIndex + 2000)

  // Pattern 1: JSON.stringify({ field1, field2, ... })
  const stringifyMatch = searchArea.match(/JSON\.stringify\(\s*\{([^}]+)\}/)
  if (stringifyMatch) {
    return parseObjectFields(stringifyMatch[1])
  }

  // Pattern 2: JSON.stringify(someVariable) - try to find that variable's definition
  const varStringifyMatch = searchArea.match(/JSON\.stringify\(\s*(\w+)\s*\)/)
  if (varStringifyMatch) {
    const varName = varStringifyMatch[1]
    // Look for the variable definition in the broader context (within 3000 chars before)
    const lookback = content.substring(Math.max(0, fetchIndex - 3000), fetchIndex + 500)
    const varDefRegex = new RegExp(`(?:const|let|var)\\s+${varName}\\s*=\\s*\\{([^}]+)\\}`)
    const varDefMatch = lookback.match(varDefRegex)
    if (varDefMatch) {
      return parseObjectFields(varDefMatch[1])
    }
  }

  // Pattern 3: body: JSON.stringify({ ... }) with spread/nested
  const bodyJsonMatch = searchArea.match(/body:\s*JSON\.stringify\(\s*\{([\s\S]*?)\}\s*\)/)
  if (bodyJsonMatch) {
    return parseObjectFields(bodyJsonMatch[1])
  }

  return []
}

// Parse object literal fields from a string like "name, email, phone: someValue, ..."
function parseObjectFields(objectBody: string): string[] {
  const fields: string[] = []
  // Split by comma, handle nested objects
  const parts = objectBody.split(",")
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed || trimmed.startsWith("...") || trimmed.startsWith("//")) continue

    // "fieldName: value" or just "fieldName" (shorthand)
    const fieldMatch = trimmed.match(/^(\w+)\s*(?::|$)/)
    if (fieldMatch) {
      const fieldName = fieldMatch[1]
      // Skip common non-field entries
      if (!["method", "headers", "body", "cache", "signal", "credentials", "mode", "const", "let", "var", "await", "return", "true", "false", "null", "undefined"].includes(fieldName)) {
        fields.push(fieldName)
      }
    }
  }
  return fields
}

// Extract table operations from an API route file
interface ApiRouteInfo {
  file: string
  relativePath: string
  routePath: string           // e.g. /api/practices/[practiceId]/contacts
  methods: string[]           // e.g. ["GET", "POST", "PATCH"]
  tables: TableOperation[]
}

interface TableOperation {
  tableName: string
  operation: string  // "select", "insert", "update", "upsert", "delete"
  fields: string[]
  lineNumber: number
}

function extractApiRouteInfo(filePath: string, projectRoot: string): ApiRouteInfo | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8")
    const relativePath = path.relative(projectRoot, filePath)

    // Derive the route path from the file path
    // e.g. app/api/practices/[practiceId]/contacts/route.ts -> /api/practices/[practiceId]/contacts
    const routePath = "/" + relativePath
      .replace(/^app\//, "")
      .replace(/\/route\.(ts|tsx)$/, "")

    // Find exported HTTP methods
    const methods: string[] = []
    const methodRegex = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)/g
    let methodMatch
    while ((methodMatch = methodRegex.exec(content)) !== null) {
      methods.push(methodMatch[1])
    }
    if (methods.length === 0) return null

    // Find .from("table") operations
    const tables: TableOperation[] = []
    const fromRegex = /\.from\(\s*["'](\w+)["']\)\s*\.(select|insert|update|upsert|delete)\(/g
    let fromMatch
    while ((fromMatch = fromRegex.exec(content)) !== null) {
      const tableName = fromMatch[1]
      const operation = fromMatch[2]
      const lineNumber = content.substring(0, fromMatch.index).split("\n").length

      // For insert/update/upsert, try to extract the fields
      let fields: string[] = []
      if (["insert", "update", "upsert"].includes(operation)) {
        fields = extractInsertUpdateFields(content, fromMatch.index + fromMatch[0].length)
      }

      tables.push({ tableName, operation, fields, lineNumber })
    }

    // Also catch .from("table").update({...}).eq() pattern (without select/insert after from)
    const fromUpdateRegex = /\.from\(\s*["'](\w+)["']\)\s*\.\s*(update|insert|upsert)\s*\(/g
    while ((fromMatch = fromUpdateRegex.exec(content)) !== null) {
      const tableName = fromMatch[1]
      const operation = fromMatch[2]
      const lineNumber = content.substring(0, fromMatch.index).split("\n").length

      // Avoid duplicates
      if (!tables.some((t) => t.tableName === tableName && t.operation === operation && t.lineNumber === lineNumber)) {
        let fields: string[] = []
        if (["insert", "update", "upsert"].includes(operation)) {
          fields = extractInsertUpdateFields(content, fromMatch.index + fromMatch[0].length)
        }
        tables.push({ tableName, operation, fields, lineNumber })
      }
    }

    return { file: filePath, relativePath, routePath, methods, tables }
  } catch {
    return null
  }
}

// Extract field names from .insert({...}) or .update({...})
function extractInsertUpdateFields(content: string, startIndex: number): string[] {
  // Find the opening { after the method call
  const searchArea = content.substring(startIndex, startIndex + 2000)

  // Could be .insert({ field1: val, field2: val }) or .insert([{ ... }]) or .insert(variable)
  const objectMatch = searchArea.match(/^\s*\(\s*(?:\[\s*)?\{([\s\S]*?)\}/)
  if (objectMatch) {
    return parseObjectFields(objectMatch[1])
  }

  // Variable reference: .insert(updateData) - search backwards for the variable
  const varMatch = searchArea.match(/^\s*\(\s*(\w+)\s*\)/)
  if (varMatch) {
    const varName = varMatch[1]
    const lookback = content.substring(Math.max(0, startIndex - 5000), startIndex)
    // Look for const varName = { ... }
    const varDefRegex = new RegExp(`(?:const|let)\\s+${varName}\\s*(?::\\s*\\w+)?\\s*=\\s*\\{([\\s\\S]*?)\\}`)
    const varDefMatch = lookback.match(varDefRegex)
    if (varDefMatch) {
      return parseObjectFields(varDefMatch[1])
    }
  }

  return []
}

// Known control/meta fields that are never DB columns.
// These are action discriminators, nested payloads, AI generation params, etc.
const CONTROL_FIELDS = new Set([
  // Action discriminators
  "action", "type", "event",
  // Nested payload arrays (sent as JSON but stored in related tables)
  "items", "contacts", "orders", "entries", "rows", "records",
  "members", "assignees", "recipients", "attendees", "participants",
  "questions", "answers", "responses", "options", "choices",
  "steps", "tasks", "subtasks", "milestones",
  "skills", "areas", "competencies", "criteria",
  "goals", "objectives", "targets",
  "tags", "labels", "categories",
  "permissions", "roles",
  "addresses", "phones", "emails",
  "files", "attachments", "images",
  // AI generation parameters (sent to AI routes, never stored directly)
  "prompt", "context", "tone", "length", "style", "format",
  "systemPrompt", "userPrompt", "instructions", "model",
  "temperature", "maxTokens", "topP",
  // Template/reference IDs (used for lookup, not stored as-is)
  "template", "templateId", "templateName", "sourceId",
  // Pagination and filtering (used in queries, not stored)
  "page", "limit", "offset", "sort", "order", "filter", "search", "query",
  // Common form control fields
  "confirm", "confirmed", "agree", "accepted", "consent",
  "redirect", "redirectUrl", "returnUrl", "callbackUrl",
  "sendNotification", "sendEmail", "notify", "silent",
  // Relation assignments (stored via junction tables)
  "teamMemberIds", "teamMembers", "selectedMembers", "selectedItems",
  "assignedTo", "sharedWith",
])

// Patterns for fields that are typically control fields based on suffix/prefix
const CONTROL_FIELD_PATTERNS = [
  /^is[A-Z]/, // boolean flags like isNew, isTemplate, isDraft (often not persisted)
  /^should[A-Z]/, // control flow like shouldNotify, shouldRedirect
  /^send[A-Z]/, // sendEmail, sendNotification
  /^include[A-Z]/, // includeArchived, includeDeleted
  /^skip[A-Z]/, // skipValidation, skipNotification
  /^force[A-Z]/, // forceUpdate, forceDelete
  /Ids$/, // teamMemberIds, selectedIds -> junction table ops
  /Items$/, // selectedItems, checkedItems -> nested
  /List$/, // recipientList, tagList -> nested
  /Data$/, // formData, responseData -> nested payload
  /Config$/, // surveyConfig, widgetConfig -> jsonb field
  /Settings$/, // notificationSettings -> nested
]

// AI-related route patterns where most body fields are generation params
const AI_ROUTE_PATTERNS = [
  /ai-generate/, /ai-optimize/, /ai-analyze/, /generate\//, /regenerate/,
  /smart-upload/, /ai-response/,
]

function isControlField(field: string, apiUrl: string): boolean {
  // Direct match against known control fields
  if (CONTROL_FIELDS.has(field)) return true

  // Check pattern-based control fields
  if (CONTROL_FIELD_PATTERNS.some((p) => p.test(field))) return true

  // For AI routes, most fields are generation parameters, not DB columns
  if (AI_ROUTE_PATTERNS.some((p) => p.test(apiUrl))) {
    // In AI routes, only practice_id, id-like fields, and common DB fields pass through
    const dbLikeFields = /^(id|practice_id|practiceId|team_member_id|teamMemberId|user_id|userId|created_at|updated_at)$/
    if (!dbLikeFields.test(field)) return true
  }

  return false
}

// Common field name aliases/mappings (frontend field -> DB column)
const FIELD_ALIASES: Record<string, string[]> = {
  date: ["recorded_date", "assessment_date", "protocol_date", "created_at", "start_date", "event_date"],
  startDate: ["start_date"],
  endDate: ["end_date"],
  dueDate: ["due_date"],
  name: ["title", "first_name", "last_name"],
  description: ["notes", "content", "reason"],
  message: ["notes", "content", "description"],
  text: ["content", "notes", "description"],
  amount: ["value", "salary", "cost", "budget"],
  url: ["file_url", "image_url", "website"],
  email: ["email"],
  phone: ["phone", "mobile"],
  color: ["color", "theme_color"],
  image: ["image_url", "logo_url"],
  file: ["file_url", "document_url"],
  rating: ["rating", "score", "overall_score"],
  score: ["score", "rating", "overall_score"],
  comment: ["notes", "content", "description"],
}

function hasFieldAlias(field: string, columns: string[]): boolean {
  const aliases = FIELD_ALIASES[field]
  if (aliases) {
    return aliases.some((alias) => columns.includes(alias))
  }
  return false
}

// Map a normalized component fetch URL to an API route path
function matchUrlToRoute(normalizedUrl: string, apiRoutes: Map<string, ApiRouteInfo>): ApiRouteInfo | null {
  // Direct match
  if (apiRoutes.has(normalizedUrl)) return apiRoutes.get(normalizedUrl)!

  // Try matching with different param names, using a scoring system.
  // Static segment matches score higher than dynamic-to-literal matches.
  // This ensures /hygiene-plans/generate matches the "generate" route, not [planId].
  const urlParts = normalizedUrl.split("/")
  let bestMatch: ApiRouteInfo | null = null
  let bestScore = -1

  for (const [routePath, info] of apiRoutes) {
    const routeParts = routePath.split("/")
    if (urlParts.length !== routeParts.length) continue

    let match = true
    let score = 0
    for (let i = 0; i < urlParts.length; i++) {
      const urlPart = urlParts[i]
      const routePart = routeParts[i]
      // Both are dynamic segments
      if (urlPart.startsWith("[") && routePart.startsWith("[")) {
        score += 1
        continue
      }
      // Both are literal and must match exactly
      if (!urlPart.startsWith("[") && !routePart.startsWith("[")) {
        if (urlPart !== routePart) { match = false; break }
        score += 3  // Exact literal match = highest priority
        continue
      }
      // One is dynamic, other is literal - lower priority match
      // URL has literal "generate" and route has dynamic [planId] -> weak match
      score += 0
    }
    if (match && score > bestScore) {
      bestScore = score
      bestMatch = info
    }
  }

  return bestMatch
}

export async function GET(request: Request) {
  await cookies()

  const startTime = Date.now()

  try {
    const projectRoot = process.cwd()

    // Step 1: Find all component files (.tsx) and API route files
    const allTsx = findFiles(path.join(projectRoot, "app"), [".tsx"])
      .concat(findFiles(path.join(projectRoot, "components"), [".tsx"]))
      .concat(findFiles(path.join(projectRoot, "contexts"), [".tsx"]))
      .concat(findFiles(path.join(projectRoot, "hooks"), [".tsx"]))

    const allApiRoutes = findFiles(path.join(projectRoot, "app", "api"), [".ts", ".tsx"])
      .filter((f) => path.basename(f).startsWith("route."))

    // Step 2: Extract form submissions from all component files
    const allSubmissions: FormSubmission[] = []
    for (const file of allTsx) {
      const submissions = extractFormSubmissions(file, projectRoot)
      allSubmissions.push(...submissions)
    }

    // Step 3: Extract API route info from all route files
    const apiRouteMap = new Map<string, ApiRouteInfo>()
    for (const file of allApiRoutes) {
      const info = extractApiRouteInfo(file, projectRoot)
      if (info) {
        apiRouteMap.set(info.routePath, info)
      }
    }

    // Step 4: Fetch live DB schema from PostgREST
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    let dbColumns: Record<string, string[]> = {}
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          Accept: "application/openapi+json",
        },
      })
      if (response.ok) {
        const schema = await response.json()
        const definitions = schema.definitions || {}
        for (const [tableName, def] of Object.entries(definitions) as [string, any][]) {
          const props = def.properties || {}
          dbColumns[tableName] = Object.keys(props)
        }
      }
    } catch {
      // DB schema fetch failed - continue without DB validation
    }

    // Step 5: Cross-reference form submissions with API routes and DB schema
    interface FormScanResult {
      id: string
      componentFile: string
      method: string
      apiUrl: string
      apiUrlNormalized: string
      lineNumber: number
      formFields: string[]
      apiRoute: string | null
      apiRouteFile: string | null
      targetTables: string[]
      dbFields: Record<string, string[]>  // table -> columns
      status: "ok" | "warning" | "error"
      issues: { severity: "error" | "warning" | "info"; message: string }[]
    }

    const results: FormScanResult[] = allSubmissions.map((sub, idx) => {
      const issues: { severity: "error" | "warning" | "info"; message: string }[] = []

      // Find matching API route
      const apiRoute = matchUrlToRoute(sub.apiUrlNormalized, apiRouteMap)

      if (!apiRoute) {
        issues.push({
          severity: "warning",
          message: `API-Route nicht gefunden: ${sub.apiUrlNormalized}`,
        })
      }

      // Get target tables from the API route
      const targetTables = apiRoute
        ? [...new Set(apiRoute.tables
            .filter((t) => ["insert", "update", "upsert"].includes(t.operation))
            .map((t) => t.tableName))]
        : []

      // Get DB columns for target tables
      const dbFieldsMap: Record<string, string[]> = {}
      for (const table of targetTables) {
        if (dbColumns[table]) {
          dbFieldsMap[table] = dbColumns[table]
        } else {
          issues.push({
            severity: "error",
            message: `Tabelle "${table}" existiert nicht in der Datenbank`,
          })
        }
      }

      // Check form fields against DB columns
      if (sub.bodyFields.length > 0 && targetTables.length > 0) {
        for (const field of sub.bodyFields) {
          // Skip known control/meta fields that are never DB columns
          if (isControlField(field, sub.apiUrlNormalized)) continue

          // Convert camelCase to snake_case for comparison
          const snakeField = field.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)

          let foundInAnyTable = false
          for (const table of targetTables) {
            const cols = dbColumns[table] || []
            // Check direct match, snake_case, and common aliases
            if (cols.includes(field) || cols.includes(snakeField) || hasFieldAlias(field, cols)) {
              foundInAnyTable = true
              break
            }
          }

          if (!foundInAnyTable && targetTables.length > 0) {
            // Check if any table has the field
            const allDbCols = targetTables.flatMap((t) => dbColumns[t] || [])
            if (allDbCols.length > 0) {
              issues.push({
                severity: "warning",
                message: `Formular-Feld "${field}" existiert nicht als Spalte in ${targetTables.join(", ")}`,
              })
            }
          }
        }
      }

      // Check if the API route's method matches
      if (apiRoute && !apiRoute.methods.includes(sub.method)) {
        issues.push({
          severity: "error",
          message: `API-Route unterstuetzt Methode ${sub.method} nicht (nur: ${apiRoute.methods.join(", ")})`,
        })
      }

      const hasErrors = issues.some((i) => i.severity === "error")
      const hasWarnings = issues.some((i) => i.severity === "warning")

      return {
        id: `form-${idx}`,
        componentFile: sub.relativePath,
        method: sub.method,
        apiUrl: sub.apiUrl,
        apiUrlNormalized: sub.apiUrlNormalized,
        lineNumber: sub.lineNumber,
        formFields: sub.bodyFields,
        apiRoute: apiRoute?.routePath || null,
        apiRouteFile: apiRoute?.relativePath || null,
        targetTables,
        dbFields: dbFieldsMap,
        status: hasErrors ? "error" : hasWarnings ? "warning" : "ok",
        issues,
      }
    })

    // Summary
    const methodCounts = {
      POST: results.filter((r) => r.method === "POST").length,
      PATCH: results.filter((r) => r.method === "PATCH").length,
      PUT: results.filter((r) => r.method === "PUT").length,
    }

    const uniqueComponents = new Set(results.map((r) => r.componentFile)).size
    const uniqueApiRoutes = new Set(results.filter((r) => r.apiRoute).map((r) => r.apiRoute)).size
    const uniqueTables = new Set(results.flatMap((r) => r.targetTables)).size

    const summary = {
      totalSubmissions: results.length,
      uniqueComponents,
      uniqueApiRoutes,
      uniqueTables,
      ok: results.filter((r) => r.status === "ok").length,
      warnings: results.filter((r) => r.status === "warning").length,
      errors: results.filter((r) => r.status === "error").length,
      methodCounts,
      scannedFiles: allTsx.length,
      scannedApiRoutes: allApiRoutes.length,
    }

    const durationMs = Date.now() - startTime

    // Save to history directly via Supabase
    try {
      const historySupabase = await createServerClient()
      await historySupabase.from("form_db_sync_history").insert({
        scan_type: "form-scan",
        summary,
        total: summary.totalSubmissions,
        ok: summary.ok,
        warnings: summary.warnings,
        errors: summary.errors,
        duration_ms: durationMs,
      })
    } catch (err) {
      console.error("[v0] Failed to save form-scan history:", err)
    }

    return NextResponse.json({ results, summary, duration_ms: durationMs })
  } catch (error: any) {
    console.error("[v0] Form scan error:", error)
    return NextResponse.json(
      { error: `Form-Scan fehlgeschlagen: ${error.message}` },
      { status: 500 },
    )
  }
}
