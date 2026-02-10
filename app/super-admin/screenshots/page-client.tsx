"use client"

import { useState, useCallback } from "react"
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
  Download, 
  Trash2, 
  RefreshCw, 
  Monitor, 
  Smartphone, 
  Tablet,
  CheckCircle2,
  XCircle,
  Clock,
  FolderOpen,
  Image as ImageIcon
} from "lucide-react"


interface ScreenshotJob {
  id: string
  url: string
  name: string
  status: "pending" | "capturing" | "completed" | "failed"
  viewport: "desktop" | "tablet" | "mobile"
  timestamp?: string
  imageUrl?: string
  error?: string
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

export function ScreenshotsPageClient() {
  const [config, setConfig] = useState<ScreenshotConfig>(defaultConfig)
  const [jobs, setJobs] = useState<ScreenshotJob[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedViewports, setSelectedViewports] = useState<Set<"desktop" | "tablet" | "mobile">>(
    new Set(["desktop"])
  )
  const [customPages, setCustomPages] = useState<string>("")

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
    
    // Create jobs for all page/viewport combinations
    const newJobs: ScreenshotJob[] = []
    pages.forEach((page) => {
      viewports.forEach((viewport) => {
        newJobs.push({
          id: `${page.path}-${viewport}-${Date.now()}`,
          url: `${config.baseUrl}${page.path}`,
          name: `${page.name} (${viewport})`,
          status: "pending",
          viewport,
        })
      })
    })

    setJobs(newJobs)
    setIsRunning(true)
    setProgress(0)

    // Simulate screenshot capture (in production, this would call a backend API)
    for (let i = 0; i < newJobs.length; i++) {
      const job = newJobs[i]
      
      // Update job to capturing
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: "capturing" } : j))
      )

      // Simulate capture delay
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500))

      // Simulate success/failure (90% success rate for demo)
      const success = Math.random() > 0.1
      
      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id
            ? {
                ...j,
                status: success ? "completed" : "failed",
                timestamp: new Date().toISOString(),
                imageUrl: success ? `/api/placeholder/800/600` : undefined,
                error: success ? undefined : "Screenshot konnte nicht erstellt werden",
              }
            : j
        )
      )

      setProgress(((i + 1) / newJobs.length) * 100)
    }

    setIsRunning(false)
  }

  const clearJobs = () => {
    setJobs([])
    setProgress(0)
  }

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

  const summary = {
    total: jobs.length,
    completed: jobs.filter((j) => j.status === "completed").length,
    failed: jobs.filter((j) => j.status === "failed").length,
    pending: jobs.filter((j) => j.status === "pending" || j.status === "capturing").length,
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Screenshot Generator</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Automatische Screenshots aller UI-Seiten in verschiedenen Viewports
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Configuration Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Konfiguration</CardTitle>
              <CardDescription>Einstellungen fuer die Screenshot-Erstellung</CardDescription>
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
                  className="w-full h-24 px-3 py-2 text-sm rounded-md border bg-background resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={startCapture}
                  disabled={isRunning}
                  className="flex-1"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Erfasse...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Starten
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={clearJobs}
                  disabled={isRunning || jobs.length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {isRunning && (
                <div className="space-y-1">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {Math.round(progress)}% abgeschlossen
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Ergebnisse</CardTitle>
                  <CardDescription>
                    {jobs.length > 0
                      ? `${summary.completed} von ${summary.total} abgeschlossen`
                      : "Starte eine neue Screenshot-Session"}
                  </CardDescription>
                </div>
                {jobs.length > 0 && (
                  <div className="flex gap-2">
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      {summary.completed}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <XCircle className="h-3 w-3 text-red-500" />
                      {summary.failed}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3 text-yellow-500" />
                      {summary.pending}
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Keine Screenshots</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Konfiguriere die Einstellungen und klicke auf "Starten", um Screenshots zu erstellen.
                  </p>
                </div>
              ) : (
                <Tabs defaultValue="list">
                  <TabsList className="mb-4">
                    <TabsTrigger value="list">Liste</TabsTrigger>
                    <TabsTrigger value="grid">Galerie</TabsTrigger>
                  </TabsList>

                  <TabsContent value="list">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {jobs.map((job) => (
                          <div
                            key={job.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card"
                          >
                            <div className="flex items-center gap-3">
                              {job.status === "completed" && (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              )}
                              {job.status === "failed" && (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                              {job.status === "capturing" && (
                                <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                              )}
                              {job.status === "pending" && (
                                <Clock className="h-5 w-5 text-muted-foreground" />
                              )}
                              <div>
                                <p className="text-sm font-medium">{job.name}</p>
                                <p className="text-xs text-muted-foreground">{job.url}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {job.viewport === "desktop" && <Monitor className="h-3 w-3 mr-1" />}
                                {job.viewport === "tablet" && <Tablet className="h-3 w-3 mr-1" />}
                                {job.viewport === "mobile" && <Smartphone className="h-3 w-3 mr-1" />}
                                {job.viewport}
                              </Badge>
                              {job.status === "completed" && (
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="grid">
                    <ScrollArea className="h-[400px]">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {jobs
                          .filter((j) => j.status === "completed")
                          .map((job) => (
                            <div
                              key={job.id}
                              className="relative group rounded-lg border overflow-hidden bg-muted"
                            >
                              <div className="aspect-video flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button variant="secondary" size="sm">
                                  <FolderOpen className="h-4 w-4 mr-1" />
                                  Oeffnen
                                </Button>
                                <Button variant="secondary" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                <p className="text-xs text-white truncate">{job.name}</p>
                              </div>
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
