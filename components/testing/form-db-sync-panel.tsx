"use client"

import { useState, useCallback } from "react"
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
  component: string
  status: "ok" | "warning" | "error" | "missing_table"
  issues: FieldIssue[]
  fields: FieldResult[]
}

interface SyncData {
  results: FormResult[]
  summary: {
    total: number
    ok: number
    warnings: number
    errors: number
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

  const runCheck = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/super-admin/form-db-sync")
      if (!res.ok) throw new Error("Fehler beim Laden")
      const json = await res.json()
      setData(json)

      toast({
        title: "Sync-Check abgeschlossen",
        description: `${json.summary.ok}/${json.summary.total} Formulare OK, ${json.summary.errors} Fehler, ${json.summary.warnings} Warnungen`,
        variant: json.summary.errors > 0 ? "destructive" : "default",
      })
    } catch (error) {
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Kopiert!", description: "v0-Prompt in die Zwischenablage kopiert" })
  }

  const successRate = data ? (data.summary.total > 0 ? (data.summary.ok / data.summary.total) * 100 : 0) : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Formulare gesamt</CardTitle>
              <Table2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.total}</div>
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

            {data && data.summary.errors > 0 && (
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
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {data && data.results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ergebnisse</CardTitle>
            <CardDescription>
              Detaillierte Ergebnisse fuer jedes Formular
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {data.results.map((form) => {
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
                              {form.table} &middot; {form.fields.length} Felder
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
                                    <pre className="mt-2 p-2 bg-background/50 rounded text-xs font-mono overflow-x-auto">
                                      {issue.fix}
                                    </pre>
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
