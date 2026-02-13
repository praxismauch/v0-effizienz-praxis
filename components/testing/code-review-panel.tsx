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
import { Code2, Search, History, Sparkles, Copy } from "lucide-react"

import type { ReviewData, CustomRule, HistoryEntry } from "./code-review/types"
import { ReviewTab } from "./code-review/review-tab"
import { CustomRulesTab } from "./code-review/custom-rules-tab"
import { HistoryTab } from "./code-review/history-tab"

export default function CodeReviewPanel() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("review")

  // ─── Review state ───
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<ReviewData | null>(null)
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

  // ─── Custom rules state ───
  const [customRules, setCustomRules] = useState<CustomRule[]>([])

  // Load custom rules from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("code-review-custom-rules")
      if (saved) setCustomRules(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  // Persist custom rules
  const saveCustomRules = useCallback((rules: CustomRule[]) => {
    setCustomRules(rules)
    localStorage.setItem("code-review-custom-rules", JSON.stringify(rules))
  }, [])

  const addOrUpdateRule = useCallback((rule: CustomRule) => {
    const updated = customRules.some((r) => r.id === rule.id)
      ? customRules.map((r) => (r.id === rule.id ? rule : r))
      : [...customRules, rule]
    saveCustomRules(updated)
    toast({ title: updated.length > customRules.length ? "Regel hinzugefuegt" : "Regel aktualisiert" })
  }, [customRules, saveCustomRules, toast])

  const deleteRule = useCallback((id: string) => {
    saveCustomRules(customRules.filter((r) => r.id !== id))
    toast({ title: "Regel geloescht" })
  }, [customRules, saveCustomRules, toast])

  const toggleRule = useCallback((id: string) => {
    saveCustomRules(customRules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)))
  }, [customRules, saveCustomRules])

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
      const enabledCustomRules = customRules.filter((r) => r.enabled)
      const res = await fetch("/api/super-admin/code-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customRules: enabledCustomRules }),
      })
      if (!res.ok) throw new Error("Fehler beim Laden")
      const json: ReviewData = await res.json()
      if (progressInterval.current) clearInterval(progressInterval.current)
      setProgress(100)
      setProgressLabel(`${json.summary.totalFindings} Findings in ${json.summary.filesScanned} Dateien`)
      setData(json)

      // Save to history
      try {
        await fetch("/api/super-admin/form-db-sync-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scan_type: "code-review",
            summary: json.summary,
            total: json.summary.totalFindings,
            ok: json.summary.filesScanned - (json.summary.topFiles?.length || 0),
            warnings: json.summary.warnings,
            errors: json.summary.critical,
            duration_ms: json.durationMs,
          }),
        })
      } catch { /* ignore history save errors */ }

      await loadHistory()
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
  }, [toast, customRules, loadHistory])

  // ─── Helpers ───
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Kopiert!", description: "Empfehlungen in die Zwischenablage kopiert" })
  }

  const showPrompt = (prompt: string, title: string) => {
    setPromptDialog({ open: true, prompt, title })
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="review" className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            Code Review
            {data && (data.summary.critical > 0 || data.summary.warnings > 0) && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {data.summary.critical + data.summary.warnings}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="custom-rules" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Eigene Regeln
            {customRules.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {customRules.filter((r) => r.enabled).length}/{customRules.length}
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

        <TabsContent value="review" className="space-y-6">
          <ReviewTab
            data={data}
            isLoading={isLoading}
            progress={progress}
            progressLabel={progressLabel}
            onRunReview={runReview}
            onShowPrompt={showPrompt}
            onCopy={copyToClipboard}
          />
        </TabsContent>

        <TabsContent value="custom-rules" className="space-y-6">
          <CustomRulesTab
            customRules={customRules}
            onAddOrUpdate={addOrUpdateRule}
            onDelete={deleteRule}
            onToggle={toggleRule}
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
