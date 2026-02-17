"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Database, Search, History, Sparkles, Copy } from "lucide-react"

import type { SyncData, FormScanData, FormResult, HistoryEntry } from "./form-db-sync/types"
import { DbSchemaTab } from "./form-db-sync/db-schema-tab"
import { FormScanTab } from "./form-db-sync/form-scan-tab"
import { HistoryTab } from "./form-db-sync/history-tab"

export default function FormDbSyncPanel() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("db-schema")

  // ─── DB Schema Check state ───
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<SyncData | null>(null)
  const [v0PromptDialog, setV0PromptDialog] = useState<{ open: boolean; prompt: string; title: string }>({
    open: false,
    prompt: "",
    title: "",
  })
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState("")
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Form Scan state ───
  const [isScanLoading, setIsScanLoading] = useState(false)
  const [scanData, setScanData] = useState<FormScanData | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanProgressLabel, setScanProgressLabel] = useState("")
  const scanProgressInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── History state ───
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)

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

  // ─── Helpers ───
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Kopiert!", description: "v0-Prompt in die Zwischenablage kopiert" })
  }

  const showPrompt = (prompt: string, title: string) => {
    setV0PromptDialog({ open: true, prompt, title })
  }

  // ─── DB Schema prompt generators ───
  const generateFixPrompt = (form: FormResult): string => {
    const fixes = form.issues.filter((i) => i.fix).map((i) => i.fix!)
    if (fixes.length === 0) return ""
    return `Bitte führe folgende SQL-Migrationen aus, um die Datenbank-Spalten für das Formular "${form.name}" (Tabelle: ${form.table}) zu korrigieren:\n\n\`\`\`sql\n${fixes.join("\n\n")}\n\n-- PostgREST Schema-Cache neu laden\nNOTIFY pgrst, 'reload schema';\n\`\`\`\n\nDas Formular befindet sich in: ${form.component}\nBitte führe die SQL-Statements direkt mit supabase_execute_sql aus.`
  }

  const generateAllFixPrompt = (): string => {
    if (!data) return ""
    const formsWithFixes = data.results.filter((r) => r.issues.some((i) => i.fix))
    if (formsWithFixes.length === 0) return ""
    const allFixes = formsWithFixes.flatMap((form) => {
      const fixes = form.issues.filter((i) => i.fix).map((i) => i.fix!)
      return [`-- ${form.name} (${form.table})`, ...fixes, ""]
    })
    return `Bitte führe folgende SQL-Migrationen aus, um alle fehlenden Datenbank-Spalten zu korrigieren:\n\n\`\`\`sql\n${allFixes.join("\n")}\n-- PostgREST Schema-Cache neu laden\nNOTIFY pgrst, 'reload schema';\n\`\`\`\n\nBitte führe die SQL-Statements direkt mit supabase_execute_sql aus.`
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

        <TabsContent value="db-schema" className="space-y-6">
          <DbSchemaTab
            data={data}
            isLoading={isLoading}
            progress={progress}
            progressLabel={progressLabel}
            onRunCheck={runCheck}
            onShowPrompt={showPrompt}
            onCopy={copyToClipboard}
            generateAllProblemsPrompt={generateAllProblemsPrompt}
            generateAllFixPrompt={generateAllFixPrompt}
            generateFixPrompt={generateFixPrompt}
          />
        </TabsContent>

        <TabsContent value="form-scan" className="space-y-6">
          <FormScanTab
            scanData={scanData}
            isLoading={isScanLoading}
            progress={scanProgress}
            progressLabel={scanProgressLabel}
            onRunScan={runFormScan}
            onCopy={copyToClipboard}
            generateFormScanProblemsPrompt={generateFormScanProblemsPrompt}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <HistoryTab
            historyData={historyData}
            isLoading={isHistoryLoading}
            onRefresh={loadHistory}
          />
        </TabsContent>
      </Tabs>

      {/* v0 Prompt Dialog */}
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
