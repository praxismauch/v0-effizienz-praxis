"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { RefreshCw, Loader2, Search, AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react"

interface LogEntry {
  timestamp: string
  level: string
  message: string
}

export function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")

  async function fetchLogs() {
    setLoading(true)
    try {
      const res = await fetch("/api/super-admin/email-logs")
      const data = await res.json()
      setLogs(data.logs || [])
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [])

  const filtered = logs.filter(
    (l) =>
      !filter ||
      l.message.toLowerCase().includes(filter.toLowerCase()) ||
      l.level.toLowerCase().includes(filter.toLowerCase())
  )

  function getLevelBadge(level: string) {
    switch (level) {
      case "error":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Fehler</Badge>
      case "warning":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1"><AlertTriangle className="h-3 w-3" />Warnung</Badge>
      case "info":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 gap-1"><Info className="h-3 w-3" />Info</Badge>
      default:
        return <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" />{level}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>E-Mail Protokoll</CardTitle>
              <CardDescription>
                {filtered.length} Eintraege{filter ? " (gefiltert)" : ""}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Aktualisieren
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Logs durchsuchen..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-red-500" /> Fehler: {logs.filter((l) => l.level === "error").length}
              </span>
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-amber-500" /> Warnungen: {logs.filter((l) => l.level === "warning").length}
              </span>
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500" /> Info: {logs.filter((l) => l.level === "info").length}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Keine Logs gefunden</p>
              <p className="text-sm">Es wurden keine E-Mail-bezogenen Log-Eintraege gefunden.</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[180px]">Zeitstempel</TableHead>
                    <TableHead className="w-[100px]">Level</TableHead>
                    <TableHead>Nachricht</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log, i) => (
                    <TableRow key={i} className={log.level === "error" ? "bg-red-50/50 dark:bg-red-900/5" : ""}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("de-DE", {
                          day: "2-digit", month: "2-digit", year: "2-digit",
                          hour: "2-digit", minute: "2-digit", second: "2-digit"
                        })}
                      </TableCell>
                      <TableCell>{getLevelBadge(log.level)}</TableCell>
                      <TableCell className="text-sm max-w-md truncate">{log.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>Fehlerbehebung</CardTitle>
          <CardDescription>Haeufige Probleme und Loesungen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: "E-Mails werden nicht gesendet", solution: "Pruefen Sie die SMTP-Konfiguration unter dem Tab 'Diagnose'. Stellen Sie sicher, dass Host, Port und Zugangsdaten korrekt sind." },
              { title: "E-Mails landen im Spam", solution: "Stellen Sie sicher, dass SPF, DKIM und DMARC DNS-Eintraege korrekt gesetzt sind. Verwenden Sie eine authentifizierte Domain." },
              { title: "Verbindung timeout", solution: "Port 465 benoetigt SSL, Port 587 benoetigt STARTTLS. Pruefen Sie die Firewall-Einstellungen." },
              { title: "Authentifizierung fehlgeschlagen", solution: "Pruefen Sie Benutzername und Passwort. Bei Gmail/Google muss ein App-Passwort verwendet werden." },
            ].map((item) => (
              <div key={item.title} className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.solution}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
