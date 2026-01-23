"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import type { CorrectionRequest } from "../types"

interface KorrekturenTabProps {
  corrections: CorrectionRequest[]
  isLoading: boolean
  onNewCorrection: () => void
  onViewCorrection: (correction: CorrectionRequest) => void
}

export default function KorrekturenTab({
  corrections,
  isLoading,
  onNewCorrection,
  onViewCorrection,
}: KorrekturenTabProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="h-3 w-3 mr-1" />
            Ausstehend
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Genehmigt
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="h-3 w-3 mr-1" />
            Abgelehnt
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with New Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Korrekturanträge</h3>
          <p className="text-sm text-muted-foreground">
            Beantragen Sie Korrekturen für fehlerhafte Zeitbuchungen
          </p>
        </div>
        <Button onClick={onNewCorrection}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Antrag
        </Button>
      </div>

      {/* Corrections List */}
      {corrections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">Keine Korrekturanträge</h3>
            <p className="text-muted-foreground text-center mt-1 mb-4">
              Sie haben noch keine Korrekturanträge gestellt
            </p>
            <Button variant="outline" onClick={onNewCorrection}>
              <Plus className="h-4 w-4 mr-2" />
              Ersten Antrag erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {corrections.map((correction) => (
            <Card
              key={correction.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onViewCorrection(correction)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {format(new Date(correction.date), "EEEE, dd. MMMM yyyy", { locale: de })}
                      </span>
                      {getStatusBadge(correction.status)}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{correction.reason}</p>
                    {correction.requested_start_time && correction.requested_end_time && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Gewünschte Zeit: {correction.requested_start_time} - {correction.requested_end_time}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {format(new Date(correction.created_at), "dd.MM.yyyy", { locale: de })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
