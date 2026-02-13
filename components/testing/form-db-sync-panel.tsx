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
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Table2,
  FileCode,
  Search,
  ArrowRight,
  History,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"

// ─── DB Schema Check types ───
interface FieldIssue {
  field: string
  label: string
  severity: "error" | "warning"
  message: string
  fix?: string
}

interface FieldResult {
  name: string
  label: string
  type: string
  required: boolean
  existsInDb: boolean
  dbType?: string
  dbNullable?: boolean
}

interface FormResult {
  id: string
  name: string
  table: string
  category?: string
  component: string
  columnCount?: number
  hasPracticeId?: boolean
  hasCreatedAt?: boolean
  hasUpdatedAt?: boolean
  hasDeletedAt?: boolean
  status: "ok" | "warning" | "error" | "missing_table"
  issues: FieldIssue[]
  fields: FieldResult[]
}

interface CategoryStat {
  name: string
  count: number
}

interface SyncData {
  results: FormResult[]
  summary: {
    total: number
    ok: number
    warnings: number
    errors: number
    totalColumns?: number
    withPracticeId?: number
    categories?: CategoryStat[]
  }
}

// ─── Form Scan types ───
interface FormScanIssue {
  severity: "error" | "warning" | "info"
  message: string
}

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
  dbFields: Record<string, string[]>
  status: "ok" | "warning" | "error"
  issues: FormScanIssue[]
}

interface FormScanData {
  results: FormScanResult[]
  summary: {
    totalSubmissions: number
    uniqueComponents: number
    uniqueApiRoutes: number
    uniqueTables: number
    ok: number
    warnings: number
    errors: number
    methodCounts: { POST: number; PATCH: number; PUT: number }
    scannedFiles: number
    scannedApiRoutes: number
  }
}

// ─── History types ───
interface HistoryEntry {
  id: string
  scan_type: "db-schema" | "form-scan"
  summary: any
  total: number
  ok: number
  warnings: number
  errors: number
  duration_ms: number | null
  created_at: string
}

export default function FormDbSyncPanel() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("db-schema")

  // ─── DB Schema Check state ───
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<SyncData | null>(null)
  const [expandedForms, setExpandedForms] = useState<Set<string>>(new Set())
  const [v0PromptDialog, setV0PromptDialog] = useState<{ open: boolean; prompt: string; title: string }>({
    open: false,
    prompt: "",
    title: "",
  })
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState("")
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Form Scan state ───
  const [isScanLoading, setIsScanLoading] = useState(false)
  const [scanData, setScanData] = useState<FormScanData | null>(null)
  const [expandedScans, setExpandedScans] = useState<Set<string>>(new Set())
  const [scanStatusFilter, setScanStatusFilter] = useState<string>("all")
  const [scanMethodFilter, setScanMethodFilter] = useState<string>("all")
  const [scanProgress, setScanProgress] = useState(0)
  const [scanProgressLabel, setScanProgressLabel] = useState("")
  const scanProgressInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── History state ───
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>("all")

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current)
      if (scanProgressInterval.current) clearInterval(scanProgressInterval.current)
    }
  }, [])

  // Load history when the history tab is activated
  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true)
    try {
      const res = await fetch("/api/super-admin/form-db-sync-history?limit=100")
      if (!res.ok) throw new Error("Fehler")
      const json = await res.json()
      setHistoryData(json.history || [])
    } catch {
      toast({ title: "Fehler", description: "Historie konnte nicht geladen werden", variant: "destructive" })
    } finally {
      setIsHistoryLoading(false)
    }
  }, [toast])

  // Auto-load history when tab changes to history
  useEffect(() => {
    if (activeTab === "history") {
      loadHistory()
    }
  }, [activeTab, loadHistory])

  // ─── DB Schema Check logic ───
  const runCheck = useCallback(async () => {
    setIsLoading(true)
    setProgress(0)
    setProgressLabel("Verbinde mit Datenbank...")

    let currentProgress = 0
    progressInterval.current = setInterval(() => {
      currentProgress += Math.random() * 8 + 2
      if (currentProgress > 90) currentProgress = 90
      setProgress(currentProgress)
      if (currentProgress < 20) setProgressLabel("Verbinde mit Datenbank...")
      else if (currentProgress < 40) setProgressLabel("Lade Tabellen-Schema...")
      else if (currentProgress < 60) setProgressLabel("Analysiere Spalten...")
      else if (currentProgress < 80) setProgressLabel("Kategorisiere Tabellen...")
      else setProgressLabel("Erstelle Bericht...")
    }, 300)

    try {
      const res = await fetch("/api/super-admin/form-db-sync")
      if (!res.ok) throw new Error("Fehler beim Laden")
      const json = await res.json()
      if (progressInterval.current) clearInterval(progressInterval.current)
      setProgress(100)
      setProgressLabel(`${json.summary.total} Tabellen analysiert`)
      setData(json)
      // Reload history in background after short delay (to let the API save finish)
      setTimeout(() => { if (historyData.length > 0 || activeTab === "history") loadHistory() }, 1500)
      toast({
        title: "Sync-Check abgeschlossen",
        description: `${json.summary.ok}/${json.summary.total} Tabellen OK, ${json.summary.errors} Fehler, ${json.summary.warnings} Warnungen`,
        variant: json.summary.errors > 0 ? "destructive" : "default",
      })
    } catch {
      if (progressInterval.current) clearInterval(progressInterval.current)
      setProgress(0)
      setProgressLabel("")
      toast({ title: "Fehler", description: "DB-Check konnte nicht ausgefuehrt werden", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast, historyData.length, activeTab, loadHistory])

  // ─── Form Scan logic ───
  const runFormScan = useCallback(async () => {
    setIsScanLoading(true)
    setScanProgress(0)
    setScanProgressLabel("Scanne Projektdateien...")

    let currentProgress = 0
    scanProgressInterval.current = setInterval(() => {
      currentProgress += Math.random() * 6 + 2
      if (currentProgress > 90) currentProgress = 90
      setScanProgress(currentProgress)
      if (currentProgress < 15) setScanProgressLabel("Scanne Projektdateien...")
      else if (currentProgress < 30) setScanProgressLabel("Analysiere Formulare...")
      else if (currentProgress < 50) setScanProgressLabel("Lese API-Routen...")
      else if (currentProgress < 70) setScanProgressLabel("Vergleiche mit DB-Schema...")
      else if (currentProgress < 85) setScanProgressLabel("Erstelle Bericht...")
      else setScanProgressLabel("Fertigstellung...")
    }, 300)

    try {
      const res = await fetch("/api/super-admin/form-scan")
      if (!res.ok) throw new Error("Fehler beim Laden")
      const json = await res.json()
      if (scanProgressInterval.current) clearInterval(scanProgressInterval.current)
      setScanProgress(100)
      setScanProgressLabel(`${json.summary.totalSubmissions} Form-Submissions gescannt`)
      setScanData(json)
      // Reload history in background after short delay
      setTimeout(() => { if (historyData.length > 0 || activeTab === "history") loadHistory() }, 1500)
      toast({
        title: "Form-Scan abgeschlossen",
        description: `${json.summary.totalSubmissions} Submissions in ${json.summary.uniqueComponents} Dateien, ${json.summary.errors} Fehler, ${json.summary.warnings} Warnungen`,
        variant: json.summary.errors > 0 ? "destructive" : "default",
      })
    } catch {
      if (scanProgressInterval.current) clearInterval(scanProgressInterval.current)
      setScanProgress(0)
      setScanProgressLabel("")
      toast({ title: "Fehler", description: "Form-Scan konnte nicht ausgefuehrt werden", variant: "destructive" })
    } finally {
      setIsScanLoading(false)
    }
  }, [toast, historyData.length, activeTab, loadHistory])

  // ─── Common helpers ───
  const toggleForm = (id: string) => {
    setExpandedForms((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleScan = (id: string) => {
    setExpandedScans((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok": return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
      case "missing_table": return <XCircle className="h-5 w-5 text-red-500" />
      default: return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ok": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">OK</Badge>
      case "warning": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warnung</Badge>
      case "error": return <Badge variant="destructive">Fehler</Badge>
      case "missing_table": return <Badge variant="destructive">Tabelle fehlt</Badge>
      default: return null
    }
  }

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "POST": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 font-mono text-xs">POST</Badge>
      case "PATCH": return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 font-mono text-xs">PATCH</Badge>
      case "PUT": return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 font-mono text-xs">PUT</Badge>
      default: return <Badge variant="outline" className="font-mono text-xs">{method}</Badge>
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Kopiert!", description: "v0-Prompt in die Zwischenablage kopiert" })
  }

  // ─── DB Schema prompt generators ───
  const generateFixPrompt = (form: FormResult): string => {
    const fixes = form.issues.filter((i) => i.fix).map((i) => i.fix!)
    if (fixes.length === 0) return ""
    return `Bitte fuehre folgende SQL-Migrationen aus, um die Datenbank-Spalten fuer das Formular "${form.name}" (Tabelle: ${form.table}) zu korrigieren:\n\n\`\`\`sql\n${fixes.join("\n\n")}\n\n-- PostgREST Schema-Cache neu laden\nNOTIFY pgrst, 'reload schema';\n\`\`\`\n\nDas Formular befindet sich in: ${form.component}\nBitte fuehre die SQL-Statements direkt mit supabase_execute_sql aus.`
  }

  const generateAllFixPrompt = (): string => {
    if (!data) return ""
    const formsWithFixes = data.results.filter((r) => r.issues.some((i) => i.fix))
    if (formsWithFixes.length === 0) return ""
    const allFixes = formsWithFixes.flatMap((form) => {
      const fixes = form.issues.filter((i) => i.fix).map((i) => i.fix!)
      return [`-- ${form.name} (${form.table})`, ...fixes, ""]
    })
    return `Bitte fuehre folgende SQL-Migrationen aus, um alle fehlenden Datenbank-Spalten zu korrigieren:\n\n\`\`\`sql\n${allFixes.join("\n")}\n-- PostgREST Schema-Cache neu laden\nNOTIFY pgrst, 'reload schema';\n\`\`\`\n\nBitte fuehre die SQL-Statements direkt mit supabase_execute_sql aus.`
  }

  const generateAllProblemsPrompt = (): string => {
    if (!data) return ""
    const problemForms = data.results.filter((r) => r.status === "warning" || r.status === "error" || r.status === "missing_table")
    if (problemForms.length === 0) return ""
    const errorForms = problemForms.filter((r) => r.status === "error" || r.status === "missing_table")
    const warningForms = problemForms.filter((r) => r.status === "warning")
    let prompt = `## Form-DB Sync Check: ${problemForms.length} Probleme gefunden\n\nZusammenfassung: ${data.summary.total} Tabellen geprueft, ${data.summary.ok} OK, ${data.summary.warnings} Warnungen, ${data.summary.errors} Fehler.\n\n`
    if (errorForms.length > 0) {
      prompt += `### Fehler (${errorForms.length})\n\n`
      errorForms.forEach((form) => {
        prompt += `**${form.name}** (Tabelle: \`${form.table}\`, Kategorie: ${form.category || "Sonstige"})\n`
        form.issues.forEach((issue) => { prompt += `- ${issue.severity === "error" ? "FEHLER" : "WARNUNG"}: ${issue.message}\n`; if (issue.fix) prompt += `  Fix: \`${issue.fix}\`\n` })
        prompt += `\n`
      })
    }
    if (warningForms.length > 0) {
      prompt += `### Warnungen (${warningForms.length})\n\n`
      warningForms.forEach((form) => {
        prompt += `**${form.name}** (Tabelle: \`${form.table}\`, Kategorie: ${form.category || "Sonstige"})\n`
        form.issues.forEach((issue) => { prompt += `- ${issue.severity === "error" ? "FEHLER" : "WARNUNG"}: ${issue.message}\n`; if (issue.fix) prompt += `  Fix: \`${issue.fix}\`\n` })
        prompt += `\n`
      })
    }
    const allFixes = problemForms.flatMap((form) => form.issues.filter((i) => i.fix).map((i) => `-- ${form.name} (${form.table}): ${i.message}\n${i.fix}`))
    if (allFixes.length > 0) {
      prompt += `### Alle SQL-Fixes zusammengefasst\n\n\`\`\`sql\n${allFixes.join("\n\n")}\n\nNOTIFY pgrst, 'reload schema';\n\`\`\`\n\n`
    }
    prompt += `Bitte analysiere alle oben genannten Probleme und behebe sie. Fuehre SQL-Fixes direkt mit supabase_execute_sql aus. Fuer Warnungen ohne SQL-Fix schlage bitte Loesungen vor.`
    return prompt
  }

  // ─── Form Scan prompt generator ───
  const generateFormScanProblemsPrompt = (): string => {
    if (!scanData) return ""
    const problems = scanData.results.filter((r) => r.status === "warning" || r.status === "error")
    if (problems.length === 0) return ""

    let prompt = `## Form-Scan: ${problems.length} Probleme gefunden\n\n`
    prompt += `Zusammenfassung: ${scanData.summary.totalSubmissions} Form-Submissions in ${scanData.summary.uniqueComponents} Komponenten gescannt.\n`
    prompt += `${scanData.summary.uniqueApiRoutes} API-Routen und ${scanData.summary.uniqueTables} DB-Tabellen zugeordnet.\n`
    prompt += `${scanData.summary.ok} OK, ${scanData.summary.warnings} Warnungen, ${scanData.summary.errors} Fehler.\n\n`

    const errors = problems.filter((r) => r.status === "error")
    const warnings = problems.filter((r) => r.status === "warning")

    if (errors.length > 0) {
      prompt += `### Fehler (${errors.length})\n\n`
      errors.forEach((r) => {
        prompt += `**${r.componentFile}** (Zeile ${r.lineNumber})\n`
        prompt += `- Methode: ${r.method}, URL: \`${r.apiUrlNormalized}\`\n`
        if (r.targetTables.length > 0) prompt += `- Ziel-Tabellen: ${r.targetTables.map((t) => `\`${t}\``).join(", ")}\n`
        if (r.formFields.length > 0) prompt += `- Formular-Felder: ${r.formFields.map((f) => `\`${f}\``).join(", ")}\n`
        r.issues.forEach((i) => { prompt += `  - ${i.severity.toUpperCase()}: ${i.message}\n` })
        prompt += `\n`
      })
    }

    if (warnings.length > 0) {
      prompt += `### Warnungen (${warnings.length})\n\n`
      warnings.forEach((r) => {
        prompt += `**${r.componentFile}** (Zeile ${r.lineNumber})\n`
        prompt += `- Methode: ${r.method}, URL: \`${r.apiUrlNormalized}\`\n`
        if (r.targetTables.length > 0) prompt += `- Ziel-Tabellen: ${r.targetTables.map((t) => `\`${t}\``).join(", ")}\n`
        if (r.formFields.length > 0) prompt += `- Formular-Felder: ${r.formFields.map((f) => `\`${f}\``).join(", ")}\n`
        r.issues.forEach((i) => { prompt += `  - ${i.severity.toUpperCase()}: ${i.message}\n` })
        prompt += `\n`
      })
    }

    prompt += `Bitte analysiere alle oben genannten Probleme und behebe sie:\n`
    prompt += `- Fuer fehlende API-Routen: Erstelle die Route oder korrigiere die URL im Frontend.\n`
    prompt += `- Fuer fehlende DB-Spalten: Fuehre ALTER TABLE mit supabase_execute_sql aus.\n`
    prompt += `- Fuer Feld-Mismatches: Passe entweder das Formular oder die DB-Spalte an.\n`
    prompt += `- Fuer fehlende Tabellen: Erstelle die Tabelle mit CREATE TABLE via supabase_execute_sql.`

    return prompt
  }

  const successRate = data ? (data.summary.total > 0 ? (data.summary.ok / data.summary.total) * 100 : 0) : 0
  const scanSuccessRate = scanData ? (scanData.summary.totalSubmissions > 0 ? (scanData.summary.ok / scanData.summary.totalSubmissions) * 100 : 0) : 0

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="db-schema" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            DB-Schema
            {data && (data.summary.warnings > 0 || data.summary.errors > 0) && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {data.summary.warnings + data.summary.errors}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="form-scan" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Form-Scan
            {scanData && (scanData.summary.warnings > 0 || scanData.summary.errors > 0) && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {scanData.summary.warnings + scanData.summary.errors}
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

        {/* ═══════════ TAB 1: DB SCHEMA CHECK ═══════════ */}
        <TabsContent value="db-schema" className="space-y-6">
          {/* Summary Cards */}
          {data && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tabellen gesamt</CardTitle>
                    <Table2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.summary.total}</div>
                    <p className="text-xs text-muted-foreground mt-1">{data.summary.totalColumns || 0} Spalten</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">OK</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{data.summary.ok}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Warnungen</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{data.summary.warnings}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fehler</CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{data.summary.errors}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sync-Rate</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{successRate.toFixed(0)}%</div>
                    <Progress value={successRate} className="mt-2" />
                  </CardContent>
                </Card>
              </div>

              {data.summary.categories && data.summary.categories.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Kategorien</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {data.summary.categories.map((cat) => (
                        <Badge key={cat.name} variant="outline" className="text-xs">
                          {cat.name}: {cat.count}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Action Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                DB-Schema Check
              </CardTitle>
              <CardDescription>
                Prueft ob alle DB-Tabellen Standardspalten (id, created_at) besitzen und kategorisiert sie.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button onClick={runCheck} disabled={isLoading} className="min-w-[200px]">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Pruefe...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync-Check ausfuehren
                    </>
                  )}
                </Button>
                {data && (data.summary.errors > 0 || data.summary.warnings > 0) && (
                  <>
                    <Button variant="outline" onClick={() => { const prompt = generateAllProblemsPrompt(); if (prompt) copyToClipboard(prompt) }}>
                      <Copy className="mr-2 h-4 w-4" />
                      Alle Probleme kopieren
                    </Button>
                    {data.summary.errors > 0 && (
                      <Button variant="outline" onClick={() => { const prompt = generateAllFixPrompt(); if (prompt) setV0PromptDialog({ open: true, prompt, title: "Alle Probleme beheben" }) }}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        v0-Fix generieren (alle)
                      </Button>
                    )}
                  </>
                )}
              </div>
              {(isLoading || progress > 0) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{progressLabel}</span>
                    <span className="font-mono text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2 transition-all duration-300" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {data && data.results.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Ergebnisse</CardTitle>
                    <CardDescription>
                      {statusFilter !== "all" || categoryFilter !== "all"
                        ? `Gefiltert: ${data.results.filter((f) => {
                            const sm = statusFilter === "all" || (statusFilter === "error" && (f.status === "error" || f.status === "missing_table")) || f.status === statusFilter
                            const cm = categoryFilter === "all" || (f.category || "Sonstige") === categoryFilter
                            return sm && cm
                          }).length} von ${data.results.length} Tabellen`
                        : `Detaillierte Ergebnisse fuer alle ${data.results.length} Tabellen`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Status</SelectItem>
                        <SelectItem value="ok"><span className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />OK</span></SelectItem>
                        <SelectItem value="warning"><span className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />Warnungen</span></SelectItem>
                        <SelectItem value="error"><span className="flex items-center gap-2"><XCircle className="h-3.5 w-3.5 text-red-500" />Fehler</span></SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[220px] h-9 text-sm"><SelectValue placeholder="Kategorie" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Kategorien</SelectItem>
                        {data.summary.categories?.map((cat) => (
                          <SelectItem key={cat.name} value={cat.name}>{cat.name} ({cat.count})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {(() => {
                      const filtered = data.results.filter((form) => {
                        const statusMatch = statusFilter === "all" || (statusFilter === "error" && (form.status === "error" || form.status === "missing_table")) || form.status === statusFilter
                        const categoryMatch = categoryFilter === "all" || (form.category || "Sonstige") === categoryFilter
                        return statusMatch && categoryMatch
                      })
                      if (filtered.length === 0) {
                        return <div className="py-8 text-center text-muted-foreground text-sm">Keine Tabellen fuer die ausgewaehlten Filter gefunden.</div>
                      }
                      const categories = new Map<string, FormResult[]>()
                      filtered.forEach((form) => {
                        const cat = form.category || "Sonstige"
                        if (!categories.has(cat)) categories.set(cat, [])
                        categories.get(cat)!.push(form)
                      })
                      return Array.from(categories.entries()).map(([category, forms]) => (
                        <div key={category} className="space-y-2">
                          <div className="flex items-center gap-2 pt-2">
                            <h4 className="text-sm font-semibold text-muted-foreground">{category}</h4>
                            <Badge variant="secondary" className="text-xs">{forms.length}</Badge>
                          </div>
                          {forms.map((form) => {
                            const isExpanded = expandedForms.has(form.id)
                            const hasFixes = form.issues.some((i) => i.fix)
                            return (
                              <Card key={form.id} className="border">
                                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleForm(form.id)}>
                                  <div className="flex items-center gap-3">
                                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                    {getStatusIcon(form.status)}
                                    <div>
                                      <p className="font-medium text-sm">{form.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        <span className="font-mono">{form.table}</span> &middot; {form.columnCount || form.fields.length} Spalten
                                        {form.hasPracticeId && " \u00B7 multi-tenant"}
                                        {form.issues.length > 0 && ` \u00B7 ${form.issues.length} Problem${form.issues.length > 1 ? "e" : ""}`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {hasFixes && (
                                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); const prompt = generateFixPrompt(form); if (prompt) setV0PromptDialog({ open: true, prompt, title: `${form.name} beheben` }) }}>
                                        <Sparkles className="h-3 w-3 mr-1" />v0-Fix
                                      </Button>
                                    )}
                                    {getStatusBadge(form.status)}
                                  </div>
                                </div>
                                {isExpanded && (
                                  <CardContent className="pt-0 pb-4 space-y-4">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <FileCode className="h-3 w-3" />{form.component}
                                    </div>
                                    {form.issues.length > 0 && (
                                      <div className="space-y-2">
                                        <p className="text-sm font-medium">Probleme:</p>
                                        {form.issues.map((issue, i) => (
                                          <div key={i} className={`p-3 rounded-lg text-sm ${issue.severity === "error" ? "bg-red-50 text-red-800 border border-red-200" : "bg-yellow-50 text-yellow-800 border border-yellow-200"}`}>
                                            <p className="font-medium">{issue.label} ({issue.field})</p>
                                            <p className="text-xs mt-0.5">{issue.message}</p>
                                            {issue.fix && (
                                              <div className="mt-2 space-y-1">
                                                <pre className="p-2 bg-background/50 rounded text-xs font-mono overflow-x-auto">{issue.fix}</pre>
                                                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); copyToClipboard(`Bitte fuehre folgendes SQL aus, um das Problem "${issue.message}" in Tabelle "${form.table}" zu beheben:\n\n\`\`\`sql\n${issue.fix}\n\nNOTIFY pgrst, 'reload schema';\n\`\`\`\n\nBitte fuehre das SQL-Statement direkt mit supabase_execute_sql aus.`) }}>
                                                  <Copy className="h-3 w-3 mr-1" />Fix in v0 einfuegen
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <div className="space-y-2">
                                      <p className="text-sm font-medium">Feld-Zuordnung:</p>
                                      <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-xs">
                                          <thead className="bg-muted/50">
                                            <tr>
                                              <th className="text-left p-2 font-medium">Feld</th>
                                              <th className="text-left p-2 font-medium">Form-Typ</th>
                                              <th className="text-left p-2 font-medium">DB-Typ</th>
                                              <th className="text-center p-2 font-medium">Pflicht</th>
                                              <th className="text-center p-2 font-medium">Status</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {form.fields.map((field) => (
                                              <tr key={field.name} className="border-t">
                                                <td className="p-2"><span className="font-mono">{field.name}</span><span className="text-muted-foreground ml-1">({field.label})</span></td>
                                                <td className="p-2 font-mono">{field.type}</td>
                                                <td className="p-2 font-mono">{field.dbType || "-"}</td>
                                                <td className="p-2 text-center">{field.required ? "Ja" : "Nein"}</td>
                                                <td className="p-2 text-center">{field.existsInDb ? <CheckCircle2 className="h-4 w-4 text-green-500 inline" /> : <XCircle className="h-4 w-4 text-red-500 inline" />}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </CardContent>
                                )}
                              </Card>
                            )
                          })}
                        </div>
                      ))
                    })()}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════ TAB 2: FORM SCAN ═══════════ */}
        <TabsContent value="form-scan" className="space-y-6">
          {/* Summary Cards */}
          {scanData && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Submissions</CardTitle>
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{scanData.summary.totalSubmissions}</div>
                  <p className="text-xs text-muted-foreground mt-1">in {scanData.summary.uniqueComponents} Dateien</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">API-Routen</CardTitle>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{scanData.summary.uniqueApiRoutes}</div>
                  <p className="text-xs text-muted-foreground mt-1">von {scanData.summary.scannedApiRoutes} gescannt</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">DB-Tabellen</CardTitle>
                  <Table2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{scanData.summary.uniqueTables}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">OK</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{scanData.summary.ok}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Warnungen</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{scanData.summary.warnings}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fehler</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{scanData.summary.errors}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Method breakdown */}
          {scanData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Methoden-Verteilung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 font-mono">POST</Badge>
                    <span className="text-sm font-bold">{scanData.summary.methodCounts.POST}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 font-mono">PATCH</Badge>
                    <span className="text-sm font-bold">{scanData.summary.methodCounts.PATCH}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 font-mono">PUT</Badge>
                    <span className="text-sm font-bold">{scanData.summary.methodCounts.PUT}</span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Scan-Rate:</span>
                    <span className="text-sm font-bold">{scanSuccessRate.toFixed(0)}%</span>
                    <Progress value={scanSuccessRate} className="w-24 h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Form-Scan
              </CardTitle>
              <CardDescription>
                Scannt alle Projekt-Dateien nach Formularen (fetch POST/PATCH/PUT), ordnet sie API-Routen und DB-Tabellen zu und prueft Feld-Kompatibilitaet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button onClick={runFormScan} disabled={isScanLoading} className="min-w-[200px]">
                  {isScanLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scanne...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Form-Scan starten
                    </>
                  )}
                </Button>
                {scanData && (scanData.summary.errors > 0 || scanData.summary.warnings > 0) && (
                  <Button variant="outline" onClick={() => { const prompt = generateFormScanProblemsPrompt(); if (prompt) copyToClipboard(prompt) }}>
                    <Copy className="mr-2 h-4 w-4" />
                    Alle Probleme kopieren
                  </Button>
                )}
              </div>
              {(isScanLoading || scanProgress > 0) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{scanProgressLabel}</span>
                    <span className="font-mono text-muted-foreground">{Math.round(scanProgress)}%</span>
                  </div>
                  <Progress value={scanProgress} className="h-2 transition-all duration-300" />
                </div>
              )}

              {/* Info box */}
              {!scanData && !isScanLoading && (
                <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Was wird gescannt?</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Alle .tsx Dateien in app/, components/, contexts/, hooks/</li>
                    <li>Alle fetch() Aufrufe mit POST, PATCH oder PUT</li>
                    <li>Zuordnung zu API-Routen unter app/api/</li>
                    <li>Erkennung der Ziel-Tabelle (.from("tabelle"))</li>
                    <li>Vergleich der Formular-Felder mit DB-Spalten</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Scan Results */}
          {scanData && scanData.results.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Form-Scan Ergebnisse</CardTitle>
                    <CardDescription>
                      {scanData.results.length} Form-Submissions gefunden
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={scanStatusFilter} onValueChange={setScanStatusFilter}>
                      <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Status</SelectItem>
                        <SelectItem value="ok"><span className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />OK</span></SelectItem>
                        <SelectItem value="warning"><span className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />Warnungen</span></SelectItem>
                        <SelectItem value="error"><span className="flex items-center gap-2"><XCircle className="h-3.5 w-3.5 text-red-500" />Fehler</span></SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={scanMethodFilter} onValueChange={setScanMethodFilter}>
                      <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue placeholder="Methode" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Methoden</SelectItem>
                        <SelectItem value="POST">POST ({scanData.summary.methodCounts.POST})</SelectItem>
                        <SelectItem value="PATCH">PATCH ({scanData.summary.methodCounts.PATCH})</SelectItem>
                        <SelectItem value="PUT">PUT ({scanData.summary.methodCounts.PUT})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-2">
                    {(() => {
                      const filtered = scanData.results.filter((r) => {
                        const statusMatch = scanStatusFilter === "all" || r.status === scanStatusFilter
                        const methodMatch = scanMethodFilter === "all" || r.method === scanMethodFilter
                        return statusMatch && methodMatch
                      })

                      if (filtered.length === 0) {
                        return <div className="py-8 text-center text-muted-foreground text-sm">Keine Ergebnisse fuer die ausgewaehlten Filter.</div>
                      }

                      // Group by component file
                      const byFile = new Map<string, typeof filtered>()
                      filtered.forEach((r) => {
                        if (!byFile.has(r.componentFile)) byFile.set(r.componentFile, [])
                        byFile.get(r.componentFile)!.push(r)
                      })

                      return Array.from(byFile.entries()).map(([file, results]) => (
                        <div key={file} className="space-y-1">
                          <div className="flex items-center gap-2 pt-3 pb-1">
                            <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-mono text-muted-foreground">{file}</span>
                            <Badge variant="secondary" className="text-xs">{results.length}</Badge>
                          </div>
                          {results.map((result) => {
                            const isExpanded = expandedScans.has(result.id)
                            return (
                              <Card key={result.id} className="border">
                                <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleScan(result.id)}>
                                  <div className="flex items-center gap-3">
                                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                    {getStatusIcon(result.status)}
                                    <div className="flex items-center gap-2">
                                      {getMethodBadge(result.method)}
                                      <span className="font-mono text-xs text-muted-foreground">{result.apiUrlNormalized}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {result.targetTables.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                        {result.targetTables.map((t) => (
                                          <Badge key={t} variant="outline" className="text-xs font-mono">{t}</Badge>
                                        ))}
                                      </div>
                                    )}
                                    {result.issues.length > 0 && (
                                      <Badge variant="secondary" className="text-xs">
                                        {result.issues.length} Problem{result.issues.length > 1 ? "e" : ""}
                                      </Badge>
                                    )}
                                    {getStatusBadge(result.status)}
                                  </div>
                                </div>
                                {isExpanded && (
                                  <CardContent className="pt-0 pb-3 space-y-3">
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                      <div>
                                        <span className="text-muted-foreground">Zeile:</span>{" "}
                                        <span className="font-mono">{result.lineNumber}</span>
                                      </div>
                                      {result.apiRouteFile && (
                                        <div>
                                          <span className="text-muted-foreground">API-Route:</span>{" "}
                                          <span className="font-mono">{result.apiRouteFile}</span>
                                        </div>
                                      )}
                                    </div>

                                    {result.formFields.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium mb-1">Formular-Felder ({result.formFields.length}):</p>
                                        <div className="flex flex-wrap gap-1">
                                          {result.formFields.map((f) => {
                                            const inDb = result.targetTables.some((t) => {
                                              const cols = result.dbFields[t] || []
                                              const snakeField = f.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
                                              return cols.includes(f) || cols.includes(snakeField)
                                            })
                                            return (
                                              <Badge key={f} variant={inDb ? "outline" : "destructive"} className="text-xs font-mono">
                                                {f}
                                                {inDb ? <CheckCircle2 className="h-3 w-3 ml-1" /> : <XCircle className="h-3 w-3 ml-1" />}
                                              </Badge>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {result.targetTables.length > 0 && Object.keys(result.dbFields).length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium mb-1">DB-Spalten:</p>
                                        {result.targetTables.map((table) => (
                                          <div key={table} className="mb-2">
                                            <span className="text-xs font-mono text-muted-foreground">{table}:</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {(result.dbFields[table] || []).slice(0, 20).map((col) => (
                                                <Badge key={col} variant="outline" className="text-xs font-mono bg-muted/30">
                                                  {col}
                                                </Badge>
                                              ))}
                                              {(result.dbFields[table] || []).length > 20 && (
                                                <Badge variant="secondary" className="text-xs">
                                                  +{(result.dbFields[table] || []).length - 20} weitere
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {result.issues.length > 0 && (
                                      <div className="space-y-1">
                                        <p className="text-xs font-medium">Probleme:</p>
                                        {result.issues.map((issue, i) => (
                                          <div key={i} className={`p-2 rounded text-xs ${
                                            issue.severity === "error" ? "bg-red-50 text-red-800 border border-red-200"
                                            : issue.severity === "warning" ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                                            : "bg-blue-50 text-blue-800 border border-blue-200"
                                          }`}>
                                            {issue.message}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Copy single issue to v0 */}
                                    {result.issues.length > 0 && (
                                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={(e) => {
                                        e.stopPropagation()
                                        let prompt = `Bitte behebe folgendes Problem in **${result.componentFile}** (Zeile ${result.lineNumber}):\n\n`
                                        prompt += `- Methode: ${result.method}, URL: \`${result.apiUrlNormalized}\`\n`
                                        if (result.targetTables.length > 0) prompt += `- Ziel-Tabellen: ${result.targetTables.join(", ")}\n`
                                        if (result.formFields.length > 0) prompt += `- Formular-Felder: ${result.formFields.join(", ")}\n\n`
                                        prompt += `Probleme:\n`
                                        result.issues.forEach((i) => { prompt += `- ${i.severity.toUpperCase()}: ${i.message}\n` })
                                        prompt += `\nBitte analysiere das Problem und behebe es. Fuer DB-Aenderungen nutze supabase_execute_sql.`
                                        copyToClipboard(prompt)
                                      }}>
                                        <Copy className="h-3 w-3 mr-1" />
                                        Fix in v0 einfuegen
                                      </Button>
                                    )}
                                  </CardContent>
                                )}
                              </Card>
                            )
                          })}
                        </div>
                      ))
                    })()}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════ TAB 3: HISTORY ═══════════ */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Scan-Historie
                  </CardTitle>
                  <CardDescription>
                    Verlauf aller DB-Schema Checks und Form-Scans mit Trend-Analyse
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={historyTypeFilter} onValueChange={setHistoryTypeFilter}>
                    <SelectTrigger className="w-[180px] h-9 text-sm">
                      <SelectValue placeholder="Scan-Typ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Scan-Typen</SelectItem>
                      <SelectItem value="db-schema">
                        <span className="flex items-center gap-2">
                          <Database className="h-3.5 w-3.5" />
                          DB-Schema Check
                        </span>
                      </SelectItem>
                      <SelectItem value="form-scan">
                        <span className="flex items-center gap-2">
                          <Search className="h-3.5 w-3.5" />
                          Form-Scan
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={loadHistory} disabled={isHistoryLoading}>
                    {isHistoryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isHistoryLoading && historyData.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Lade Historie...</span>
                </div>
              ) : historyData.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  <History className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p>Noch keine Scan-Ergebnisse vorhanden.</p>
                  <p className="text-xs mt-1">Fuehre einen DB-Schema Check oder Form-Scan aus, um die Historie zu starten.</p>
                </div>
              ) : (
                <>
                  {/* Trend Summary Cards */}
                  {(() => {
                    const filtered = historyTypeFilter === "all"
                      ? historyData
                      : historyData.filter((h) => h.scan_type === historyTypeFilter)

                    if (filtered.length < 2) return null

                    const latest = filtered[0]
                    const previous = filtered[1]
                    const errorDiff = latest.errors - previous.errors
                    const warningDiff = latest.warnings - previous.warnings
                    const okDiff = latest.ok - previous.ok

                    return (
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <Card className="border-green-200">
                          <CardContent className="pt-4 pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">OK Trend</p>
                                <p className="text-xl font-bold text-green-600">{latest.ok}</p>
                              </div>
                              <div className={`flex items-center gap-1 text-sm ${okDiff > 0 ? "text-green-600" : okDiff < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                                {okDiff > 0 ? <TrendingUp className="h-4 w-4" /> : okDiff < 0 ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                                {okDiff > 0 ? `+${okDiff}` : okDiff === 0 ? "0" : okDiff}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-yellow-200">
                          <CardContent className="pt-4 pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">Warnungen Trend</p>
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
                                <p className="text-xs text-muted-foreground">Fehler Trend</p>
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
                      {(() => {
                        const filtered = historyTypeFilter === "all"
                          ? historyData
                          : historyData.filter((h) => h.scan_type === historyTypeFilter)

                        if (filtered.length === 0) {
                          return (
                            <div className="py-8 text-center text-muted-foreground text-sm">
                              Keine Eintraege fuer diesen Filter.
                            </div>
                          )
                        }

                        // Group by date
                        const byDate = new Map<string, HistoryEntry[]>()
                        filtered.forEach((entry) => {
                          const date = new Date(entry.created_at).toLocaleDateString("de-DE", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                          if (!byDate.has(date)) byDate.set(date, [])
                          byDate.get(date)!.push(entry)
                        })

                        return Array.from(byDate.entries()).map(([date, entries]) => (
                          <div key={date} className="space-y-2">
                            <div className="flex items-center gap-2 pt-3 pb-1">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-semibold text-muted-foreground">{date}</span>
                              <Badge variant="secondary" className="text-xs">{entries.length}</Badge>
                            </div>
                            {entries.map((entry, idx) => {
                              const prevEntry = idx < entries.length - 1 ? entries[idx + 1] : null
                              const errorChange = prevEntry ? entry.errors - prevEntry.errors : 0
                              const time = new Date(entry.created_at).toLocaleTimeString("de-DE", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                              const successRate = entry.total > 0 ? ((entry.ok / entry.total) * 100).toFixed(0) : "0"

                              return (
                                <Card key={entry.id} className="border">
                                  <div className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-3">
                                      {entry.scan_type === "db-schema" ? (
                                        <Database className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <Search className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm font-medium">
                                            {entry.scan_type === "db-schema" ? "DB-Schema Check" : "Form-Scan"}
                                          </p>
                                          <span className="text-xs text-muted-foreground font-mono">{time}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                          <span>{entry.total} gesamt</span>
                                          <span className="text-green-600">{entry.ok} OK</span>
                                          {entry.warnings > 0 && <span className="text-yellow-600">{entry.warnings} Warn.</span>}
                                          {entry.errors > 0 && <span className="text-red-600">{entry.errors} Fehler</span>}
                                          {entry.duration_ms != null && (
                                            <span>{entry.duration_ms < 1000 ? `${entry.duration_ms}ms` : `${(entry.duration_ms / 1000).toFixed(1)}s`}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {/* Trend indicator vs previous run of same day */}
                                      {prevEntry && errorChange !== 0 && (
                                        <div className={`flex items-center gap-1 text-xs ${errorChange < 0 ? "text-green-600" : "text-red-600"}`}>
                                          {errorChange < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                                          {errorChange > 0 ? `+${errorChange}` : errorChange} Fehler
                                        </div>
                                      )}
                                      <div className="text-right">
                                        <span className="text-sm font-bold">{successRate}%</span>
                                        <Progress value={Number(successRate)} className="w-16 h-1.5 mt-0.5" />
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              )
                            })}
                          </div>
                        ))
                      })()}
                    </div>
                  </ScrollArea>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* v0 Prompt Dialog (shared) */}
      <Dialog open={v0PromptDialog.open} onOpenChange={(open) => setV0PromptDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              v0-Fix: {v0PromptDialog.title}
            </DialogTitle>
            <DialogDescription>
              Kopieren Sie diesen Prompt und fuegen Sie ihn in einen neuen v0-Chat ein,
              um die Probleme automatisch zu beheben.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <ScrollArea className="h-[400px]">
              <pre className="p-4 bg-muted rounded-lg text-sm font-mono whitespace-pre-wrap">{v0PromptDialog.prompt}</pre>
            </ScrollArea>
            <Button className="w-full" onClick={() => copyToClipboard(v0PromptDialog.prompt)}>
              <Copy className="mr-2 h-4 w-4" />
              In Zwischenablage kopieren
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
