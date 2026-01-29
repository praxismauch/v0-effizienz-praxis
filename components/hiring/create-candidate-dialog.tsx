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
import { useToast } from "@/hooks/use-toast"
import { Sparkles, Upload, Loader2, FileText, Check } from "lucide-react"
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
  const [documents, setDocuments] = useState<any>({})
  const [candidateId, setCandidateId] = useState<string | null>(null)
  const [jobPostings, setJobPostings] = useState<any[]>([])
  const [selectedJobPostingId, setSelectedJobPostingId] = useState<string>("none")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [firstStage, setFirstStage] = useState<string | null>(null)
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

  const processFilesForAI = async (files: File[]) => {
    if (files.length === 0) return

    setUploadedFiles((prev) => [...prev, ...files])
    setAiExtracting(true)

    try {
      const formDataUpload = new FormData()
      files.forEach((file) => {
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
        description: `${files.length} Dokument(e) erfolgreich analysiert.`,
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

    const files = Array.from(e.dataTransfer.files).filter((file) => {
      const ext = file.name.toLowerCase()
      return ext.endsWith(".pdf") || ext.endsWith(".doc") || ext.endsWith(".docx") || ext.endsWith(".txt")
    })

    if (files.length === 0) {
      toast({
        title: "Ungültige Dateien",
        description: "Bitte laden Sie PDF, DOC, DOCX oder TXT Dateien hoch.",
        variant: "destructive",
      })
      return
    }

    await processFilesForAI(files)
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
            } ${aiExtracting ? "pointer-events-none opacity-75" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100">KI-Dokumentenanalyse</h3>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                  Laden Sie Lebensläufe, Anschreiben oder andere Dokumente hoch. Die KI extrahiert automatisch alle
                  Informationen und füllt das Formular aus.
                </p>

                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 ${
                    isDragging
                      ? "border-purple-500 bg-purple-100 dark:bg-purple-900/40"
                      : "border-purple-300 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-600"
                  }`}
                >
                  {aiExtracting ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        KI analysiert Dokumente...
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center gap-2">
                        <Upload className={`h-8 w-8 ${isDragging ? "text-purple-600" : "text-purple-400"}`} />
                        <div className="text-sm text-purple-700 dark:text-purple-300">
                          <span className="font-medium">Dateien hierher ziehen</span>
                          <span className="text-purple-500 dark:text-purple-400"> oder </span>
                        </div>
                        <Input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleAIFileUpload}
                          disabled={aiExtracting}
                          className="hidden"
                          id="ai-file-upload"
                        />
                        <Label htmlFor="ai-file-upload" className="cursor-pointer">
                          <Button type="button" variant="secondary" size="sm" disabled={aiExtracting} asChild>
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              Dokumente auswählen
                            </span>
                          </Button>
                        </Label>
                        <span className="text-xs text-purple-500 dark:text-purple-400">
                          PDF, DOC, DOCX oder TXT (mehrere Dateien möglich)
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                      Hochgeladene Dateien ({uploadedFiles.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {uploadedFiles.map((file, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded text-xs"
                        >
                          <FileText className="h-3 w-3" />
                          {file.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
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
