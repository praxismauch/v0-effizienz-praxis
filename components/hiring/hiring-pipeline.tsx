"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import useSWR, { useSWRConfig } from "swr"
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
import { LayoutDashboard, Mail, Archive, Sparkles, MoreVertical, Eye } from "lucide-react"
import { defaultPipelineStages } from "@/lib/recruiting-defaults"
import { useToast } from "@/hooks/use-toast"
import { AICandidateAnalysisDialog } from "./ai-candidate-analysis-dialog"
import { SWR_KEYS } from "@/lib/swr-keys"
import { swrFetcher } from "@/lib/swr-fetcher"

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
    date_of_birth?: string
    current_position: string
    rating: number
    image_url?: string
    documents?: Array<{ name: string; url: string; size?: number; uploadedAt?: string }>
    notes?: string
    salary_expectation?: number
    weekly_hours?: number
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

const STATUS_TO_STAGE_MAP: Record<string, string> = {
  new: "Bewerbung eingegangen",
  contacted: "Bewerbung eingegangen",
  first_interview: "Erstgespräch",
  trial_work: "Probearbeiten",
  second_interview: "Zweitgespräch",
  interviewed: "Erstgespräch",
  offer_extended: "Angebot",
  rejected: "Abgelehnt",
  archived: "Abgelehnt",
}

const STAGE_TO_STATUS_MAP: Record<string, string> = {
  "Bewerbung eingegangen": "new",
  Erstgespräch: "first_interview",
  Probearbeiten: "trial_work",
  Zweitgespräch: "second_interview",
  Angebot: "offer_extended",
  Abgelehnt: "rejected",
}

export function HiringPipeline() {
  const router = useRouter()
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const { mutate: globalMutate } = useSWRConfig()
  const [selectedJobPostingId, setSelectedJobPostingId] = useState<string>("alle")
  const [draggedApplicationId, setDraggedApplicationId] = useState<string | null>(null)
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [candidateToArchive, setCandidateToArchive] = useState<{ id: string; name: string } | null>(null)
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)
  const [isMoving, setIsMoving] = useState<string | null>(null)

  const practiceId = currentPractice?.id

  const { data: jobPostings = [], error: jobPostingsError } = useSWR<JobPosting[]>(
    practiceId ? SWR_KEYS.jobPostings(practiceId) : null,
    swrFetcher,
    { revalidateOnFocus: false },
  )

  const { data: stages = [] } = useSWR<PipelineStage[]>(
    practiceId && selectedJobPostingId !== "alle" ? SWR_KEYS.pipelineStages(practiceId, selectedJobPostingId) : null,
    swrFetcher,
    { revalidateOnFocus: false },
  )

  const {
    data: applications = [],
    mutate: mutateApplications,
    isLoading: loading,
  } = useSWR<Application[]>(
    practiceId
      ? selectedJobPostingId === "alle"
        ? SWR_KEYS.candidates(practiceId, { excludeArchived: true })
        : SWR_KEYS.applications(practiceId, selectedJobPostingId)
      : null,
    async (url: string) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()

      // Transform candidates to applications format if fetching all
      if (selectedJobPostingId === "alle") {
        return data.map((candidate: any) => ({
          id: `candidate-${candidate.id}`,
          status: candidate.status,
          stage: STATUS_TO_STAGE_MAP[candidate.status] || "Bewerbung eingegangen",
          applied_at: candidate.created_at,
          candidate: {
            id: candidate.id,
            first_name: candidate.first_name,
            last_name: candidate.last_name,
            email: candidate.email,
            phone: candidate.phone,
            date_of_birth: candidate.date_of_birth,
            current_position: candidate.current_position,
            rating: candidate.rating,
            image_url: candidate.image_url,
            documents: candidate.documents || [],
            notes: candidate.notes,
            salary_expectation: candidate.salary_expectation,
            weekly_hours: candidate.weekly_hours,
          },
          job_posting: {
            id: candidate.job_posting_id || "",
            title: candidate.job_posting_title || "Keine Stelle",
            department: "",
          },
        }))
      }
      return data
    },
    {
      revalidateOnFocus: false,
      refreshInterval: isMoving ? 0 : 10000, // Disable refresh while moving
    },
  )

  // Compute stages with applications
  const stagesWithApplications =
    selectedJobPostingId === "alle"
      ? defaultPipelineStages
          .filter((stage) => stage.name !== "Abgelehnt")
          .map((stage, index) => ({
            id: stage.name,
            name: stage.name,
            color: stage.color,
            stage_order: index,
            job_posting_id: "alle",
            applications: applications.filter((app) => app.stage === stage.name),
          }))
      : stages.map((stage) => ({
          ...stage,
          applications: applications.filter((app) => app.stage === stage.id),
        }))

  const handleMoveApplication = useCallback(
    async (applicationId: string, newStageId: string) => {
      const isCandidateId = applicationId.startsWith("candidate-")

      const previousApplications = applications ? [...applications] : []

      await mutateApplications(
        (currentData) => {
          if (!currentData) return currentData
          return currentData.map((app) => {
            if (app.id === applicationId) {
              return {
                ...app,
                stage: newStageId,
                status: STAGE_TO_STATUS_MAP[newStageId] || app.status,
              }
            }
            return app
          })
        },
        { revalidate: false },
      )

      setIsMoving(applicationId)

      try {
        if (isCandidateId) {
          const candidateId = applicationId.replace("candidate-", "")
          const newStatus = STAGE_TO_STATUS_MAP[newStageId] || "new"

          const response = await fetch(`/api/hiring/candidates/${candidateId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          })

          if (!response.ok) {
            await mutateApplications(() => previousApplications, { revalidate: false })
            const errorData = await response.json().catch(() => ({ error: "Unbekannter Fehler" }))
            toast({
              title: "Fehler beim Verschieben",
              description: errorData.error || "Kandidat konnte nicht verschoben werden.",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Kandidat verschoben",
              description: `Kandidat wurde nach "${newStageId}" verschoben.`,
            })
            mutateApplications()
          }
          return
        }

        // For regular applications
        const response = await fetch(`/api/hiring/applications/${applicationId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: newStageId }),
        })

        if (!response.ok) {
          await mutateApplications(() => previousApplications, { revalidate: false })

          if (response.status === 401) {
            toast({
              title: "Authentifizierung erforderlich",
              description: "Bitte melden Sie sich erneut an.",
              variant: "destructive",
            })
            setTimeout(() => router.push("/login"), 2000)
          } else {
            const errorData = await response.json().catch(() => ({ error: "Unbekannter Fehler" }))
            toast({
              title: "Fehler beim Verschieben",
              description: errorData.error || "Bewerbung konnte nicht verschoben werden.",
              variant: "destructive",
            })
          }
        } else {
          toast({
            title: "Bewerbung verschoben",
            description: `Bewerbung wurde nach "${newStageId}" verschoben.`,
          })
          mutateApplications()
        }
      } catch (error) {
        await mutateApplications(() => previousApplications, { revalidate: false })
        toast({
          title: "Netzwerkfehler",
          description: "Verbindung zum Server fehlgeschlagen.",
          variant: "destructive",
        })
      } finally {
        setIsMoving(null)
      }
    },
    [applications, mutateApplications, router, toast],
  )

  const handleJobPostingSelected = async (jobPostingId: string) => {
    setSelectedJobPostingId(jobPostingId)
  }

  const openArchiveDialog = (candidateId: string, candidateName: string) => {
    setCandidateToArchive({ id: candidateId, name: candidateName })
    setArchiveDialogOpen(true)
  }

  const handleArchiveCandidate = async () => {
    if (!candidateToArchive) return

    const previousApplications = applications ? [...applications] : []

    await mutateApplications(
      (currentData) => {
        if (!currentData) return currentData
        return currentData.filter((app) => !app.id.includes(candidateToArchive.id))
      },
      { revalidate: false },
    )

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
        await mutateApplications()
      } else {
        await mutateApplications(() => previousApplications, { revalidate: false })
        toast({
          title: "Fehler",
          description: "Kandidat konnte nicht archiviert werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      await mutateApplications(() => previousApplications, { revalidate: false })
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
    setDraggedApplicationId(applicationId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragEnd = () => {
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
    if (draggedApplicationId) {
      const currentApp = applications.find((app) => app.id === draggedApplicationId)
      if (currentApp && currentApp.stage !== stageId) {
        handleMoveApplication(draggedApplicationId, stageId)
      }
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
    const annualSalary = salaryExpectation * 12
    const annualHours = weeklyHours * 52
    return annualSalary / annualHours
  }

  if (jobPostingsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fehler</CardTitle>
          <CardDescription className="text-destructive">
            {jobPostingsError.message === "401"
              ? "Bitte melden Sie sich an, um fortzufahren."
              : "Fehler beim Laden der Daten"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/login")}>Zur Anmeldung</Button>
        </CardContent>
      </Card>
    )
  }

  if (loading && applications.length === 0) {
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
        {stagesWithApplications.map((stage) => (
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
            <CardContent className="flex-1 p-2 pt-0">
              <ScrollArea className="h-[calc(100vh-400px)] min-h-[300px]">
                <div className="space-y-2 pr-2">
                  {stage.applications.map((application) => (
                    <Card
                      key={application.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, application.id)}
                      onDragEnd={handleDragEnd}
                      className={`cursor-grab active:cursor-grabbing transition-all duration-200 ${
                        draggedApplicationId === application.id ? "opacity-50 scale-95" : "hover:shadow-md"
                      } ${isMoving === application.id ? "animate-pulse" : ""}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={application.candidate.image_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {application.candidate.first_name?.[0] || "?"}
                              {application.candidate.last_name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {application.candidate.first_name} {application.candidate.last_name}
                            </p>
                            {application.candidate.date_of_birth && (
                              <p className="text-xs text-muted-foreground">
                                {calculateAge(application.candidate.date_of_birth)} Jahre
                              </p>
                            )}
                            {application.job_posting?.title && (
                              <Badge variant="outline" className="text-xs mt-1 max-w-full truncate">
                                {application.job_posting.title}
                              </Badge>
                            )}
                            {application.candidate.salary_expectation && application.candidate.weekly_hours && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Intl.NumberFormat("de-DE", {
                                  style: "currency",
                                  currency: "EUR",
                                  minimumFractionDigits: 2,
                                }).format(
                                  calculateHourlyRate(
                                    application.candidate.salary_expectation,
                                    application.candidate.weekly_hours,
                                  ) || 0,
                                )}
                                /Std
                              </p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewCandidate(application.candidate.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Details ansehen
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSendEmail(
                                    application.candidate.email,
                                    `${application.candidate.first_name} ${application.candidate.last_name}`,
                                  )
                                }
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                E-Mail senden
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  openArchiveDialog(
                                    application.candidate.id,
                                    `${application.candidate.first_name} ${application.candidate.last_name}`,
                                  )
                                }
                                className="text-destructive"
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archivieren
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {stage.applications.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">Keine Kandidaten</div>
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
              Möchten Sie {candidateToArchive?.name} wirklich archivieren? Der Kandidat kann später wiederhergestellt
              werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveCandidate}>Archivieren</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AICandidateAnalysisDialog
        open={showAIAnalysis}
        onOpenChange={setShowAIAnalysis}
        candidates={applications.map((app) => ({
          id: app.candidate.id,
          first_name: app.candidate.first_name,
          last_name: app.candidate.last_name,
          email: app.candidate.email,
          current_position: app.candidate.current_position,
          rating: app.candidate.rating,
          notes: app.candidate.notes,
        }))}
      />
    </div>
  )
}
