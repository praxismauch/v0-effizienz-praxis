"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, Copy, ExternalLink, Info, Bug, AlertCircle, XCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export function CronSetupGuide() {
  const { toast } = useToast()
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedItem(label)
    toast({
      title: "Kopiert!",
      description: `${label} wurde in die Zwischenablage kopiert.`,
    })
    setTimeout(() => setCopiedItem(null), 2000)
  }

  const cronJobs = [
    {
      name: "Todo Erinnerungen",
      path: "/api/cron/todo-reminders",
      schedule: "0 8 * * *",
      description: "Sendet täglich um 8:00 Uhr (UTC) E-Mail-Erinnerungen für anstehende Todos",
      frequency: "Täglich um 8:00 Uhr UTC (10:00 Uhr MEZ)",
    },
    {
      name: "Wiederkehrende Todos",
      path: "/api/todos/generate-recurring",
      schedule: "0 0 * * *",
      description: "Generiert täglich um Mitternacht (UTC) wiederkehrende Todo-Einträge",
      frequency: "Täglich um 00:00 Uhr UTC (02:00 Uhr MEZ)",
    },
  ]

  const vercelJsonExample = `{
  "crons": [
    {
      "path": "/api/cron/todo-reminders",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/todos/generate-recurring",
      "schedule": "0 0 * * *"
    }
  ]
}`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cron Job Einrichtung
          </CardTitle>
          <CardDescription>
            Konfigurieren Sie automatische Aufgaben für E-Mail-Erinnerungen und wiederkehrende Todos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Wichtig:</strong> Nach dem Ändern der vercel.json müssen Sie Ihr Projekt neu deployen, damit die
              Cron Jobs im Vercel Dashboard erscheinen. Die Konfiguration enthält aktuell{" "}
              <strong>{cronJobs.length} Cron Jobs</strong>.
            </AlertDescription>
          </Alert>

          {/* Cron Jobs List */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Verfügbare Cron Jobs ({cronJobs.length})</h3>
            {cronJobs.map((job, index) => (
              <Card key={job.path} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <CardTitle className="text-base">{job.name}</CardTitle>
                      </div>
                      <CardDescription className="text-xs">{job.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-2 shrink-0">
                      {job.frequency}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className="flex items-center gap-2 text-sm">
                    <code className="flex-1 rounded bg-muted px-2 py-1 text-xs font-mono">{job.path}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(job.path, job.name)}
                      className="h-7 px-2"
                    >
                      {copiedItem === job.name ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xs text-muted-foreground">Cron Syntax:</span>
                    <code className="rounded bg-muted px-2 py-1 text-xs font-mono">{job.schedule}</code>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Setup Instructions */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-semibold">Einrichtung in Vercel</h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  1
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium">vercel.json erstellen oder aktualisieren</p>
                  <p className="text-xs text-muted-foreground">
                    Fügen Sie folgende Konfiguration in die <code className="text-xs">vercel.json</code> Datei im
                    Projekt-Root ein:
                  </p>
                  <div className="relative">
                    <pre className="rounded-lg bg-muted p-4 text-xs overflow-x-auto">
                      <code>{vercelJsonExample}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(vercelJsonExample, "vercel.json")}
                      className="absolute top-2 right-2 h-7 px-2"
                    >
                      {copiedItem === "vercel.json" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  2
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium">CRON_SECRET konfigurieren (optional, empfohlen)</p>
                  <p className="text-xs text-muted-foreground">
                    Setzen Sie eine <code className="text-xs">CRON_SECRET</code> Umgebungsvariable für zusätzliche
                    Sicherheit. Diese ist bereits in Ihrem Projekt vorhanden.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  3
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium">Deployment durchführen</p>
                  <p className="text-xs text-muted-foreground">
                    Committen Sie die Änderungen und deployen Sie zu Vercel. Die Cron Jobs werden automatisch aktiviert.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  4
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium">Cron Jobs überprüfen</p>
                  <p className="text-xs text-muted-foreground">
                    Gehen Sie zu Ihrem Vercel Dashboard → Projekt → Cron, um die Ausführung zu überwachen.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      Vercel Dashboard öffnen
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Testing */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-semibold">Manuelles Testen</h3>
            <p className="text-xs text-muted-foreground">
              Sie können die Cron Jobs manuell auslösen, indem Sie die Endpunkte direkt aufrufen:
            </p>
            <div className="space-y-2">
              <code className="block rounded bg-muted px-3 py-2 text-xs">
                curl https://ihre-domain.com/api/cron/todo-reminders
              </code>
              <code className="block rounded bg-muted px-3 py-2 text-xs">
                curl https://ihre-domain.com/api/todos/generate-recurring
              </code>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Mit <code className="text-xs">CRON_SECRET</code>: Fügen Sie den Header{" "}
                <code className="text-xs">Authorization: Bearer your-cron-secret</code> hinzu
              </AlertDescription>
            </Alert>
          </div>

          {/* Cron Syntax Reference */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-semibold">Cron Syntax Referenz</h3>
            <div className="rounded-lg border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Format</th>
                    <th className="px-3 py-2 text-left font-medium">Beschreibung</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-3 py-2 font-mono">* * * * *</td>
                    <td className="px-3 py-2">Minute Stunde Tag Monat Wochentag</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono">0 8 * * *</td>
                    <td className="px-3 py-2">Täglich um 8:00 Uhr</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono">0 */6 * * *</td>
                    <td className="px-3 py-2">Alle 6 Stunden</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono">0 9 * * 1</td>
                    <td className="px-3 py-2">Jeden Montag um 9:00 Uhr</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono">0 0 1 * *</td>
                    <td className="px-3 py-2">Am ersten Tag jedes Monats um Mitternacht</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debugging in Production */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Debugging in Produktion
          </CardTitle>
          <CardDescription>
            So überprüfen Sie, ob Ihre Cron Jobs in der Live-Umgebung ordnungsgemäß ausgeführt werden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Check Vercel Logs */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                1
              </span>
              Vercel Logs überprüfen
            </h4>
            <div className="ml-8 space-y-2">
              <p className="text-sm text-muted-foreground">Gehen Sie zu Ihrem Vercel Dashboard:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Öffnen Sie Ihr Projekt in Vercel</li>
                <li>Klicken Sie auf "Logs" im Menü</li>
                <li>Filtern Sie nach "Function" → wählen Sie Ihre Cron-Funktionen</li>
                <li>Suchen Sie nach Einträgen mit "[v0]" für detaillierte Logs</li>
              </ol>
            </div>
          </div>

          {/* Step 2: Manual Testing */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                2
              </span>
              Manueller Test in Produktion
            </h4>
            <div className="ml-8 space-y-3">
              <p className="text-sm text-muted-foreground">Testen Sie die Cron-Endpunkte direkt:</p>
              <div className="space-y-2">
                <Label>Todo-Erinnerungen testen:</Label>
                <div className="relative">
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                    {`curl -X POST https://ihre-domain.vercel.app/api/cron/todo-reminders \\
  -H "Authorization: Bearer \${CRON_SECRET}"`}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() =>
                      handleCopy(
                        'curl -X POST https://ihre-domain.vercel.app/api/cron/todo-reminders \\\n  -H "Authorization: Bearer ${CRON_SECRET}"',
                        "curl-todo",
                      )
                    }
                  >
                    {copiedItem === "curl-todo" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Ersetzen Sie <code>ihre-domain.vercel.app</code> mit Ihrer tatsächlichen Domain und{" "}
                  <code>{"${CRON_SECRET}"}</code> mit Ihrem tatsächlichen CRON_SECRET aus den Umgebungsvariablen
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Step 3: Check Execution Status */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                3
              </span>
              Ausführungsstatus überprüfen
            </h4>
            <div className="ml-8 space-y-3">
              <p className="text-sm text-muted-foreground">Erfolgreiche Ausführung sollte zurückgeben:</p>
              <div className="relative">
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                  {`{
  "success": true,
  "message": "Todo reminders sent successfully",
  "sent": 5,
  "failed": 0
}`}
                </pre>
              </div>
              <p className="text-sm text-muted-foreground">Fehler werden mit Details zurückgegeben:</p>
              <div className="relative">
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                  {`{
  "success": false,
  "message": "Unauthorized",
  "error": "Invalid CRON_SECRET"
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* Step 4: Common Issues */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                4
              </span>
              Häufige Probleme
            </h4>
            <div className="ml-8 space-y-3">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">"Unauthorized" oder 401 Fehler</p>
                    <p className="text-xs text-muted-foreground">
                      → Überprüfen Sie, ob CRON_SECRET korrekt in den Vercel Umgebungsvariablen gesetzt ist
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Cron Job wird nicht ausgeführt</p>
                    <p className="text-xs text-muted-foreground">
                      → Überprüfen Sie vercel.json Konfiguration im Deployment
                      <br />→ Stellen Sie sicher, dass Sie auf einem Pro-Plan oder höher sind
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Keine E-Mails werden gesendet</p>
                    <p className="text-xs text-muted-foreground">
                      → Überprüfen Sie SMTP-Einstellungen in der Datenbank oder Umgebungsvariablen
                      <br />→ Prüfen Sie die E-Mail-Logs auf Zustellungsprobleme
                      <br />→ Überprüfen Sie, ob Benutzer gültige E-Mail-Adressen haben
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Function Timeout</p>
                    <p className="text-xs text-muted-foreground">
                      → Cron-Funktionen haben ein 10-Minuten-Timeout
                      <br />→ Wenn Sie viele Benutzer haben, erwägen Sie Batch-Verarbeitung
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5: Enhanced Logging */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                5
              </span>
              Erweiterte Logging aktivieren
            </h4>
            <div className="ml-8 space-y-3">
              <p className="text-sm text-muted-foreground">
                Die Cron-Endpunkte enthalten bereits detailliertes Logging mit [v0] Tags. Suchen Sie in den Vercel Logs
                nach:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                <li>
                  <code>[v0] Starting todo reminder cron job</code> - Job wurde gestartet
                </li>
                <li>
                  <code>[v0] Found X practices with todos</code> - Praxen gefunden
                </li>
                <li>
                  <code>[v0] Processing practice</code> - Verarbeitung läuft
                </li>
                <li>
                  <code>[v0] Sending email to user</code> - E-Mail wird gesendet
                </li>
                <li>
                  <code>[v0] Successfully sent X reminder emails</code> - Erfolgreich abgeschlossen
                </li>
              </ul>
            </div>
          </div>

          {/* Step 6: Monitor Execution */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                6
              </span>
              Regelmäßige Überwachung
            </h4>
            <div className="ml-8 space-y-2">
              <p className="text-sm text-muted-foreground">Empfohlene Überwachungsstrategie:</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                <li>Prüfen Sie Vercel Logs wöchentlich auf Fehler oder Warnungen</li>
                <li>Überwachen Sie die E-Mail-Logs für Zustellungsraten</li>
                <li>Testen Sie manuelle Ausführung monatlich zur Verifizierung</li>
                <li>Richten Sie Vercel Monitoring-Benachrichtigungen für Funktionsfehler ein</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CronSetupGuide
