"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, BarChart3, CalendarDays, TrendingUp, AlertTriangle, ListTodo, Sparkles } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import type { WeeklySummarySettings } from "./types"

interface PreviewTabProps {
  settings: WeeklySummarySettings
}

export function PreviewTab({ settings }: PreviewTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            E-Mail-Vorschau
          </CardTitle>
          <CardDescription>So wird Ihre wöchentliche Zusammenfassung aussehen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted p-4 border-b">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Von:</span>
                <span className="text-muted-foreground">noreply@effizienz-praxis.de</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Betreff:</span>
                <span>Wöchentliche Praxis-Zusammenfassung - KW {format(new Date(), "w", { locale: de })}</span>
              </div>
            </div>

            <div className="p-6 bg-white">
              <div
                className="p-6 rounded-t-lg text-white mb-6"
                style={{ backgroundColor: settings.branding_color }}
              >
                <h1 className="text-2xl font-bold">Wöchentliche Zusammenfassung</h1>
                <p className="opacity-90">
                  Kalenderwoche {format(new Date(), "w", { locale: de })} -{" "}
                  {format(new Date(), "MMMM yyyy", { locale: de })}
                </p>
              </div>

              {settings.custom_intro && <p className="text-muted-foreground mb-6">{settings.custom_intro}</p>}

              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <BarChart3 className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-muted-foreground">Aufgaben erledigt</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <CalendarDays className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">28</p>
                  <p className="text-xs text-muted-foreground">Termine</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">85%</p>
                  <p className="text-xs text-muted-foreground">Ziel-Fortschritt</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-xs text-muted-foreground">Warnungen</p>
                </div>
              </div>

              <div className="space-y-4">
                {settings.include_todos && (
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <ListTodo className="h-4 w-4" />
                      Aufgaben-Übersicht
                    </h3>
                    <p className="text-sm text-muted-foreground">5 offene Aufgaben, 12 diese Woche erledigt</p>
                  </div>
                )}
                {settings.include_appointments && (
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <CalendarDays className="h-4 w-4" />
                      Kommende Termine
                    </h3>
                    <p className="text-sm text-muted-foreground">28 Termine in der nächsten Woche geplant</p>
                  </div>
                )}
                {settings.include_ai_insights && (
                  <div className="p-4 border rounded-lg bg-primary/5">
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      KI-Empfehlung
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Basierend auf den Daten empfehlen wir, die Terminplanung am Mittwoch zu optimieren...
                    </p>
                  </div>
                )}
                {settings.include_weekly_forecast && (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <CalendarDays className="h-4 w-4" />
                      Wochenvorschau
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Geburtstage, wichtige Termine, fällige Aufgaben der kommenden Woche
                    </p>
                  </div>
                )}
              </div>

              {settings.custom_footer && (
                <p className="text-sm text-muted-foreground mt-6 pt-6 border-t">{settings.custom_footer}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
