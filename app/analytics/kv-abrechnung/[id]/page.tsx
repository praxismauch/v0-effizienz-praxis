"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  BarChart3,
  FileImage,
  FileText,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ExtractedData {
  quarter?: string
  year?: string
  total_amount?: string | number
  patient_count?: string | number
  case_count?: string | number
  avg_per_patient?: string | number
  [key: string]: any
}

interface KVAbrechnungData {
  id: string
  quarter: string
  year: string
  image_url?: string
  extracted_data?: ExtractedData
  created_at: string
}

export default function KVAbrechnungDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [abrechnung, setAbrechnung] = useState<KVAbrechnungData | null>(null)
  const [aiInsights, setAiInsights] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingInsights, setLoadingInsights] = useState(false)

  const newIntl = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  })

  useEffect(() => {
    const fetchAbrechnung = async () => {
      try {
        const response = await fetch(`/api/kv-abrechnung/${params.id}`)
        if (!response.ok) throw new Error("Failed to fetch KV-Abrechnung")

        const data = await response.json()
        setAbrechnung(data)

        // Fetch AI insights if extracted data exists
        if (data.extracted_data) {
          fetchAIInsights(data)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch KV-Abrechnung:", error)
        toast({
          title: "Fehler",
          description: "KV-Abrechnung konnte nicht geladen werden",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchAbrechnung()
    }
  }, [params.id])

  const fetchAIInsights = async (abrechnungData: KVAbrechnungData) => {
    if (!abrechnungData.extracted_data) return

    setLoadingInsights(true)
    try {
      const response = await fetch("/api/kv-abrechnung/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extracted_data: abrechnungData.extracted_data,
          year: abrechnungData.year,
          quarter: abrechnungData.quarter,
        }),
      })

      if (!response.ok) throw new Error("Failed to fetch insights")

      const data = await response.json()
      setAiInsights(data.insights)
    } catch (error) {
      console.error("[v0] Failed to fetch AI insights:", error)
      toast({
        title: "Fehler",
        description: "KI-Analyse konnte nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setLoadingInsights(false)
    }
  }

  if (loading) {
    return <AppLayout loading={true} loadingMessage="KV-Abrechnung wird geladen..." />
  }

  if (!abrechnung) {
    return (
      <AppLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">KV-Abrechnung nicht gefunden</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zur Übersicht
        </Button>

        {/* Page Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">
              KV-Abrechnung Q{abrechnung.quarter} {abrechnung.year}
            </h1>
          </div>
          <p className="text-muted-foreground">Detaillierte Ansicht der extrahierten Daten und KI-Analyse</p>
        </div>

        {/* Extracted Data Section */}
        {abrechnung.extracted_data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-500" />
                Extrahierte Daten
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quarter & Year */}
                <div className="p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-muted-foreground mb-1">Quartal</div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    Q{abrechnung.extracted_data.quarter} {abrechnung.extracted_data.year}
                  </div>
                </div>

                {/* Total Amount */}
                {abrechnung.extracted_data.total_amount && (
                  <div className="p-6 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-sm text-muted-foreground mb-1">Gesamtbetrag</div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {newIntl.format(Number(abrechnung.extracted_data.total_amount))}
                    </div>
                  </div>
                )}

                {/* Patient Count */}
                {abrechnung.extracted_data.patient_count && (
                  <div className="p-6 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="text-sm text-muted-foreground mb-1">Anzahl Patienten</div>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {abrechnung.extracted_data.patient_count}
                    </div>
                  </div>
                )}

                {/* Case Count */}
                {abrechnung.extracted_data.case_count && (
                  <div className="p-6 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="text-sm text-muted-foreground mb-1">Behandlungsfälle</div>
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {abrechnung.extracted_data.case_count}
                    </div>
                  </div>
                )}

                {/* Avg Per Patient */}
                {abrechnung.extracted_data.avg_per_patient && (
                  <div className="md:col-span-2 p-6 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <div className="text-sm text-muted-foreground mb-1">Durchschnitt pro Patient</div>
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                      {newIntl.format(Number(abrechnung.extracted_data.avg_per_patient))}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Fields */}
              {Object.keys(abrechnung.extracted_data).filter(
                (key) =>
                  ![
                    "quarter",
                    "year",
                    "total_amount",
                    "patient_count",
                    "case_count",
                    "avg_per_patient",
                    "raw_text",
                    "parse_error",
                  ].includes(key),
              ).length > 0 && (
                <div className="pt-4 border-t">
                  <div className="text-sm font-medium mb-3">Weitere Daten</div>
                  <div className="space-y-2">
                    {Object.entries(abrechnung.extracted_data)
                      .filter(
                        ([key]) =>
                          ![
                            "quarter",
                            "year",
                            "total_amount",
                            "patient_count",
                            "case_count",
                            "avg_per_patient",
                            "raw_text",
                            "parse_error",
                          ].includes(key),
                      )
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm font-medium">{key}:</span>
                          <span className="text-sm">{String(value)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* AI Insights Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-500" />
              KI-Analyse & Einblicke
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingInsights ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <span className="ml-3 text-muted-foreground">KI-Analyse wird erstellt...</span>
              </div>
            ) : aiInsights ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="space-y-4">
                  {aiInsights.split("\n\n").map((paragraph, idx) => {
                    // Check if it's a heading (starts with ##)
                    if (paragraph.startsWith("## ")) {
                      return (
                        <h3 key={idx} className="text-lg font-semibold mt-6 mb-3 flex items-center gap-2">
                          {paragraph.includes("Empfehlung") && <Lightbulb className="h-5 w-5 text-yellow-500" />}
                          {paragraph.includes("Warnung") && <AlertTriangle className="h-5 w-5 text-orange-500" />}
                          {paragraph.includes("Trend") && <TrendingUp className="h-5 w-5 text-blue-500" />}
                          {paragraph.includes("Positiv") && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                          {paragraph.replace("## ", "")}
                        </h3>
                      )
                    }

                    // Check if it's a bullet point
                    if (paragraph.startsWith("- ") || paragraph.startsWith("• ")) {
                      return (
                        <div key={idx} className="pl-4 border-l-2 border-purple-200 dark:border-purple-800 py-2">
                          <p className="text-sm leading-relaxed">{paragraph.replace(/^[-•]\s/, "")}</p>
                        </div>
                      )
                    }

                    // Regular paragraph
                    return (
                      <p key={idx} className="text-sm leading-relaxed text-foreground/90">
                        {paragraph}
                      </p>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Keine KI-Analyse verfügbar</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Image */}
        {abrechnung.image_url && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileImage className="h-6 w-6 text-gray-500" />
                Original-Dokument
              </CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={abrechnung.image_url || "/placeholder.svg"}
                alt={`KV Abrechnung Q${abrechnung.quarter} ${abrechnung.year}`}
                className="w-full rounded-lg border shadow-lg"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
