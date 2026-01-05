"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePractice } from "@/contexts/practice-context"
import { Loader2, FileText, CheckCircle, AlertCircle, TrendingUp } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface KVAbrechnungData {
  id: string
  year: number
  quarter: number
  image_url: string | null
  extracted_data: any
  created_at: string
}

const KVAbrechnungBericht = () => {
  const [data, setData] = useState<KVAbrechnungData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { currentPractice } = usePractice()

  useEffect(() => {
    if (currentPractice?.id) {
      fetchData()
    }
  }, [currentPractice?.id])

  const fetchData = async () => {
    if (!currentPractice?.id) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/practices/${currentPractice.id}/kv-abrechnung`)
      if (!response.ok) throw new Error("Fehler beim Laden der Daten")
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error("Error fetching KV Abrechnung data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = () => {
    const totalDocuments = data.length
    const analyzedDocuments = data.filter((d) => d.extracted_data).length
    const years = new Set(data.map((d) => d.year))
    const currentYear = new Date().getFullYear()

    const quartersByYear = Array.from(years).map((year) => ({
      year,
      quarters: data.filter((d) => d.year === year).length,
      analyzed: data.filter((d) => d.year === year && d.extracted_data).length,
    }))

    const completeness = totalDocuments > 0 ? (analyzedDocuments / totalDocuments) * 100 : 0

    return {
      totalDocuments,
      analyzedDocuments,
      quartersByYear,
      completeness,
      currentYear,
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const stats = calculateStats()

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gesamt Dokumente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold">{stats.totalDocuments}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Analysiert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <span className="text-3xl font-bold">{stats.analyzedDocuments}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quartale erfasst</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <span className="text-3xl font-bold">{stats.totalDocuments}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vollständigkeit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">{stats.completeness.toFixed(0)}%</div>
              <Progress value={stats.completeness} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Jahresübersicht</CardTitle>
          <CardDescription>Verteilung der KV-Abrechnungen nach Jahren und Quartalen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.quartersByYear.map((yearData) => (
              <div key={yearData.year} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{yearData.year}</span>
                  <span className="text-sm text-muted-foreground">
                    {yearData.quarters}/4 Quartale • {yearData.analyzed} analysiert
                  </span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((quarter) => {
                    const hasData = data.some((d) => d.year === yearData.year && d.quarter === quarter)
                    const isAnalyzed = data.some(
                      (d) => d.year === yearData.year && d.quarter === quarter && d.extracted_data,
                    )

                    return (
                      <div
                        key={quarter}
                        className={`flex-1 h-10 rounded flex items-center justify-center text-sm font-medium ${
                          isAnalyzed
                            ? "bg-green-500/20 text-green-700 border border-green-500/50"
                            : hasData
                              ? "bg-blue-500/20 text-blue-700 border border-blue-500/50"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        Q{quarter}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Empfehlungen</CardTitle>
          <CardDescription>Automatische Hinweise zur Vervollständigung Ihrer Dokumentation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.totalDocuments === 0 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Erste Schritte</p>
                  <p className="text-sm text-blue-700">
                    Beginnen Sie mit dem Hochladen Ihrer KV-Abrechnungen im Tab "Dateien"
                  </p>
                </div>
              </div>
            )}

            {stats.totalDocuments > 0 && stats.completeness < 100 && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900">Fehlende Quartale</p>
                  <p className="text-sm text-amber-700">
                    {stats.totalDocuments < 4 * stats.quartersByYear.length
                      ? `Es fehlen noch ${4 * stats.quartersByYear.length - stats.totalDocuments} Quartale für eine vollständige Dokumentation`
                      : "Alle Quartale sind dokumentiert"}
                  </p>
                </div>
              </div>
            )}

            {stats.analyzedDocuments < stats.totalDocuments && (
              <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-900">KI-Analyse ausstehend</p>
                  <p className="text-sm text-purple-700">
                    {stats.totalDocuments - stats.analyzedDocuments} Dokument(e) können noch analysiert werden
                  </p>
                </div>
              </div>
            )}

            {stats.completeness === 100 && stats.analyzedDocuments === stats.totalDocuments && (
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Vollständig</p>
                  <p className="text-sm text-green-700">Alle Dokumente sind hochgeladen und analysiert</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default KVAbrechnungBericht
