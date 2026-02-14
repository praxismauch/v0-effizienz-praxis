"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import type { SummaryHistory } from "./types"

interface HistoryTabProps {
  history: SummaryHistory[]
}

export function HistoryTab({ history }: HistoryTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Versandverlauf
          </CardTitle>
          <CardDescription>Übersicht der gesendeten Zusammenfassungen</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {history.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      {entry.status === "sent" ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <div>
                        <p className="font-medium">
                          {format(new Date(entry.sent_at), "dd.MM.yyyy 'um' HH:mm 'Uhr'", { locale: de })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entry.recipients_count} Empfänger • {entry.todos_count} Aufgaben •{" "}
                          {entry.appointments_count} Termine
                        </p>
                      </div>
                    </div>
                    <Badge variant={entry.status === "sent" ? "default" : "destructive"}>
                      {entry.status === "sent" ? "Gesendet" : "Fehlgeschlagen"}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Noch keine Zusammenfassungen gesendet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
