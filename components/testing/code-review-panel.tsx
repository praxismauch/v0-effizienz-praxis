"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Code2,
  Shield,
  Zap,
  AlertTriangle,
  Bug,
  FileCode,
  Loader2,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Search,
  History,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  XCircle,
  CheckCircle2,
  Info,
  Lightbulb,
  Database,
  Accessibility,
  Import,
  Layers,
  Server,
} from "lucide-react"

// ─── Types ───
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

interface ReviewSummary {
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

interface ReviewData {
  findings: ReviewFinding[]
  summary: ReviewSummary
  durationMs: number
}

interface HistoryEntry {
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

// ─── Category metadata ───
const CATEGORY_META: Record<Category, { label: string; icon: React.ReactNode; color: string }> = {
  security: { label: "Sicherheit", icon: <Shield className="h-4 w-4" />, color: "text-red-600" },
  performance: { label: "Performance", icon: <Zap className="h-4 w-4" />, color: "text-orange-600" },
  "error-handling": { label: "Fehlerbehandlung", icon: <Bug className="h-4 w-4" />, color: "text-yellow-600" },
  typescript: { label: "TypeScript", icon: <Code2 className="h-4 w-4" />, color: "text-blue-600" },
  "nextjs-patterns": { label: "Next.js Patterns", icon: <Layers className="h-4 w-4" />, color: "text-foreground" },
  "code-quality": { label: "Code-Qualitaet", icon: <FileCode className="h-4 w-4" />, color: "text-purple-600" },
  accessibility: { label: "Barrierefreiheit", icon: <Accessibility className="h-4 w-4" />, color: "text-teal-600" },
  "api-design": { label: "API Design", icon: <Server className="h-4 w-4" />, color: "text-indigo-600" },
  database: { label: "Datenbank", icon: <Database className="h-4 w-4" />, color: "text-emerald-600" },
  imports: { label: "Imports", icon: <Import className="h-4 w-4" />, color: "text-slate-600" },
}

const SEVERITY_META: Record<Severity, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  critical: { label: "Kritisch", icon: <XCircle className="h-4 w-4" />, color: "text-red-600", bgColor: "bg-red-100 text-red-800 hover:bg-red-100" },
  warning: { label: "Warnung", icon: <AlertTriangle className="h-4 w-4" />, color: "text-yellow-600", bgColor: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  info: { label: "Info", icon: <Info className="h-4 w-4" />, color: "text-blue-600", bgColor: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  suggestion: { label: "Vorschlag", icon: <Lightbulb className="h-4 w-4" />, color: "text-purple-600", bgColor: "bg-purple-100 text-purple-800 hover:bg-purple-100" },
}

export default function CodeReviewPanel() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("review")

  // ─── Review state ───
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<ReviewData | null>(null)
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set())
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [fileFilter, setFileFilter] = useState<string>("all")
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState("")
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── History state ───
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)

  // ─── Prompt dialog ───
  const [promptDialog, setPromptDialog] = useState<{ open: boolean; prompt: string; title: string }>({
    open: false,
    prompt: "",
    title: "",
  })

  useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }, [])

  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true)
    try {
      const res = await fetch("/api/super-admin/form-db-sync-history?limit=100&scan_type=code-review")
      if (!res.ok) throw new Error("Fehler")
      const json = await res.json()
      setHistoryData(json.history || [])
    } catch {
      toast({ title: "Fehler", description: "Historie konnte nicht geladen werden", variant: "destructive" })
    } finally {
      setIsHistoryLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory()
    }
  }, [activeTab, loadHistory])

  // ─── Run Review ───
  const runReview = useCallback(async () => {
    setIsLoading(true)
    setProgress(0)
    setProgressLabel("Initialisiere Code Review...")

    let currentProgress = 0
    progressInterval.current = setInterval(() => {
      currentProgress += Math.random() * 5 + 1
      if (currentProgress > 92) currentProgress = 92
      setProgress(currentProgress)
      if (currentProgress < 10) setProgressLabel("Initialisiere Code Review...")
      else if (currentProgress < 25) setProgressLabel("Scanne Projektdateien...")
      else if (currentProgress < 40) setProgressLabel("Pruefe Sicherheit...")
      else if (currentProgress < 55) setProgressLabel("Analysiere Performance...")
      else if (currentProgress < 65) setProgressLabel("Pruefe TypeScript-Qualitaet...")
      else if (currentProgress < 75) setProgressLabel("Pruefe Next.js Patterns...")
      else if (currentProgress < 85) setProgressLabel("Pruefe Barrierefreiheit...")
      else setProgressLabel("Erstelle Bericht...")
    }, 400)

    try {
      const res = await fetch("/api/super-admin/code-review")
      if (!res.ok) throw new Error("Fehler beim Laden")
      const json: ReviewData = await res.json()
      if (progressInterval.current) clearInterval(progressInterval.current)
      setProgress(100)
      setProgressLabel(`${json.summary.totalFindings} Findings in ${json.summary.filesScanned} Dateien`)
      setData(json)
      setTimeout(() => { if (historyData.length > 0 || activeTab === "history") loadHistory() }, 1500)
      toast({
        title: "Code Review abgeschlossen",
        description: `${json.summary.totalFindings} Findings: ${json.summary.critical} kritisch, ${json.summary.warnings} Warnungen, ${json.summary.info} Info`,
        variant: json.summary.critical > 0 ? "destructive" : "default",
      })
    } catch {
      if (progressInterval.current) clearInterval(progressInterval.current)
      setProgress(0)
      setProgressLabel("")
      toast({ title: "Fehler", description: "Code Review konnte nicht ausgefuehrt werden", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast, historyData.length, activeTab, loadHistory])

  // ─── Helpers ───
  const toggleFinding = (id: string) => {
    setExpandedFindings((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Kopiert!", description: "Empfehlungen in die Zwischenablage kopiert" })
  }

  // ─── Generate v0 prompt from all findings ───
  const generateAllRecommendationsPrompt = (): string => {
    if (!data) return ""

    const criticalFindings = data.findings.filter((f) => f.severity === "critical")
    const warningFindings = data.findings.filter((f) => f.severity === "warning")
    const infoFindings = data.findings.filter((f) => f.severity === "info")

    let prompt = `## Code Review Ergebnisse: ${data.summary.totalFindings} Findings\n\n`
    prompt += `Zusammenfassung: ${data.summary.filesScanned} Dateien gescannt in ${(data.durationMs / 1000).toFixed(1)}s.\n`
    prompt += `${data.summary.critical} kritisch, ${data.summary.warnings} Warnungen, ${data.summary.info} Info.\n\n`

    if (criticalFindings.length > 0) {
      prompt += `### KRITISCH (${criticalFindings.length}) - Sofort beheben!\n\n`
      criticalFindings.forEach((f) => {
        prompt += `**${f.title}** in \`${f.file}\` (Zeile ${f.line})\n`
        prompt += `- ${f.message}\n`
        if (f.code) prompt += `- Code: \`${f.code}\`\n`
        if (f.fix) prompt += `- Fix: ${f.fix}\n`
        prompt += `\n`
      })
    }

    if (warningFindings.length > 0) {
      prompt += `### WARNUNGEN (${warningFindings.length})\n\n`
      // Group by category for cleaner output
      const byCategory = new Map<string, typeof warningFindings>()
      warningFindings.forEach((f) => {
        if (!byCategory.has(f.category)) byCategory.set(f.category, [])
        byCategory.get(f.category)!.push(f)
      })
      byCategory.forEach((findings, category) => {
        const meta = CATEGORY_META[category as Category]
        prompt += `#### ${meta?.label || category} (${findings.length})\n\n`
        findings.forEach((f) => {
          prompt += `- **${f.title}** in \`${f.file}\` (Zeile ${f.line}): ${f.message}\n`
          if (f.fix) prompt += `  - Fix: ${f.fix}\n`
        })
        prompt += `\n`
      })
    }

    if (infoFindings.length > 0) {
      prompt += `### INFO/VORSCHLAEGE (${infoFindings.length})\n\n`
      const byCategory = new Map<string, typeof infoFindings>()
      infoFindings.forEach((f) => {
        if (!byCategory.has(f.category)) byCategory.set(f.category, [])
        byCategory.get(f.category)!.push(f)
      })
      byCategory.forEach((findings, category) => {
        const meta = CATEGORY_META[category as Category]
        prompt += `#### ${meta?.label || category} (${findings.length})\n\n`
        // Limit info findings per category to keep prompt manageable
        const shown = findings.slice(0, 10)
        shown.forEach((f) => {
          prompt += `- **${f.title}** in \`${f.file}\` (Zeile ${f.line}): ${f.message}\n`
          if (f.fix) prompt += `  - Fix: ${f.fix}\n`
        })
        if (findings.length > 10) prompt += `- ... und ${findings.length - 10} weitere\n`
        prompt += `\n`
      })
    }

    prompt += `\n---\n\nBitte analysiere und behebe die oben genannten Code Review Findings. `
    prompt += `Priorisiere kritische Sicherheitsprobleme, dann Warnungen. `
    prompt += `Fuer Info-Findings schlage Verbesserungen vor, die die Code-Qualitaet steigern.`

    return prompt
  }

  // ─── Generate prompt for a specific category ───
  const generateCategoryPrompt = (category: Category): string => {
    if (!data) return ""
    const findings = data.findings.filter((f) => f.category === category)
    if (findings.length === 0) return ""

    const meta = CATEGORY_META[category]
    let prompt = `## Code Review: ${meta.label} (${findings.length} Findings)\n\n`
    findings.forEach((f) => {
      prompt += `**${f.title}** in \`${f.file}\` (Zeile ${f.line})\n`
      prompt += `- Schwere: ${SEVERITY_META[f.severity].label}\n`
      prompt += `- ${f.message}\n`
      if (f.code) prompt += `- Code: \`${f.code}\`\n`
      if (f.fix) prompt += `- Fix: ${f.fix}\n`
      prompt += `\n`
    })
    prompt += `Bitte behebe alle oben genannten ${meta.label}-Probleme.`
    return prompt
  }

  // ─── Filtered findings ───
  const filteredFindings = data?.findings.filter((f) => {
    if (severityFilter !== "all" && f.severity !== severityFilter) return false
    if (categoryFilter !== "all" && f.category !== categoryFilter) return false
    if (fileFilter !== "all" && f.file !== fileFilter) return false
    return true
  }) || []

  // Unique files for filter dropdown
  const uniqueFiles = data ? [...new Set(data.findings.map((f) => f.file))].sort() : []

  // Score calculation (0-100, 100 = perfect)
  const codeScore = data
    ? Math.max(0, Math.round(100 - (data.summary.critical * 10 + data.summary.warnings * 3 + data.summary.info * 0.5)))
    : null

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="review" className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            Code Review
            {data && (data.summary.critical > 0 || data.summary.warnings > 0) && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {data.summary.critical + data.summary.warnings}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historie
            {historyData.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {historyData.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ═══════════ TAB 1: CODE REVIEW ═══════════ */}
        <TabsContent value="review" className="space-y-6">
          {/* Summary Cards */}
          {data && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {/* Code Score */}
                <Card className="col-span-2 md:col-span-1 border-2 border-foreground/10">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground mb-1">Code Score</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-3xl font-bold ${
                        codeScore !== null && codeScore >= 80 ? "text-green-600" :
                        codeScore !== null && codeScore >= 60 ? "text-yellow-600" : "text-red-600"
                      }`}>
                        {codeScore}
                      </span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                    <Progress
                      value={codeScore || 0}
                      className="mt-2 h-1.5"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground">Dateien gescannt</p>
                    <p className="text-2xl font-bold">{data.summary.filesScanned}</p>
                  </CardContent>
                </Card>
                <Card className="border-red-200">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground">Kritisch</p>
                    <p className="text-2xl font-bold text-red-600">{data.summary.critical}</p>
                  </CardContent>
                </Card>
                <Card className="border-yellow-200">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground">Warnungen</p>
                    <p className="text-2xl font-bold text-yellow-600">{data.summary.warnings}</p>
                  </CardContent>
                </Card>
                <Card className="border-blue-200">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground">Info</p>
                    <p className="text-2xl font-bold text-blue-600">{data.summary.info}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground">Dauer</p>
                    <p className="text-2xl font-bold">{(data.durationMs / 1000).toFixed(1)}s</p>
                  </CardContent>
                </Card>
              </div>

              {/* Category Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Findings nach Kategorie</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(data.summary.byCategory)
                      .sort((a, b) => b[1] - a[1])
                      .map(([cat, count]) => {
                        const meta = CATEGORY_META[cat as Category]
                        if (!meta) return null
                        const percentage = data.summary.totalFindings > 0
                          ? Math.round((count / data.summary.totalFindings) * 100)
                          : 0
                        return (
                          <div
                            key={cat}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50 ${categoryFilter === cat ? "bg-muted border-foreground/20" : ""}`}
                          >
                            <button
                              className="flex items-center gap-2 flex-1 min-w-0"
                              onClick={() => setCategoryFilter(categoryFilter === cat ? "all" : cat)}
                            >
                              <span className={`shrink-0 ${meta.color}`}>{meta.icon}</span>
                              <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium truncate">{meta.label}</span>
                                  <span className="text-xs text-muted-foreground ml-2 shrink-0">{count} ({percentage}%)</span>
                                </div>
                                <Progress
                                  value={percentage}
                                  className="h-1.5"
                                />
                              </div>
                            </button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 shrink-0"
                              title={`${meta.label}-Empfehlungen kopieren`}
                              onClick={(e) => {
                                e.stopPropagation()
                                const prompt = generateCategoryPrompt(cat as Category)
                                if (prompt) {
                                  setPromptDialog({ open: true, prompt, title: `${meta.label} Fixes` })
                                }
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="default"
                  onClick={() => {
                    const prompt = generateAllRecommendationsPrompt()
                    if (prompt) {
                      setPromptDialog({ open: true, prompt, title: "Alle Empfehlungen" })
                    }
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Alle Empfehlungen als v0-Prompt kopieren
                </Button>
                {data.summary.critical > 0 && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const criticals = data.findings.filter((f) => f.severity === "critical")
                      let prompt = `## KRITISCHE Code-Probleme sofort beheben!\n\n`
                      criticals.forEach((f) => {
                        prompt += `**${f.title}** in \`${f.file}\` (Zeile ${f.line})\n`
                        prompt += `- ${f.message}\n`
                        if (f.code) prompt += `- Code: \`${f.code}\`\n`
                        if (f.fix) prompt += `- Fix: ${f.fix}\n\n`
                      })
                      prompt += `Bitte behebe SOFORT alle kritischen Sicherheits- und Stabilitaetsprobleme.`
                      setPromptDialog({ open: true, prompt, title: "Kritische Probleme" })
                    }}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Kritische Fixes kopieren
                  </Button>
                )}
                <Button variant="outline" onClick={runReview} disabled={isLoading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  Erneut scannen
                </Button>
              </div>
            </>
          )}

          {/* Run button when no data */}
          {!data && !isLoading && (
            <Card>
              <CardHeader className="text-center">
                <Code2 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <CardTitle>Professioneller Code Review</CardTitle>
                <CardDescription>
                  Scannt den gesamten Code wie ein erfahrener Entwickler und prueft auf Sicherheit,
                  Performance, TypeScript-Qualitaet, Next.js Best Practices, Barrierefreiheit und mehr.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button size="lg" onClick={runReview}>
                  <Search className="mr-2 h-5 w-5" />
                  Code Review starten
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Progress */}
          {isLoading && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="text-sm font-medium">{progressLabel}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          {data && (
            <div className="flex flex-wrap gap-3">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Schweregrad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Schweregrade</SelectItem>
                  <SelectItem value="critical">Kritisch ({data.summary.critical})</SelectItem>
                  <SelectItem value="warning">Warnungen ({data.summary.warnings})</SelectItem>
                  <SelectItem value="info">Info ({data.summary.info})</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Kategorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  {Object.entries(data.summary.byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, count]) => {
                      const meta = CATEGORY_META[cat as Category]
                      return (
                        <SelectItem key={cat} value={cat}>
                          {meta?.label || cat} ({count})
                        </SelectItem>
                      )
                    })}
                </SelectContent>
              </Select>

              <Select value={fileFilter} onValueChange={setFileFilter}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Datei" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Dateien ({uniqueFiles.length})</SelectItem>
                  {data.summary.topFiles.map(({ file, count }) => (
                    <SelectItem key={file} value={file}>
                      {file.length > 40 ? `...${file.slice(-40)}` : file} ({count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="self-center text-sm text-muted-foreground">
                {filteredFindings.length} von {data.summary.totalFindings} Findings
              </span>
            </div>
          )}

          {/* Findings List */}
          {data && (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-2">
                {filteredFindings.map((finding, idx) => {
                  const id = `${finding.file}:${finding.line}:${idx}`
                  const isExpanded = expandedFindings.has(id)
                  const severityMeta = SEVERITY_META[finding.severity]
                  const categoryMeta = CATEGORY_META[finding.category]

                  return (
                    <Card key={id} className={`border ${finding.severity === "critical" ? "border-red-300 bg-red-50/30 dark:bg-red-950/10" : ""}`}>
                      <div
                        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => toggleFinding(id)}
                      >
                        <span className={`mt-0.5 ${severityMeta.color}`}>
                          {severityMeta.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{finding.title}</span>
                            <Badge className={severityMeta.bgColor}>{severityMeta.label}</Badge>
                            <Badge variant="outline" className="gap-1 text-xs">
                              <span className={categoryMeta.color}>{categoryMeta.icon}</span>
                              {categoryMeta.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                            {finding.file}:{finding.line}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-3 pb-3 pt-0 space-y-2 border-t">
                          <p className="text-sm mt-2">{finding.message}</p>
                          {finding.code && (
                            <div className="bg-muted rounded-md p-2">
                              <code className="text-xs font-mono break-all">{finding.code}</code>
                            </div>
                          )}
                          {finding.fix && (
                            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-md p-2">
                              <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-1">Empfohlener Fix:</p>
                              <p className="text-xs text-green-700 dark:text-green-400">{finding.fix}</p>
                            </div>
                          )}
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                const prompt = `Bitte behebe folgendes Code-Problem:\n\n**${finding.title}** in \`${finding.file}\` (Zeile ${finding.line})\n- ${finding.message}\n${finding.code ? `- Code: \`${finding.code}\`\n` : ""}${finding.fix ? `- Empfohlener Fix: ${finding.fix}\n` : ""}`
                                setPromptDialog({ open: true, prompt, title: finding.title })
                              }}
                            >
                              <Sparkles className="mr-1 h-3 w-3" />
                              v0-Fix
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                const prompt = generateCategoryPrompt(finding.category)
                                if (prompt) setPromptDialog({ open: true, prompt, title: `${categoryMeta.label} Fixes` })
                              }}
                            >
                              <Copy className="mr-1 h-3 w-3" />
                              Alle {categoryMeta.label}
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })}

                {filteredFindings.length === 0 && data.summary.totalFindings > 0 && (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    Keine Findings fuer die aktuelle Filterauswahl.
                  </div>
                )}
                {data.summary.totalFindings === 0 && (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                      <p className="text-lg font-medium">Keine Probleme gefunden</p>
                      <p className="text-sm text-muted-foreground">Der Code sieht sauber aus!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Top Files (problem hotspots) */}
          {data && data.summary.topFiles.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Dateien mit den meisten Findings</CardTitle>
                <CardDescription>Diese Dateien sollten priorisiert ueberarbeitet werden</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.summary.topFiles.slice(0, 10).map(({ file, count }) => (
                    <div
                      key={file}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                      onClick={() => setFileFilter(fileFilter === file ? "all" : file)}
                    >
                      <span className="text-sm font-mono truncate flex-1 mr-2">{file}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════ TAB 2: HISTORY ═══════════ */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Code Review Historie
                  </CardTitle>
                  <CardDescription>Vergangene Code Reviews und deren Ergebnisse</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadHistory} disabled={isHistoryLoading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isHistoryLoading ? "animate-spin" : ""}`} />
                  Aktualisieren
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isHistoryLoading && (
                <div className="flex items-center justify-center py-8 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Lade Historie...</span>
                </div>
              )}
              {!isHistoryLoading && historyData.length === 0 && (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Noch keine Code Reviews durchgefuehrt. Starten Sie den ersten Scan im Review-Tab.
                </div>
              )}
              {!isHistoryLoading && historyData.length > 0 && (
                <>
                  {/* Trend Cards */}
                  {(() => {
                    if (historyData.length < 2) return null
                    const latest = historyData[0]
                    const previous = historyData[1]
                    const errorDiff = latest.errors - previous.errors
                    const warningDiff = latest.warnings - previous.warnings

                    return (
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <Card>
                          <CardContent className="pt-4 pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">Findings Trend</p>
                                <p className="text-xl font-bold">{latest.total}</p>
                              </div>
                              <div className={`flex items-center gap-1 text-sm ${latest.total < previous.total ? "text-green-600" : latest.total > previous.total ? "text-red-600" : "text-muted-foreground"}`}>
                                {latest.total < previous.total ? <TrendingDown className="h-4 w-4" /> : latest.total > previous.total ? <TrendingUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                                {latest.total - previous.total > 0 ? `+${latest.total - previous.total}` : latest.total - previous.total}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-yellow-200">
                          <CardContent className="pt-4 pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">Warnungen</p>
                                <p className="text-xl font-bold text-yellow-600">{latest.warnings}</p>
                              </div>
                              <div className={`flex items-center gap-1 text-sm ${warningDiff < 0 ? "text-green-600" : warningDiff > 0 ? "text-red-600" : "text-muted-foreground"}`}>
                                {warningDiff < 0 ? <TrendingDown className="h-4 w-4" /> : warningDiff > 0 ? <TrendingUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                                {warningDiff > 0 ? `+${warningDiff}` : warningDiff === 0 ? "0" : warningDiff}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-red-200">
                          <CardContent className="pt-4 pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">Kritisch</p>
                                <p className="text-xl font-bold text-red-600">{latest.errors}</p>
                              </div>
                              <div className={`flex items-center gap-1 text-sm ${errorDiff < 0 ? "text-green-600" : errorDiff > 0 ? "text-red-600" : "text-muted-foreground"}`}>
                                {errorDiff < 0 ? <TrendingDown className="h-4 w-4" /> : errorDiff > 0 ? <TrendingUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                                {errorDiff > 0 ? `+${errorDiff}` : errorDiff === 0 ? "0" : errorDiff}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )
                  })()}

                  {/* History List */}
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-2">
                      {historyData.map((entry, idx) => {
                        const prevEntry = idx < historyData.length - 1 ? historyData[idx + 1] : null
                        const findingsDiff = prevEntry ? entry.total - prevEntry.total : 0
                        const time = new Date(entry.created_at).toLocaleString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })

                        return (
                          <Card key={entry.id} className="border">
                            <div className="flex items-center justify-between p-3">
                              <div className="flex items-center gap-3">
                                <Code2 className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">Code Review</p>
                                    <span className="text-xs text-muted-foreground">{time}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                    <span>{entry.total} Findings</span>
                                    {entry.errors > 0 && <span className="text-red-600">{entry.errors} kritisch</span>}
                                    {entry.warnings > 0 && <span className="text-yellow-600">{entry.warnings} Warn.</span>}
                                    {entry.duration_ms != null && (
                                      <span>{entry.duration_ms < 1000 ? `${entry.duration_ms}ms` : `${(entry.duration_ms / 1000).toFixed(1)}s`}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {prevEntry && findingsDiff !== 0 && (
                                  <div className={`flex items-center gap-1 text-xs ${findingsDiff < 0 ? "text-green-600" : "text-red-600"}`}>
                                    {findingsDiff < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                                    {findingsDiff > 0 ? `+${findingsDiff}` : findingsDiff}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Prompt Dialog */}
      <Dialog open={promptDialog.open} onOpenChange={(open) => setPromptDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Code Review: {promptDialog.title}
            </DialogTitle>
            <DialogDescription>
              Kopieren Sie diese Empfehlungen und fuegen Sie sie in v0 ein,
              um die Probleme automatisch zu beheben.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <ScrollArea className="h-[400px]">
              <pre className="p-4 bg-muted rounded-lg text-sm font-mono whitespace-pre-wrap">{promptDialog.prompt}</pre>
            </ScrollArea>
            <Button className="w-full" onClick={() => copyToClipboard(promptDialog.prompt)}>
              <Copy className="mr-2 h-4 w-4" />
              In Zwischenablage kopieren
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
