"use client"

import { useState, useEffect, useCallback } from "react"
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
} from "lucide-react"
import Link from "next/link"
import { CreateCandidateDialog } from "./create-candidate-dialog"
import EditCandidateDialog from "./edit-candidate-dialog"
import { SendQuestionnaireDialog } from "./send-questionnaire-dialog"
import { AICandidateAnalysisDialog } from "./ai-candidate-analysis-dialog"
import { ConvertToTeamMemberDialog } from "./convert-to-team-member-dialog"
import { GenerateInterviewDialog } from "@/components/hiring/generate-interview-dialog"
import { useToast } from "@/hooks/use-toast"
import { useAiEnabled } from "@/lib/hooks/use-ai-enabled"
import { defaultPipelineStages } from "@/lib/recruiting-defaults"

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
  onUpdate?: () => void
  onNavigateToTab?: () => void
}

const CandidatesManager = ({
  showArchived = false,
  onTabChange,
  onUpdate,
  onNavigateToTab,
}: CandidatesManagerProps) => {
  const { currentPractice } = usePractice()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [jobPostingFilter, setJobPostingFilter] = useState<string>("all")
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const [sendQuestionnaireCandidate, setSendQuestionnaireCandidate] = useState<{
    id: string
    name: string
  } | null>(null)
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)
  const [convertingCandidate, setConvertingCandidate] = useState<Candidate | null>(null)
  const [interviewCandidate, setInterviewCandidate] = useState<Candidate | null>(null)
  const { toast } = useToast()
  const { isAiEnabled } = useAiEnabled()

  const loadData = useCallback(async () => {
    if (!currentPractice?.id) return

    try {
      setLoading(true)

      // Build candidates URL
      const candidatesUrl = new URL("/api/hiring/candidates", window.location.origin)
      candidatesUrl.searchParams.set("practiceId", currentPractice.id)
      if (searchQuery) {
        candidatesUrl.searchParams.set("search", searchQuery)
      }
      if (jobPostingFilter && jobPostingFilter !== "all") {
        candidatesUrl.searchParams.set("jobPostingId", jobPostingFilter)
      }
      if (showArchived) {
        candidatesUrl.searchParams.set("status", "archived")
      } else {
        if (statusFilter && statusFilter !== "all") {
          candidatesUrl.searchParams.set("status", statusFilter)
        } else {
          candidatesUrl.searchParams.set("excludeArchived", "true")
        }
      }

      // Build job postings URL
      const jobPostingsUrl = new URL("/api/hiring/job-postings", window.location.origin)
      jobPostingsUrl.searchParams.set("practiceId", currentPractice.id)

      const [candidatesResponse, jobPostingsResponse] = await Promise.all([
        fetch(candidatesUrl.toString()),
        fetch(jobPostingsUrl.toString()),
      ])

      if (candidatesResponse.ok) {
        const data = await candidatesResponse.json()
        setCandidates(data)
      }

      if (jobPostingsResponse.ok) {
        const data = await jobPostingsResponse.json()
        setJobPostings(data)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }, [currentPractice?.id, searchQuery, statusFilter, jobPostingFilter, showArchived])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleArchive = async (id: string, isArchived: boolean) => {
    try {
      console.log("[v0] Archiving/Unarchiving candidate:", { id, isArchived, currentCount: candidates.length })

      setCandidates((prev) => {
        const filtered = prev.filter((c) => c.id !== id)
        console.log("[v0] Removed candidate from state, new count:", filtered.length)
        return filtered
      })

      const response = await fetch(`/api/hiring/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: isArchived ? "new" : "archived" }),
      })

      if (response.ok) {
        console.log("[v0] Archive/Unarchive successful")
        toast({
          title: isArchived ? "Kandidat wiederhergestellt" : "Kandidat archiviert",
          description: isArchived
            ? "Der Kandidat wurde aus dem Archiv wiederhergestellt."
            : "Der Kandidat wurde ins Archiv verschoben.",
        })

        await loadData()

        if (onUpdate) {
          onUpdate()
        }

        if (isArchived && onTabChange) {
          onTabChange("candidates")
        }
      } else {
        console.error("[v0] Archive/Unarchive failed, reloading...")
        await loadData()
        toast({
          title: "Fehler",
          description: "Der Kandidat konnte nicht archiviert werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error in handleArchive:", error)
      await loadData()
      toast({
        title: "Fehler",
        description: "Der Kandidat konnte nicht archiviert werden.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie diesen Kandidaten wirklich löschen?")) {
      return
    }

    console.log("[v0] Deleting candidate:", id)

    try {
      const response = await fetch(`/api/hiring/candidates/${id}`, {
        method: "DELETE",
      })

      console.log("[v0] Delete response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] Delete failed:", errorData)
        alert(`Fehler beim Löschen des Kandidaten: ${errorData.error || "Unbekannter Fehler"}`)
        return
      }

      const result = await response.json()
      console.log("[v0] Delete result:", result)

      setCandidates((prev) => prev.filter((c) => c.id !== id))

      await loadData()

      console.log("[v0] Candidate deleted successfully, list refreshed")
    } catch (error) {
      console.error("[v0] Error deleting candidate:", error)
      alert("Ein Fehler ist beim Löschen aufgetreten. Bitte versuchen Sie es erneut.")
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
    return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase()
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
    if (
      jobPostingFilter !== "all" &&
      (!candidate.applications || !candidate.applications.some((app) => app.job_posting_id === jobPostingFilter))
    ) {
      return false
    }
    if (statusFilter !== "all" && candidate.status !== statusFilter) {
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
                            onError={(e) => {
                              console.log("[v0] Failed to load candidate image, falling back to avatar")
                              e.currentTarget.style.display = "none"
                            }}
                          />
                          <AvatarFallback className="text-lg">
                            {getInitials(candidate.first_name, candidate.last_name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/hiring/candidates/${candidate.id}`}
                            className="text-base font-semibold text-primary hover:underline cursor-pointer block"
                          >
                            {candidate.first_name} {candidate.last_name}
                          </Link>
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

                      {!showArchived && (
                        <div className="w-full flex items-center justify-between gap-2">
                          <div className="flex-1" />
                          <div className="flex-shrink-0">{renderRating(candidate.rating)}</div>
                        </div>
                      )}

                      <div className="w-full flex items-center justify-center gap-2 pt-1.5 border-t">
                        {!showArchived && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setSendQuestionnaireCandidate({
                                id: candidate.id,
                                name: `${candidate.first_name} ${candidate.last_name}`,
                              })
                            }
                            title="Fragebogen senden"
                          >
                            <Mail className="h-6 w-6" />
                          </Button>
                        )}
                        {!showArchived && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCandidate(candidate)}
                            title="Kandidat bearbeiten"
                          >
                            <Edit className="h-6 w-6" />
                          </Button>
                        )}
                        {!showArchived && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setInterviewCandidate(candidate)}
                            title="Bewerbungsgespräch generieren"
                          >
                            <FileText className="h-6 w-6" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(candidate.id, showArchived)}
                          title={showArchived ? "Wiederherstellen" : "Archivieren"}
                        >
                          {showArchived ? <ArchiveRestore className="h-6 w-6" /> : <Archive className="h-6 w-6" />}
                        </Button>
                        {!showArchived && !candidate.converted_to_team_member && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConvertingCandidate(candidate)}
                            title="Zu Team-Mitglied konvertieren"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <UserPlus className="h-6 w-6" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(candidate.id)}
                          title="Kandidat löschen"
                        >
                          <Trash2 className="h-6 w-6" />
                        </Button>
                      </div>
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
        onSuccess={loadData}
        onNavigateToTab={onNavigateToTab}
      />

      {editingCandidate && (
        <EditCandidateDialog
          open={!!editingCandidate}
          onOpenChange={(open) => !open && setEditingCandidate(null)}
          candidate={editingCandidate}
          onSuccess={loadData}
          onNavigateToTab={onNavigateToTab}
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

      <AICandidateAnalysisDialog open={showAIAnalysis} onOpenChange={setShowAIAnalysis} />

      {convertingCandidate && (
        <ConvertToTeamMemberDialog
          open={!!convertingCandidate}
          onOpenChange={(open) => !open && setConvertingCandidate(null)}
          candidate={convertingCandidate}
          onSuccess={() => {
            loadData()
            if (onUpdate) onUpdate()
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
    </div>
  )
}

export { CandidatesManager }
export default CandidatesManager
