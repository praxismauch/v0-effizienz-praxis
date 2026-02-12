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
} from "lucide-react"

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

export default function FormDbSyncPanel() {
  const { toast } = useToast()
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

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }, [])

  const runCheck = useCallback(async () => {
    setIsLoading(true)
    setProgress(0)
    setProgressLabel("Verbinde mit Datenbank...")

    // Simulate progress while the API processes
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

      toast({
        title: "Sync-Check abgeschlossen",
        description: `${json.summary.ok}/${json.summary.total} Tabellen OK, ${json.summary.errors} Fehler, ${json.summary.warnings} Warnungen`,
        variant: json.summary.errors > 0 ? "destructive" : "default",
      })
    } catch (error) {
      if (progressInterval.current) clearInterval(progressInterval.current)
      setProgress(0)
      setProgressLabel("")
      toast({
        title: "Fehler",
        description: "Form-DB Sync-Check konnte nicht ausgefuehrt werden",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const toggleForm = (id: string) => {
    setExpandedForms((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
      case "missing_table":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ok":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">OK</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warnung</Badge>
      case "error":
        return <Badge variant="destructive">Fehler</Badge>
      case "missing_table":
        return <Badge variant="destructive">Tabelle fehlt</Badge>
      default:
        return null
    }
  }

  // Generate a v0-pasteable fix prompt for a single form
  const generateFixPrompt = (form: FormResult): string => {
    const fixes = form.issues.filter((i) => i.fix).map((i) => i.fix!)
    if (fixes.length === 0) return ""

    return `Bitte fuehre folgende SQL-Migrationen aus, um die Datenbank-Spalten fuer das Formular "${form.name}" (Tabelle: ${form.table}) zu korrigieren:

\`\`\`sql
${fixes.join("\n\n")}

-- PostgREST Schema-Cache neu laden
NOTIFY pgrst, 'reload schema';
\`\`\`

Das Formular befindet sich in: ${form.component}
Bitte fuehre die SQL-Statements direkt mit supabase_execute_sql aus.`
  }

  // Generate a combined fix prompt for all forms with issues
  const generateAllFixPrompt = (): string => {
    if (!data) return ""
    const formsWithFixes = data.results.filter((r) => r.issues.some((i) => i.fix))
    if (formsWithFixes.length === 0) return ""

    const allFixes = formsWithFixes.flatMap((form) => {
      const fixes = form.issues.filter((i) => i.fix).map((i) => i.fix!)
      return [`-- ${form.name} (${form.table})`, ...fixes, ""]
    })

    return `Bitte fuehre folgende SQL-Migrationen aus, um alle fehlenden Datenbank-Spalten zu korrigieren:

\`\`\`sql
${allFixes.join("\n")}
-- PostgREST Schema-Cache neu laden
NOTIFY pgrst, 'reload schema';
\`\`\`

Bitte fuehre die SQL-Statements direkt mit supabase_execute_sql aus.`
  }

  // Generate a comprehensive v0-chat prompt for ALL warnings and errors
  const generateAllProblemsPrompt = (): string => {
    if (!data) return ""

    const problemForms = data.results.filter(
      (r) => r.status === "warning" || r.status === "error" || r.status === "missing_table"
    )
    if (problemForms.length === 0) return ""

    const errorForms = problemForms.filter((r) => r.status === "error" || r.status === "missing_table")
    const warningForms = problemForms.filter((r) => r.status === "warning")

    let prompt = `## Form-DB Sync Check: ${problemForms.length} Probleme gefunden\n\n`
    prompt += `Zusammenfassung: ${data.summary.total} Tabellen geprueft, ${data.summary.ok} OK, ${data.summary.warnings} Warnungen, ${data.summary.errors} Fehler.\n\n`

    if (errorForms.length > 0) {
      prompt += `### Fehler (${errorForms.length})\n\n`
      errorForms.forEach((form) => {
        prompt += `**${form.name}** (Tabelle: \`${form.table}\`, Kategorie: ${form.category || "Sonstige"})\n`
        form.issues.forEach((issue) => {
          prompt += `- ${issue.severity === "error" ? "FEHLER" : "WARNUNG"}: ${issue.message}\n`
          if (issue.fix) {
            prompt += `  Fix: \`${issue.fix}\`\n`
          }
        })
        prompt += `\n`
      })
    }

    if (warningForms.length > 0) {
      prompt += `### Warnungen (${warningForms.length})\n\n`
      warningForms.forEach((form) => {
        prompt += `**${form.name}** (Tabelle: \`${form.table}\`, Kategorie: ${form.category || "Sonstige"})\n`
        form.issues.forEach((issue) => {
          prompt += `- ${issue.severity === "error" ? "FEHLER" : "WARNUNG"}: ${issue.message}\n`
          if (issue.fix) {
            prompt += `  Fix: \`${issue.fix}\`\n`
          }
        })
        prompt += `\n`
      })
    }

    // Collect all SQL fixes
    const allFixes = problemForms.flatMap((form) =>
      form.issues
        .filter((i) => i.fix)
        .map((i) => `-- ${form.name} (${form.table}): ${i.message}\n${i.fix}`)
    )

    if (allFixes.length > 0) {
      prompt += `### Alle SQL-Fixes zusammengefasst\n\n`
      prompt += `\`\`\`sql\n${allFixes.join("\n\n")}\n\nNOTIFY pgrst, 'reload schema';\n\`\`\`\n\n`
    }

    prompt += `Bitte analysiere alle oben genannten Probleme und behebe sie. Fuehre SQL-Fixes direkt mit supabase_execute_sql aus. Fuer Warnungen ohne SQL-Fix schlage bitte Loesungen vor.`

    return prompt
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Kopiert!", description: "v0-Prompt in die Zwischenablage kopiert" })
  }

  const successRate = data ? (data.summary.total > 0 ? (data.summary.ok / data.summary.total) * 100 : 0) : 0

  return (
    <div className="space-y-6">
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

          {/* Category Breakdown */}
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
            Form-DB Sync Check
          </CardTitle>
          <CardDescription>
            Prueft ob alle Formular-Felder als Spalten in der Datenbank existieren und die Typen kompatibel sind.
            Bei Problemen wird ein v0-Prompt generiert, den Sie direkt in v0 einfuegen koennen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
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
                <Button
                  variant="outline"
                  onClick={() => {
                    const prompt = generateAllProblemsPrompt()
                    if (prompt) copyToClipboard(prompt)
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Alle Probleme kopieren
                </Button>
                {data.summary.errors > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const prompt = generateAllFixPrompt()
                      if (prompt) setV0PromptDialog({ open: true, prompt, title: "Alle Probleme beheben" })
                    }}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    v0-Fix generieren (alle)
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Progress Bar */}
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
                  <SelectTrigger className="w-[150px] h-9 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="ok">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        OK
                      </span>
                    </SelectItem>
                    <SelectItem value="warning">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                        Warnungen
                      </span>
                    </SelectItem>
                    <SelectItem value="error">
                      <span className="flex items-center gap-2">
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                        Fehler
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[220px] h-9 text-sm">
                    <SelectValue placeholder="Kategorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kategorien</SelectItem>
                    {data.summary.categories?.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        {cat.name} ({cat.count})
                      </SelectItem>
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
                  // Filter results
                  const filtered = data.results.filter((form) => {
                    const statusMatch = statusFilter === "all" 
                      || (statusFilter === "error" && (form.status === "error" || form.status === "missing_table"))
                      || form.status === statusFilter
                    const categoryMatch = categoryFilter === "all" || (form.category || "Sonstige") === categoryFilter
                    return statusMatch && categoryMatch
                  })

                  if (filtered.length === 0) {
                    return (
                      <div className="py-8 text-center text-muted-foreground text-sm">
                        Keine Tabellen fuer die ausgewaehlten Filter gefunden.
                      </div>
                    )
                  }

                  // Group results by category
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
                      {/* Form Header - clickable */}
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleForm(form.id)}
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                const prompt = generateFixPrompt(form)
                                if (prompt) setV0PromptDialog({ open: true, prompt, title: `${form.name} beheben` })
                              }}
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              v0-Fix
                            </Button>
                          )}
                          {getStatusBadge(form.status)}
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <CardContent className="pt-0 pb-4 space-y-4">
                          {/* Component path */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <FileCode className="h-3 w-3" />
                            {form.component}
                          </div>

                          {/* Issues */}
                          {form.issues.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Probleme:</p>
                              {form.issues.map((issue, i) => (
                                <div
                                  key={i}
                                  className={`p-3 rounded-lg text-sm ${
                                    issue.severity === "error"
                                      ? "bg-red-50 text-red-800 border border-red-200"
                                      : "bg-yellow-50 text-yellow-800 border border-yellow-200"
                                  }`}
                                >
                                  <p className="font-medium">{issue.label} ({issue.field})</p>
                                  <p className="text-xs mt-0.5">{issue.message}</p>
                                  {issue.fix && (
                                    <div className="mt-2 space-y-1">
                                      <pre className="p-2 bg-background/50 rounded text-xs font-mono overflow-x-auto">
                                        {issue.fix}
                                      </pre>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          const fixPrompt = `Bitte fuehre folgendes SQL aus, um das Problem "${issue.message}" in Tabelle "${form.table}" zu beheben:\n\n\`\`\`sql\n${issue.fix}\n\nNOTIFY pgrst, 'reload schema';\n\`\`\`\n\nBitte fuehre das SQL-Statement direkt mit supabase_execute_sql aus.`
                                          copyToClipboard(fixPrompt)
                                        }}
                                      >
                                        <Copy className="h-3 w-3 mr-1" />
                                        Fix in v0 einfuegen
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Fields Table */}
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
                                      <td className="p-2">
                                        <span className="font-mono">{field.name}</span>
                                        <span className="text-muted-foreground ml-1">({field.label})</span>
                                      </td>
                                      <td className="p-2 font-mono">{field.type}</td>
                                      <td className="p-2 font-mono">{field.dbType || "-"}</td>
                                      <td className="p-2 text-center">{field.required ? "Ja" : "Nein"}</td>
                                      <td className="p-2 text-center">
                                        {field.existsInDb ? (
                                          <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                                        ) : (
                                          <XCircle className="h-4 w-4 text-red-500 inline" />
                                        )}
                                      </td>
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

      {/* v0 Prompt Dialog */}
      <Dialog
        open={v0PromptDialog.open}
        onOpenChange={(open) => setV0PromptDialog((prev) => ({ ...prev, open }))}
      >
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
              <pre className="p-4 bg-muted rounded-lg text-sm font-mono whitespace-pre-wrap">
                {v0PromptDialog.prompt}
              </pre>
            </ScrollArea>
            <Button
              className="w-full"
              onClick={() => copyToClipboard(v0PromptDialog.prompt)}
            >
              <Copy className="mr-2 h-4 w-4" />
              In Zwischenablage kopieren
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
