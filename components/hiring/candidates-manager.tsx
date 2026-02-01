"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { usePractice } from "@/contexts/practice-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Star,
  Archive,
  ArchiveRestore,
  Mail,
  Sparkles,
  UserPlus,
  FileText,
  MoreVertical,
  Calendar,
  MessageSquare,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { CreateCandidateDialog } from "./create-candidate-dialog"
import EditCandidateDialog from "./edit-candidate-dialog"
import { SendQuestionnaireDialog } from "./send-questionnaire-dialog"
import { AICandidateAnalysisDialog } from "./ai-candidate-analysis-dialog"
import { ConvertToTeamMemberDialog } from "./convert-to-team-member-dialog"
import { GenerateInterviewDialog } from "@/components/hiring/generate-interview-dialog"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { useToast } from "@/hooks/use-toast"
import { useAiEnabled } from "@/lib/hooks/use-ai-enabled"
import { defaultPipelineStages } from "@/lib/recruiting-defaults"
import { SWR_KEYS } from "@/lib/swr-keys"
import { swrFetcher } from "@/lib/swr-fetcher"

interface CandidateEvent {
  id: string
  type: 'interview_1' | 'interview_2' | 'trial_day_1' | 'trial_day_2' | 'other'
  date: string
  time?: string
  notes?: string
  completed: boolean
  created_at: string
}

interface Candidate {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth?: string
  current_position: string
  current_company: string
  status: string
  rating: number
  created_at: string
  image_url?: string
  converted_to_team_member?: boolean
  notes?: string
  first_contact_date?: string
  events?: CandidateEvent[]
  applications?: Array<{
    id: string
    job_posting_id: string
    status: string
    stage?: string
    job_postings: {
      id: string
      title: string
      department: string
    }
  }>
  salary_expectation?: number
  weekly_hours?: number
}

interface JobPosting {
  id: string
  title: string
}

interface CandidatesManagerProps {
  showArchived?: boolean
  onTabChange?: (mainTab: string, subTab?: string) => void
  onShowArchivedChange?: (show: boolean) => void
  onUpdate?: () => void
  onNavigateToTab?: () => void
  initialJobPostingFilter?: string
}

const CandidatesManager = ({
  showArchived = false,
  onTabChange,
  onShowArchivedChange,
  onUpdate,
  onNavigateToTab,
  initialJobPostingFilter,
}: CandidatesManagerProps) => {
  const { currentPractice } = usePractice()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [jobPostingFilter, setJobPostingFilter] = useState<string>(initialJobPostingFilter || "all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const [sendQuestionnaireCandidate, setSendQuestionnaireCandidate] = useState<{
    id: string
    name: string
  } | null>(null)
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)
  const [convertingCandidate, setConvertingCandidate] = useState<Candidate | null>(null)
  const [interviewCandidate, setInterviewCandidate] = useState<Candidate | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<Candidate | null>(null)
  const { toast } = useToast()
  const { isAiEnabled } = useAiEnabled()

  const practiceId = currentPractice?.id

  const candidatesKey = useMemo(() => {
    if (!practiceId) return null
    return SWR_KEYS.candidates(practiceId, {
      search: searchQuery || undefined,
      jobPostingId: jobPostingFilter !== "all" ? jobPostingFilter : undefined,
      status: showArchived ? "archived" : statusFilter !== "all" ? statusFilter : undefined,
      excludeArchived: !showArchived && statusFilter === "all",
    })
  }, [practiceId, searchQuery, jobPostingFilter, statusFilter, showArchived])

  const {
    data: candidates = [],
    isLoading: loading,
    mutate: mutateCandidates,
  } = useSWR<Candidate[]>(candidatesKey, swrFetcher, { revalidateOnFocus: false })

  const { data: jobPostings = [] } = useSWR<JobPosting[]>(
    practiceId ? SWR_KEYS.jobPostings(practiceId) : null,
    swrFetcher,
    { revalidateOnFocus: false },
  )

  const handleArchive = async (id: string, isArchived: boolean) => {
    const previousCandidates = [...candidates]
    await mutateCandidates(
      candidates.filter((c) => c.id !== id),
      { revalidate: false },
    )

    try {
      const response = await fetch(`/api/hiring/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: isArchived ? "new" : "archived" }),
      })

      if (response.ok) {
        toast({
          title: isArchived ? "Kandidat wiederhergestellt" : "Kandidat archiviert",
          description: isArchived
            ? "Der Kandidat wurde aus dem Archiv wiederhergestellt."
            : "Der Kandidat wurde ins Archiv verschoben.",
        })

        await mutateCandidates()
        onUpdate?.()

        if (isArchived && onTabChange) {
          onTabChange("candidates")
        }
      } else {
        // Rollback
        await mutateCandidates(previousCandidates, { revalidate: false })
        toast({
          title: "Fehler",
          description: "Der Kandidat konnte nicht archiviert werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      // Rollback
      await mutateCandidates(previousCandidates, { revalidate: false })
      toast({
        title: "Fehler",
        description: "Der Kandidat konnte nicht archiviert werden.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    const previousCandidates = [...candidates]
    await mutateCandidates(
      candidates.filter((c) => c.id !== id),
      { revalidate: false },
    )

    try {
      const response = await fetch(`/api/hiring/candidates/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        // Rollback
        await mutateCandidates(previousCandidates, { revalidate: false })
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        toast({
          title: "Fehler",
          description: `Kandidat konnte nicht gelöscht werden: ${errorData.error}`,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Kandidat gelöscht",
        description: "Der Kandidat wurde erfolgreich gelöscht.",
      })
      await mutateCandidates()
    } catch (error) {
      // Rollback
      await mutateCandidates(previousCandidates, { revalidate: false })
      toast({
        title: "Fehler",
        description: "Ein Fehler ist beim Löschen aufgetreten.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string; label: string }> = {
      new: { className: "bg-blue-500 text-white hover:bg-blue-600", label: "Neu" },
      screening: { className: "bg-purple-500 text-white hover:bg-purple-600", label: "Screening" },
      interviewing: { className: "bg-yellow-500 text-white hover:bg-yellow-600", label: "Interview" },
      offer: { className: "bg-orange-500 text-white hover:bg-orange-600", label: "Angebot" },
      hired: { className: "bg-green-500 text-white hover:bg-green-600", label: "Eingestellt" },
      rejected: { className: "bg-slate-500 text-white hover:bg-slate-600", label: "Abgelehnt" },
      withdrawn: { className: "bg-gray-400 text-white hover:bg-gray-500", label: "Zurückgezogen" },
      archived: { className: "bg-gray-300 text-gray-700 hover:bg-gray-400", label: "Archiviert" },
    }
    const config = statusConfig[status] || statusConfig.new
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getPipelineStageBadge = (candidate: Candidate) => {
    const latestApplication = candidate.applications?.[0]
    const stage = latestApplication?.stage || latestApplication?.status || "Bewerbung eingegangen"
    const stageConfig = defaultPipelineStages.find((s) => s.name === stage)
    const color = stageConfig?.color || "#3b82f6"
    return (
      <Badge className="text-white text-xs px-2 py-0.5" style={{ backgroundColor: color }}>
        {stage}
      </Badge>
    )
  }

  const renderRating = (rating: number) => {
    if (!rating) return <span className="text-muted-foreground">-</span>
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`h-3 w-3 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
        ))}
      </div>
    )
  }

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName?.trim() || ""
    const last = lastName?.trim() || ""
    return `${first[0] || "?"}${last[0] || "?"}`.toUpperCase()
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

  const getEventTypeShortLabel = (type: string) => {
    const labels: Record<string, string> = {
      interview_1: '1. Gespräch',
      interview_2: '2. Gespräch',
      trial_day_1: '1. Probearbeit',
      trial_day_2: '2. Probearbeit',
      other: 'Termin',
    }
    return labels[type] || type
  }

  const getUpcomingEvents = (events: CandidateEvent[] | undefined) => {
    if (!events || events.length === 0) return []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return events
      .filter(e => !e.completed && new Date(e.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 2)
  }

  // Client-side filtering for search (SWR handles status/jobPosting filtering on server)
  const displayedCandidates = candidates.filter((candidate) => {
    if (
      searchQuery &&
      !(
        candidate.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.last_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    ) {
      return false
    }
    return true
  })

  if (loading) {
    return <div>Laden...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{showArchived ? "Archivierte Kandidaten" : "Kandidaten"}</CardTitle>
              <CardDescription>
                {showArchived
                  ? "Verwalten Sie archivierte Bewerber"
                  : "Verwalten Sie Bewerber und deren Bewerbungsstatus"}
              </CardDescription>
            </div>
            {!showArchived && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAIAnalysis(true)}
                  className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
                  disabled={!isAiEnabled}
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="font-semibold">KI-Analyse</span>
                </Button>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Neuer Kandidat
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kandidaten suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {!showArchived && (
              <>
                <Select value={jobPostingFilter} onValueChange={setJobPostingFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Stelle filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Stellen</SelectItem>
                    {jobPostings.map((posting) => (
                      <SelectItem key={posting.id} value={posting.id}>
                        {posting.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Status filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="new">Neu</SelectItem>
                    <SelectItem value="screening">Screening</SelectItem>
                    <SelectItem value="interviewing">Interview</SelectItem>
                    <SelectItem value="offer">Angebot</SelectItem>
                    <SelectItem value="hired">Eingestellt</SelectItem>
                    <SelectItem value="rejected">Abgelehnt</SelectItem>
                    <SelectItem value="withdrawn">Zurückgezogen</SelectItem>
                    <SelectItem value="archived">Archiv</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {displayedCandidates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery || statusFilter !== "all" || jobPostingFilter !== "all"
                ? "Keine Kandidaten gefunden. Versuchen Sie eine andere Suche oder Filter."
                : showArchived
                  ? "Keine archivierten Kandidaten vorhanden."
                  : "Keine Kandidaten vorhanden. Fügen Sie Ihren ersten Kandidaten hinzu."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedCandidates.map((candidate) => (
                <Card key={candidate.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-16 w-16 flex-shrink-0">
                          <AvatarImage
                            src={candidate.image_url || undefined}
                            alt={`${candidate.first_name} ${candidate.last_name}`}
                          />
                          <AvatarFallback className="text-lg">
                            {getInitials(candidate.first_name, candidate.last_name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <Link
                              href={`/hiring/candidates/${candidate.id}`}
                              className="text-base font-semibold text-primary hover:underline cursor-pointer block"
                            >
                              {candidate.first_name} {candidate.last_name}
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!showArchived && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setSendQuestionnaireCandidate({
                                        id: candidate.id,
                                        name: `${candidate.first_name} ${candidate.last_name}`,
                                      })
                                    }
                                  >
                                    <Mail className="h-4 w-4 mr-2" />
                                    Fragebogen senden
                                  </DropdownMenuItem>
                                )}
                                {!showArchived && (
                                  <DropdownMenuItem onClick={() => setInterviewCandidate(candidate)}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Interview generieren
                                  </DropdownMenuItem>
                                )}
                                {!showArchived && !candidate.converted_to_team_member && (
                                  <DropdownMenuItem onClick={() => setConvertingCandidate(candidate)}>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Als Team-Mitglied hinzufügen
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => setEditingCandidate(candidate)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Bearbeiten
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleArchive(candidate.id, showArchived)}>
                                  {showArchived ? (
                                    <>
                                      <ArchiveRestore className="h-4 w-4 mr-2" />
                                      Wiederherstellen
                                    </>
                                  ) : (
                                    <>
                                      <Archive className="h-4 w-4 mr-2" />
                                      Archivieren
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteCandidate(candidate)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Löschen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {candidate.date_of_birth && (
                            <p className="text-xs text-muted-foreground">
                              {calculateAge(candidate.date_of_birth)} Jahre
                            </p>
                          )}
                          <div className="mt-1">{getPipelineStageBadge(candidate)}</div>
                          {candidate.applications &&
                            candidate.applications.length > 0 &&
                            candidate.applications[0].job_postings && (
                              <div className="flex items-center gap-1 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {candidate.applications[0].job_postings.title}
                                </Badge>
                              </div>
                            )}
                          {candidate.salary_expectation && candidate.weekly_hours && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Intl.NumberFormat("de-DE", {
                                style: "currency",
                                currency: "EUR",
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }).format(
                                calculateHourlyRate(candidate.salary_expectation, Number(candidate.weekly_hours)) || 0,
                              )}
                              /Std
                            </div>
                          )}
                          {candidate.converted_to_team_member && (
                            <Badge variant="default" className="mt-1 bg-green-500 text-white">
                              Team-Mitglied
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* First Contact Date */}
                      {candidate.first_contact_date && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Erstkontakt: {new Date(candidate.first_contact_date).toLocaleDateString("de-DE")}</span>
                        </div>
                      )}

                      {/* Internal Notes */}
                      {candidate.notes && (
                        <div className="flex items-start gap-1.5 text-xs bg-muted/50 rounded p-2">
                          <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                          <span className="text-muted-foreground line-clamp-2">{candidate.notes}</span>
                        </div>
                      )}

                      {/* Upcoming Events */}
                      {getUpcomingEvents(candidate.events).length > 0 && (
                        <div className="space-y-1">
                          {getUpcomingEvents(candidate.events).map((event) => (
                            <div key={event.id} className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-950/30 rounded px-2 py-1">
                              <Calendar className="h-3 w-3 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                              <span className="font-medium text-blue-700 dark:text-blue-300">
                                {getEventTypeShortLabel(event.type)}:
                              </span>
                              <span className="text-blue-600 dark:text-blue-400">
                                {new Date(event.date).toLocaleDateString("de-DE")}
                                {event.time && ` ${event.time}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {!showArchived && (
                        <div className="w-full flex items-center justify-end gap-2 pt-1.5 border-t">
                          <div className="flex-shrink-0">{renderRating(candidate.rating)}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateCandidateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={async () => {
          await mutateCandidates()
          onUpdate?.()
        }}
        onNavigateToTab={onNavigateToTab}
      />

      {editingCandidate && (
        <EditCandidateDialog
          open={!!editingCandidate}
          onOpenChange={(open) => !open && setEditingCandidate(null)}
          candidate={editingCandidate}
          onSuccess={async () => {
            await mutateCandidates()
            onUpdate?.()
          }}
        />
      )}

      {sendQuestionnaireCandidate && (
        <SendQuestionnaireDialog
          open={!!sendQuestionnaireCandidate}
          onOpenChange={(open) => !open && setSendQuestionnaireCandidate(null)}
          candidateId={sendQuestionnaireCandidate.id}
          candidateName={sendQuestionnaireCandidate.name}
        />
      )}

      <AICandidateAnalysisDialog
        open={showAIAnalysis}
        onOpenChange={setShowAIAnalysis}
        candidates={candidates.map((c) => ({
          id: c.id,
          first_name: c.first_name,
          last_name: c.last_name,
          email: c.email,
          current_position: c.current_position,
          rating: c.rating,
        }))}
      />

      {convertingCandidate && (
        <ConvertToTeamMemberDialog
          open={!!convertingCandidate}
          onOpenChange={(open) => !open && setConvertingCandidate(null)}
          candidate={convertingCandidate}
          onSuccess={async () => {
            await mutateCandidates()
            onUpdate?.()
          }}
        />
      )}

      {interviewCandidate && (
        <GenerateInterviewDialog
          open={!!interviewCandidate}
          onOpenChange={(open) => !open && setInterviewCandidate(null)}
          candidate={interviewCandidate}
        />
      )}

      <ConfirmDeleteDialog
        open={!!deleteCandidate}
        onOpenChange={(open) => !open && setDeleteCandidate(null)}
        onConfirm={() => {
          if (deleteCandidate) {
            handleDelete(deleteCandidate.id)
            setDeleteCandidate(null)
          }
        }}
        title="Kandidat löschen"
        description="Diese Aktion kann nicht rückgängig gemacht werden. Der Kandidat und alle zugehörigen Daten werden dauerhaft gelöscht."
        itemName={deleteCandidate ? `${deleteCandidate.first_name} ${deleteCandidate.last_name}` : undefined}
      />
    </div>
  )
}

export default CandidatesManager
