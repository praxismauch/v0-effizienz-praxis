"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  MessageSquare,
  Search,
  RefreshCw,
  Trash2,
  Eye,
  Download,
  BarChart3,
  MessageCircleQuestion,
  Bot,
  AlertCircle,
  Calendar,
  Clock,
} from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"

interface ChatLog {
  id: string
  question: string
  response: string
  matched_faq_key: string | null
  session_id: string | null
  user_agent: string | null
  referrer: string | null
  response_time_ms: number | null
  is_default_response: boolean
  is_greeting: boolean
  created_at: string
}

interface Statistics {
  total: number
  default_responses: number
  greetings: number
  faq_matches: number
  faq_usage: Record<string, number>
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const FAQ_LABELS: Record<string, string> = {
  kennzahlen: "Kennzahlen/KPIs",
  funktionen: "Funktionen",
  preise: "Preise",
  dsgvo: "DSGVO/Datenschutz",
  ki: "KI-Features",
  kontakt: "Kontakt",
  team: "Team-Management",
  recruiting: "Recruiting",
  greeting: "Begrüßung",
}

export default function ChatLogsViewer() {
  const [logs, setLogs] = useState<ChatLog[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selectedLog, setSelectedLog] = useState<ChatLog | null>(null)

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        filter,
      })

      if (search) params.set("search", search)

      const response = await fetch(`/api/super-admin/chat-logs?${params}`)
      const data = await response.json()

      if (data.logs) {
        setLogs(data.logs)
        setPagination(data.pagination)
        setStatistics(data.statistics)
      }
    } catch (error) {
      console.error("Failed to fetch chat logs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [pagination.page, filter])

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchLogs()
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/super-admin/chat-logs?id=${id}`, { method: "DELETE" })
      fetchLogs()
    } catch (error) {
      console.error("Failed to delete log:", error)
    }
  }

  const handleCleanup = async (days: number) => {
    try {
      await fetch(`/api/super-admin/chat-logs?olderThan=${days}`, { method: "DELETE" })
      fetchLogs()
    } catch (error) {
      console.error("Failed to cleanup logs:", error)
    }
  }

  const exportLogs = () => {
    const csvContent = [
      ["Datum", "Frage", "FAQ-Match", "Standard-Antwort", "Begrüßung", "Antwortzeit (ms)"].join(";"),
      ...logs.map((log) =>
        [
          format(new Date(log.created_at), "dd.MM.yyyy HH:mm", { locale: de }),
          `"${log.question.replace(/"/g, '""')}"`,
          log.matched_faq_key || "-",
          log.is_default_response ? "Ja" : "Nein",
          log.is_greeting ? "Ja" : "Nein",
          log.response_time_ms || "-",
        ].join(";"),
      ),
    ].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `chat-logs-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getTypeBadge = (log: ChatLog) => {
    if (log.is_greeting) {
      return <Badge variant="secondary">Begrüßung</Badge>
    }
    if (log.is_default_response) {
      return <Badge variant="destructive">Keine Übereinstimmung</Badge>
    }
    if (log.matched_faq_key) {
      return <Badge variant="default">{FAQ_LABELS[log.matched_faq_key] || log.matched_faq_key}</Badge>
    }
    return <Badge variant="outline">Unbekannt</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamt Anfragen</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">FAQ Treffer</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.faq_matches}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.total > 0 ? `${((statistics.faq_matches / statistics.total) * 100).toFixed(1)}%` : "0%"}{" "}
                Trefferquote
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Keine Übereinstimmung</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{statistics.default_responses}</div>
              <p className="text-xs text-muted-foreground">Standard-Antworten</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Begrüßungen</CardTitle>
              <MessageCircleQuestion className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statistics.greetings}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* FAQ Usage Chart */}
      {statistics?.faq_usage && Object.keys(statistics.faq_usage).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              FAQ Nutzung
            </CardTitle>
            <CardDescription>Welche Themen werden am häufigsten angefragt</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statistics.faq_usage)
                .sort(([, a], [, b]) => b - a)
                .map(([key, count]) => {
                  const maxCount = Math.max(...Object.values(statistics.faq_usage))
                  const percentage = (count / maxCount) * 100
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-32 text-sm font-medium">{FAQ_LABELS[key] || key}</div>
                      <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-12 text-sm text-right">{count}</div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Chat-Protokolle</CardTitle>
              <CardDescription>Alle Chatbot-Anfragen von der Landingpage</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Suche in Fragen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-48"
                />
                <Button variant="outline" size="icon" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="faq">FAQ Treffer</SelectItem>
                  <SelectItem value="default">Keine Übereinstimmung</SelectItem>
                  <SelectItem value="greeting">Begrüßungen</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchLogs}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="outline" size="icon" onClick={exportLogs}>
                <Download className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Aufräumen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Alte Logs löschen</AlertDialogTitle>
                    <AlertDialogDescription>
                      Wählen Sie, wie alt die Logs sein müssen, die gelöscht werden sollen.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="flex gap-2 py-4">
                    <Button variant="outline" onClick={() => handleCleanup(30)}>
                      Älter als 30 Tage
                    </Button>
                    <Button variant="outline" onClick={() => handleCleanup(90)}>
                      Älter als 90 Tage
                    </Button>
                    <Button variant="outline" onClick={() => handleCleanup(180)}>
                      Älter als 180 Tage
                    </Button>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine Chat-Protokolle gefunden</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Datum</TableHead>
                    <TableHead>Frage</TableHead>
                    <TableHead className="w-40">Typ</TableHead>
                    <TableHead className="w-24">Zeit</TableHead>
                    <TableHead className="w-20">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(log.created_at), "dd.MM.yy", { locale: de })}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.created_at), "HH:mm", { locale: de })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="line-clamp-2">{log.question}</span>
                      </TableCell>
                      <TableCell>{getTypeBadge(log)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.response_time_ms ? `${log.response_time_ms}ms` : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(log.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Zeige {(pagination.page - 1) * pagination.limit + 1} -{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} von {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Zurück
                  </Button>
                  <span className="text-sm">
                    Seite {pagination.page} von {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Weiter
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chat-Details</DialogTitle>
            <DialogDescription>
              {selectedLog &&
                format(new Date(selectedLog.created_at), "dd. MMMM yyyy, HH:mm 'Uhr'", {
                  locale: de,
                })}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MessageCircleQuestion className="h-4 w-4" />
                  Frage
                </h4>
                <div className="bg-muted p-3 rounded-lg">{selectedLog.question}</div>
              </div>
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Antwort
                </h4>
                <div className="bg-muted p-3 rounded-lg whitespace-pre-wrap text-sm">{selectedLog.response}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Typ:</span>
                  <div className="mt-1">{getTypeBadge(selectedLog)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Antwortzeit:</span>
                  <div className="mt-1">{selectedLog.response_time_ms ? `${selectedLog.response_time_ms}ms` : "-"}</div>
                </div>
                {selectedLog.session_id && (
                  <div>
                    <span className="text-muted-foreground">Session:</span>
                    <div className="mt-1 font-mono text-xs truncate">{selectedLog.session_id}</div>
                  </div>
                )}
                {selectedLog.referrer && (
                  <div>
                    <span className="text-muted-foreground">Referrer:</span>
                    <div className="mt-1 truncate">{selectedLog.referrer}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
