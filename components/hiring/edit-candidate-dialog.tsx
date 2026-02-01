"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { CandidateImageUpload } from "./candidate-image-upload"
import { CandidateDocumentsUpload } from "./candidate-documents-upload"
import { CandidateEventsManager, type CandidateEvent } from "./candidate-events-manager"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context" // Added useUser import
import { useTranslation } from "@/contexts/translation-context"
import { useToast } from "@/hooks/use-toast"
import { Sparkles } from "lucide-react"
import { useRouter } from "next/navigation" // Added useRouter import

interface Candidate {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  mobile: string
  date_of_birth?: string
  address?: string
  city?: string
  postal_code?: string
  current_position: string
  current_company: string
  years_of_experience: number
  education: string
  linkedin_url: string
  portfolio_url: string
  cover_letter: string
  salary_expectation: number
  weekly_hours?: number
  source: string
  notes: string
  status: string
  rating: number
  documents?: any
  image_url?: string
  first_contact_date?: string
  availability_date?: string
  events?: CandidateEvent[]
}

interface EditCandidateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidate: Candidate
  onSuccess: () => void
  onNavigateToTab?: () => void
}

export function EditCandidateDialog({
  open,
  onOpenChange,
  candidate,
  onSuccess,
  onNavigateToTab,
}: EditCandidateDialogProps) {
  const { currentPractice } = usePractice()
  const { currentUser: user } = useUser() // Added user hook
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter() // Added router hook
  const [loading, setLoading] = useState(false)
  const [jobPostings, setJobPostings] = useState<any[]>([])
  const [selectedJobPosting, setSelectedJobPosting] = useState<string>("none")
  const [originalJobPosting, setOriginalJobPosting] = useState<string>("none")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    mobile: "",
    date_of_birth: "",
    address: "",
    city: "",
    postal_code: "",
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
    rating: "",
    availability_date: "",
  })
  const [documents, setDocuments] = useState<any>({})
  const [events, setEvents] = useState<CandidateEvent[]>([])
  const [showInterviewGenerator, setShowInterviewGenerator] = useState(false)

  const formatDepartment = (department: string) => {
    if (department.toLowerCase() === "mfa") return "MFA"
    // Capitalize first letter for other departments
    return department.charAt(0).toUpperCase() + department.slice(1).toLowerCase()
  }

  const calculateHourlyRate = () => {
    const salary = Number.parseFloat(formData.salary_expectation)
    const hours = Number.parseFloat(formData.weekly_hours.replace(",", "."))

    if (salary > 0 && hours > 0) {
      // Formula: (Monthly salary * 12 months) / (Weekly hours * 52 weeks)
      const hourlyRate = (salary * 12) / (hours * 52)
      return hourlyRate.toFixed(2)
    }
    return null
  }

  const hourlyRate = calculateHourlyRate()

  useEffect(() => {
    if (open && currentPractice?.id) {
      fetchJobPostings()
      fetchCandidateApplications()
    }
  }, [open, currentPractice?.id, candidate.id])

  const fetchJobPostings = async () => {
    try {
      const response = await fetch(`/api/hiring/job-postings?practiceId=${currentPractice?.id}`)
      if (response.ok) {
        const data = await response.json()
        const validJobPostings = data.filter((job: any) => job.id && typeof job.id === "string" && job.id.trim() !== "")
        setJobPostings(validJobPostings)
      }
    } catch (error) {
      console.error("[v0] Error fetching job postings:", error)
    }
  }

  const fetchCandidateApplications = async () => {
    try {
      const response = await fetch(`/api/hiring/applications?candidateId=${candidate.id}`)
      if (response.ok) {
        const data = await response.json()
        // Get the most recent active application
        if (data.length > 0) {
          const activeApp = data.find((app: any) => app.status !== "rejected" && app.status !== "withdrawn")
          if (activeApp && activeApp.job_posting_id) {
            setSelectedJobPosting(activeApp.job_posting_id)
            setOriginalJobPosting(activeApp.job_posting_id)
            console.log("[v0] Found existing application for job posting:", activeApp.job_posting_id)
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching candidate applications:", error)
    }
  }

  useEffect(() => {
    if (candidate) {
      setFormData({
        first_name: candidate.first_name || "",
        last_name: candidate.last_name || "",
        email: candidate.email || "",
        phone: candidate.phone || "",
        mobile: candidate.mobile || "",
        date_of_birth: candidate.date_of_birth || "",
        address: candidate.address || "",
        city: candidate.city || "",
        postal_code: candidate.postal_code || "",
        first_contact_date: (candidate as any).first_contact_date || "",
        current_position: candidate.current_position || "",
        current_company: candidate.current_company || "",
        years_of_experience: candidate.years_of_experience?.toString() || "",
        education: candidate.education || "",
        portfolio_url: candidate.portfolio_url || "",
        salary_expectation: candidate.salary_expectation?.toString() || "",
        weekly_hours: candidate.weekly_hours?.toString() || "",
        source: candidate.source || "",
        notes: candidate.notes || "",
        status: candidate.status || "new",
        rating: candidate.rating?.toString() || "",
        availability_date: candidate.availability_date || "",
      })
      setDocuments(candidate.documents || {})
      setImageUrl(candidate.image_url || null)
      setEvents(candidate.events || [])
    }
  }, [candidate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    console.log("[v0] Starting candidate update submission")
    console.log("[v0] Candidate ID:", candidate.id)
    console.log("[v0] Selected job posting:", selectedJobPosting)
    console.log("[v0] Original job posting:", originalJobPosting)

    try {
      const weeklyHoursValue = formData.weekly_hours ? Number.parseFloat(formData.weekly_hours.replace(",", ".")) : null

      const payload = {
        ...formData,
        date_of_birth: formData.date_of_birth && formData.date_of_birth.trim() !== "" ? formData.date_of_birth : null,
        first_contact_date:
          formData.first_contact_date && formData.first_contact_date.trim() !== "" ? formData.first_contact_date : null,
        availability_date:
          formData.availability_date && formData.availability_date.trim() !== "" ? formData.availability_date : null,
        years_of_experience: formData.years_of_experience ? Number.parseInt(formData.years_of_experience) : null,
        salary_expectation: formData.salary_expectation ? Number.parseInt(formData.salary_expectation) : null,
        weekly_hours: weeklyHoursValue,
        rating: formData.rating ? Number.parseInt(formData.rating) : null,
        documents: documents,
        image_url: imageUrl,
        events: events,
      }

      console.log("[v0] Payload to send:", payload)

      const response = await fetch(`/api/hiring/candidates/${candidate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log("[v0] Response status:", response.status)
      const responseData = await response.json()
      console.log("[v0] Response data:", responseData)

      if (response.ok) {
        console.log("[v0] Candidate updated successfully")

        if (selectedJobPosting !== originalJobPosting) {
          console.log("[v0] Job posting changed, updating application")

          if (originalJobPosting !== "none") {
            try {
              await fetch(`/api/hiring/applications?candidateId=${candidate.id}&jobPostingId=${originalJobPosting}`, {
                method: "DELETE",
              })
              console.log("[v0] Removed old application")
            } catch (error) {
              console.error("[v0] Error removing old application:", error)
            }
          }

          if (selectedJobPosting !== "none") {
            console.log("[v0] Creating new application for job posting:", selectedJobPosting)
            const appResponse = await fetch("/api/hiring/applications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                candidate_id: candidate.id,
                job_posting_id: selectedJobPosting,
                practice_id: currentPractice?.id,
                status: "applied",
                applied_at: new Date().toISOString(),
              }),
            })

            if (appResponse.ok) {
              console.log("[v0] Application created successfully")
            } else {
              console.error("[v0] Failed to create application")
            }
          }
        } else {
          console.log("[v0] Job posting unchanged, no application update needed")
        }

        toast({
          title: "Kandidat aktualisiert",
          description: "Die Änderungen wurden erfolgreich gespeichert.",
        })

        onSuccess()
        if (onNavigateToTab) {
          onNavigateToTab()
        }
        onOpenChange(false)
      } else {
        console.error("[v0] Failed to update candidate:", responseData)
        alert(`Fehler beim Speichern: ${responseData.error || "Unbekannter Fehler"}`)
      }
    } catch (error) {
      console.error("[v0] Error updating candidate:", error)
      alert(`Fehler beim Speichern: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[104rem] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("hiring.editCandidateDialog.title", "Kandidat bearbeiten")}</DialogTitle>
          <DialogDescription>
            {t("hiring.editCandidateDialog.description", "Aktualisieren Sie die Kandidateninformationen")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="job_posting">
              {t("hiring.editCandidateDialog.addJobPosting", "Stellenausschreibung hinzufügen")}
            </Label>
            <Select value={selectedJobPosting} onValueChange={setSelectedJobPosting}>
              <SelectTrigger>
                <SelectValue
                  placeholder={t("hiring.editCandidateDialog.selectJobPosting", "Wählen Sie eine Stelle (optional)")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine</SelectItem>
                {jobPostings.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title} - {formatDepartment(job.department)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("hiring.editCandidateDialog.profileImage", "Profilbild")}</Label>
            <CandidateImageUpload
              imageUrl={imageUrl}
              onImageChange={setImageUrl}
              candidateName={`${formData.first_name} ${formData.last_name}`.trim()}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">{t("hiring.editCandidateDialog.firstName", "Vorname")} *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">{t("hiring.editCandidateDialog.lastName", "Nachname")} *</Label>
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
              <Label htmlFor="email">{t("hiring.editCandidateDialog.email", "E-Mail")}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("hiring.editCandidateDialog.phone", "Telefon")}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_birth">{t("hiring.editCandidateDialog.birthday", "Geburtsdatum")}</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">{t("hiring.editCandidateDialog.address", "Straße und Hausnummer")}</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="z.B. Hauptstraße 123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">{t("hiring.editCandidateDialog.postalCode", "PLZ")}</Label>
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
              <Label htmlFor="city">{t("hiring.editCandidateDialog.city", "Ort")}</Label>
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
                {t("hiring.editCandidateDialog.yearsOfExperience", "Berufserfahrung (Jahre)")}
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
                {t("hiring.editCandidateDialog.currentPosition", "Aktuelle Position")}
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
              {t("hiring.editCandidateDialog.currentCompany", "Aktuelles Unternehmen")}
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
                {t("hiring.editCandidateDialog.salaryExpectation", "Gehaltsvorstellung (€)")}
              </Label>
              <Input
                id="salary_expectation"
                type="number"
                value={formData.salary_expectation}
                onChange={(e) => setFormData({ ...formData, salary_expectation: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weekly_hours">{t("hiring.editCandidateDialog.weeklyHours", "Wochenstunden")}</Label>
              <Input
                id="weekly_hours"
                type="text"
                value={formData.weekly_hours}
                onChange={(e) => {
                  const value = e.target.value
                  // Allow numbers, comma, and dot
                  if (value === "" || /^[\d,.]+$/.test(value)) {
                    setFormData({ ...formData, weekly_hours: value })
                  }
                }}
                placeholder="z.B. 38,5 oder 40"
              />
            </div>
          </div>

          {hourlyRate && (
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Stundenlohn:</div>
                <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">{hourlyRate} €/Std.</div>
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Berechnet: ({formData.salary_expectation} € × 12) ÷ ({formData.weekly_hours.replace(",", ".")} Std. ×
                52)
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="rating">{t("hiring.editCandidateDialog.rating", "Bewertung (1-5)")}</Label>
            <Select value={formData.rating} onValueChange={(value) => setFormData({ ...formData, rating: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t("hiring.editCandidateDialog.ratingPlaceholder", "Bewertung")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t("hiring.editCandidateDialog.rating1", "1 Stern")}</SelectItem>
                <SelectItem value="2">{t("hiring.editCandidateDialog.rating2", "2 Sterne")}</SelectItem>
                <SelectItem value="3">{t("hiring.editCandidateDialog.rating3", "3 Sterne")}</SelectItem>
                <SelectItem value="4">{t("hiring.editCandidateDialog.rating4", "4 Sterne")}</SelectItem>
                <SelectItem value="5">{t("hiring.editCandidateDialog.rating5", "5 Sterne")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="education">
              {t("hiring.editCandidateDialog.education", "Ausbildung / Abschluss / Note")}
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
              <Label htmlFor="status">{t("hiring.editCandidateDialog.status", "Status")}</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">{t("hiring.editCandidateDialog.statusNew", "Neu")}</SelectItem>
                  <SelectItem value="screening">
                    {t("hiring.editCandidateDialog.statusScreening", "Screening")}
                  </SelectItem>
                  <SelectItem value="interviewing">
                    {t("hiring.editCandidateDialog.statusInterviewing", "Interview")}
                  </SelectItem>
                  <SelectItem value="offer">{t("hiring.editCandidateDialog.statusOffer", "Angebot")}</SelectItem>
                  <SelectItem value="hired">{t("hiring.editCandidateDialog.statusHired", "Eingestellt")}</SelectItem>
                  <SelectItem value="rejected">
                    {t("hiring.editCandidateDialog.statusRejected", "Abgelehnt")}
                  </SelectItem>
                  <SelectItem value="withdrawn">
                    {t("hiring.editCandidateDialog.statusWithdrawn", "Zurückgezogen")}
                  </SelectItem>
                  <SelectItem value="archived">{t("hiring.editCandidateDialog.statusArchived", "Archiv")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">{t("hiring.editCandidateDialog.source", "Quelle")}</Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("hiring.editCandidateDialog.selectSource", "Wählen Sie eine Quelle")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">
                    {t("hiring.editCandidateDialog.sourceDirect", "Direktbewerbung")}
                  </SelectItem>
                  <SelectItem value="website">{t("hiring.editCandidateDialog.sourceWebsite", "Website")}</SelectItem>
                  <SelectItem value="referral">
                    {t("hiring.editCandidateDialog.sourceReferral", "Empfehlung")}
                  </SelectItem>
                  <SelectItem value="other">{t("hiring.editCandidateDialog.sourceOther", "Sonstiges")}</SelectItem>
                  <SelectItem value="linkedin">{t("hiring.editCandidateDialog.sourceLinkedIn", "LinkedIn")}</SelectItem>
                  <SelectItem value="indeed">{t("hiring.editCandidateDialog.sourceIndeed", "Indeed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t("hiring.editCandidateDialog.notes", "Notizen")}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Candidate Events Section */}
          <div className="border-t pt-4 mt-4">
            <CandidateEventsManager events={events} onChange={setEvents} />
          </div>

          <div className="space-y-2">
            <Label>{t("hiring.editCandidateDialog.documents", "Dokumente")}</Label>
            <CandidateDocumentsUpload documents={documents} onDocumentsChange={setDocuments} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="first_contact_date">
              {t("hiring.editCandidateDialog.firstContactDate", "Monat / Jahr der ersten Kontaktaufnahme")}
            </Label>
            <Input
              id="first_contact_date"
              type="date"
              value={formData.first_contact_date}
              onChange={(e) => setFormData({ ...formData, first_contact_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="availability_date">
              {t("hiring.editCandidateDialog.availableFrom", "Verfügbarkeit ab")}
            </Label>
            <Input
              id="availability_date"
              type="date"
              value={formData.availability_date}
              onChange={(e) => setFormData({ ...formData, availability_date: e.target.value })}
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              onClick={() => setShowInterviewGenerator(true)}
              className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white"
            >
              <Sparkles className="h-4 w-4" />
              Interview-Fragen generieren
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("common.saving", "Saving...") : t("common.save", "Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {showInterviewGenerator && (
        <Dialog open={showInterviewGenerator} onOpenChange={setShowInterviewGenerator}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Interview-Fragen für {formData.first_name} {formData.last_name} generieren
              </DialogTitle>
              <DialogDescription>
                Die KI wird personalisierte Interview-Fragen basierend auf den Kandidaten-Daten erstellen
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {/* We'll dynamically import this to avoid circular dependencies */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">
                  Die KI verwendet folgende Kandidaten-Informationen:
                </p>
                <ul className="text-sm space-y-1">
                  {formData.first_name && (
                    <li>
                      • Name: {formData.first_name} {formData.last_name}
                    </li>
                  )}
                  {formData.current_position && <li>• Position: {formData.current_position}</li>}
                  {formData.salary_expectation && <li>• Gehaltsvorstellung: {formData.salary_expectation} €</li>}
                  {formData.weekly_hours && <li>• Wochenstunden: {formData.weekly_hours}</li>}
                  {formData.years_of_experience && <li>• Berufserfahrung: {formData.years_of_experience} Jahre</li>}
                  {formData.education && <li>• Ausbildung: {formData.education.substring(0, 100)}...</li>}
                </ul>
                <Button
                  className="mt-4 gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600"
                  onClick={() => {
                    setShowInterviewGenerator(false)
                    router.push(
                      `/hiring?tab=candidates&subtab=interview-templates&candidateName=${encodeURIComponent(`${formData.first_name} ${formData.last_name}`)}&position=${encodeURIComponent(formData.current_position || "")}&salary=${formData.salary_expectation || ""}&hours=${formData.weekly_hours || ""}`,
                    )
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                  Interview-Vorlagen öffnen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}

export default EditCandidateDialog
