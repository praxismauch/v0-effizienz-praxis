"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/contexts/translation-context"
import { CandidateImageUpload } from "./candidate-image-upload"
import { CandidateDocumentsUpload } from "./candidate-documents-upload"
import { CandidateEventsManager, type CandidateEvent } from "./candidate-events-manager"
import { useToast } from "@/hooks/use-toast"
import { Sparkles, Upload, Loader2, FileText, Check, ImageIcon, X, Eye, File } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"

interface CreateCandidateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onNavigateToTab?: () => void
}

function CreateCandidateDialog({ open, onOpenChange, onSuccess, onNavigateToTab }: CreateCandidateDialogProps) {
  const { t } = useTranslation()
  const { currentPractice } = usePractice()
  const { currentUser } = useUser()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [aiExtracting, setAiExtracting] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<Array<{ file: File; previewUrl: string; uploadedUrl?: string }>>([])
  const [imageUploadProgress, setImageUploadProgress] = useState<number>(0)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [activeUploadTab, setActiveUploadTab] = useState<string>("documents")
  const [documents, setDocuments] = useState<any>({})
  const [candidateId, setCandidateId] = useState<string | null>(null)
  const [jobPostings, setJobPostings] = useState<any[]>([])
  const [selectedJobPostingId, setSelectedJobPostingId] = useState<string>("none")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [firstStage, setFirstStage] = useState<string | null>(null)
  const [events, setEvents] = useState<CandidateEvent[]>([])
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    mobile: "",
    address: "",
    city: "",
    postal_code: "",
    date_of_birth: "",
    first_contact_date: "",
    current_position: "",
    current_company: "",
    years_of_experience: "",
    education: "",
    portfolio_url: "",
    salary_expectation: "",
    weekly_hours: "",
    source: "",
    notes: "",
    status: "new",
  })

  useEffect(() => {
    if (open && currentPractice?.id) {
      fetchJobPostings()
    }
  }, [open, currentPractice?.id])

  useEffect(() => {
    if (selectedJobPostingId !== "none" && currentPractice?.id) {
      fetchFirstStage()
    }
  }, [selectedJobPostingId, currentPractice?.id])

  const fetchJobPostings = async () => {
    try {
      const response = await fetch(`/api/hiring/job-postings?practiceId=${currentPractice?.id}`)
      if (response.ok) {
        const data = await response.json()
        const validJobPostings = data.filter((job: any) => job.id && typeof job.id === "string" && job.id.trim() !== "")
        setJobPostings(validJobPostings)
      }
    } catch (error) {
      console.error("Error fetching job postings:", error)
    }
  }

  const fetchFirstStage = async () => {
    try {
      const response = await fetch(
        `/api/hiring/pipeline-stages?practiceId=${currentPractice?.id}&jobPostingId=${selectedJobPostingId}`,
      )
      if (response.ok) {
        const stages = await response.json()
        if (stages.length > 0) {
          const sortedStages = stages.sort((a: any, b: any) => a.stage_order - b.stage_order)
          setFirstStage(sortedStages[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching pipeline stages:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const weeklyHoursValue = formData.weekly_hours ? Number.parseFloat(formData.weekly_hours.replace(",", ".")) : null

      const response = await fetch("/api/hiring/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          practice_id: currentPractice?.id,
          created_by: currentUser?.id,
          years_of_experience: formData.years_of_experience ? Number.parseInt(formData.years_of_experience) : null,
          salary_expectation: formData.salary_expectation ? Number.parseInt(formData.salary_expectation) : null,
          weekly_hours: weeklyHoursValue,
          documents: documents,
          image_url: imageUrl,
          events: events,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unbekannter Fehler" }))
        toast({
          title: "Fehler beim Erstellen",
          description: errorData.error || "Kandidat konnte nicht erstellt werden.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const newCandidate = await response.json()
      setCandidateId(newCandidate.id)

      if (selectedJobPostingId !== "none") {
        const appResponse = await fetch("/api/hiring/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidate_id: newCandidate.id,
            job_posting_id: selectedJobPostingId,
            practice_id: currentPractice?.id,
            status: "applied",
            stage: firstStage,
            applied_at: new Date().toISOString(),
          }),
        })

        if (!appResponse.ok) {
          console.error("Error creating application for candidate")
        }
      }

      // Show success state briefly
      setSuccess(true)
      toast({
        title: "Kandidat erstellt",
        description: "Der neue Kandidat wurde erfolgreich hinzugefügt.",
      })

      // Wait for success animation before closing
      setTimeout(() => {
        onSuccess()
        if (onNavigateToTab) {
          onNavigateToTab()
        }
        onOpenChange(false)
        setSuccess(false)
      }, 800)
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        mobile: "",
        address: "",
        city: "",
        postal_code: "",
        date_of_birth: "",
        first_contact_date: "",
        current_position: "",
        current_company: "",
        years_of_experience: "",
        education: "",
        portfolio_url: "",
        salary_expectation: "",
        weekly_hours: "",
        source: "",
        notes: "",
        status: "new",
      })
      setDocuments({})
      setCandidateId(null)
      setSelectedJobPostingId("none")
      setImageUrl(null)
      setEvents([])
      // Clean up image previews and reset state
      uploadedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl))
      setUploadedImages([])
      setUploadedFiles([])
      setActiveUploadTab("documents")
    } catch (error) {
      console.error("Error creating candidate:", error)
      toast({
        title: "Netzwerkfehler",
        description: "Verbindung zum Server fehlgeschlagen. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleJobPostingChange = (value: string) => {
    setSelectedJobPostingId(value)
  }

  const isDocDuplicate = (file: File) => {
    return uploadedFiles.some((f) => f.name === file.name && f.size === file.size)
  }

  const isImageDuplicate = (file: File) => {
    return uploadedImages.some((img) => img.file.name === file.name && img.file.size === file.size)
  }

  const processFilesForAI = async (files: File[]) => {
    if (files.length === 0) return

    const newFiles = files.filter((f) => !isDocDuplicate(f))
    const skippedCount = files.length - newFiles.length

    if (skippedCount > 0) {
      toast({
        title: "Duplikate erkannt",
        description: `${skippedCount} Dokument(e) bereits vorhanden und uebersprungen.`,
      })
    }

    if (newFiles.length === 0) return

    setUploadedFiles((prev) => [...prev, ...newFiles])
    setAiExtracting(true)

    try {
      const formDataUpload = new FormData()
      newFiles.forEach((file) => {
        formDataUpload.append("files", file)
      })
      formDataUpload.append("practiceId", currentPractice?.id || "")

      const response = await fetch("/api/hiring/ai-extract-candidate", {
        method: "POST",
        body: formDataUpload,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        toast({
          title: "Fehler bei der KI-Analyse",
          description: errorData.error || "Unbekannter Fehler",
          variant: "destructive",
        })
        setAiExtracting(false)
        return
      }

      const extracted = await response.json()

      if (extracted.error) {
        toast({
          title: "KI-Analyse Fehler",
          description: extracted.error,
          variant: "destructive",
        })
        setAiExtracting(false)
        return
      }

      const getValidValue = (value: any, fallback: string): string => {
        if (value === null || value === undefined || value === "null" || value === "NULL" || value === "") {
          return fallback
        }
        return String(value)
      }

      setFormData({
        first_name: getValidValue(extracted.first_name, formData.first_name),
        last_name: getValidValue(extracted.last_name, formData.last_name),
        email: getValidValue(extracted.email, formData.email),
        phone: getValidValue(extracted.phone, formData.phone),
        mobile: getValidValue(extracted.mobile, formData.mobile),
        address: getValidValue(extracted.address, formData.address),
        city: getValidValue(extracted.city, formData.city),
        postal_code: getValidValue(extracted.postal_code, formData.postal_code),
        date_of_birth: getValidValue(extracted.date_of_birth, formData.date_of_birth),
        first_contact_date: formData.first_contact_date,
        current_position: getValidValue(extracted.current_position, formData.current_position),
        current_company: getValidValue(extracted.current_company, formData.current_company),
        years_of_experience: getValidValue(extracted.years_of_experience, formData.years_of_experience),
        education: getValidValue(extracted.education, formData.education),
        portfolio_url: getValidValue(extracted.portfolio_url, formData.portfolio_url),
        salary_expectation: getValidValue(extracted.salary_expectation, formData.salary_expectation),
        weekly_hours: getValidValue(extracted.weekly_hours, formData.weekly_hours),
        source: getValidValue(extracted.source, formData.source),
        notes: getValidValue(extracted.notes, formData.notes),
        status: "new",
      })

      if (extracted.documents) {
        setDocuments(extracted.documents)
      }

      toast({
        title: "KI-Analyse abgeschlossen",
        description: `${newFiles.length} Dokument(e) erfolgreich analysiert.`,
      })
    } catch (error) {
      console.error("Error extracting with AI:", error)
      toast({
        title: "Fehler",
        description: "Ein Fehler ist bei der KI-Extraktion aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setAiExtracting(false)
    }
  }

  const handleAIFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    await processFilesForAI(files)
  }

  const handleUnifiedFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const allFiles = Array.from(e.target.files || [])
    const docFiles = allFiles.filter((file) => {
      const ext = file.name.toLowerCase()
      return ext.endsWith(".pdf") || ext.endsWith(".doc") || ext.endsWith(".docx") || ext.endsWith(".txt")
    })
    const imageFiles = allFiles.filter((file) => file.type.startsWith("image/"))
    
    if (docFiles.length > 0) await processFilesForAI(docFiles)
    if (imageFiles.length > 0) await processImageFiles(imageFiles)
    e.target.value = ""
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const allFiles = Array.from(e.dataTransfer.files)
    
    const docFiles = allFiles.filter((file) => {
      const ext = file.name.toLowerCase()
      return ext.endsWith(".pdf") || ext.endsWith(".doc") || ext.endsWith(".docx") || ext.endsWith(".txt")
    })
    
    const imageFiles = allFiles.filter((file) => {
      return file.type.startsWith("image/")
    })

    if (docFiles.length === 0 && imageFiles.length === 0) {
      toast({
        title: "Ungueltige Dateien",
        description: "Bitte laden Sie Dokumente (PDF, DOC, DOCX, TXT) oder Bilder (JPEG, PNG, GIF) hoch.",
        variant: "destructive",
      })
      return
    }

    if (docFiles.length > 0) await processFilesForAI(docFiles)
    if (imageFiles.length > 0) await processImageFiles(imageFiles)
  }

  // Image upload handling
  const validateImageFile = (file: File): boolean => {
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/jpg"]
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Ungültiges Bildformat",
        description: `${file.name}: Nur JPEG, PNG und GIF werden unterstützt.`,
        variant: "destructive",
      })
      return false
    }
    
    if (file.size > maxSize) {
      toast({
        title: "Datei zu groß",
        description: `${file.name}: Maximale Dateigröße ist 10MB.`,
        variant: "destructive",
      })
      return false
    }
    
    return true
  }

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    await processImageFiles(files)
    // Reset the input so the same file can be selected again
    e.target.value = ""
  }

  const processImageFiles = async (files: File[]) => {
    const validFiles = files.filter(validateImageFile)
    if (validFiles.length === 0) return

    const uniqueFiles = validFiles.filter((f) => !isImageDuplicate(f))
    const skippedImgCount = validFiles.length - uniqueFiles.length

    if (skippedImgCount > 0) {
      toast({
        title: "Duplikate erkannt",
        description: `${skippedImgCount} Bild(er) bereits vorhanden und uebersprungen.`,
      })
    }

    if (uniqueFiles.length === 0) return

    // Create preview URLs and add to state
    const newImages = uniqueFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      uploadedUrl: undefined,
    }))

    setUploadedImages((prev) => [...prev, ...newImages])
    
    // Upload each image
    setIsUploadingImages(true)
    setImageUploadProgress(0)
    
    const { compressImageIfLarge } = await import("@/lib/image-compression")
    for (let i = 0; i < uniqueFiles.length; i++) {
      try {
        const processedFile = uniqueFiles[i].type.startsWith("image/") ? await compressImageIfLarge(uniqueFiles[i]) : uniqueFiles[i]
        const formData = new FormData()
        formData.append("file", processedFile)
        
        const response = await fetch("/api/hiring/candidates/upload-document", {
          method: "POST",
          body: formData,
        })
        
        if (response.ok) {
          const { url } = await response.json()
          
          // Update the uploaded URL for this image
          setUploadedImages((prev) =>
            prev.map((img) =>
              img.file === uniqueFiles[i] ? { ...img, uploadedUrl: url } : img
            )
          )
          
          // Add to documents under a new "bilder" category
          setDocuments((prev: any) => ({
            ...prev,
            bilder: [
              ...(prev.bilder || []),
              {
                name: uniqueFiles[i].name,
                url,
                size: uniqueFiles[i].size,
                type: uniqueFiles[i].type,
              },
            ],
          }))
        }
        
        setImageUploadProgress(Math.round(((i + 1) / uniqueFiles.length) * 100))
      } catch (error) {
        console.error("Error uploading image:", error)
        toast({
          title: "Upload fehlgeschlagen",
          description: `${uniqueFiles[i].name} konnte nicht hochgeladen werden.`,
          variant: "destructive",
        })
      }
    }
    
    setIsUploadingImages(false)
    setImageUploadProgress(0)
    
    if (uniqueFiles.length > 0) {
      toast({
        title: "Bilder hochgeladen",
        description: `${uniqueFiles.length} Bild(er) erfolgreich hochgeladen.`,
      })
    }
  }

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleImageDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    )

    if (files.length === 0) {
      toast({
        title: "Keine Bilder gefunden",
        description: "Bitte laden Sie Bilddateien hoch (JPEG, PNG, GIF).",
        variant: "destructive",
      })
      return
    }

    await processImageFiles(files)
  }

  const removeImage = (index: number) => {
    const imageToRemove = uploadedImages[index]
    
    // Revoke the preview URL to free memory
    URL.revokeObjectURL(imageToRemove.previewUrl)
    
    // Remove from uploadedImages
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
    
    // Remove from documents if it was uploaded
    if (imageToRemove.uploadedUrl) {
      setDocuments((prev: any) => ({
        ...prev,
        bilder: (prev.bilder || []).filter(
          (img: any) => img.url !== imageToRemove.uploadedUrl
        ),
      }))
    }
  }

  const openImagePreview = (previewUrl: string) => {
    window.open(previewUrl, "_blank")
  }

  const extractAllInformation = async () => {
    // Collect all files (documents and images)
    const allFiles: File[] = []
    
    // Add document files
    if (uploadedFiles.length > 0) {
      allFiles.push(...uploadedFiles)
    }
    
    // Add image files
    if (uploadedImages.length > 0) {
      uploadedImages.forEach((img) => {
        if (img.file) {
          allFiles.push(img.file)
        }
      })
    }

    if (allFiles.length === 0) {
      toast({
        title: "Keine Dateien vorhanden",
        description: "Bitte laden Sie zuerst Dokumente oder Bilder hoch.",
        variant: "destructive",
      })
      return
    }

    setAiExtracting(true)

    try {
      const formDataUpload = new FormData()
      allFiles.forEach((file) => {
        formDataUpload.append("files", file)
      })
      formDataUpload.append("practiceId", currentPractice?.id || "")

      const response = await fetch("/api/hiring/ai-extract-candidate", {
        method: "POST",
        body: formDataUpload,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        toast({
          title: "Fehler bei der KI-Analyse",
          description: errorData.error || "Unbekannter Fehler",
          variant: "destructive",
        })
        setAiExtracting(false)
        return
      }

      const extracted = await response.json()

      if (extracted.error) {
        toast({
          title: "KI-Analyse Fehler",
          description: extracted.error,
          variant: "destructive",
        })
        setAiExtracting(false)
        return
      }

      const getValidValue = (value: any, fallback: string): string => {
        if (value === null || value === undefined || value === "null" || value === "NULL" || value === "") {
          return fallback
        }
        return String(value)
      }

      setFormData({
        first_name: getValidValue(extracted.first_name, formData.first_name),
        last_name: getValidValue(extracted.last_name, formData.last_name),
        email: getValidValue(extracted.email, formData.email),
        phone: getValidValue(extracted.phone, formData.phone),
        mobile: getValidValue(extracted.mobile, formData.mobile),
        address: getValidValue(extracted.address, formData.address),
        city: getValidValue(extracted.city, formData.city),
        postal_code: getValidValue(extracted.postal_code, formData.postal_code),
        date_of_birth: getValidValue(extracted.date_of_birth, formData.date_of_birth),
        first_contact_date: formData.first_contact_date,
        current_position: getValidValue(extracted.current_position, formData.current_position),
        current_company: getValidValue(extracted.current_company, formData.current_company),
        years_of_experience: getValidValue(extracted.years_of_experience, formData.years_of_experience),
        education: getValidValue(extracted.education, formData.education),
        portfolio_url: getValidValue(extracted.portfolio_url, formData.portfolio_url),
        salary_expectation: getValidValue(extracted.salary_expectation, formData.salary_expectation),
        weekly_hours: getValidValue(extracted.weekly_hours, formData.weekly_hours),
        source: getValidValue(extracted.source, formData.source),
        notes: getValidValue(extracted.notes, formData.notes),
        status: "new",
      })

      if (extracted.documents) {
        setDocuments((prev: any) => ({
          ...prev,
          ...extracted.documents,
        }))
      }

      const docCount = uploadedFiles.length
      const imgCount = uploadedImages.length
      const totalCount = docCount + imgCount

      toast({
        title: "KI-Analyse abgeschlossen",
        description: `${totalCount} Datei(en) erfolgreich analysiert (${docCount} Dokumente, ${imgCount} Bilder). Formular wurde ausgefüllt.`,
      })
    } catch (error) {
      console.error("Error extracting with AI:", error)
      toast({
        title: "Fehler",
        description: "Ein Fehler ist bei der KI-Extraktion aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setAiExtracting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("hiring.createCandidateDialog.title", "Neuer Kandidat")}</DialogTitle>
          <DialogDescription>
            {t("hiring.createCandidateDialog.description", "Fügen Sie einen neuen Kandidaten zum System hinzu")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card
            className={`p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-2 transition-all duration-200 ${
              isDragging
                ? "border-purple-500 bg-purple-100/50 dark:bg-purple-900/30 scale-[1.01]"
                : "border-purple-200 dark:border-purple-800"
            } ${aiExtracting || isUploadingImages ? "pointer-events-none opacity-75" : ""}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">KI-Dokumentenanalyse & Medien-Upload</h3>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
              Laden Sie Dokumente und Bilder hoch - das System erkennt den Dateityp automatisch und verarbeitet alles für Sie.
            </p>

            {/* Extraction Button - Always visible when files are uploaded */}
            {(uploadedFiles.length > 0 || uploadedImages.length > 0) && (
              <div className="mb-4 p-4 bg-purple-100 dark:bg-purple-900/40 rounded-lg border border-purple-300 dark:border-purple-700">
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                      {uploadedFiles.length + uploadedImages.length} Datei(en) bereit zur Analyse
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      Klicken Sie auf den Button, um alle Informationen zu extrahieren und das Formular auszufüllen.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    size="default"
                    onClick={() => extractAllInformation()}
                    disabled={aiExtracting || isUploadingImages}
                    className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                  >
                    {aiExtracting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Extrahiere...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Alle Informationen extrahieren
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Unified drop zone for documents and images */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                isDragging
                  ? "border-purple-500 bg-purple-100 dark:bg-purple-900/40"
                  : "border-purple-300 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-600"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {aiExtracting || isUploadingImages ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="relative">
                    <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
                    <Sparkles className="h-4 w-4 text-purple-400 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      {aiExtracting ? "KI analysiert Dateien..." : "Dateien werden hochgeladen..."}
                    </span>
                    {isUploadingImages && (
                      <Progress value={imageUploadProgress} className="h-2 max-w-xs mx-auto" />
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/40">
                    <Upload className={`h-8 w-8 ${isDragging ? "text-purple-600" : "text-purple-400"}`} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      Dateien hierher ziehen
                    </p>
                    <p className="text-xs text-purple-500 dark:text-purple-400">
                      oder klicken zum Auswählen
                    </p>
                  </div>
                  <Input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,image/jpeg,image/png,image/gif,image/jpg"
                    onChange={handleUnifiedFileUpload}
                    disabled={aiExtracting || isUploadingImages}
                    className="hidden"
                    id="unified-file-upload"
                  />
                  <Label htmlFor="unified-file-upload" className="cursor-pointer">
                    <Button type="button" variant="secondary" size="sm" disabled={aiExtracting || isUploadingImages} asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Dateien auswählen
                      </span>
                    </Button>
                  </Label>
                  <span className="text-xs text-purple-500 dark:text-purple-400">
                    PDF, DOC, DOCX, TXT, JPEG, PNG oder GIF
                  </span>
                </div>
              )}
            </div>

            {/* Uploaded documents list */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  Dokumente ({uploadedFiles.length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-md text-xs border border-purple-200 dark:border-purple-800"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Uploaded images grid */}
            {uploadedImages.length > 0 && (
              <div className="mt-4 space-y-3">
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  Bilder ({uploadedImages.length}):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {uploadedImages.map((image, index) => (
                    <div
                      key={index}
                      className="relative group rounded-lg overflow-hidden border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20"
                    >
                      <div className="aspect-square">
                        <img
                          src={image.previewUrl}
                          alt={image.file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute top-2 left-2">
                        {image.uploadedUrl ? (
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white">
                            <Check className="h-3 w-3" />
                          </span>
                        ) : (
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500">
                            <Loader2 className="h-3 w-3 text-white animate-spin" />
                          </span>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openImagePreview(image.previewUrl)}
                          title="Vorschau"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeImage(index)}
                          title="Entfernen"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/70 to-transparent">
                        <p className="text-xs text-white truncate" title={image.file.name}>
                          {image.file.name}
                        </p>
                        <p className="text-[10px] text-white/70">
                          {(image.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <div className="space-y-2">
            <Label>{t("hiring.createCandidateDialog.profileImage", "Profilbild")}</Label>
            <CandidateImageUpload
              imageUrl={imageUrl}
              onImageChange={setImageUrl}
              candidateName={`${formData.first_name} ${formData.last_name}`.trim()}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job_posting">
                {t("hiring.createCandidateDialog.jobPosting", "Stellenausschreibung")}
              </Label>
              <Select value={selectedJobPostingId} onValueChange={handleJobPostingChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Keine Stelle zuweisen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine</SelectItem>
                  {jobPostings.map((posting) => (
                    <SelectItem key={posting.id} value={posting.id}>
                      {posting.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="first_contact_date">
                {t("hiring.createCandidateDialog.firstContactDate", "Datum der ersten Kontaktaufnahme")}
              </Label>
              <Input
                id="first_contact_date"
                type="date"
                value={formData.first_contact_date}
                onChange={(e) => setFormData({ ...formData, first_contact_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">{t("hiring.createCandidateDialog.firstName", "Vorname *")}</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">{t("hiring.createCandidateDialog.lastName", "Nachname *")}</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("hiring.createCandidateDialog.email", "E-Mail")}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("hiring.createCandidateDialog.phone", "Telefon")}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_birth">{t("hiring.createCandidateDialog.birthday", "Geburtsdatum")}</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">{t("hiring.createCandidateDialog.address", "Straße und Hausnummer")}</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="z.B. Hauptstraße 123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">{t("hiring.createCandidateDialog.postalCode", "PLZ")}</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="z.B. 12345"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">{t("hiring.createCandidateDialog.city", "Ort")}</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="z.B. Berlin"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="years_of_experience">
                {t("hiring.createCandidateDialog.yearsOfExperience", "Berufserfahrung (Jahre)")}
              </Label>
              <Input
                id="years_of_experience"
                type="number"
                value={formData.years_of_experience}
                onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_position">
                {t("hiring.createCandidateDialog.currentPosition", "Aktuelle Position")}
              </Label>
              <Textarea
                id="current_position"
                value={formData.current_position}
                onChange={(e) => setFormData({ ...formData, current_position: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_company">
              {t("hiring.createCandidateDialog.currentCompany", "Aktuelles Unternehmen")}
            </Label>
            <Input
              id="current_company"
              value={formData.current_company}
              onChange={(e) => setFormData({ ...formData, current_company: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary_expectation">
                {t("hiring.createCandidateDialog.salaryExpectation", "Gehaltsvorstellung (€)")}
              </Label>
              <Input
                id="salary_expectation"
                type="number"
                value={formData.salary_expectation}
                onChange={(e) => setFormData({ ...formData, salary_expectation: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weekly_hours">{t("hiring.createCandidateDialog.weeklyHours", "Wochenstunden")}</Label>
              <Input
                id="weekly_hours"
                type="text"
                value={formData.weekly_hours}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === "" || /^[\d,.]+$/.test(value)) {
                    setFormData({ ...formData, weekly_hours: value })
                  }
                }}
                placeholder="z.B. 38,5 oder 40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="education">
              {t("hiring.createCandidateDialog.education", "Ausbildung / Abschluss / Note")}
            </Label>
            <Textarea
              id="education"
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">{t("hiring.createCandidateDialog.status", "Status")}</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">{t("hiring.createCandidateDialog.statusNew", "Neu")}</SelectItem>
                  <SelectItem value="screening">
                    {t("hiring.createCandidateDialog.statusScreening", "Screening")}
                  </SelectItem>
                  <SelectItem value="interviewing">
                    {t("hiring.createCandidateDialog.statusInterviewing", "Interview")}
                  </SelectItem>
                  <SelectItem value="offer">{t("hiring.createCandidateDialog.statusOffer", "Angebot")}</SelectItem>
                  <SelectItem value="hired">{t("hiring.createCandidateDialog.statusHired", "Eingestellt")}</SelectItem>
                  <SelectItem value="rejected">
                    {t("hiring.createCandidateDialog.statusRejected", "Abgelehnt")}
                  </SelectItem>
                  <SelectItem value="withdrawn">
                    {t("hiring.createCandidateDialog.statusWithdrawn", "Zurückgezogen")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">{t("hiring.createCandidateDialog.source", "Quelle")}</Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("hiring.createCandidateDialog.selectSource", "Wählen Sie eine Quelle")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">{t("hiring.createCandidateDialog.direct", "Direktbewerbung")}</SelectItem>
                  <SelectItem value="website">{t("hiring.createCandidateDialog.website", "Website")}</SelectItem>
                  <SelectItem value="referral">{t("hiring.createCandidateDialog.referral", "Empfehlung")}</SelectItem>
                  <SelectItem value="other">{t("hiring.createCandidateDialog.other", "Sonstiges")}</SelectItem>
                  <SelectItem value="linkedin">{t("hiring.createCandidateDialog.linkedin", "LinkedIn")}</SelectItem>
                  <SelectItem value="indeed">{t("hiring.createCandidateDialog.indeed", "Indeed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("hiring.createCandidateDialog.documents", "Dokumente")}</Label>
            <CandidateDocumentsUpload documents={documents} onDocumentsChange={setDocuments} />
          </div>

          {/* Termine & Ereignisse */}
          <div className="border rounded-lg p-4">
            <CandidateEventsManager
              events={events}
              onChange={setEvents}
              candidateName={`${formData.first_name} ${formData.last_name}`.trim()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t("hiring.createCandidateDialog.notes", "Notizen")}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading || success}>
              {t("common.cancel", "Abbrechen")}
            </Button>
            <Button
              type="submit"
              disabled={loading || success}
              className={success ? "bg-green-600 hover:bg-green-600" : ""}
            >
              {success ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {t("common.created", "Erstellt")}
                </>
              ) : loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.creating", "Erstelle...")}
                </>
              ) : (
                t("common.create", "Erstellen")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { CreateCandidateDialog }
export default CreateCandidateDialog
