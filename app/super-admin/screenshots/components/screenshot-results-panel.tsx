"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Camera,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  CheckCircle2,
  XCircle,
  Clock,
  FolderOpen,
  ArrowLeft,
  Trash2,
  ExternalLink,
} from "lucide-react"
import { type ScreenshotRun, type ScreenshotResult, formatDate, formatDuration } from "../screenshot-types"

interface ResultsSummary {
  total: number
  completed: number
  failed: number
  pending: number
}

interface ScreenshotResultsPanelProps {
  view: "new" | "detail"
  isRunning: boolean
  loadingResults: boolean
  activeRun: ScreenshotRun | undefined
  activeRunId: string | null
  activeResults: ScreenshotResult[]
  resultsSummary: ResultsSummary
  onBack: () => void
  onDeleteRun: (runId: string) => void
}

export function ScreenshotResultsPanel({
  view,
  isRunning,
  loadingResults,
  activeRun,
  activeRunId,
  activeResults,
  resultsSummary,
  onBack,
  onDeleteRun,
}: ScreenshotResultsPanelProps) {
  return (
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
                    onClick={onBack}
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
                  onClick={() => onDeleteRun(activeRunId)}
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
                    <ResultListItem key={result.id} result={result} />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="grid">
              <ScrollArea className="h-[500px]">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {activeResults.map((result) => (
                    <ResultGridItem key={result.id} result={result} />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

function ResultListItem({ result }: { result: ScreenshotResult }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
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
            <p
              className={`text-xs mt-0.5 ${
                result.error_message.startsWith("Redirect")
                  ? "text-amber-500"
                  : "text-red-500"
              }`}
            >
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
  )
}

function ResultGridItem({ result }: { result: ScreenshotResult }) {
  return (
    <div className="relative group rounded-lg border overflow-hidden bg-muted">
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
          <Button variant="secondary" size="sm" asChild>
            <a
              href={result.image_url}
              download={`${result.page_name}_${result.viewport}.png`}
            >
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
  )
}
