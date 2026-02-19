"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bug, AlertCircle, XCircle, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface CronDebuggingGuideProps {
  copiedItem: string | null
  onCopy: (text: string, label: string) => void
}

function DebugStep({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
          {step}
        </span>
        {title}
      </h4>
      <div className="ml-8 space-y-3">{children}</div>
    </div>
  )
}

function CommonIssue({ title, description }: { title: string; description: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </div>
  )
}

export function CronDebuggingGuide({ copiedItem, onCopy }: CronDebuggingGuideProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Debugging in Produktion
        </CardTitle>
        <CardDescription>
          {"So überprüfen Sie, ob Ihre Cron Jobs in der Live-Umgebung ordnungsgemäß ausgeführt werden"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <DebugStep step={1} title={"Vercel Logs überprüfen"}>
          <p className="text-sm text-muted-foreground">{"Gehen Sie zu Ihrem Vercel Dashboard:"}</p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>{"Öffnen Sie Ihr Projekt in Vercel"}</li>
            <li>{'Klicken Sie auf "Logs" im Menü'}</li>
            <li>{'Filtern Sie nach "Function" → wählen Sie Ihre Cron-Funktionen'}</li>
            <li>{'Suchen Sie nach Einträgen mit "[v0]" für detaillierte Logs'}</li>
          </ol>
        </DebugStep>

        <DebugStep step={2} title="Manueller Test in Produktion">
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
                  onCopy(
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
        </DebugStep>

        <DebugStep step={3} title={"Ausführungsstatus überprüfen"}>
          <p className="text-sm text-muted-foreground">{"Erfolgreiche Ausführung sollte zurückgeben:"}</p>
          <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
            {`{
  "success": true,
  "message": "Todo reminders sent successfully",
  "sent": 5,
  "failed": 0
}`}
          </pre>
          <p className="text-sm text-muted-foreground">{"Fehler werden mit Details zurückgegeben:"}</p>
          <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
            {`{
  "success": false,
  "message": "Unauthorized",
  "error": "Invalid CRON_SECRET"
}`}
          </pre>
        </DebugStep>

        <DebugStep step={4} title={"Häufige Probleme"}>
          <div className="space-y-2">
            <CommonIssue
              title={'"Unauthorized" oder 401 Fehler'}
              description={<p>{"→ Überprüfen Sie, ob CRON_SECRET korrekt in den Vercel Umgebungsvariablen gesetzt ist"}</p>}
            />
            <CommonIssue
              title={"Cron Job wird nicht ausgeführt"}
              description={
                <p>
                  {"→ Überprüfen Sie vercel.json Konfiguration im Deployment"}<br />
                  {"→ Stellen Sie sicher, dass Sie auf einem Pro-Plan oder höher sind"}
                </p>
              }
            />
            <CommonIssue
              title="Keine E-Mails werden gesendet"
              description={
                <p>
                  {"→ Überprüfen Sie SMTP-Einstellungen in der Datenbank oder Umgebungsvariablen"}<br />
                  {"→ Prüfen Sie die E-Mail-Logs auf Zustellungsprobleme"}<br />
                  {"→ Überprüfen Sie, ob Benutzer gültige E-Mail-Adressen haben"}
                </p>
              }
            />
            <CommonIssue
              title="Function Timeout"
              description={
                <p>
                  {"→ Cron-Funktionen haben ein 10-Minuten-Timeout"}<br />
                  {"→ Wenn Sie viele Benutzer haben, erwägen Sie Batch-Verarbeitung"}
                </p>
              }
            />
          </div>
        </DebugStep>

        <DebugStep step={5} title="Erweiterte Logging aktivieren">
          <p className="text-sm text-muted-foreground">
            {"Die Cron-Endpunkte enthalten bereits detailliertes Logging mit [v0] Tags. Suchen Sie in den Vercel Logs nach:"}
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
            <li><code>[v0] Starting todo reminder cron job</code> - Job wurde gestartet</li>
            <li><code>[v0] Found X practices with todos</code> - Praxen gefunden</li>
            <li><code>[v0] Processing practice</code> - Verarbeitung läuft</li>
            <li><code>[v0] Sending email to user</code> - E-Mail wird gesendet</li>
            <li><code>[v0] Successfully sent X reminder emails</code> - Erfolgreich abgeschlossen</li>
          </ul>
        </DebugStep>

        <DebugStep step={6} title={"Regelmäßige Überwachung"}>
          <p className="text-sm text-muted-foreground">{"Empfohlene Überwachungsstrategie:"}</p>
          <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
            <li>{"Prüfen Sie Vercel Logs wöchentlich auf Fehler oder Warnungen"}</li>
            <li>{"Überwachen Sie die E-Mail-Logs für Zustellungsraten"}</li>
            <li>{"Testen Sie manuelle Ausführung monatlich zur Verifizierung"}</li>
            <li>{"Richten Sie Vercel Monitoring-Benachrichtigungen für Funktionsfehler ein"}</li>
          </ul>
        </DebugStep>
      </CardContent>
    </Card>
  )
}
