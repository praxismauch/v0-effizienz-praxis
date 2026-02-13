"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  type ScreenshotConfig,
  type ScreenshotRun,
  type ScreenshotResult,
  defaultConfig,
  defaultPages,
  captureScreenshot,
} from "./screenshot-types"
import { ScreenshotConfigPanel } from "./components/screenshot-config-panel"
import { ScreenshotRunHistory } from "./components/screenshot-run-history"
import { ScreenshotResultsPanel } from "./components/screenshot-results-panel"

export function ScreenshotsPageClient() {
  const [config, setConfig] = useState<ScreenshotConfig>(() => ({
    ...defaultConfig,
    baseUrl: typeof window !== "undefined" ? window.location.origin : defaultConfig.baseUrl,
  }))
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

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

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

    // 1. Try to create run in DB (non-blocking)
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
          viewport: viewport as ScreenshotResult["viewport"],
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

    // 3. Process each result
    let completedCount = 0
    let failedCount = 0

    for (let i = 0; i < results.length; i++) {
      if (cancelRef.current) {
        setActiveResults((prev) =>
          prev.map((r) =>
            r.status === "pending" || r.status === "capturing"
              ? { ...r, status: "pending" }
              : r
          )
        )
        if (runId && runId !== "local") {
          fetch(`/api/super-admin/screenshot-runs/${runId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              runUpdate: { completedCount, failedCount, status: "cancelled" },
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

      // Capture real screenshot
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

      // Persist to DB - store the actual PNG blob URL, not the page URL
      if (runId && runId !== "local") {
        fetch(`/api/super-admin/screenshot-runs/${runId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resultId: result.id,
            status: newStatus,
            imageUrl: imageUrl || undefined,
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

  const handleDeleteRequest = (runId: string) => {
    setDeleteConfirmId(runId)
  }

  const handleBack = () => {
    setView("new")
    setActiveRunId(null)
    setActiveResults([])
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
          <ScreenshotConfigPanel
            config={config}
            onConfigChange={setConfig}
            selectedViewports={selectedViewports}
            onToggleViewport={toggleViewport}
            customPages={customPages}
            onCustomPagesChange={setCustomPages}
            isRunning={isRunning}
            progress={progress}
            totalScreenshots={getPages().length * selectedViewports.size}
            onStart={startCapture}
            onStop={stopCapture}
          />

          <ScreenshotRunHistory
            runs={runs}
            loadingRuns={loadingRuns}
            activeRunId={activeRunId}
            onLoadRuns={loadRuns}
            onLoadRunDetail={loadRunDetail}
            onDeleteRun={handleDeleteRequest}
          />
        </div>

        {/* Right Column: Results */}
        <ScreenshotResultsPanel
          view={view}
          isRunning={isRunning}
          loadingResults={loadingResults}
          activeRun={activeRun}
          activeRunId={activeRunId}
          activeResults={activeResults}
          resultsSummary={resultsSummary}
          onBack={handleBack}
          onDeleteRun={handleDeleteRequest}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lauf wirklich loeschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Screenshot-Lauf und alle zugehoerigen Ergebnisse werden unwiderruflich geloescht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirmId) {
                  deleteRun(deleteConfirmId)
                  setDeleteConfirmId(null)
                }
              }}
            >
              Loeschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
