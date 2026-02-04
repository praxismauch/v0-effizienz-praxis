"use client"

import { useState, useEffect, useCallback } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"
import useSWR from "swr"
import {
  AlertTriangle,
  Bug,
  Info,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight,
  Monitor,
  Server,
  Globe,
  Zap,
  Database,
  Shield,
  Mail,
  Bot,
  Layers,
  Activity,
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  Settings,
  CheckSquare,
  Square,
  MoreHorizontal,
  Copy,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface ErrorLog {
  id: string
  created_at: string
  level: "debug" | "info" | "warn" | "error" | "critical"
  category: string
  message: string
  error_name: string | null
  error_message: string | null
  stack_trace: string | null
  source: string | null
  url: string | null
  method: string | null
  user_agent: string | null
  ip_address: string | null
  user_id: string | null
  practice_id: number | null
  request_id: string | null
  metadata: Record<string, any>
  status: "new" | "acknowledged" | "investigating" | "resolved" | "ignored"
  resolved_at: string | null
  resolved_by: string | null
  resolution_notes: string | null
  fingerprint: string | null
}

interface Stats {
  total: number
  byLevel: Record<string, number>
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  bySource: Record<string, number>
  last24h: number
  lastWeek: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const levelConfig = {
  debug: { icon: Bug, color: "text-slate-500", bg: "bg-slate-500/10", label: "Debug" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10", label: "Info" },
  warn: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Warnung" },
  error: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Fehler" },
  critical: { icon: XCircle, color: "text-red-700", bg: "bg-red-700/10", label: "Kritisch" },
}

const statusConfig = {
  new: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Neu" },
  acknowledged: { icon: Eye, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Bestätigt" },
  investigating: { icon: Search, color: "text-blue-500", bg: "bg-blue-500/10", label: "In Bearbeitung" },
  resolved: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", label: "Gelöst" },
  ignored: { icon: XCircle, color: "text-slate-400", bg: "bg-slate-400/10", label: "Ignoriert" },
}

const categoryIcons: Record<string, any> = {
  api: Globe,
  database: Database,
  auth: Shield,
  ui: Monitor,
  email: Mail,
  ai: Bot,
  cron: Clock,
  middleware: Layers,
  security: Shield,
  performance: Zap,
  other: Activity,
}

const sourceIcons: Record<string, any> = {
  client: Monitor,
  server: Server,
  api: Globe,
  cron: Clock,
}

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

  const { data, error, isLoading, mutate } = useSWR<{
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
      const body: any = { status }
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
    } catch (error) {
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
    if (!confirm(`Alle Logs älter als ${days} Tage löschen?`)) return

    try {
      const response = await fetch(`/api/super-admin/error-logs?olderThan=${days}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete logs")
      
      const result = await response.json()
      toast({ title: "Erfolg", description: `${result.deleted || 0} Logs gelöscht` })
      mutate()
    } catch (error) {
      toast({ title: "Fehler", description: "Logs konnten nicht gelöscht werden", variant: "destructive" })
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
            Systemweite Fehlerüberwachung und Analyse
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
                Älter als 7 Tage löschen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteOldLogs(30)}>
                Älter als 30 Tage löschen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteOldLogs(90)}>
                Älter als 90 Tage löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamt Logs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.last24h} in den letzten 24h
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fehler</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {((stats.byLevel.error || 0) + (stats.byLevel.critical || 0)).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.byLevel.critical || 0} kritisch
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ungelöst</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {((stats.byStatus.new || 0) + (stats.byStatus.acknowledged || 0) + (stats.byStatus.investigating || 0)).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.byStatus.new || 0} neue
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gelöst</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {(stats.byStatus.resolved || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.byStatus.ignored || 0} ignoriert
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category & Source Distribution */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Nach Kategorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.byCategory).map(([category, count]) => {
                  const Icon = categoryIcons[category] || Activity
                  return (
                    <Badge
                      key={category}
                      variant="outline"
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleFilterChange("category", category)}
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {category}: {count}
                    </Badge>
                  )
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Nach Quelle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.bySource).map(([source, count]) => {
                  const Icon = sourceIcons[source] || Activity
                  return (
                    <Badge
                      key={source}
                      variant="outline"
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleFilterChange("source", source)}
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {source}: {count}
                    </Badge>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                <SelectItem value="acknowledged">Bestätigt</SelectItem>
                <SelectItem value="investigating">In Bearbeitung</SelectItem>
                <SelectItem value="resolved">Gelöst</SelectItem>
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
                Filter zurücksetzen
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
                {selectedLogs.length} Log(s) ausgewählt
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate("acknowledged")}>
                  Bestätigen
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate("investigating")}>
                  In Bearbeitung
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate("resolved")}>
                  Gelöst
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
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectedLogs.length === logs.length && logs.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-[160px]">Zeit</TableHead>
                <TableHead className="w-[100px]">Level</TableHead>
                <TableHead className="w-[100px]">Kategorie</TableHead>
                <TableHead>Nachricht</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[80px]">Quelle</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Keine Logs gefunden
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const levelCfg = levelConfig[log.level] || levelConfig.info
                  const statusCfg = statusConfig[log.status] || statusConfig.new
                  const LevelIcon = levelCfg.icon
                  const StatusIcon = statusCfg.icon
                  const CategoryIcon = categoryIcons[log.category] || Activity
                  const SourceIcon = sourceIcons[log.source || ""] || Activity

                  return (
                    <TableRow
                      key={log.id}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50",
                        selectedLogs.includes(log.id) && "bg-muted/50"
                      )}
                      onClick={() => handleViewDetails(log)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedLogs.includes(log.id)}
                          onCheckedChange={() => handleSelectLog(log.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <div>{format(new Date(log.created_at), "dd.MM.yyyy HH:mm:ss")}</div>
                        <div className="text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: de })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(levelCfg.bg, levelCfg.color)}>
                          <LevelIcon className="h-3 w-3 mr-1" />
                          {levelCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <CategoryIcon className="h-3 w-3 text-muted-foreground" />
                          {log.category}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[400px] truncate font-medium">
                          {log.message}
                        </div>
                        {log.url && (
                          <div className="text-xs text-muted-foreground truncate max-w-[400px]">
                            {log.url}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(statusCfg.bg, statusCfg.color)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.source && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <SourceIcon className="h-3 w-3" />
                            {log.source}
                          </div>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(log)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Details anzeigen
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleUpdateStatus(log.id, "acknowledged")}>
                              Bestätigen
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(log.id, "investigating")}>
                              In Bearbeitung
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(log.id, "resolved")}>
                              Gelöst
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(log.id, "ignored")}>
                              Ignorieren
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
              Zurück
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
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && (
                <>
                  {(() => {
                    const cfg = levelConfig[selectedLog.level]
                    const Icon = cfg.icon
                    return <Icon className={cn("h-5 w-5", cfg.color)} />
                  })()}
                  Error Details
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedLog && format(new Date(selectedLog.created_at), "dd.MM.yyyy HH:mm:ss")}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {/* Status & Actions */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant="outline" className={cn(statusConfig[selectedLog.status].bg, statusConfig[selectedLog.status].color)}>
                      {statusConfig[selectedLog.status].label}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={selectedLog.status}
                      onValueChange={(value) => {
                        handleUpdateStatus(selectedLog.id, value)
                        setSelectedLog({ ...selectedLog, status: value as any })
                      }}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Neu</SelectItem>
                        <SelectItem value="acknowledged">Bestätigt</SelectItem>
                        <SelectItem value="investigating">In Bearbeitung</SelectItem>
                        <SelectItem value="resolved">Gelöst</SelectItem>
                        <SelectItem value="ignored">Ignoriert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nachricht</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">{selectedLog.message}</p>
                    {selectedLog.error_message && selectedLog.error_message !== selectedLog.message && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedLog.error_message}</p>
                    )}
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Kategorie</Label>
                    <p className="text-sm">{selectedLog.category}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Quelle</Label>
                    <p className="text-sm">{selectedLog.source || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Benutzer ID</Label>
                    <p className="text-sm font-mono">{selectedLog.user_id || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Praxis ID</Label>
                    <p className="text-sm">{selectedLog.practice_id || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Request ID</Label>
                    <p className="text-sm font-mono">{selectedLog.request_id || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">IP Adresse</Label>
                    <p className="text-sm font-mono">{selectedLog.ip_address || "-"}</p>
                  </div>
                </div>

                {/* URL */}
                {selectedLog.url && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">URL</Label>
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      {selectedLog.method && (
                        <Badge variant="outline">{selectedLog.method}</Badge>
                      )}
                      <code className="text-sm flex-1 truncate">{selectedLog.url}</code>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(selectedLog.url || "")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Stack Trace */}
                {selectedLog.stack_trace && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        Stack Trace
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto">
                        <pre className="text-xs whitespace-pre-wrap">{selectedLog.stack_trace}</pre>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* User Agent */}
                {selectedLog.user_agent && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">User Agent</Label>
                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded-lg">
                      {selectedLog.user_agent}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        Zusätzliche Daten
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 p-3 bg-muted rounded-lg overflow-x-auto">
                        <pre className="text-xs">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Resolution Notes */}
                {selectedLog.resolution_notes && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Lösungsnotizen</Label>
                    <p className="text-sm bg-green-500/10 text-green-700 p-3 rounded-lg">
                      {selectedLog.resolution_notes}
                    </p>
                  </div>
                )}

                {/* Fingerprint */}
                {selectedLog.fingerprint && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Fingerprint:</span>
                    <code>{selectedLog.fingerprint}</code>
                    <Button
                      size="sm"
                      variant="link"
                      className="text-xs h-auto p-0"
                      onClick={() => {
                        handleFilterChange("search", "")
                        setShowDetailDialog(false)
                        // Would need fingerprint filter support
                      }}
                    >
                      Ähnliche anzeigen
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Status aktualisieren</DialogTitle>
            <DialogDescription>
              Status für {selectedLogs.length} Log(s) auf "{statusConfig[newStatus as keyof typeof statusConfig]?.label}" setzen
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Lösungsnotizen (optional)</Label>
              <Textarea
                placeholder="Notizen zur Lösung oder Erklärung..."
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
