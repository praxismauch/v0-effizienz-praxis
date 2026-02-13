"use client"

import { useState } from "react"
import { format } from "date-fns"
import useSWR from "swr"
import {
  Search,
  RefreshCw,
  Download,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { type ErrorLog, type Stats, statusConfig } from "./logging-types"
import { LoggingStats } from "./components/logging-stats"
import { LogsTable } from "./components/logs-table"
import { LogDetailDialog } from "./components/log-detail-dialog"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ErrorLogsPageClient() {
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    level: "all",
    status: "all",
    category: "all",
    source: "all",
    search: "",
    startDate: "",
    endDate: "",
  })
  const [selectedLogs, setSelectedLogs] = useState<string[]>([])
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [newStatus, setNewStatus] = useState<string>("")
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Build query string
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "50",
    ...(filters.level !== "all" && { level: filters.level }),
    ...(filters.status !== "all" && { status: filters.status }),
    ...(filters.category !== "all" && { category: filters.category }),
    ...(filters.source !== "all" && { source: filters.source }),
    ...(filters.search && { search: filters.search }),
    ...(filters.startDate && { startDate: filters.startDate }),
    ...(filters.endDate && { endDate: filters.endDate }),
  })

  const { data, isLoading, mutate } = useSWR<{
    logs: ErrorLog[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
    stats: Stats
  }>(`/api/super-admin/error-logs?${queryParams}`, fetcher, {
    refreshInterval: autoRefresh ? 10000 : 0,
  })

  const logs = data?.logs || []
  const pagination = data?.pagination
  const stats = data?.stats

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleSelectAll = () => {
    if (selectedLogs.length === logs.length) {
      setSelectedLogs([])
    } else {
      setSelectedLogs(logs.map((log) => log.id))
    }
  }

  const handleSelectLog = (id: string) => {
    setSelectedLogs((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleViewDetails = (log: ErrorLog) => {
    setSelectedLog(log)
    setShowDetailDialog(true)
  }

  const handleUpdateStatus = async (logId: string | string[], status: string, notes?: string) => {
    setIsUpdating(true)
    try {
      const body: Record<string, unknown> = { status }
      if (notes) body.resolution_notes = notes
      
      if (Array.isArray(logId)) {
        body.ids = logId
      } else {
        body.id = logId
      }

      const response = await fetch("/api/super-admin/error-logs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error("Failed to update status")

      toast({ title: "Erfolg", description: "Status wurde aktualisiert" })
      mutate()
      setShowStatusDialog(false)
      setSelectedLogs([])
    } catch {
      toast({ title: "Fehler", description: "Status konnte nicht aktualisiert werden", variant: "destructive" })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleBulkStatusUpdate = (status: string) => {
    if (selectedLogs.length === 0) return
    setNewStatus(status)
    setShowStatusDialog(true)
  }

  const handleDeleteOldLogs = async (days: number) => {
    if (!confirm(`Alle Logs alter als ${days} Tage loschen?`)) return

    try {
      const response = await fetch(`/api/super-admin/error-logs?olderThan=${days}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete logs")
      
      const result = await response.json()
      toast({ title: "Erfolg", description: `${result.deleted || 0} Logs geloscht` })
      mutate()
    } catch {
      toast({ title: "Fehler", description: "Logs konnten nicht geloscht werden", variant: "destructive" })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Kopiert", description: "In Zwischenablage kopiert" })
  }

  const exportLogs = () => {
    const csvContent = [
      ["Zeit", "Level", "Kategorie", "Nachricht", "URL", "Status", "Benutzer ID"].join(","),
      ...logs.map((log) =>
        [
          log.created_at,
          log.level,
          log.category,
          `"${log.message.replace(/"/g, '""')}"`,
          log.url || "",
          log.status,
          log.user_id || "",
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `error-logs-${format(new Date(), "yyyy-MM-dd-HH-mm")}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Error Logging</h1>
          <p className="text-muted-foreground">
            Systemweite Fehleruberwachung und Analyse
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(autoRefresh && "border-green-500 text-green-500")}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", autoRefresh && "animate-spin")} />
            {autoRefresh ? "Live" : "Auto-Refresh"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Bereinigen
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleDeleteOldLogs(7)}>
                {"Alter als 7 Tage loschen"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteOldLogs(30)}>
                {"Alter als 30 Tage loschen"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteOldLogs(90)}>
                {"Alter als 90 Tage loschen"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats */}
      {stats && <LoggingStats stats={stats} onFilterChange={handleFilterChange} />}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Suche in Logs..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filters.level} onValueChange={(v) => handleFilterChange("level", v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Level</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warnung</SelectItem>
                <SelectItem value="error">Fehler</SelectItem>
                <SelectItem value="critical">Kritisch</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(v) => handleFilterChange("status", v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="new">Neu</SelectItem>
                <SelectItem value="acknowledged">{"Bestatigt"}</SelectItem>
                <SelectItem value="investigating">In Bearbeitung</SelectItem>
                <SelectItem value="resolved">{"Gelost"}</SelectItem>
                <SelectItem value="ignored">Ignoriert</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.category} onValueChange={(v) => handleFilterChange("category", v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="ui">UI</SelectItem>
                <SelectItem value="database">Datenbank</SelectItem>
                <SelectItem value="auth">Auth</SelectItem>
                <SelectItem value="email">E-Mail</SelectItem>
                <SelectItem value="ai">AI</SelectItem>
                <SelectItem value="security">Sicherheit</SelectItem>
                <SelectItem value="other">Sonstige</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.source} onValueChange={(v) => handleFilterChange("source", v)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Quelle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Quellen</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="server">Server</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="cron">Cron</SelectItem>
              </SelectContent>
            </Select>
            {(filters.level !== "all" || filters.status !== "all" || filters.category !== "all" || filters.source !== "all" || filters.search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setFilters({
                    level: "all",
                    status: "all",
                    category: "all",
                    source: "all",
                    search: "",
                    startDate: "",
                    endDate: "",
                  })
                }
              >
                {"Filter zurucksetzen"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedLogs.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedLogs.length} {"Log(s) ausgewahlt"}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate("acknowledged")}>
                  {"Bestatigen"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate("investigating")}>
                  In Bearbeitung
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate("resolved")}>
                  {"Gelost"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate("ignored")}>
                  Ignorieren
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedLogs([])}>
                  Auswahl aufheben
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs Table */}
      <LogsTable
        logs={logs}
        isLoading={isLoading}
        selectedLogs={selectedLogs}
        onSelectAll={handleSelectAll}
        onSelectLog={handleSelectLog}
        onViewDetails={handleViewDetails}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Zeige {((page - 1) * 50) + 1} bis {Math.min(page * 50, pagination.total)} von {pagination.total} Logs
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {"Zuruck"}
            </Button>
            <span className="flex items-center px-3 text-sm">
              Seite {page} von {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
            >
              Weiter
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <LogDetailDialog
        log={selectedLog}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        onUpdateStatus={handleUpdateStatus}
        onCopy={copyToClipboard}
      />

      {/* Bulk Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Status aktualisieren</DialogTitle>
            <DialogDescription>
              {"Status fur"} {selectedLogs.length} {"Log(s) auf"} &quot;{statusConfig[newStatus as keyof typeof statusConfig]?.label}&quot; setzen
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{"Losungsnotizen (optional)"}</Label>
              <Textarea
                placeholder={"Notizen zur Losung oder Erklarung..."}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => handleUpdateStatus(selectedLogs, newStatus, resolutionNotes)}
              disabled={isUpdating}
            >
              {isUpdating ? "Wird aktualisiert..." : "Aktualisieren"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
