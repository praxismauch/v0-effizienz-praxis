"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePractice } from "@/contexts/practice-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  Briefcase,
  Mail,
  Phone,
  FileText,
  Archive,
  StickyNote,
  Sparkles,
  MoreVertical,
  Eye,
} from "lucide-react"
import { defaultPipelineStages } from "@/lib/recruiting-defaults"
import { useToast } from "@/hooks/use-toast"
import { AICandidateAnalysisDialog } from "./ai-candidate-analysis-dialog"

interface Application {
  id: string
  status: string
  stage: string
  applied_at: string
  candidate: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    date_of_birth?: string // Added date_of_birth field
    current_position: string
    rating: number
    image_url?: string
    documents?: Array<{ name: string; url: string; size?: number; uploadedAt?: string }>
    notes?: string
    salary_expectation?: number // Added salary_expectation field
    weekly_hours?: number // Added weekly_hours field
  }
  job_posting: {
    id: string
    title: string
    department: string
  }
}

interface JobPosting {
  id: string
  title: string
}

interface PipelineStage {
  id: string
  name: string
  color: string
  stage_order: number
  job_posting_id: string
  applications: Application[]
}

export function HiringPipeline() {
  const router = useRouter()
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const [applications, setApplications] = useState<Application[]>([])
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [selectedJobPostingId, setSelectedJobPostingId] = useState<string>("alle")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draggedApplicationId, setDraggedApplicationId] = useState<string | null>(null)
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [candidateToArchive, setCandidateToArchive] = useState<{ id: string; name: string } | null>(null)
  const [pendingMove, setPendingMove] = useState<{ candidateId: string; newStage: string } | null>(null)
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)

  useEffect(() => {
    if (currentPractice?.id) {
      loadJobPostings()
    }
  }, [currentPractice?.id])

  useEffect(() => {
    if (currentPractice?.id && (selectedJobPostingId || selectedJobPostingId === "alle")) {
      if (selectedJobPostingId === "alle") {
        loadAllCandidates()
      } else {
        loadPipelineStages()
        loadApplications()
      }
    }
  }, [selectedJobPostingId, currentPractice?.id])

  useEffect(() => {
    if (!currentPractice?.id) return
    if (!selectedJobPostingId && selectedJobPostingId !== "alle") return

    const interval = setInterval(() => {
      if (selectedJobPostingId === "alle") {
        loadAllCandidates()
      } else {
        loadApplications()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [selectedJobPostingId, currentPractice?.id])

  const loadJobPostings = async () => {
    try {
      setLoading(true)
      setError(null)
      const url = `/api/hiring/job-postings?practiceId=${currentPractice?.id}`

      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        setJobPostings(data)
        if (data.length === 0) {
          setLoading(false)
        }
      } else if (response.status === 401) {
        setError("Bitte melden Sie sich an, um fortzufahren.")
        setLoading(false)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error("Error loading job postings:", error)
      setLoading(false)
    }
  }

  const loadPipelineStages = async () => {
    try {
      const url = `/api/hiring/pipeline-stages?practiceId=${currentPractice?.id}&jobPostingId=${selectedJobPostingId}`

      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        setStages(data)
      }
    } catch (error) {
      console.error("Error loading pipeline stages:", error)
    }
  }

  const loadApplications = async () => {
    try {
      setLoading(true)
      const url = `/api/hiring/applications?practiceId=${currentPractice?.id}&jobPostingId=${selectedJobPostingId}`

      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      }
    } catch (error) {
      console.error("Error loading applications:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadAllCandidates = async () => {
    try {
      setLoading(true)
      const url = `/api/hiring/candidates?practiceId=${currentPractice?.id}`

      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()

        const statusToStageMap: Record<string, string> = {
          new: "Bewerbung eingegangen",
          contacted: "Bewerbung eingegangen",
          first_interview: "Erstgespräch",
          trial_work: "Probearbeiten",
          second_interview: "Zweitgespräch",
          interviewed: "Erstgespräch", // fallback for old data
          offer_extended: "Angebot",
          rejected: "Abgelehnt",
          archived: "Abgelehnt",
        }

        const candidatesAsApplications = data.map((candidate: any) => ({
          id: `candidate-${candidate.id}`,
          status: candidate.status,
          stage: statusToStageMap[candidate.status] || "Bewerbung eingegangen",
          applied_at: candidate.created_at,
          candidate: {
            id: candidate.id,
            first_name: candidate.first_name,
            last_name: candidate.last_name,
            email: candidate.email,
            phone: candidate.phone,
            date_of_birth: candidate.date_of_birth, // Added date_of_birth to mapping
            current_position: candidate.current_position,
            rating: candidate.rating,
            image_url: candidate.image_url,
            documents: candidate.documents || [],
            notes: candidate.notes,
            salary_expectation: candidate.salary_expectation, // Added salary_expectation to mapping
            weekly_hours: candidate.weekly_hours, // Added weekly_hours to mapping
          },
          job_posting: {
            id: candidate.job_posting_id || "",
            title: candidate.job_posting_title || "Keine Stelle",
            department: "",
          },
        }))
        setApplications(candidatesAsApplications)

        const allStages = defaultPipelineStages
          .filter((stage) => stage.name !== "Abgelehnt")
          .map((stage, index) => ({
            id: stage.name,
            name: stage.name,
            color: stage.color,
            stage_order: index,
            job_posting_id: "alle",
            applications: candidatesAsApplications.filter((app: Application) => app.stage === stage.name),
          }))

        setStages(allStages)
      }
    } catch (error) {
      console.error("Error loading all candidates:", error)
    } finally {
      setLoading(false)
    }
  }

  const stagesWithApplications = stages.map((stage) => ({
    ...stage,
    applications: applications.filter((app) => app.stage === stage.id),
  }))

  const handleMoveApplication = async (applicationId: string, newStageId: string) => {
    try {
      const isCandidateId = applicationId.startsWith("candidate-")

      if (isCandidateId) {
        const candidateId = applicationId.replace("candidate-", "")

        const stageToStatusMap: Record<string, string> = {
          "Bewerbung eingegangen": "new",
          Erstgespräch: "first_interview",
          Probearbeiten: "trial_work",
          Zweitgespräch: "second_interview",
          Angebot: "offer_extended",
          Abgelehnt: "rejected",
        }

        const newStatus = stageToStatusMap[newStageId] || "new"

        console.log("[v0] Moving candidate:", { candidateId, newStageId, newStatus })

        const response = await fetch(`/api/hiring/candidates/${candidateId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        })

        if (response.ok) {
          loadAllCandidates()
        } else {
          toast({
            title: "Fehler",
            description: "Kandidat konnte nicht verschoben werden.",
            variant: "destructive",
          })
        }
        return
      }

      const response = await fetch(`/api/hiring/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStageId }),
      })

      if (response.ok) {
        loadApplications()
      } else if (response.status === 401) {
        const errorData = await response.json().catch(() => ({ error: "Unauthorized" }))
        console.error("[v0] Authentication error:", errorData)

        toast({
          title: "Authentifizierung erforderlich",
          description: "Bitte melden Sie sich erneut an.",
          variant: "destructive",
        })
        setTimeout(() => router.push("/login"), 2000)
      } else {
        const errorData = await response.json()
        console.error("[v0] Error moving application:", errorData)

        toast({
          title: "Fehler",
          description: errorData.error || "Kandidat konnte nicht verschoben werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error moving application:", error)
    }
  }

  const handleJobPostingSelected = async (jobPostingId: string) => {
    console.log("[v0] Job posting selected:", jobPostingId)
    setSelectedJobPostingId(jobPostingId)
  }

  const openArchiveDialog = (candidateId: string, candidateName: string) => {
    setCandidateToArchive({ id: candidateId, name: candidateName })
    setArchiveDialogOpen(true)
  }

  const handleArchiveCandidate = async () => {
    if (!candidateToArchive) return

    try {
      const response = await fetch(`/api/hiring/candidates/${candidateToArchive.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      })

      if (response.ok) {
        toast({
          title: "Kandidat archiviert",
          description: `${candidateToArchive.name} wurde ins Archiv verschoben.`,
        })

        if (selectedJobPostingId === "alle") {
          loadAllCandidates()
        } else {
          loadApplications()
        }
      } else {
        toast({
          title: "Fehler",
          description: "Kandidat konnte nicht archiviert werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error archiving candidate:", error)
      toast({
        title: "Fehler",
        description: "Ein Fehler ist beim Archivieren aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setArchiveDialogOpen(false)
      setCandidateToArchive(null)
    }
  }

  const handleSendEmail = (email: string, candidateName: string) => {
    const subject = encodeURIComponent(`Bezüglich Ihrer Bewerbung`)
    const body = encodeURIComponent(`Sehr geehrte(r) ${candidateName},\n\n`)
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  }

  const handleViewCandidate = (candidateId: string) => {
    router.push(`/hiring/candidates/${candidateId}`)
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, applicationId: string) => {
    console.log("[v0] Drag start:", applicationId)
    setDraggedApplicationId(applicationId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragEnd = () => {
    console.log("[v0] Drag end")
    setDraggedApplicationId(null)
    setDragOverStageId(null)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, stageId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverStageId(stageId)
  }

  const handleDragLeave = () => {
    setDragOverStageId(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, stageId: string) => {
    e.preventDefault()
    console.log("[v0] Drop:", { draggedApplicationId, stageId })
    if (draggedApplicationId) {
      handleMoveApplication(draggedApplicationId, stageId)
    }
    setDraggedApplicationId(null)
    setDragOverStageId(null)
  }

  const calculateAge = (dateOfBirth: string | undefined) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const calculateHourlyRate = (
    salaryExpectation: number | null | undefined,
    weeklyHours: number | null | undefined,
  ) => {
    if (!salaryExpectation || !weeklyHours || weeklyHours === 0) return null
    // Convert monthly salary to annual, then divide by weeks * hours
    const annualSalary = salaryExpectation * 12
    const annualHours = weeklyHours * 52
    return annualSalary / annualHours
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fehler</CardTitle>
          <CardDescription className="text-destructive">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/login")}>Zur Anmeldung</Button>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return <div>Laden...</div>
  }

  if (jobPostings.length === 0 && selectedJobPostingId !== "alle") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5" />
              <CardTitle>Einstellungs-Pipeline</CardTitle>
            </div>
            <Select value={selectedJobPostingId} onValueChange={handleJobPostingSelected}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Stelle auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle</SelectItem>
                {jobPostings
                  .filter((job) => job.id && job.id.trim() !== "")
                  .map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <CardDescription>
            Keine Stellenausschreibungen vorhanden. Erstellen Sie zuerst eine Stelle im "Stellen"-Tab.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5" />
              <CardTitle>Einstellungs-Pipeline</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAIAnalysis(true)}
                className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <Sparkles className="h-4 w-4" />
                <span className="font-semibold">KI-Analyse</span>
              </Button>
              <Select value={selectedJobPostingId} onValueChange={handleJobPostingSelected}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Stelle auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle</SelectItem>
                  {jobPostings
                    .filter((job) => job.id && job.id.trim() !== "")
                    .map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <CardDescription>
            Verfolgen Sie Kandidaten durch den Recruiting-Prozess ({applications.length} aktive Bewerbungen)
          </CardDescription>
        </CardHeader>
      </Card>

      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(130px, 1fr))`,
          maxWidth: "100%",
        }}
      >
        {stagesWithApplications.map((stage, index) => (
          <Card
            key={stage.id}
            className={`flex flex-col transition-all duration-200 bg-muted/30 ${dragOverStageId === stage.id ? "ring-2 ring-primary shadow-lg" : ""}`}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex flex-col items-start gap-2">
                <CardTitle className="text-base font-semibold">{stage.name}</CardTitle>
                <Badge
                  variant="secondary"
                  className="text-sm font-semibold px-2.5 py-0.5"
                  style={{ backgroundColor: stage.color, color: "white" }}
                >
                  {stage.applications.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-2">
              <ScrollArea className="h-[600px]">
                <div className="space-y-2 pr-2">
                  {stage.applications.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">Keine Bewerbungen</div>
                  ) : (
                    stage.applications.map((application) => (
                      <Card
                        key={application.id}
                        className={`p-3 hover:shadow-lg transition-all duration-200 cursor-move border border-border/50 bg-card ${draggedApplicationId === application.id ? "opacity-50 scale-95" : "hover:scale-[1.02]"}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, application.id)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="space-y-2">
                          <Badge
                            className="text-xs font-medium px-2 py-0.5 w-fit"
                            style={{ backgroundColor: stage.color, color: "white" }}
                          >
                            {stage.name}
                          </Badge>
                          <div className="flex items-start gap-2">
                            <Avatar className="h-9 w-9 border-2 border-muted">
                              <AvatarImage
                                src={application.candidate.image_url || "/placeholder.svg"}
                                alt={`${application.candidate.first_name} ${application.candidate.last_name}`}
                              />
                              <AvatarFallback className="text-xs font-semibold">
                                {application.candidate.first_name?.[0]}
                                {application.candidate.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div
                                className="font-semibold text-sm cursor-pointer hover:text-primary hover:underline truncate"
                                onClick={() => handleViewCandidate(application.candidate.id)}
                              >
                                {application.candidate.first_name} {application.candidate.last_name}
                              </div>
                              {application.candidate.date_of_birth && (
                                <div className="text-xs text-muted-foreground">
                                  {calculateAge(application.candidate.date_of_birth)} Jahre
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {application.candidate.documents && application.candidate.documents.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {application.candidate.documents.length}
                                </Badge>
                              )}
                              {application.candidate.rating && (
                                <Badge variant="outline" className="text-xs bg-yellow-50">
                                  ⭐ {application.candidate.rating}
                                </Badge>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="outline" className="h-6 w-6 p-0 bg-transparent">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleSendEmail(
                                      application.candidate.email,
                                      `${application.candidate.first_name} ${application.candidate.last_name}`,
                                    )
                                  }}
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  E-Mail senden
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openArchiveDialog(
                                      application.candidate.id,
                                      `${application.candidate.first_name} ${application.candidate.last_name}`,
                                    )
                                  }}
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Ins Archiv verschieben
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewCandidate(application.candidate.id)
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Kandidat anzeigen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                              <Briefcase className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate font-medium">{application.job_posting.title}</span>
                            </div>

                            {application.candidate.current_position && (
                              <div className="text-xs text-muted-foreground px-1.5 truncate">
                                {application.candidate.current_position}
                              </div>
                            )}
                            {application.candidate.salary_expectation && application.candidate.weekly_hours && (
                              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium px-1.5">
                                {new Intl.NumberFormat("de-DE", {
                                  style: "currency",
                                  currency: "EUR",
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }).format(
                                  calculateHourlyRate(
                                    application.candidate.salary_expectation,
                                    Number(application.candidate.weekly_hours),
                                  ) || 0,
                                )}
                                /Std
                              </div>
                            )}
                          </div>

                          {application.candidate.notes && (
                            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                              <StickyNote className="h-3 w-3 mt-0.5 flex-shrink-0 text-amber-600" />
                              <span className="line-clamp-2 leading-relaxed">{application.candidate.notes}</span>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            {application.candidate.phone && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground px-1.5">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <span>{application.candidate.phone}</span>
                              </div>
                            )}
                          </div>

                          {selectedJobPostingId !== "alle" && (
                            <div className="pt-1.5 flex gap-2 border-t border-border/50">
                              {index > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 flex-1 font-medium hover:bg-primary/10 hover:text-primary hover:border-primary bg-transparent"
                                  onClick={() =>
                                    handleMoveApplication(application.id, stagesWithApplications[index - 1].id)
                                  }
                                >
                                  ← Zurück
                                </Button>
                              )}
                              {index < stagesWithApplications.length - 1 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 flex-1 font-medium hover:bg-primary/10 hover:text-primary hover:border-primary bg-transparent"
                                  onClick={() =>
                                    handleMoveApplication(application.id, stagesWithApplications[index + 1].id)
                                  }
                                >
                                  Weiter →
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kandidat archivieren?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie {candidateToArchive?.name} wirklich ins Archiv verschieben? Der Kandidat kann später aus dem
              Archiv wiederhergestellt werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveCandidate}>Archivieren</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AICandidateAnalysisDialog open={showAIAnalysis} onOpenChange={setShowAIAnalysis} />
    </div>
  )
}
