import type React from "react"
import {
  Shield,
  Zap,
  Bug,
  Code2,
  FileCode,
  Layers,
  Server,
  Database,
  Accessibility,
  Import,
  XCircle,
  AlertTriangle,
  Info,
  Lightbulb,
} from "lucide-react"
import { createElement } from "react"

// ─── Core types ───
export type Severity = "critical" | "warning" | "info" | "suggestion"
export type Category =
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

export interface ReviewFinding {
  file: string
  line: number
  category: Category
  severity: Severity
  title: string
  message: string
  code?: string
  fix?: string
}

export interface ReviewSummary {
  filesTotal: number
  filesScanned: number
  filesSkipped: number
  totalFindings: number
  truncated: boolean
  critical: number
  warnings: number
  info: number
  suggestions: number
  byCategory: Record<string, number>
  topFiles: { file: string; count: number }[]
}

export interface ReviewData {
  findings: ReviewFinding[]
  summary: ReviewSummary
  durationMs: number
}

export interface HistoryEntry {
  id: string
  scan_type: string
  summary: any
  total: number
  ok: number
  warnings: number
  errors: number
  duration_ms: number | null
  created_at: string
}

export interface CustomRule {
  id: string
  pattern: string
  category: Category
  severity: Severity
  title: string
  message: string
  fix: string
  fileGlob: string
  enabled: boolean
  createdAt: string
}

// ─── Metadata constants ───
export interface CategoryMeta {
  label: string
  icon: React.ReactNode
  color: string
}

export interface SeverityMeta {
  label: string
  icon: React.ReactNode
  color: string
  bgColor: string
}

const h = createElement
const iconProps = { className: "h-4 w-4" }

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  security: { label: "Sicherheit", icon: h(Shield, iconProps), color: "text-red-600" },
  performance: { label: "Performance", icon: h(Zap, iconProps), color: "text-orange-600" },
  "error-handling": { label: "Fehlerbehandlung", icon: h(Bug, iconProps), color: "text-yellow-600" },
  typescript: { label: "TypeScript", icon: h(Code2, iconProps), color: "text-blue-600" },
  "nextjs-patterns": { label: "Next.js Patterns", icon: h(Layers, iconProps), color: "text-foreground" },
  "code-quality": { label: "Code-Qualitaet", icon: h(FileCode, iconProps), color: "text-purple-600" },
  accessibility: { label: "Barrierefreiheit", icon: h(Accessibility, iconProps), color: "text-teal-600" },
  "api-design": { label: "API Design", icon: h(Server, iconProps), color: "text-indigo-600" },
  database: { label: "Datenbank", icon: h(Database, iconProps), color: "text-emerald-600" },
  imports: { label: "Imports", icon: h(Import, iconProps), color: "text-slate-600" },
}

export const SEVERITY_META: Record<Severity, SeverityMeta> = {
  critical: { label: "Kritisch", icon: h(XCircle, iconProps), color: "text-red-600", bgColor: "bg-red-100 text-red-800 hover:bg-red-100" },
  warning: { label: "Warnung", icon: h(AlertTriangle, iconProps), color: "text-yellow-600", bgColor: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  info: { label: "Info", icon: h(Info, iconProps), color: "text-blue-600", bgColor: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  suggestion: { label: "Vorschlag", icon: h(Lightbulb, iconProps), color: "text-purple-600", bgColor: "bg-purple-100 text-purple-800 hover:bg-purple-100" },
}

// ─── Prompt generators ───
export function formatFinding(f: ReviewFinding, index: number, showSeverity = false): string {
  const lines: string[] = []
  const severityTag = showSeverity ? ` [${SEVERITY_META[f.severity].label}]` : ""
  lines.push(`${index}. ${f.title}${severityTag}`)
  lines.push(`   Datei: ${f.file} (Zeile ${f.line})`)
  lines.push(`   Problem: ${f.message}`)
  if (f.code) lines.push(`   Code: ${f.code.trim()}`)
  if (f.fix) lines.push(`   Loesung: ${f.fix}`)
  return lines.join("\n")
}

export function groupByFile(findings: ReviewFinding[]): Map<string, ReviewFinding[]> {
  const map = new Map<string, ReviewFinding[]>()
  for (const f of findings) {
    if (!map.has(f.file)) map.set(f.file, [])
    map.get(f.file)!.push(f)
  }
  return map
}

export function generateAllRecommendationsPrompt(data: ReviewData): string {
  const criticalFindings = data.findings.filter((f) => f.severity === "critical")
  const warningFindings = data.findings.filter((f) => f.severity === "warning")
  const infoFindings = data.findings.filter((f) => f.severity === "info")

  const lines: string[] = []

  lines.push("## KRITISCHE Code-Probleme sofort beheben!")
  lines.push("")
  lines.push(`Scan-Ergebnis: ${data.summary.totalFindings} Findings in ${data.summary.filesScanned} Dateien (${(data.durationMs / 1000).toFixed(1)}s)`)
  lines.push(`  - ${data.summary.critical} Kritisch | ${data.summary.warnings} Warnungen | ${data.summary.info} Info`)
  lines.push("")

  if (criticalFindings.length > 0) {
    lines.push(`${"=".repeat(60)}`)
    lines.push(`  KRITISCH (${criticalFindings.length}) - Sofort beheben!`)
    lines.push(`${"=".repeat(60)}`)
    lines.push("")
    const byFile = groupByFile(criticalFindings)
    let idx = 1
    byFile.forEach((findings) => {
      findings.forEach((f) => {
        lines.push(`  Datei: ${f.file}`)
        lines.push(`  ${"-".repeat(50)}`)
        lines.push(formatFinding(f, idx++))
        lines.push("")
      })
    })
  }

  if (warningFindings.length > 0) {
    lines.push(`${"=".repeat(60)}`)
    lines.push(`  WARNUNGEN (${warningFindings.length})`)
    lines.push(`${"=".repeat(60)}`)
    lines.push("")
    const byCategory = new Map<string, ReviewFinding[]>()
    warningFindings.forEach((f) => {
      if (!byCategory.has(f.category)) byCategory.set(f.category, [])
      byCategory.get(f.category)!.push(f)
    })
    let idx = 1
    byCategory.forEach((findings, category) => {
      const meta = CATEGORY_META[category as Category]
      lines.push(`  --- ${meta?.label || category} (${findings.length}) ---`)
      lines.push("")
      for (const f of findings) {
        lines.push(formatFinding(f, idx++))
        lines.push("")
      }
    })
  }

  if (infoFindings.length > 0) {
    lines.push(`${"=".repeat(60)}`)
    lines.push(`  INFO & VORSCHLAEGE (${infoFindings.length})`)
    lines.push(`${"=".repeat(60)}`)
    lines.push("")
    const byCategory = new Map<string, ReviewFinding[]>()
    infoFindings.forEach((f) => {
      if (!byCategory.has(f.category)) byCategory.set(f.category, [])
      byCategory.get(f.category)!.push(f)
    })
    let idx = 1
    byCategory.forEach((findings, category) => {
      const meta = CATEGORY_META[category as Category]
      lines.push(`  --- ${meta?.label || category} (${findings.length}) ---`)
      lines.push("")
      const shown = findings.slice(0, 10)
      for (const f of shown) {
        lines.push(formatFinding(f, idx++))
        lines.push("")
      }
      if (findings.length > 10) {
        lines.push(`  ... und ${findings.length - 10} weitere Findings in dieser Kategorie`)
        lines.push("")
      }
    })
  }

  lines.push(`${"=".repeat(60)}`)
  lines.push("")
  lines.push("Bitte behebe SOFORT alle kritischen Sicherheits- und Stabilitaetsprobleme.")
  lines.push("Danach die Warnungen nach Prioritaet abarbeiten.")
  lines.push("Info-Findings sind Verbesserungsvorschlaege fuer hoehere Code-Qualitaet.")

  return lines.join("\n")
}

export function generateCategoryPrompt(data: ReviewData, category: Category): string {
  const findings = data.findings.filter((f) => f.category === category)
  if (findings.length === 0) return ""

  const meta = CATEGORY_META[category]
  const lines: string[] = []

  lines.push(`## Code Review: ${meta.label} Fixes`)
  lines.push("")
  lines.push(`${findings.length} Findings in der Kategorie "${meta.label}" gefunden.`)
  lines.push("")
  lines.push(`${"=".repeat(60)}`)
  lines.push("")

  const critical = findings.filter((f) => f.severity === "critical")
  const warnings = findings.filter((f) => f.severity === "warning")
  const info = findings.filter((f) => f.severity === "info")

  let idx = 1
  if (critical.length > 0) {
    lines.push(`  KRITISCH (${critical.length}):`)
    lines.push("")
    for (const f of critical) {
      lines.push(formatFinding(f, idx++, true))
      lines.push("")
    }
  }

  if (warnings.length > 0) {
    lines.push(`  WARNUNGEN (${warnings.length}):`)
    lines.push("")
    for (const f of warnings) {
      lines.push(formatFinding(f, idx++, true))
      lines.push("")
    }
  }

  if (info.length > 0) {
    lines.push(`  VORSCHLAEGE (${info.length}):`)
    lines.push("")
    for (const f of info) {
      lines.push(formatFinding(f, idx++, true))
      lines.push("")
    }
  }

  lines.push(`${"=".repeat(60)}`)
  lines.push("")
  lines.push(`Bitte behebe alle oben genannten ${meta.label}-Probleme.`)

  return lines.join("\n")
}
