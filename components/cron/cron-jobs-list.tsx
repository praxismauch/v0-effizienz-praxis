"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, Copy, ExternalLink, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

export const CRON_JOBS = [
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

export const VERCEL_JSON_EXAMPLE = `{
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

interface CronJobsListProps {
  copiedItem: string | null
  onCopy: (text: string, label: string) => void
}

export function CronJobsList({ copiedItem, onCopy }: CronJobsListProps) {
  return (
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
            <strong>{CRON_JOBS.length} Cron Jobs</strong>.
          </AlertDescription>
        </Alert>

        {/* Cron Jobs List */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Verfügbare Cron Jobs ({CRON_JOBS.length})</h3>
          {CRON_JOBS.map((job, index) => (
            <Card key={job.path} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">#{index + 1}</Badge>
                      <CardTitle className="text-base">{job.name}</CardTitle>
                    </div>
                    <CardDescription className="text-xs">{job.description}</CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-2 shrink-0">{job.frequency}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div className="flex items-center gap-2 text-sm">
                  <code className="flex-1 rounded bg-muted px-2 py-1 text-xs font-mono">{job.path}</code>
                  <Button size="sm" variant="ghost" onClick={() => onCopy(job.path, job.name)} className="h-7 px-2">
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
            <SetupStep step={1} title="vercel.json erstellen oder aktualisieren">
              <p className="text-xs text-muted-foreground">
                {"Fügen Sie folgende Konfiguration in die"} <code className="text-xs">vercel.json</code> {"Datei im Projekt-Root ein:"}
              </p>
              <div className="relative">
                <pre className="rounded-lg bg-muted p-4 text-xs overflow-x-auto">
                  <code>{VERCEL_JSON_EXAMPLE}</code>
                </pre>
                <Button size="sm" variant="ghost" onClick={() => onCopy(VERCEL_JSON_EXAMPLE, "vercel.json")} className="absolute top-2 right-2 h-7 px-2">
                  {copiedItem === "vercel.json" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </SetupStep>
            <SetupStep step={2} title="CRON_SECRET konfigurieren (optional, empfohlen)">
              <p className="text-xs text-muted-foreground">
                {"Setzen Sie eine"} <code className="text-xs">CRON_SECRET</code> {"Umgebungsvariable für zusätzliche Sicherheit. Diese ist bereits in Ihrem Projekt vorhanden."}
              </p>
            </SetupStep>
            <SetupStep step={3} title="Deployment durchführen">
              <p className="text-xs text-muted-foreground">
                {"Committen Sie die Änderungen und deployen Sie zu Vercel. Die Cron Jobs werden automatisch aktiviert."}
              </p>
            </SetupStep>
            <SetupStep step={4} title={"Cron Jobs überprüfen"}>
              <p className="text-xs text-muted-foreground">
                {"Gehen Sie zu Ihrem Vercel Dashboard → Projekt → Cron, um die Ausführung zu überwachen."}
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-3.5 w-3.5" />
                  Vercel Dashboard öffnen
                </a>
              </Button>
            </SetupStep>
          </div>
        </div>

        {/* Manual Testing */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-sm font-semibold">Manuelles Testen</h3>
          <p className="text-xs text-muted-foreground">
            {"Sie können die Cron Jobs manuell auslösen, indem Sie die Endpunkte direkt aufrufen:"}
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
              {"Mit"} <code className="text-xs">CRON_SECRET</code>{": Fügen Sie den Header"}{" "}
              <code className="text-xs">Authorization: Bearer your-cron-secret</code> {"hinzu"}
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
                <tr><td className="px-3 py-2 font-mono">{"* * * * *"}</td><td className="px-3 py-2">Minute Stunde Tag Monat Wochentag</td></tr>
                <tr><td className="px-3 py-2 font-mono">{"0 8 * * *"}</td><td className="px-3 py-2">{"Täglich um 8:00 Uhr"}</td></tr>
                <tr><td className="px-3 py-2 font-mono">{"0 */6 * * *"}</td><td className="px-3 py-2">Alle 6 Stunden</td></tr>
                <tr><td className="px-3 py-2 font-mono">{"0 9 * * 1"}</td><td className="px-3 py-2">{"Jeden Montag um 9:00 Uhr"}</td></tr>
                <tr><td className="px-3 py-2 font-mono">{"0 0 1 * *"}</td><td className="px-3 py-2">Am ersten Tag jedes Monats um Mitternacht</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SetupStep({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
        {step}
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium">{title}</p>
        {children}
      </div>
    </div>
  )
}
