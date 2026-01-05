"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, RefreshCw, Trash2 } from "lucide-react"
import { formatDateTimeDE } from "@/lib/utils"

interface LogEntry {
  id: string
  timestamp: string
  level: string
  category: string
  message: string
  details: any
  user_id: string | null
  practice_id: string | null
  request_id: string | null
  url: string | null
  method: string | null
  stack_trace: string | null
}

export function DebugLogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState<string>("warn,error")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (levelFilter !== "all") params.append("level", levelFilter)
      if (categoryFilter !== "all") params.append("category", categoryFilter)

      const response = await fetch(`/api/logs?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (Array.isArray(data)) {
        setLogs(data)
      } else {
        console.error("Logs API returned non-array data:", data)
        setLogs([])
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error)
      setLogs([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [levelFilter, categoryFilter])

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "destructive"
      case "warn":
        return "default"
      case "info":
        return "secondary"
      case "debug":
        return "outline"
      default:
        return "outline"
    }
  }

  const exportLogsToClipboard = async () => {
    try {
      if (logs.length === 0) {
        alert("Keine Protokolle zum Exportieren")
        return
      }

      const textContent = logs
        .map((log) => {
          let text = `Timestamp: ${formatDateTimeDE(log.timestamp)}\n`
          text += `Level: ${log.level.toUpperCase()}\n`
          text += `Category: ${log.category}\n`
          if (log.request_id) text += `Request ID: ${log.request_id}\n`
          if (log.url) text += `URL: ${log.method} ${log.url}\n`
          text += `Message: ${log.message}\n`
          if (log.details) text += `Details: ${JSON.stringify(log.details, null, 2)}\n`
          if (log.stack_trace) text += `Stack Trace:\n${log.stack_trace}\n`
          return text + "\n" + "=".repeat(100)
        })
        .join("\n\n")

      await navigator.clipboard.writeText(textContent)
      alert(`Erfolgreich ${logs.length} Protokolle in die Zwischenablage kopiert!`)
    } catch (error) {
      console.error("Failed to copy logs:", error)
      alert(`Fehler beim Kopieren der Protokolle: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`)
    }
  }

  const exportLargeLogsToClipboard = async () => {
    try {
      const params = new URLSearchParams({ limit: "1000" })
      if (levelFilter !== "all") params.append("level", levelFilter)
      if (categoryFilter !== "all") params.append("category", categoryFilter)

      const response = await fetch(`/api/logs?${params.toString()}`)
      const largeLogs = await response.json()

      if (largeLogs.length === 0) {
        alert("Keine Protokolle zum Exportieren")
        return
      }

      const textContent = largeLogs
        .map((log: LogEntry) => {
          let text = `Timestamp: ${formatDateTimeDE(log.timestamp)}\n`
          text += `Level: ${log.level.toUpperCase()}\n`
          text += `Category: ${log.category}\n`
          if (log.request_id) text += `Request ID: ${log.request_id}\n`
          if (log.url) text += `URL: ${log.method} ${log.url}\n`
          text += `Message: ${log.message}\n`
          if (log.details) text += `Details: ${JSON.stringify(log.details, null, 2)}\n`
          if (log.stack_trace) text += `Stack Trace:\n${log.stack_trace}\n`
          return text + "\n" + "=".repeat(100)
        })
        .join("\n\n")

      await navigator.clipboard.writeText(textContent)
      alert(`Erfolgreich ${largeLogs.length} Protokolle in die Zwischenablage kopiert!`)
    } catch (error) {
      console.error("Failed to copy logs:", error)
      alert(`Fehler beim Kopieren der Protokolle: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`)
    }
  }

  const deleteAllLogs = async () => {
    if (
      !confirm(
        "Sind Sie sicher, dass Sie ALLE Protokolle löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.",
      )
    ) {
      return
    }

    try {
      const response = await fetch("/api/logs", {
        method: "DELETE",
      })

      if (response.ok) {
        alert("Alle Protokolle erfolgreich gelöscht")
        fetchLogs()
      } else {
        alert("Fehler beim Löschen der Protokolle")
      }
    } catch (error) {
      console.error("Failed to delete logs:", error)
      alert(`Fehler beim Löschen der Protokolle: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System-Debug-Protokolle</CardTitle>
            <CardDescription>Anwendungsprotokolle anzeigen und exportieren</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={deleteAllLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Alle löschen
            </Button>
            <Button variant="outline" onClick={exportLogsToClipboard} disabled={logs.length === 0}>
              <Copy className="h-4 w-4 mr-2" />
              In Zwischenablage kopieren
            </Button>
            <Button variant="outline" onClick={exportLargeLogsToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              1000 Protokolle kopieren
            </Button>
            <Button onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Level</label>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Level</SelectItem>
                <SelectItem value="warn,error">Warnungen & Fehler</SelectItem>
                <SelectItem value="error">Fehler</SelectItem>
                <SelectItem value="warn">Warnung</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Kategorie</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="context">Context</SelectItem>
                <SelectItem value="auth">Auth</SelectItem>
                <SelectItem value="database">Datenbank</SelectItem>
                <SelectItem value="supabase">Supabase</SelectItem>
                <SelectItem value="ui">UI</SelectItem>
                <SelectItem value="other">Sonstige</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Lade Protokolle...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Keine Protokolle gefunden</div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {logs.map((log) => (
              <Card key={log.id} className="p-4">
                <div className="flex items-start gap-4">
                  <Badge variant={getLevelColor(log.level)}>{log.level.toUpperCase()}</Badge>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{formatDateTimeDE(log.timestamp)}</span>
                      <Badge variant="outline">{log.category}</Badge>
                      {log.request_id && (
                        <span className="font-mono text-xs text-muted-foreground">{log.request_id}</span>
                      )}
                    </div>
                    <p className="font-medium">{log.message}</p>
                    {log.url && (
                      <p className="text-sm text-muted-foreground">
                        {log.method} {log.url}
                      </p>
                    )}
                    {log.details && (
                      <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                    {log.stack_trace && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground">Stack-Trace</summary>
                        <pre className="bg-muted p-2 rounded mt-2 overflow-x-auto">{log.stack_trace}</pre>
                      </details>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DebugLogsTab
