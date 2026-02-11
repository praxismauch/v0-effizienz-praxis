"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  Camera,
  Play,
  Trash2,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  CheckCircle2,
  XCircle,
  Clock,
  FolderOpen,
  History,
  ChevronRight,
  ArrowLeft,
  Square,
  ExternalLink,
} from "lucide-react"

// ── Types ──

interface ScreenshotRun {
  id: string
  started_at: string
  finished_at: string | null
  status: "running" | "completed" | "failed" | "cancelled"
  total_pages: number
  completed_count: number
  failed_count: number
  viewports: string[]
  base_url: string
  created_at: string
}

interface ScreenshotResult {
  id: string
  run_id: string
  page_path: string
  page_name: string
  viewport: "desktop" | "tablet" | "mobile"
  status: "pending" | "capturing" | "completed" | "failed"
  image_url: string | null
  error_message: string | null
  captured_at: string | null
  created_at: string
}

interface ScreenshotConfig {
  baseUrl: string
  viewports: {
    desktop: { width: number; height: number }
    tablet: { width: number; height: number }
    mobile: { width: number; height: number }
  }
}

const defaultConfig: ScreenshotConfig = {
  baseUrl: typeof window !== "undefined" ? window.location.origin : "",
  viewports: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 812 },
  },
}

const defaultPages = [
  // ── Public / Landing Pages ──
  { path: "/", name: "Landing Page" },
  { path: "/about", name: "Über uns" },
  { path: "/pricing", name: "Preise" },
  { path: "/features", name: "Features" },
  { path: "/contact", name: "Kontakt" },
  { path: "/blog", name: "Blog" },
  { path: "/auth/login", name: "Login" },
  { path: "/auth/register", name: "Registrierung" },

  // ── App – Übersicht ──
  { path: "/dashboard", name: "Dashboard" },
  { path: "/analysis", name: "KI-Analyse" },
  { path: "/academy", name: "Academy" },

  // ── App – Planung & Organisation ──
  { path: "/calendar", name: "Kalender" },
  { path: "/dienstplan", name: "Dienstplan" },
  { path: "/zeiterfassung", name: "Zeiterfassung" },
  { path: "/todos", name: "Aufgaben" },
  { path: "/goals", name: "Ziele" },
  { path: "/workflows", name: "Workflows" },
  { path: "/responsibilities", name: "Zuständigkeiten" },

  // ── App – Daten & Dokumente ──
  { path: "/analytics", name: "Kennzahlen" },
  { path: "/documents", name: "Dokumente" },
  { path: "/practice-insights", name: "Journal" },
  { path: "/knowledge", name: "Wissen" },
  { path: "/protocols", name: "Protokolle" },
  { path: "/cirs", name: "Verbesserungsmeldung" },

  // ── App – Qualitäts-Management ──
  { path: "/hygieneplan", name: "Hygieneplan" },

  // ── App – Strategie & Führung ──
  { path: "/strategy-journey", name: "Strategiepfad" },
  { path: "/leadership", name: "Leadership" },
  { path: "/wellbeing", name: "Mitarbeiter-Wellbeing" },
  { path: "/leitbild", name: "Leitbild" },
  { path: "/roi-analysis", name: "Lohnt-es-sich-Analyse" },
  { path: "/igel-analysis", name: "Selbstzahler-Analyse" },
  { path: "/competitor-analysis", name: "Konkurrenzanalyse" },
  { path: "/wunschpatient", name: "Wunschpatient" },

  // ── App – Team & Personal ──
  { path: "/hiring", name: "Personalsuche" },
  { path: "/team", name: "Team" },
  { path: "/mitarbeitergespraeche", name: "Mitarbeitergespräche" },
  { path: "/selbst-check", name: "Selbst-Check" },
  { path: "/skills", name: "Kompetenzen" },
  { path: "/organigramm", name: "Organigramm" },
  { path: "/training", name: "Fortbildung" },

  // ── App – Praxis & Einstellungen ──
  { path: "/contacts", name: "Kontakte" },
  { path: "/surveys", name: "Umfragen" },
  { path: "/arbeitsplaetze", name: "Arbeitsplätze" },
  { path: "/rooms", name: "Räume" },
  { path: "/arbeitsmittel", name: "Arbeitsmittel" },
  { path: "/inventory", name: "Material" },
  { path: "/devices", name: "Geräte" },
  { path: "/settings", name: "Einstellungen" },

  // ── Super Admin – Übersicht ──
  { path: "/super-admin", name: "SA Dashboard" },

  // ── Super Admin – Verwaltung ──
  { path: "/super-admin/tickets", name: "SA Tickets" },
  { path: "/super-admin/verwaltung?tab=practices", name: "SA Praxen" },
  { path: "/super-admin/verwaltung?tab=users", name: "SA Benutzer" },
  { path: "/super-admin/user-rights", name: "SA Benutzerrechte" },
  { path: "/super-admin/kpi-kategorien", name: "SA KPI-Kategorien" },
  { path: "/super-admin/content?tab=skills", name: "SA Vorlagen: Skills" },
  { path: "/super-admin/content?tab=workflows", name: "SA Vorlagen: Workflows" },
  { path: "/super-admin/content?tab=checklisten", name: "SA Vorlagen: Checklisten" },
  { path: "/super-admin/content?tab=dokumente", name: "SA Vorlagen: Dokumente" },
  { path: "/super-admin/content?tab=teams", name: "SA Vorlagen: Teams" },
  { path: "/super-admin/content?tab=event-types", name: "SA Vorlagen: Event-Typen" },

  // ── Super Admin – Content ──
  { path: "/super-admin/academy", name: "SA Academy" },
  { path: "/super-admin/waitlist", name: "SA Warteliste" },

  // ── Super Admin – Finanzen ──
  { path: "/super-admin/zahlungen", name: "SA Zahlungen" },

  // ── Super Admin – Management ──
  { path: "/super-admin/roadmap", name: "SA Roadmap & Ideen" },

  // ── Super Admin – Marketing ──
  { path: "/super-admin/social-media", name: "SA Social Media Posts" },

  // ── Super Admin – Seiten ──
  { path: "/super-admin/landingpages", name: "SA Landingpages" },

  // ── Super Admin – Testing ──
  { path: "/super-admin/testing", name: "SA UI-Tests" },
  { path: "/super-admin/screenshots", name: "SA Screenshots" },

  // ── Super Admin – System ──
  { path: "/super-admin/system", name: "SA Systemverwaltung" },
  { path: "/super-admin/features", name: "SA Feature-Verwaltung" },
  { path: "/super-admin/chat-logs", name: "SA Chat-Protokolle" },
  { path: "/super-admin/logging", name: "SA Error Logging" },
  { path: "/super-admin/settings", name: "SA Admin-Einstellungen" },
]

// ── Helpers ──

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDuration(start: string, end: string | null) {
  if (!end) return "laufend..."
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Captures a real screenshot via headless browser on the server.
 * Returns the Vercel Blob URL of the PNG image.
 */
async function captureScreenshot(
  url: string,
  viewport: string,
  pageName: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    const res = await fetch("/api/super-admin/screenshot-capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, viewport, pageName }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || `HTTP ${res.status}` }
    }
    return { success: true, imageUrl: data.imageUrl }
  } catch {
    return { success: false, error: "Screenshot-API nicht erreichbar" }
  }
}

function statusColor(status: string) {
  switch (status) {
    case "completed": return "text-green-500"
    case "failed": return "text-red-500"
    case "cancelled": return "text-amber-500"
    case "running": case "capturing": return "text-blue-500"
    default: return "text-muted-foreground"
  }
}

function statusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed": return "default"
    case "failed": return "destructive"
    case "cancelled": return "outline"
    case "running": return "secondary"
    default: return "outline"
  }
}

// ── Component ──

export function ScreenshotsPageClient() {
  const [config, setConfig] = useState<ScreenshotConfig>(defaultConfig)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const cancelRef = useRef(false)
  const [selectedViewports, setSelectedViewports] = useState<Set<"desktop" | "tablet" | "mobile">>(
    new Set(["desktop"])
  )
  const [customPages, setCustomPages] = useState("")

  // Run history
  const [runs, setRuns] = useState<ScreenshotRun[]>([])
  const [loadingRuns, setLoadingRuns] = useState(true)

  // Currently active or selected run
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [activeResults, setActiveResults] = useState<ScreenshotResult[]>([])
  const [loadingResults, setLoadingResults] = useState(false)

  // View mode: "new" (start screen) or "detail" (viewing a run)
  const [view, setView] = useState<"new" | "detail">("new")

  // Load run history on mount
  useEffect(() => {
    loadRuns()
  }, [])

  const loadRuns = async () => {
    setLoadingRuns(true)
    try {
      const res = await fetch("/api/super-admin/screenshot-runs?limit=50")
      if (res.ok) {
        const data = await res.json()
        setRuns(data.runs || [])
      }
    } catch (e) {
      console.error("Failed to load runs:", e)
    } finally {
      setLoadingRuns(false)
    }
  }

  const loadRunDetail = async (runId: string) => {
    setLoadingResults(true)
    setActiveRunId(runId)
    setView("detail")
    try {
      const res = await fetch(`/api/super-admin/screenshot-runs/${runId}`)
      if (res.ok) {
        const data = await res.json()
        setActiveResults(data.results || [])
      }
    } catch (e) {
      console.error("Failed to load run detail:", e)
    } finally {
      setLoadingResults(false)
    }
  }

  const deleteRun = async (runId: string) => {
    try {
      const res = await fetch(`/api/super-admin/screenshot-runs/${runId}`, { method: "DELETE" })
      if (res.ok) {
        setRuns((prev) => prev.filter((r) => r.id !== runId))
        if (activeRunId === runId) {
          setView("new")
          setActiveRunId(null)
          setActiveResults([])
        }
      }
    } catch (e) {
      console.error("Failed to delete run:", e)
    }
  }

  const getPages = useCallback(() => {
    const custom = customPages
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((path) => ({ path, name: path }))
    return [...defaultPages, ...custom]
  }, [customPages])

  const startCapture = async () => {
    const pages = getPages()
    const viewports = Array.from(selectedViewports)

    setIsRunning(true)
    setProgress(0)
    cancelRef.current = false

    // 1. Try to create run in DB (non-blocking — works without DB too)
    let runId: string | null = null
    let results: ScreenshotResult[] = []

    try {
      const res = await fetch("/api/super-admin/screenshot-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages, viewports, baseUrl: config.baseUrl }),
      })
      if (res.ok) {
        const data = await res.json()
        runId = data.run?.id || null
      }
    } catch (e) {
      console.error("Failed to create run in DB (continuing without persistence):", e)
    }

    // 2. Load DB results or generate in-memory fallback
    if (runId) {
      try {
        const res = await fetch(`/api/super-admin/screenshot-runs/${runId}`)
        if (res.ok) {
          const data = await res.json()
          results = data.results || []
        }
      } catch (e) {
        console.error("Failed to load run results:", e)
      }
    }

    // Fallback: generate results locally if DB failed
    if (results.length === 0) {
      results = pages.flatMap((page) =>
        viewports.map((viewport) => ({
          id: `local-${page.path}-${viewport}-${Date.now()}`,
          run_id: runId || "local",
          page_path: page.path,
          page_name: page.name,
          viewport,
          status: "pending" as const,
          image_url: null,
          error_message: null,
          captured_at: null,
          created_at: new Date().toISOString(),
        }))
      )
    }

    // Show the run detail view
    setActiveRunId(runId || "local")
    setActiveResults(results)
    setView("detail")

    // 3. Process each result (simulate capture)
    let completedCount = 0
    let failedCount = 0

    for (let i = 0; i < results.length; i++) {
      // Check for cancellation
      if (cancelRef.current) {
        // Mark remaining results as pending (cancelled)
        setActiveResults((prev) =>
          prev.map((r) =>
            r.status === "pending" || r.status === "capturing"
              ? { ...r, status: "pending" }
              : r
          )
        )
        // Update run status to cancelled in DB
        if (runId && runId !== "local") {
          fetch(`/api/super-admin/screenshot-runs/${runId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              runUpdate: {
                completedCount,
                failedCount,
                status: "cancelled",
              },
            }),
          }).catch(() => {})
        }
        break
      }

      const result = results[i]

      // Update to capturing
      setActiveResults((prev) =>
        prev.map((r) => (r.id === result.id ? { ...r, status: "capturing" } : r))
      )

      // Capture real screenshot via headless browser -> Vercel Blob PNG
      const fullUrl = `${config.baseUrl}${result.page_path}`
      const captureResult = await captureScreenshot(fullUrl, result.viewport, result.page_name)

      const newStatus: "completed" | "failed" = captureResult.success ? "completed" : "failed"
      const imageUrl = captureResult.imageUrl || null
      const errorMsg = captureResult.error || null

      if (newStatus === "completed") completedCount++
      else failedCount++

      // Update local state with actual Blob image URL
      setActiveResults((prev) =>
        prev.map((r) =>
          r.id === result.id
            ? {
                ...r,
                status: newStatus,
                image_url: imageUrl,
                captured_at: new Date().toISOString(),
                error_message: errorMsg,
              }
            : r
        )
      )

      // Persist to DB (skip for local-only runs)
      if (runId && runId !== "local") {
        fetch(`/api/super-admin/screenshot-runs/${runId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resultId: result.id,
            status: newStatus,
            imageUrl: fullUrl,
            error: errorMsg || undefined,
            runUpdate: {
              completedCount,
              failedCount,
              status: i === results.length - 1 ? "completed" : "running",
            },
          }),
        }).catch(() => {})
      }

      setProgress(((i + 1) / results.length) * 100)
    }

    setIsRunning(false)
    // Refresh run list so the new run appears in history
    loadRuns()
  }

  const stopCapture = useCallback(() => {
    cancelRef.current = true
  }, [])

  const toggleViewport = (viewport: "desktop" | "tablet" | "mobile") => {
    setSelectedViewports((prev) => {
      const next = new Set(prev)
      if (next.has(viewport)) {
        if (next.size > 1) next.delete(viewport)
      } else {
        next.add(viewport)
      }
      return next
    })
  }

  const activeRun = runs.find((r) => r.id === activeRunId)

  const resultsSummary = {
    total: activeResults.length,
    completed: activeResults.filter((r) => r.status === "completed").length,
    failed: activeResults.filter((r) => r.status === "failed").length,
    pending: activeResults.filter((r) => r.status === "pending" || r.status === "capturing").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Screenshot Generator</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Automatische Screenshots aller UI-Seiten -- jeder Lauf wird gespeichert
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Config + Run History */}
        <div className="space-y-6 lg:col-span-1">
          {/* Configuration Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Neuer Lauf</CardTitle>
              <CardDescription>Einstellungen und Start</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Base URL</Label>
                <Input
                  value={config.baseUrl}
                  onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Viewports</Label>
                <div className="flex gap-2">
                  <Button
                    variant={selectedViewports.has("desktop") ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleViewport("desktop")}
                    className="flex-1"
                  >
                    <Monitor className="h-4 w-4 mr-1" />
                    Desktop
                  </Button>
                  <Button
                    variant={selectedViewports.has("tablet") ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleViewport("tablet")}
                    className="flex-1"
                  >
                    <Tablet className="h-4 w-4 mr-1" />
                    Tablet
                  </Button>
                  <Button
                    variant={selectedViewports.has("mobile") ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleViewport("mobile")}
                    className="flex-1"
                  >
                    <Smartphone className="h-4 w-4 mr-1" />
                    Mobile
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Zusaetzliche Seiten (eine pro Zeile)</Label>
                <textarea
                  value={customPages}
                  onChange={(e) => setCustomPages(e.target.value)}
                  placeholder="/custom-page&#10;/another-page"
                  className="w-full h-20 px-3 py-2 text-sm rounded-md border bg-background resize-none"
                />
              </div>

              {isRunning ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button disabled className="flex-1">
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Erfasse... ({Math.round(progress)}%)
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={stopCapture}
                      className="shrink-0"
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Stopp
                    </Button>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              ) : (
                <Button onClick={startCapture} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Lauf starten ({getPages().length * selectedViewports.size} Screenshots)
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Run History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Verlauf
                  </CardTitle>
                  <CardDescription>{runs.length} gespeicherte Laeufe</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={loadRuns} disabled={loadingRuns}>
                  <RefreshCw className={`h-4 w-4 ${loadingRuns ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingRuns && runs.length === 0 ? (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Lade Verlauf...
                </div>
              ) : runs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Noch keine Laeufe gespeichert
                </p>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {runs.map((run) => (
                      <button
                        key={run.id}
                        onClick={() => loadRunDetail(run.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent ${
                          activeRunId === run.id ? "border-primary bg-accent" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            {formatDate(run.started_at)}
                          </span>
                          <Badge variant={statusBadgeVariant(run.status)} className="text-xs">
                            {run.status === "completed" ? "Fertig" : run.status === "running" ? "Laufend" : run.status === "failed" ? "Fehler" : run.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {run.completed_count}/{run.total_pages} OK
                            {run.failed_count > 0 && (
                              <span className="text-red-500 ml-1">
                                ({run.failed_count} Fehler)
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-1">
                            <span>{formatDuration(run.started_at, run.finished_at)}</span>
                            <ChevronRight className="h-3 w-3" />
                          </div>
                        </div>
                        <div className="flex gap-1 mt-1.5">
                          {run.viewports.map((v) => (
                            <Badge key={v} variant="outline" className="text-[10px] py-0 px-1.5">
                              {v}
                            </Badge>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Results */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                {view === "detail" && activeRun ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setView("new")
                          setActiveRunId(null)
                          setActiveResults([])
                        }}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <CardTitle className="text-base">
                        Lauf vom {formatDate(activeRun.started_at)}
                      </CardTitle>
                    </div>
                    <CardDescription className="ml-9">
                      {resultsSummary.completed} von {resultsSummary.total} erfolgreich
                      {" -- "}Dauer: {formatDuration(activeRun.started_at, activeRun.finished_at)}
                    </CardDescription>
                  </>
                ) : view === "detail" && isRunning ? (
                  <>
                    <CardTitle className="text-base">Aktueller Lauf</CardTitle>
                    <CardDescription>
                      {resultsSummary.completed} von {resultsSummary.total} abgeschlossen
                    </CardDescription>
                  </>
                ) : (
                  <>
                    <CardTitle className="text-base">Ergebnisse</CardTitle>
                    <CardDescription>
                      Waehle einen Lauf aus dem Verlauf oder starte einen neuen
                    </CardDescription>
                  </>
                )}
              </div>
              {view === "detail" && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {resultsSummary.completed}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <XCircle className="h-3 w-3 text-red-500" />
                    {resultsSummary.failed}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3 text-yellow-500" />
                    {resultsSummary.pending}
                  </Badge>
                  {activeRunId && !isRunning && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteRun(activeRunId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {view === "new" && !isRunning ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Bereit fuer einen neuen Lauf</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Konfiguriere die Einstellungen links und starte einen neuen Screenshot-Lauf,
                  oder waehle einen vergangenen Lauf aus dem Verlauf.
                </p>
              </div>
            ) : loadingResults ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Tabs defaultValue="list">
                <TabsList className="mb-4">
                  <TabsTrigger value="list">Liste</TabsTrigger>
                  <TabsTrigger value="grid">Galerie</TabsTrigger>
                </TabsList>

                <TabsContent value="list">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {activeResults.map((result) => (
                        <div
                          key={result.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            {result.status === "completed" && result.image_url ? (
                              <img
                                src={result.image_url}
                                alt={result.page_name}
                                className="h-10 w-16 rounded border object-cover object-top shrink-0"
                              />
                            ) : result.status === "completed" ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                            ) : result.status === "failed" ? (
                              <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                            ) : result.status === "capturing" ? (
                              <RefreshCw className="h-5 w-5 text-blue-500 animate-spin shrink-0" />
                            ) : (
                              <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {result.page_name} ({result.viewport})
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {result.page_path}
                              </p>
                              {result.error_message && (
                                <p className={`text-xs mt-0.5 ${
                                  result.error_message.startsWith("Redirect") 
                                    ? "text-amber-500" 
                                    : "text-red-500"
                                }`}>
                                  {result.error_message}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-xs">
                              {result.viewport === "desktop" && <Monitor className="h-3 w-3 mr-1" />}
                              {result.viewport === "tablet" && <Tablet className="h-3 w-3 mr-1" />}
                              {result.viewport === "mobile" && <Smartphone className="h-3 w-3 mr-1" />}
                              {result.viewport}
                            </Badge>
                            {result.status === "completed" && result.image_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(result.image_url!, "_blank")}
                                title="Screenshot oeffnen"
                              >
                                <FolderOpen className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="grid">
                  <ScrollArea className="h-[500px]">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {activeResults.map((result) => (
                        <div
                          key={result.id}
                          className="relative group rounded-lg border overflow-hidden bg-muted"
                        >
                          <div className="aspect-video flex flex-col items-center justify-center bg-muted gap-2 p-3 relative">
                            {result.status === "completed" && result.image_url ? (
                              <img
                                src={result.image_url}
                                alt={`${result.page_name} (${result.viewport})`}
                                className="absolute inset-0 w-full h-full object-cover object-top"
                              />
                            ) : result.status === "failed" ? (
                              <>
                                <XCircle className="h-10 w-10 text-red-400" />
                                <span className="text-[10px] text-red-500 max-w-full text-center truncate">
                                  {result.error_message || "Fehler"}
                                </span>
                              </>
                            ) : result.status === "capturing" ? (
                              <>
                                <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
                                <span className="text-[10px] text-muted-foreground">Wird aufgenommen...</span>
                              </>
                            ) : result.status === "completed" ? (
                              <CheckCircle2 className="h-10 w-10 text-green-500" />
                            ) : (
                              <Clock className="h-10 w-10 text-muted-foreground/40" />
                            )}
                          </div>
                          {result.status === "completed" && result.image_url && (
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => window.open(result.image_url!, "_blank")}
                              >
                                <FolderOpen className="h-4 w-4 mr-1" />
                                Oeffnen
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                asChild
                              >
                                <a href={result.image_url} download={`${result.page_name}_${result.viewport}.png`}>
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Download
                                </a>
                              </Button>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-xs text-white truncate">
                              {result.page_name} ({result.viewport})
                            </p>
                          </div>
                          {result.status === "failed" && (
                            <div className="absolute top-2 right-2">
                              <Badge variant="destructive" className="text-[10px] py-0">
                                Fehler
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>


    </div>
  )
}
