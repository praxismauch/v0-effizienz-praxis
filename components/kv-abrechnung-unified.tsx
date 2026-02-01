"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Upload,
  FileImage,
  Loader2,
  Trash2,
  Eye,
  Sparkles,
  ChevronDown,
  FileText,
  FileQuestion,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ArrowLeft,
  Euro,
  Calendar,
  BarChart3,
  Users,
  X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { put } from "@vercel/blob"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface KVFile {
  url: string
  uploaded_at: string
  file_name: string
  file_size: number
}

interface KVAbrechnungData {
  id: string
  practice_id: string
  year: number
  quarter: number
  image_url: string | null
  files: KVFile[]
  extracted_data: any
  created_by: string
  created_at: string
  updated_at: string
  file_url: string | null
}

const QUARTERS = [
  { value: 1, label: "Q1", fullLabel: "Q1 (Jan-Mär)", months: "Januar - März" },
  { value: 2, label: "Q2", fullLabel: "Q2 (Apr-Jun)", months: "April - Juni" },
  { value: 3, label: "Q3", fullLabel: "Q3 (Jul-Sep)", months: "Juli - September" },
  { value: 4, label: "Q4", fullLabel: "Q4 (Okt-Dez)", months: "Oktober - Dezember" },
]

const currentYear = new Date().getFullYear()
const ALL_YEARS = Array.from({ length: 10 }, (_, i) => currentYear - i)
const DEFAULT_YEARS_COUNT = 3

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "—"
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value)
}

const getAbrechnungFiles = (quarterData: KVAbrechnungData | null): KVFile[] => {
  if (!quarterData) return []
  const files = Array.isArray(quarterData.files) ? quarterData.files : []
  if (files.length === 0 && quarterData.file_url) {
    return [
      {
        url: quarterData.file_url,
        uploaded_at: quarterData.created_at,
        file_name: "legacy-file.pdf",
        file_size: 0,
      },
    ]
  }
  return files
}

export function KVAbrechnungUnified() {
  const [data, setData] = useState<KVAbrechnungData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingQuarter, setUploadingQuarter] = useState<{ year: number; quarter: number } | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [showAllYears, setShowAllYears] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiInsights, setAiInsights] = useState<string | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  
  // Detail view state
  const [selectedQuarter, setSelectedQuarter] = useState<{ year: number; quarter: number } | null>(null)
  const [detailTab, setDetailTab] = useState("overview")
  
  const { toast } = useToast()
  const { currentPractice } = usePractice()
  const { currentUser } = useUser()

  useEffect(() => {
    if (currentPractice?.id) {
      fetchData()
    }
  }, [currentPractice])

  const fetchData = async () => {
    if (!currentPractice?.id) return
    try {
      setIsLoading(true)
      const response = await fetch(`/api/practices/${currentPractice.id}/kv-abrechnung`)
      if (!response.ok) throw new Error("Fehler beim Laden der Daten")
      const result = await response.json()
      setData(result)
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Daten konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getQuarterData = (year: number, quarter: number) => {
    return data.find((d) => d.year === year && d.quarter === quarter)
  }

  const handleMultipleFileUpload = async (year: number, quarter: number, files: FileList) => {
    if (!currentPractice?.id || !currentUser?.id || files.length === 0) return

    try {
      setUploadingQuarter({ year, quarter })
      toast({ title: "Upload gestartet", description: `${files.length} Datei(en) werden hochgeladen...` })

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const blob = await put(
          `kv-abrechnung/${currentPractice.id}/${year}-Q${quarter}-${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split(".").pop()}`,
          file,
          { access: "public" }
        )

        await fetch(`/api/practices/${currentPractice.id}/kv-abrechnung`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            year,
            quarter,
            image_url: blob.url,
            file_url: blob.url,
            file_name: file.name,
            file_size: file.size,
            created_by: currentUser.id,
          }),
        })
      }

      toast({ title: "Erfolgreich", description: `${files.length} Datei(en) hochgeladen` })
      await fetchData()
    } catch (error) {
      toast({ title: "Fehler", description: "Upload fehlgeschlagen", variant: "destructive" })
    } finally {
      setUploadingQuarter(null)
    }
  }

  const handleDeleteFile = async (abrechnungId: string, fileIndex: number) => {
    if (!currentPractice?.id) return
    if (!confirm("Möchten Sie diese Datei wirklich löschen?")) return

    try {
      const response = await fetch(
        `/api/practices/${currentPractice.id}/kv-abrechnung/${abrechnungId}/files/${fileIndex}`,
        { method: "DELETE", credentials: "include" }
      )
      if (!response.ok) throw new Error("Fehler beim Löschen")
      toast({ title: "Gelöscht", description: "Datei wurde entfernt" })
      fetchData()
    } catch (error) {
      toast({ title: "Fehler", description: "Konnte nicht gelöscht werden", variant: "destructive" })
    }
  }

  const handleReanalyze = async (abrechnung: KVAbrechnungData) => {
    const filesToAnalyze: string[] = []
    if (abrechnung.files?.length > 0) {
      filesToAnalyze.push(...abrechnung.files.map((f) => f.url))
    } else if (abrechnung.file_url) {
      filesToAnalyze.push(abrechnung.file_url)
    }

    if (filesToAnalyze.length === 0) {
      toast({ title: "Keine Dateien", description: "Keine Dateien zum Analysieren", variant: "destructive" })
      return
    }

    setAnalyzing(true)
    try {
      const response = await fetch("/api/ai/analyze-kv-abrechnung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrls: filesToAnalyze,
          practiceId: abrechnung.practice_id,
          abrechnungId: abrechnung.id,
        }),
      })

      if (!response.ok) throw new Error("Fehler bei der Analyse")
      toast({ title: "Analyse abgeschlossen", description: "Daten wurden extrahiert" })
      await fetchData()
    } catch (error) {
      toast({ title: "Fehler", description: "Analyse fehlgeschlagen", variant: "destructive" })
    } finally {
      setAnalyzing(false)
    }
  }

  const fetchAIInsights = async (abrechnung: KVAbrechnungData) => {
    if (!abrechnung.extracted_data || !currentPractice?.id) return
    setLoadingInsights(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/kv-abrechnung/${abrechnung.id}/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extracted_data: abrechnung.extracted_data }),
      })
      if (!response.ok) throw new Error("Fehler")
      const data = await response.json()
      setAiInsights(data.insights)
    } catch (error) {
      console.error("Failed to fetch AI insights:", error)
    } finally {
      setLoadingInsights(false)
    }
  }

  // Calculate statistics
  const calculateStats = () => {
    const totalDocuments = data.length
    const analyzedDocuments = data.filter((d) => d.extracted_data).length
    const completeness = totalDocuments > 0 ? (analyzedDocuments / totalDocuments) * 100 : 0

    // Calculate total revenue from extracted data
    let totalRevenue = 0
    data.forEach((d) => {
      if (d.extracted_data?.gesamtHonorar) {
        const value = parseFloat(String(d.extracted_data.gesamtHonorar).replace(/[^\d,.-]/g, "").replace(",", "."))
        if (!isNaN(value)) totalRevenue += value
      }
    })

    return { totalDocuments, analyzedDocuments, completeness, totalRevenue }
  }

  const getQuarterRevenue = (quarterData: KVAbrechnungData | undefined) => {
    if (!quarterData?.extracted_data?.gesamtHonorar) return null
    const value = parseFloat(
      String(quarterData.extracted_data.gesamtHonorar).replace(/[^\d,.-]/g, "").replace(",", ".")
    )
    return isNaN(value) ? null : value
  }

  const getQuarterPatients = (quarterData: KVAbrechnungData | undefined) => {
    if (!quarterData?.extracted_data?.fallzahl) return null
    const value = parseInt(String(quarterData.extracted_data.fallzahl).replace(/[^\d]/g, ""))
    return isNaN(value) ? null : value
  }

  const displayYears = showAllYears ? ALL_YEARS : ALL_YEARS.slice(0, DEFAULT_YEARS_COUNT)
  const stats = calculateStats()
  const selectedQuarterData = selectedQuarter ? getQuarterData(selectedQuarter.year, selectedQuarter.quarter) : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Detail View for a specific quarter
  if (selectedQuarter) {
    const quarterInfo = QUARTERS.find((q) => q.value === selectedQuarter.quarter)
    const files = getAbrechnungFiles(selectedQuarterData)
    const extractedData = selectedQuarterData?.extracted_data

    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedQuarter(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Übersicht
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">
              {quarterInfo?.fullLabel} {selectedQuarter.year}
            </h2>
            <p className="text-muted-foreground">{quarterInfo?.months}</p>
          </div>
          {selectedQuarterData && (
            <Badge variant={extractedData ? "default" : "secondary"}>
              {extractedData ? "Analysiert" : "Nicht analysiert"}
            </Badge>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gesamthonorar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">
                  {formatCurrency(getQuarterRevenue(selectedQuarterData))}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fallzahl</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">
                  {getQuarterPatients(selectedQuarterData) || "—"}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Dokumente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{files.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {extractedData ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-700">Vollständig</span>
                  </>
                ) : files.length > 0 ? (
                  <>
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    <span className="text-sm font-medium text-amber-700">Analyse ausstehend</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Keine Daten</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs value={detailTab} onValueChange={setDetailTab}>
          <TabsList>
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="files">Dateien ({files.length})</TabsTrigger>
            <TabsTrigger value="analysis">KI-Analyse</TabsTrigger>
            <TabsTrigger value="details">Alle Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Zusammenfassung</CardTitle>
                <CardDescription>Wichtigste Kennzahlen aus der KV-Abrechnung</CardDescription>
              </CardHeader>
              <CardContent>
                {extractedData ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(extractedData).slice(0, 9).map(([key, value]) => (
                      <div key={key} className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{key}</p>
                        <p className="text-lg font-semibold mt-1">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Keine analysierten Daten vorhanden</p>
                    <p className="text-sm">Laden Sie Dateien hoch und starten Sie die KI-Analyse</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Dokumente</CardTitle>
                    <CardDescription>Hochgeladene KV-Abrechnungsdateien für dieses Quartal</CardDescription>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                      multiple
                      id="upload-files"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          handleMultipleFileUpload(selectedQuarter.year, selectedQuarter.quarter, e.target.files)
                        }
                      }}
                    />
                    <label htmlFor="upload-files">
                      <Button asChild disabled={!!uploadingQuarter}>
                        <div className="cursor-pointer">
                          {uploadingQuarter ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          Dateien hochladen
                        </div>
                      </Button>
                    </label>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {files.length > 0 ? (
                  <div className="space-y-3">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                      >
                        {file.url?.endsWith(".pdf") ? (
                          <FileText className="h-8 w-8 flex-shrink-0 text-red-500" />
                        ) : (
                          <FileImage className="h-8 w-8 flex-shrink-0 text-blue-500" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.file_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(file.uploaded_at).toLocaleDateString("de-DE", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                            {file.file_size > 0 && ` • ${(file.file_size / 1024).toFixed(0)} KB`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setPreviewImage(file.url)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Vorschau
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => selectedQuarterData && handleDeleteFile(selectedQuarterData.id, index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">Keine Dateien hochgeladen</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ziehen Sie Dateien hierher oder klicken Sie auf "Dateien hochladen"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>KI-Analyse</CardTitle>
                    <CardDescription>Automatische Datenextraktion und Einblicke</CardDescription>
                  </div>
                  {selectedQuarterData && files.length > 0 && (
                    <Button
                      onClick={() => handleReanalyze(selectedQuarterData)}
                      disabled={analyzing}
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                    >
                      {analyzing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      {extractedData ? "Erneut analysieren" : "Analyse starten"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {extractedData ? (
                  <div className="space-y-6">
                    {/* AI Insights */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-purple-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-purple-900 dark:text-purple-100">KI-Einblicke</p>
                          {loadingInsights ? (
                            <div className="flex items-center gap-2 mt-2 text-purple-700">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Analysiere...
                            </div>
                          ) : aiInsights ? (
                            <p className="text-sm text-purple-800 dark:text-purple-200 mt-2 whitespace-pre-line">
                              {aiInsights}
                            </p>
                          ) : (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto text-purple-600"
                              onClick={() => selectedQuarterData && fetchAIInsights(selectedQuarterData)}
                            >
                              KI-Einblicke generieren
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Noch keine Analyse durchgeführt</p>
                    <p className="text-sm text-muted-foreground">
                      {files.length > 0
                        ? "Klicken Sie auf 'Analyse starten' um die Daten zu extrahieren"
                        : "Laden Sie zuerst Dateien hoch"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alle extrahierten Daten</CardTitle>
                <CardDescription>Vollständige Übersicht aller aus den Dokumenten extrahierten Informationen</CardDescription>
              </CardHeader>
              <CardContent>
                {extractedData ? (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {Object.entries(extractedData).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50">
                          <span className="text-sm font-medium text-muted-foreground min-w-[200px]">{key}</span>
                          <span className="text-sm font-medium flex-1">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Keine Daten verfügbar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // Main Overview View
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gesamtumsatz</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Euro className="h-6 w-6 text-green-500" />
              <span className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quartale erfasst</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="text-2xl font-bold">{stats.totalDocuments}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Analysiert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <span className="text-2xl font-bold">{stats.analyzedDocuments}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vollständigkeit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <span className="text-2xl font-bold">{stats.completeness.toFixed(0)}%</span>
              <Progress value={stats.completeness} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Year/Quarter Grid */}
      <Card>
        <CardHeader>
          <CardTitle>KV-Abrechnungen nach Quartalen</CardTitle>
          <CardDescription>
            Klicken Sie auf ein Quartal um Details anzuzeigen, Dateien hochzuladen und KI-Analysen durchzuführen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {displayYears.map((year) => (
              <div key={year} className="space-y-3">
                <h3 className="text-lg font-semibold">{year}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {QUARTERS.map(({ value: quarter, label, months }) => {
                    const quarterData = getQuarterData(year, quarter)
                    const revenue = getQuarterRevenue(quarterData)
                    const patients = getQuarterPatients(quarterData)
                    const files = getAbrechnungFiles(quarterData)
                    const hasData = !!quarterData
                    const isAnalyzed = !!quarterData?.extracted_data

                    return (
                      <Card
                        key={quarter}
                        className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
                          isAnalyzed
                            ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
                            : hasData
                              ? "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20"
                              : ""
                        }`}
                        onClick={() => setSelectedQuarter({ year, quarter })}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{label}</CardTitle>
                            {isAnalyzed && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {hasData && !isAnalyzed && <AlertCircle className="h-4 w-4 text-amber-500" />}
                          </div>
                          <CardDescription className="text-xs">{months}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {hasData ? (
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs text-muted-foreground">Honorar</p>
                                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                  {formatCurrency(revenue)}
                                </p>
                              </div>
                              {patients && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Fälle</p>
                                  <p className="text-sm font-medium">{patients}</p>
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <FileText className="h-3 w-3" />
                                {files.length} Datei(en)
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                              <p className="text-xs text-muted-foreground">Keine Daten</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}

            {ALL_YEARS.length > DEFAULT_YEARS_COUNT && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={() => setShowAllYears(!showAllYears)}>
                  {showAllYears ? "Weniger anzeigen" : `Mehr anzeigen (${ALL_YEARS.length - DEFAULT_YEARS_COUNT} weitere)`}
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showAllYears ? "rotate-180" : ""}`} />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Dokumentvorschau</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="relative w-full h-[600px] bg-muted/10 rounded-lg overflow-hidden">
              {previewImage.toLowerCase().endsWith(".pdf") ? (
                <iframe src={previewImage} className="w-full h-full" title="PDF Preview" />
              ) : (
                <Image src={previewImage} alt="Dokument" fill className="object-contain" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default KVAbrechnungUnified
