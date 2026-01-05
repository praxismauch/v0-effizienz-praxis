"use client"

import { format, parseISO } from "date-fns"
import { de } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, BarChart3, TrendingUp, Sparkles, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react"

interface Journal {
  id: string
  period_type: "weekly" | "monthly" | "quarterly" | "yearly"
  period_start: string
  period_end: string
  title: string
  summary: string | null
  ai_analysis: any
  kpis_included: any
  diagrams: any
  user_notes: string | null
  status: "draft" | "published" | "archived"
  created_at: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  journal: Journal
}

export function ViewJournalDialog({ open, onOpenChange, journal }: Props) {
  const getPeriodTypeLabel = (type: string) => {
    switch (type) {
      case "weekly":
        return "Wochenbericht"
      case "monthly":
        return "Monatsbericht"
      case "quarterly":
        return "Quartalsbericht"
      case "yearly":
        return "Jahresbericht"
      default:
        return type
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <DialogTitle>{journal.title}</DialogTitle>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{getPeriodTypeLabel(journal.period_type)}</Badge>
            <span>
              {format(parseISO(journal.period_start), "dd.MM.yyyy", { locale: de })} -{" "}
              {format(parseISO(journal.period_end), "dd.MM.yyyy", { locale: de })}
            </span>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Summary */}
            {journal.summary && (
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Zusammenfassung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{journal.summary}</p>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* AI Analysis */}
            {journal.ai_analysis && (
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  KI-Analyse
                </h3>

                {journal.ai_analysis.overview && (
                  <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Übersicht</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{journal.ai_analysis.overview}</p>
                    </CardContent>
                  </Card>
                )}

                {journal.ai_analysis.achievements && journal.ai_analysis.achievements.length > 0 && (
                  <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700 dark:text-green-300">
                        <CheckCircle2 className="h-4 w-4" />
                        Erfolge
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {journal.ai_analysis.achievements.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {journal.ai_analysis.challenges && journal.ai_analysis.challenges.length > 0 && (
                  <Card className="border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-700 dark:text-orange-300">
                        <AlertTriangle className="h-4 w-4" />
                        Herausforderungen
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {journal.ai_analysis.challenges.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {journal.ai_analysis.recommendations && journal.ai_analysis.recommendations.length > 0 && (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
                        <Lightbulb className="h-4 w-4" />
                        Empfehlungen
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {journal.ai_analysis.recommendations.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* User Notes */}
            {journal.user_notes && (
              <>
                <Separator />
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Persönliche Notizen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {journal.user_notes}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            {/* KPIs Included */}
            {journal.kpis_included && journal.kpis_included.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Enthaltene KPIs
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {journal.kpis_included.map((kpi: any, i: number) => (
                      <Badge key={i} variant="secondary">
                        {kpi.name || kpi}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
