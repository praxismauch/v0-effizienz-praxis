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
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { put } from "@vercel/blob"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"

interface KVFile {
  url: string
  uploaded_at: string
  file_name: string
  file_size: number
}

/** Extracted data structure from KV documents */
interface KVExtractedData {
  gesamtbetrag?: number
  einzelleistungen?: Array<{
    bezeichnung: string
    anzahl: number
    betrag: number
  }>
  arzt?: string
  praxis?: string
  abrechnungszeitraum?: string
  datum?: string
  raw_text?: string
  [key: string]: unknown // Allow additional dynamic fields from AI extraction
}

/** Main KV Abrechnung entity - single source of truth */
interface KVAbrechnung {
  id: string
  practice_id: string
  year: number
  quarter: number
  image_url?: string | null
  files: KVFile[]
  extracted_data: KVExtractedData | null
  created_by: string
  created_at: string
  updated_at: string
  file_url: string | null
}

// Alias for backwards compatibility
type KVAbrechnungData = KVAbrechnung

const QUARTERS = [
  { value: 1, label: "Q1 (Jan-Mär)" },
  { value: 2, label: "Q2 (Apr-Jun)" },
  { value: 3, label: "Q3 (Jul-Sep)" },
  { value: 4, label: "Q4 (Okt-Dez)" },
]

const currentYear = new Date().getFullYear()
const ALL_YEARS = Array.from({ length: 10 }, (_, i) => currentYear - i)
const DEFAULT_YEARS_COUNT = 5

// Helper for currency formatting
const newIntl = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" })

const getAbrechnungFiles = (quarterData: KVAbrechnung | null): KVFile[] => {
  if (!quarterData) return []

  // Support both new files array and legacy single file
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

export function KVAbrechnungManager() {
  const [data, setData] = useState<KVAbrechnungData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingQuarter, setUploadingQuarter] = useState<{ year: number; quarter: number } | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [showSmartUpload, setShowSmartUpload] = useState(false)
  const [showAllYears, setShowAllYears] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [smartUploadProgress, setSmartUploadProgress] = useState<{
    total: number
    current: number
    isAnalyzing: boolean
    currentFile?: string
    results: Array<{ filename: string; year?: number; quarter?: number; success: boolean; error?: string }>
  } | null>(null)
  const [manualQuarterSelection, setManualQuarterSelection] = useState<{
    file: File
    blob: { url: string }
    year: number
    index: number
  } | null>(null)
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null)
  const [expandedData, setExpandedData] = useState<Record<string, boolean>>({})
  const { toast } = useToast()
  const { currentPractice } = usePractice()
  const { currentUser } = useUser()
  const [dragOverQuarter, setDragOverQuarter] = useState<{ year: number; quarter: number } | null>(null)
  const [previewFile, setPreviewFile] = useState<{ file: File; url: string } | null>(null)
  const [analyzing, setAnalyzing] = useState(false) // Added state for re-analyze functionality

  const [selectedAbrechnung, setSelectedAbrechnung] = useState<KVAbrechnungData | null>(null)
  const [showDetailedView, setShowDetailedView] = useState(false)
  const [aiInsights, setAiInsights] = useState<string | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)

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

      if (!response.ok) {
        throw new Error("Fehler beim Laden der Daten")
      }

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

  const handleFileUpload = async (year: number, quarter: number, file: File) => {
    if (!currentPractice?.id || !currentUser?.id) return

    try {
      setUploadingQuarter({ year, quarter })

      const blob = await put(
        `kv-abrechnung/${currentPractice.id}/${year}-Q${quarter}-${Date.now()}.${file.name.split(".").pop()}`,
        file,
        { access: "public" },
      )

      const response = await fetch(`/api/practices/${currentPractice.id}/kv-abrechnung`, {
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

      if (!response.ok) throw new Error("Fehler beim Speichern")

      toast({
        title: "Erfolgreich hochgeladen",
        description: `Datei für ${year} Q${quarter} wurde hinzugefügt`,
      })

      fetchData()
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Fehler",
        description: "Datei konnte nicht hochgeladen werden",
        variant: "destructive",
      })
    } finally {
      setUploadingQuarter(null)
    }
  }

  const handleMultipleFileUpload = async (year: number, quarter: number, files: FileList) => {
    if (!currentPractice?.id || !currentUser?.id || files.length === 0) return

    try {
      setUploadingQuarter({ year, quarter })



      // Show initial toast
      toast({
        title: "Upload gestartet",
        description: `${files.length} Datei(en) werden hochgeladen...`,
      })

      const results: Array<{ success: boolean; filename: string; error?: string }> = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]


        try {
          const blob = await put(
            `kv-abrechnung/${currentPractice.id}/${year}-Q${quarter}-${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split(".").pop()}`,
            file,
            {
              access: "public",
              token: process.env.BLOB_READ_WRITE_TOKEN,
            },
          )



          // Save to database
          const response = await fetch(`/api/practices/${currentPractice.id}/kv-abrechnung`, {
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

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
            throw new Error(errorData.error || `Fehler beim Speichern von ${file.name}`)
          }

          await response.json()
          results.push({ success: true, filename: file.name })
        } catch (error) {
          results.push({
            success: false,
            filename: file.name,
            error: error instanceof Error ? error.message : "Unknown error",
          })
        }
      }

      const successCount = results.filter((r) => r.success).length
      const failCount = results.filter((r) => !r.success).length

      if (failCount === 0) {
        toast({
          title: "Erfolgreich hochgeladen",
          description: `Alle ${successCount} Datei(en) wurden zu ${year} Q${quarter} hinzugefügt`,
        })
      } else {
        toast({
          title: "Upload teilweise erfolgreich",
          description: `${successCount} Datei(en) hochgeladen, ${failCount} fehlgeschlagen`,
          variant: "destructive",
        })
      }

      await fetchData()
    } catch (error) {
      console.error("[v0] ❌ Error uploading files:", error)
      toast({
        title: "Fehler",
        description: "Dateien konnten nicht hochgeladen werden",
        variant: "destructive",
      })
    } finally {
      setUploadingQuarter(null)
    }
  }

  const handleDeleteFile = async (abrechnungId: string, fileIndex: number, year: number, quarter: number) => {
    if (!currentPractice?.id) return

    if (!confirm("Möchten Sie diese Datei wirklich löschen?")) return

    try {
      const response = await fetch(
        `/api/practices/${currentPractice.id}/kv-abrechnung/${abrechnungId}/files/${fileIndex}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Löschen")
      }

      toast({
        title: "Erfolgreich gelöscht",
        description: "Datei wurde entfernt",
      })

      fetchData()
    } catch (error: any) {
      console.error("Error deleting file:", error)
      toast({
        title: "Fehler beim Löschen",
        description: error.message || "Datei konnte nicht gelöscht werden",
        variant: "destructive",
      })
    }
  }

  const handleAnalyze = async (id: string, imageUrl: string) => {
    try {
      setAnalyzingId(id)

      const response = await fetch(`/api/practices/${currentPractice?.id}/kv-abrechnung/${id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: imageUrl }),
      })

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch (e) {
          console.error("[v0] KV Abrechnung - Could not parse error JSON:", e)
          errorData = { error: `Server-Fehler (Status ${response.status})` }
        }
        console.error("[v0] KV Abrechnung - Analysis error:", errorData)
        throw new Error(errorData.error || errorData.details || "Fehler bei der Analyse")
      }

      const result = await response.json()

      toast({
        title: "Analyse abgeschlossen",
        description: "Die KV Abrechnung wurde erfolgreich analysiert",
      })

      fetchData()
    } catch (error) {
      console.error("[v0] KV Abrechnung - Error analyzing image:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Bild konnte nicht analysiert werden",
        variant: "destructive",
      })
    } finally {
      setAnalyzingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/kv-abrechnung/${id}`, {
        method: "DELETE",
      })

      // Attempt to parse JSON response for detailed errors
      let data: any = {}
      try {
        data = await response.json()
      } catch (e) {
        console.warn("[v0] Could not parse JSON response for delete operation:", e)
      }

      if (!response.ok) {
        const errorMessage = data.details || data.error || "Fehler beim Löschen"
        console.error("[v0] Delete failed:", { status: response.status, data, responseText: await response.text() })
        throw new Error(errorMessage)
      }

      toast({
        title: "Gelöscht",
        description: "KV Abrechnung wurde gelöscht",
      })

      fetchData()
    } catch (error) {
      console.error("[v0] Error deleting:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Konnte nicht gelöscht werden",
        variant: "destructive",
      })
    }
  }

  const handleSmartUpload = async (files: FileList) => {
    if (!currentPractice?.id || !currentUser?.id || files.length === 0) return

    try {
      setSmartUploadProgress({
        total: files.length,
        current: 0,
        isAnalyzing: true,
        currentFile: files[0].name,
        results: [],
      })

      const formData = new FormData()
      Array.from(files).forEach((file) => formData.append("files", file))

      const response = await fetch(`/api/practices/${currentPractice.id}/kv-abrechnung/smart-upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || "Fehler beim Upload")
      }

      const { results } = await response.json()

      const needsManualSelection = results.find((r: any) => r.needs_manual_selection && r.year && r.blob_url)

      if (needsManualSelection) {
        console.log("[v0] Smart upload - File needs manual quarter selection:", needsManualSelection.filename)

        const fileIndex = results.findIndex((r: any) => r.filename === needsManualSelection.filename)
        const originalFile = files[fileIndex]

        setManualQuarterSelection({
          file: originalFile,
          blob: { url: needsManualSelection.blob_url },
          year: needsManualSelection.year,
          index: fileIndex,
        })

        setSmartUploadProgress({
          total: files.length,
          current: files.length,
          isAnalyzing: false,
          results: results.map((r: any) => ({
            filename: r.filename,
            year: r.year,
            quarter: r.quarter,
            success: r.success,
            error: r.needs_manual_selection
              ? "⏳ Wartet auf manuelle Quartalauswahl..."
              : r.error || (r.success ? undefined : "Fehler beim Verarbeiten"),
          })),
        })

        return
      }

      setSmartUploadProgress({
        total: files.length,
        current: files.length,
        isAnalyzing: false,
        results,
      })

      const successCount = results.filter((r: any) => r.success).length
      const failCount = results.filter((r: any) => !r.success).length

      toast({
        title: "Upload abgeschlossen",
        description: `${successCount} Datei(en) erfolgreich hochgeladen${failCount > 0 ? `, ${failCount} fehlgeschlagen` : ""}`,
      })

      fetchData()
    } catch (error: any) {
      console.error("[v0] Smart upload - Error:", error)
      toast({
        title: "Fehler",
        description: error.message || "Smart Upload fehlgeschlagen",
        variant: "destructive",
      })
      setSmartUploadProgress(null)
    }
  }

  const handleFileSelection = (files: FileList) => {
    console.log("[v0] KV - File selection started, files:", files.length)
    const fileArray = Array.from(files)
    const acceptedFiles = fileArray.filter((file) => {
      const isImage = file.type.startsWith("image/")
      const isPDF = file.type === "application/pdf"
      const isDoc =
        file.type === "application/msword" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

      if (!isImage && !isPDF && !isDoc) {
        toast({
          title: "Ungültiger Dateityp",
          description: `${file.name} wird nicht unterstützt. Bitte laden Sie Bilder (JPEG, PNG, GIF, WebP), PDFs oder DOC-Dateien hoch.`,
          variant: "destructive",
        })
        return false
      }
      return true
    })
    console.log("[v0] KV - Accepted files:", acceptedFiles.length)
    setSelectedFiles((prev) => [...prev, ...acceptedFiles])
  }

  const removeSelectedFile = (index: number) => {
    console.log("[v0] KV - Removing file at index:", index)
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const startAnalysis = () => {
    console.log("[v0] KV - Starting analysis with", selectedFiles.length, "files")

    if (selectedFiles.length === 0) {
      toast({
        title: "Keine Dateien ausgewählt",
        description: "Bitte wählen Sie mindestens eine Datei aus.",
        variant: "destructive",
      })
      return
    }

    const fileList = new DataTransfer()
    selectedFiles.forEach((file) => fileList.items.add(file))
    handleSmartUpload(fileList.files)
  }

  const getQuarterData = (year: number, quarter: number) => {
    return data.find((d) => d.year === year && d.quarter === quarter)
  }

  // Use the new helper function for getting files
  const getQuarterFiles = (quarterData: KVAbrechnungData | undefined): KVFile[] => {
    // Call the updated helper function
    return getAbrechnungFiles(quarterData as KVAbrechnung | null)
  }

  const displayYears = showAllYears ? ALL_YEARS : ALL_YEARS.slice(0, DEFAULT_YEARS_COUNT)

  const handleQuarterDragOver = (e: React.DragEvent, year: number, quarter: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverQuarter({ year, quarter })
  }

  const handleQuarterDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverQuarter(null)
  }

  const handleQuarterDrop = async (e: React.DragEvent, year: number, quarter: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverQuarter(null)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleMultipleFileUpload(year, quarter, files)
    }
  }

  const saveManualSelection = async () => {
    if (!manualQuarterSelection || !selectedQuarter || !currentPractice?.id || !currentUser?.id) {
      console.log("[v0] Manual selection - Missing required data:", {
        hasManualSelection: !!manualQuarterSelection,
        selectedQuarter,
        practiceId: currentPractice?.id,
        userId: currentUser?.id,
      })
      return
    }

    try {
      const { file, blob, year } = manualQuarterSelection

      console.log(`[v0] Manual selection - Saving ${file.name} to ${year} Q${selectedQuarter}`)
      console.log(`[v0] Manual selection - Practice ID: ${currentPractice.id}`)
      console.log(`[v0] Manual selection - User ID: ${currentUser.id}`)

      const response = await fetch(`/api/practices/${currentPractice.id}/kv-abrechnung`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          year,
          quarter: selectedQuarter,
          image_url: blob.url,
          file_url: blob.url, // Ensure file_url is also set
          file_name: file.name, // Ensure file_name is set
          file_size: file.size, // Ensure file_size is set
          created_by: currentUser.id,
          extracted_data: {},
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unbekannter Fehler" }))
        console.error("[v0] Manual selection - API error:", errorData)
        throw new Error(errorData.error || "Fehler beim Speichern")
      }

      const savedData = await response.json()
      console.log("[v0] Manual selection - Saved successfully:", savedData)

      if (smartUploadProgress) {
        const updatedResults = [...smartUploadProgress.results]
        updatedResults[manualQuarterSelection.index] = {
          filename: file.name,
          year,
          quarter: selectedQuarter,
          success: true,
        }
        setSmartUploadProgress({
          ...smartUploadProgress,
          results: updatedResults,
        })

        const successCount = updatedResults.filter((r) => r.success).length
        toast({
          title: "Erfolgreich gespeichert",
          description: `${file.name} wurde zu ${year} Q${selectedQuarter} zugeordnet (${successCount}/${smartUploadProgress.total} gespeichert)`,
        })
      } else {
        toast({
          title: "Erfolgreich gespeichert",
          description: `${file.name} wurde zu ${year} Q${selectedQuarter} zugeordnet`,
        })
      }

      setManualQuarterSelection(null)
      setSelectedQuarter(null)
      fetchData()
    } catch (error: any) {
      console.error("[v0] Manual selection - Error:", error)
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Speichern",
        variant: "destructive",
      })
    }
  }

  const fetchAIInsights = async (abrechnung: KVAbrechnungData) => {
    if (!abrechnung.extracted_data) return

    setLoadingInsights(true)
    try {
      const response = await fetch("/api/kv-abrechnung/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extracted_data: abrechnung.extracted_data,
          year: abrechnung.year,
          quarter: abrechnung.quarter,
        }),
      })

      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        let errorMessage = `Server-Fehler (Status ${response.status})`

        if (contentType?.includes("application/json")) {
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorData.details || errorMessage
          } catch (e) {
            console.error("[v0] Failed to parse error JSON:", e)
          }
        } else {
          try {
            const errorText = await response.text()
            errorMessage = errorText || errorMessage
          } catch (e) {
            console.error("[v0] Failed to read error text:", e)
          }
        }

        throw new Error(errorMessage)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType?.includes("application/json")) {
        const responseText = await response.text()
        console.error("[v0] Non-JSON response:", responseText)
        throw new Error("Server hat keine JSON-Antwort zurückgegeben")
      }

      const data = await response.json()
      setAiInsights(data.insights)
    } catch (error) {
      console.error("[v0] Failed to fetch AI insights:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "KI-Analyse konnte nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setLoadingInsights(false)
    }
  }

  const handleReanalyze = async (abrechnung: KVAbrechnungData) => {
    const filesToAnalyze: string[] = []

    if (abrechnung.files && abrechnung.files.length > 0) {
      filesToAnalyze.push(...abrechnung.files.map((f) => f.url))
    } else if (abrechnung.file_url) {
      // Backward compatibility with legacy single file
      filesToAnalyze.push(abrechnung.file_url)
    }

    if (filesToAnalyze.length === 0) {
      toast({
        title: "Keine Dateien",
        description: "Keine Dateien zum Analysieren verfügbar",
        variant: "destructive",
      })
      return
    }

    setAnalyzing(true)
    try {
      console.log("[v0] Analyzing KV Abrechnung with", filesToAnalyze.length, "files:", abrechnung.id)

      const response = await fetch("/api/ai/analyze-kv-abrechnung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrls: filesToAnalyze,
          practiceId: abrechnung.practice_id,
          abrechnungId: abrechnung.id,
        }),
      })

      console.log("[v0] Analysis response status:", response.status)

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch (e) {
          console.error("[v0] Could not parse error JSON:", e)
          errorData = { error: `Server-Fehler (Status ${response.status})` }
        }
        console.error("[v0] Analysis error:", errorData)
        throw new Error(errorData.error || errorData.details || "Fehler bei der Analyse")
      }

      const result = await response.json()
      console.log("[v0] Analysis result:", result)

      toast({
        title: "Analyse abgeschlossen",
        description: `${filesToAnalyze.length} ${filesToAnalyze.length === 1 ? "Datei" : "Dateien"} erfolgreich analysiert`,
      })

      await fetchData()
      setSelectedAbrechnung({ ...abrechnung, extracted_data: result.data })
      setShowDetailedView(true)
    } catch (error) {
      console.error("[v0] Error analyzing KV Abrechnung:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Fehler bei der Analyse",
        variant: "destructive",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const openPdfPreview = (abrechnung: KVAbrechnungData) => {
    if (abrechnung.file_url) {
      setPreviewFile({ file: new File([], "preview"), url: abrechnung.file_url })
    }
  }

  const openDetailedView = (abrechnung: KVAbrechnungData) => {
    setSelectedAbrechnung(abrechnung)
    setShowDetailedView(true)
    setAiInsights(null)
    if (abrechnung.extracted_data) {
      fetchAIInsights(abrechnung)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>KV Abrechnungen</CardTitle>
              <CardDescription>
                Laden Sie Ihre KV Abrechnungen hoch und lassen Sie die Daten automatisch extrahieren
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowSmartUpload(true)}
              className="bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              KI Upload
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {displayYears.map((year) => (
              <div key={year} className="space-y-4">
                <h3 className="text-lg font-semibold">{year}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {QUARTERS.map(({ value: quarter, label }) => {
                    const quarterData = getQuarterData(year, quarter)
                    const isUploading = uploadingQuarter?.year === year && uploadingQuarter?.quarter === quarter
                    const isAnalyzing = analyzingId === quarterData?.id || analyzing // Combined with `analyzing` state
                    const isDragOver = dragOverQuarter?.year === year && dragOverQuarter?.quarter === quarter

                    return (
                      <Card
                        key={quarter}
                        className={`relative transition-colors ${isDragOver ? "border-primary bg-primary/10" : ""}`}
                        onDragOver={(e) => handleQuarterDragOver(e, year, quarter)}
                        onDragLeave={handleQuarterDragLeave}
                        onDrop={(e) => handleQuarterDrop(e, year, quarter)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{label}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          {quarterData ? (
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  {getQuarterFiles(quarterData).length} Datei(en)
                                </p>
                                {getQuarterFiles(quarterData).map((file, fileIndex) => (
                                  <div
                                    key={fileIndex}
                                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                                  >
                                    {file.url?.endsWith(".pdf") ? (
                                      <FileText className="h-5 w-5 flex-shrink-0 text-red-500" />
                                    ) : (
                                      <FileImage className="h-5 w-5 flex-shrink-0 text-blue-500" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{file.file_name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(file.uploaded_at).toLocaleDateString("de-DE", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })}
                                        {file.file_size > 0 && ` • ${(file.file_size / 1024).toFixed(0)} KB`}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setPreviewImage(file.url)}
                                        className="h-8 w-8 p-0"
                                        title="Vorschau"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteFile(quarterData.id, fileIndex, year, quarter)}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        title="Löschen"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="space-y-2 pt-2 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full bg-transparent"
                                  onClick={() => handleReanalyze(quarterData)}
                                  disabled={isAnalyzing}
                                >
                                  {isAnalyzing ? (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                      Analysiert...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                                      Analysieren
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full bg-transparent"
                                  onClick={() => openDetailedView(quarterData)}
                                >
                                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                                  Details
                                </Button>
                              </div>

                              <div className="pt-2 space-y-2 border-t">
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                  multiple
                                  id={`upload-more-${year}-${quarter}`}
                                  className="hidden"
                                  onChange={(e) => {
                                    const files = e.target.files
                                    if (files && files.length > 0) {
                                      handleMultipleFileUpload(year, quarter, files)
                                    }
                                  }}
                                />
                                <label htmlFor={`upload-more-${year}-${quarter}`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full bg-transparent"
                                    disabled={isUploading}
                                    asChild
                                  >
                                    <div className="flex items-center gap-2 cursor-pointer">
                                      <Upload className="h-4 w-4" />
                                      <span>Dateien hinzufügen</span>
                                    </div>
                                  </Button>
                                </label>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="relative"
                              onDragOver={(e) => handleQuarterDragOver(e, year, quarter)}
                              onDragLeave={handleQuarterDragLeave}
                              onDrop={(e) => handleQuarterDrop(e, year, quarter)}
                            >
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                multiple
                                id={`upload-${year}-${quarter}`}
                                className="hidden"
                                onChange={(e) => {
                                  const files = e.target.files
                                  if (files && files.length > 0) {
                                    handleMultipleFileUpload(year, quarter, files)
                                  }
                                }}
                              />

                              <label htmlFor={`upload-${year}-${quarter}`}>
                                <Button
                                  variant="outline"
                                  className="w-full h-32 bg-transparent hover:bg-muted hover:text-foreground"
                                  disabled={isUploading}
                                  asChild
                                >
                                  <div className="flex flex-col items-center gap-2 cursor-pointer">
                                    {isUploading ? (
                                      <Loader2 className="h-8 w-8 animate-spin" />
                                    ) : (
                                      <>
                                        <Upload className="h-8 w-8" />
                                        <span className="text-sm">Hochladen</span>
                                        <span className="text-xs text-muted-foreground">oder hierher ziehen</span>
                                      </>
                                    )}
                                  </div>
                                </Button>
                              </label>
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
                  {showAllYears ? (
                    <>
                      Weniger anzeigen
                      <ChevronDown className="ml-2 h-4 w-4 rotate-180" />
                    </>
                  ) : (
                    <>
                      Mehr anzeigen ({ALL_YEARS.length - DEFAULT_YEARS_COUNT} weitere Jahre)
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>KV Abrechnung Vorschau</DialogTitle>
          </DialogHeader>
          {previewImage ? (
            <div className="relative w-full h-[600px] bg-muted/10 rounded-lg overflow-hidden">
              {previewImage.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewImage || "/placeholder.svg"}
                  className="w-full h-full"
                  title="PDF Preview"
                  onError={() => {
                    console.error("[v0] KV Preview - PDF failed to load:", previewImage)
                  }}
                  onLoad={() => {
                    console.log("[v0] KV Preview - PDF loaded successfully:", previewImage)
                  }}
                />
              ) : (
                <Image
                  src={previewImage || "/placeholder.svg"}
                  alt="KV Abrechnung"
                  fill
                  className="object-contain"
                  onError={(e) => {
                    console.error("[v0] KV Preview - Image failed to load:", previewImage)
                  }}
                  onLoad={() => {
                    console.log("[v0] KV Preview - Image loaded successfully:", previewImage)
                  }}
                />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[600px] bg-muted/10 rounded-lg">
              <div className="text-center space-y-2">
                <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Keine Vorschau verfügbar</p>
                <p className="text-sm text-muted-foreground">Bild-URL fehlt oder ungültig</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={showSmartUpload}
        onOpenChange={(open) => {
          setShowSmartUpload(open)
          if (!open) {
            setSelectedFiles([])
            setSmartUploadProgress(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-droppable="true">
          <DialogHeader>
            <DialogTitle>KI-gestützter Upload</DialogTitle>
            <DialogDescription>
              Laden Sie mehrere KV Abrechnungen hoch. Die KI erkennt automatisch Jahr und Quartal.
              <span className="block mt-2 text-xs text-amber-600">
                ⚠️ Hinweis: Für die KI-Analyse werden nur Bilddateien unterstützt (JPG, PNG). PDFs können hochgeladen,
                aber nicht automatisch analysiert werden.
              </span>
            </DialogDescription>
          </DialogHeader>

          {!smartUploadProgress ? (
            <div className="space-y-4">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                multiple
                id="smart-upload-input"
                className="hidden"
                onChange={(e) => {
                  console.log("[v0] KV - File input changed")
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelection(e.target.files)
                    e.target.value = ""
                  }
                }}
              />
              <div
                data-droppable="true"
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log("[v0] KV - Files dropped")
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFileSelection(e.dataTransfer.files)
                  }
                }}
              >
                <label htmlFor="smart-upload-input">
                  <Button
                    variant="outline"
                    className="w-full h-32 border-2 border-dashed bg-white hover:bg-gray-50"
                    asChild
                  >
                    <div className="flex flex-col items-center gap-2 cursor-pointer">
                      <Upload className="h-12 w-12" />
                      <span className="text-sm font-medium">Dateien auswählen oder hierher ziehen</span>
                      <span className="text-xs text-muted-foreground">PDFs, Bilder oder DOC-Dateien</span>
                      <span className="text-xs text-amber-600">Nur Bilder können analysiert werden</span>
                    </div>
                  </Button>
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {selectedFiles.length} {selectedFiles.length === 1 ? "Datei" : "Dateien"} ausgewählt
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log("[v0] KV - Clearing all files")
                        setSelectedFiles([])
                      }}
                    >
                      Alle entfernen
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3 bg-white">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {file.type === "application/pdf" ? (
                            <FileText className="h-4 w-4 flex-shrink-0 text-red-500" />
                          ) : (
                            <FileImage className="h-4 w-4 flex-shrink-0 text-blue-500" />
                          )}
                          <p className="text-sm truncate font-medium">{file.name}</p>
                          <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSelectedFile(index)}
                          className="hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => {
                      console.log("[v0] KV - Analyse button clicked")
                      startAnalysis()
                    }}
                    className="w-full h-12 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Analyse starten ({selectedFiles.length} {selectedFiles.length === 1 ? "Datei" : "Dateien"})
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">
                    {smartUploadProgress.isAnalyzing ? "Analyse läuft..." : "Abgeschlossen"}
                  </p>
                  <p className="text-lg font-bold">
                    {Math.round((smartUploadProgress.current / smartUploadProgress.total) * 100)}%
                  </p>
                </div>
                <Progress value={(smartUploadProgress.current / smartUploadProgress.total) * 100} className="h-2" />
              </div>

              {smartUploadProgress.results.length > 0 && (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {smartUploadProgress.results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        result.success ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"
                      }`}
                    >
                      <p className="text-sm font-medium truncate">{result.filename}</p>
                      <p className="text-xs mt-1">
                        {result.success ? `✓ ${result.year} Q${result.quarter}` : `✗ ${result.error || "Fehler"}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {!smartUploadProgress.isAnalyzing && (
                <Button
                  onClick={() => {
                    setSmartUploadProgress(null)
                    setShowSmartUpload(false)
                  }}
                  className="w-full"
                >
                  Fertig
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!previewFile}
        onOpenChange={(open) => {
          if (!open && previewFile) {
            URL.revokeObjectURL(previewFile.url)
            setPreviewFile(null)
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Vorschau</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="relative w-full h-[600px]">
              {previewFile.file.type === "application/pdf" ? (
                <iframe src={previewFile.url} className="w-full h-full" title="PDF Preview" />
              ) : (
                <Image src={previewFile.url || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!manualQuarterSelection}
        onOpenChange={(open) => {
          if (!open) {
            setManualQuarterSelection(null)
            setSelectedQuarter(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quartal auswählen</DialogTitle>
            <DialogDescription>Die KI konnte das Quartal nicht automatisch erkennen.</DialogDescription>
          </DialogHeader>

          {manualQuarterSelection && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{manualQuarterSelection.file.name}</p>
                <p className="text-xs text-muted-foreground">Jahr: {manualQuarterSelection.year}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {QUARTERS.map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={selectedQuarter === value ? "default" : "outline"}
                    onClick={() => setSelectedQuarter(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    setManualQuarterSelection(null)
                    setSelectedQuarter(null)
                  }}
                >
                  Abbrechen
                </Button>
                <Button className="flex-1" onClick={saveManualSelection} disabled={!selectedQuarter}>
                  Speichern
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detailed View Sheet */}
      <Sheet open={showDetailedView} onOpenChange={setShowDetailedView}>
        <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl">KV Abrechnung Analyse</SheetTitle>
            <SheetDescription className="text-base">
              {selectedAbrechnung ? (
                <div className="flex items-center gap-3 mt-2">
                  <span className="font-semibold text-foreground">
                    {selectedAbrechnung.year} - Q{selectedAbrechnung.quarter}
                  </span>
                  {selectedAbrechnung.extracted_data && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Analysiert
                    </span>
                  )}
                </div>
              ) : (
                ""
              )}
            </SheetDescription>
          </SheetHeader>

          {selectedAbrechnung && (
            <div className="mt-6 space-y-6">
              {/* Gesamtübersicht - Prominent at top */}
              {selectedAbrechnung.extracted_data?.aggregated && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-xl flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Gesamtübersicht
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardDescription className="text-xs uppercase tracking-wide">Gesamtbetrag</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-primary">
                          {newIntl.format(selectedAbrechnung.extracted_data.aggregated.total_amount || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Abgerechneter Betrag</p>
                      </CardContent>
                    </Card>
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardDescription className="text-xs uppercase tracking-wide">Patienten</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-600">
                          {selectedAbrechnung.extracted_data.aggregated.total_patients || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Behandelte Patienten</p>
                      </CardContent>
                    </Card>
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardDescription className="text-xs uppercase tracking-wide">Fälle</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-emerald-600">
                          {selectedAbrechnung.extracted_data.aggregated.total_cases || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Behandlungsfälle</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Additional aggregated metrics if available */}
                  {selectedAbrechnung.extracted_data.aggregated.average_per_case && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <p className="text-sm text-muted-foreground">Ø pro Fall</p>
                        <p className="text-xl font-semibold mt-1">
                          {newIntl.format(selectedAbrechnung.extracted_data.aggregated.average_per_case)}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <p className="text-sm text-muted-foreground">Ø pro Patient</p>
                        <p className="text-xl font-semibold mt-1">
                          {newIntl.format(
                            selectedAbrechnung.extracted_data.aggregated.total_amount /
                              selectedAbrechnung.extracted_data.aggregated.total_patients || 0,
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* File Analyses - More detailed breakdown */}
              {selectedAbrechnung.extracted_data?.file_analyses && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Einzelne Analysen
                    <span className="text-sm font-normal text-muted-foreground">
                      ({selectedAbrechnung.extracted_data.file_analyses.length}{" "}
                      {selectedAbrechnung.extracted_data.file_analyses.length === 1 ? "Datei" : "Dateien"})
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {selectedAbrechnung.extracted_data.file_analyses.map((fileAnalysis: any, idx: number) => (
                      <Card key={idx} className="overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold">
                              Dokument {idx + 1}
                              {fileAnalysis.kv_region && (
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                  • {fileAnalysis.kv_region}
                                </span>
                              )}
                            </CardTitle>
                            {fileAnalysis.error ? (
                              <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">Fehler</span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">Erfolgreich</span>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          {fileAnalysis.error ? (
                            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded">
                              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-red-700">{fileAnalysis.error}</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {fileAnalysis.total_amount !== undefined && (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Betrag</p>
                                  <p className="text-lg font-semibold text-primary">
                                    {newIntl.format(fileAnalysis.total_amount)}
                                  </p>
                                </div>
                              )}
                              {fileAnalysis.patient_count !== undefined && (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Patienten</p>
                                  <p className="text-lg font-semibold">{fileAnalysis.patient_count}</p>
                                </div>
                              )}
                              {fileAnalysis.case_count !== undefined && (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Fälle</p>
                                  <p className="text-lg font-semibold">{fileAnalysis.case_count}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Uploaded Files Preview */}
              {selectedAbrechnung.files && selectedAbrechnung.files.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Hochgeladene Dateien
                    <span className="text-sm font-normal text-muted-foreground">
                      ({selectedAbrechnung.files.length})
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedAbrechnung.files.map((file, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-[3/4] rounded-lg overflow-hidden border-2 bg-muted/30 cursor-pointer hover:border-primary hover:shadow-md transition-all"
                        onClick={() => setPreviewFile({ file: new File([], file.file_name), url: file.url })}
                      >
                        {file.url.toLowerCase().endsWith(".pdf") ? (
                          <div className="flex flex-col items-center justify-center h-full p-4">
                            <FileText className="h-16 w-16 text-primary/60 mb-3 group-hover:text-primary transition-colors" />
                            <p className="text-xs text-center text-muted-foreground line-clamp-2 px-2">
                              {file.file_name}
                            </p>
                          </div>
                        ) : (
                          <Image
                            src={file.url || "/placeholder.svg"}
                            alt={file.file_name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* KI-Insights - improved professional card design */}
              {aiInsights && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-xl flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    KI-Insights
                  </h3>
                  <Card className="bg-gradient-to-br from-primary/5 via-purple-50/50 to-indigo-50/50 dark:from-primary/10 dark:via-purple-950/20 dark:to-indigo-950/20 border-primary/20 shadow-sm">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {aiInsights.split("\n\n").map((section, index) => {
                          const trimmed = section.trim()
                          if (!trimmed) return null

                          // Handle markdown headers
                          const h2Match = trimmed.match(/^##\s+(.+)/)
                          if (h2Match) {
                            return (
                              <h4 key={index} className="font-semibold text-base text-primary mt-4 first:mt-0">
                                {h2Match[1]}
                              </h4>
                            )
                          }

                          // Handle bullet points
                          if (trimmed.includes("- ")) {
                            const bullets = trimmed.split("\n").filter((line) => line.startsWith("- "))
                            return (
                              <ul key={index} className="space-y-2">
                                {bullets.map((bullet, i) => (
                                  <li key={i} className="flex items-start gap-3 text-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                    <span className="leading-relaxed">{bullet.slice(2)}</span>
                                  </li>
                                ))}
                              </ul>
                            )
                          }

                          return (
                            <p key={index} className="text-sm leading-relaxed">
                              {trimmed}
                            </p>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* No data message */}
              {!selectedAbrechnung.extracted_data && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Noch nicht analysiert</h4>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Diese Abrechnung wurde noch nicht analysiert. Klicken Sie auf "Analysieren", um die KI-Analyse zu
                    starten.
                  </p>
                </div>
              )}

              {/* Footer metadata */}
              <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
                <p>
                  Erstellt am:{" "}
                  {new Date(selectedAbrechnung.created_at).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {selectedAbrechnung.extracted_data && (
                  <p>
                    Analysiert am:{" "}
                    {new Date(
                      selectedAbrechnung.extracted_data.analyzed_at || selectedAbrechnung.created_at,
                    ).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default KVAbrechnungManager
