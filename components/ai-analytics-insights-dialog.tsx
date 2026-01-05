"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePractice } from "@/contexts/practice-context"

export function AIAnalyticsInsightsDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<any>(null)
  const { currentPractice } = usePractice()

  const generateInsights = async () => {
    if (!currentPractice) return

    setLoading(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/analytics/ai-insights`, {
        method: "POST",
      })
      const data = await response.json()
      setInsights(data)
    } catch (error) {
      console.error("Error generating insights:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={generateInsights}
          className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 text-white shadow-md hover:shadow-lg transition-all border-0"
        >
          <Sparkles className="h-4 w-4" />
          KI-Analyse
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI-Analytics Einblicke
          </DialogTitle>
          <DialogDescription>
            Tiefe Analyse Ihrer Kennzahlen mit Vorhersagen und Optimierungsvorschlägen
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          </div>
        ) : insights ? (
          <div className="space-y-4">
            {insights.trends && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Erkannte Trends
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insights.trends.map((trend: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="font-semibold text-base mb-1">{trend.metric}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{trend.description}</p>
                      <Badge className="mt-2">{trend.direction}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {insights.predictions && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    Vorhersagen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insights.predictions.map((prediction: string, index: number) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xs font-semibold text-amber-700 dark:text-amber-300">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-relaxed pt-0.5">{prediction}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {insights.anomalies && insights.anomalies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Anomalien
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insights.anomalies.map((anomaly: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 rounded-lg"
                    >
                      <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm leading-relaxed">{anomaly}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {insights.recommendations && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Optimierungsvorschläge
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insights.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-sm leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center p-12 text-muted-foreground">
            Klicken Sie auf den Button, um KI-Analyse zu starten
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AIAnalyticsInsightsDialog
