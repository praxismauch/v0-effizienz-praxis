"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { usePractice } from "@/contexts/practice-context"
import { useTranslation } from "@/contexts/translation-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Edit,
  Trash2,
  Briefcase,
  Building2,
  Clock,
  CalendarDays,
  MapPin,
  MoreHorizontal,
  Eye,
  Copy,
  Archive,
  CheckCircle2,
  FileEdit,
  Globe,
  Users,
} from "lucide-react"
import { EditJobPostingDialog } from "./edit-job-posting-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { SWR_KEYS } from "@/lib/swr-keys"
import { swrFetcher } from "@/lib/swr-fetcher"
import { useToast } from "@/hooks/use-toast"

interface JobPosting {
  id: string
  title: string
  department: string
  employment_type: string
  location: string
  status: string
  published_at: string
  created_at: string
  start_month: number
  start_year: number
  description?: string
  candidates_count?: number
}

export function JobPostingsManager({ onUpdate, initialTab }: { onUpdate?: () => void; initialTab?: string }) {
  const router = useRouter()
  const { t } = useTranslation()
  const { toast } = useToast()
  const { currentPractice } = usePractice()
  const [editingPosting, setEditingPosting] = useState<JobPosting | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>(initialTab || "active")

  const practiceId = currentPractice?.id

  const {
    data: jobPostings = [],
    isLoading: loading,
    mutate: mutateJobPostings,
  } = useSWR<JobPosting[]>(practiceId ? SWR_KEYS.jobPostings(practiceId) : null, swrFetcher, {
    revalidateOnFocus: false,
  })

  useEffect(() => {
    if (initialTab) {
      setStatusFilter(initialTab)
    }
  }, [initialTab])

  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie diese Stellenausschreibung wirklich löschen?")) {
      return
    }

    const previousPostings = [...jobPostings]
    await mutateJobPostings(
      jobPostings.filter((p) => p.id !== id),
      { revalidate: false },
    )

    try {
      const response = await fetch(`/api/hiring/job-postings/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({ title: "Stelle gelöscht", description: "Die Stellenausschreibung wurde gelöscht." })
        await mutateJobPostings()
        onUpdate?.()
      } else {
        // Rollback
        await mutateJobPostings(previousPostings, { revalidate: false })
        toast({ title: "Fehler", description: "Stelle konnte nicht gelöscht werden.", variant: "destructive" })
      }
    } catch (error) {
      // Rollback
      await mutateJobPostings(previousPostings, { revalidate: false })
      toast({ title: "Fehler", description: "Netzwerkfehler beim Löschen.", variant: "destructive" })
    }
  }

  const handleStatusToggle = async (posting: JobPosting) => {
    const newStatus = posting.status === "published" ? "draft" : "published"

    const previousPostings = [...jobPostings]
    await mutateJobPostings(
      jobPostings.map((p) => (p.id === posting.id ? { ...p, status: newStatus } : p)),
      { revalidate: false },
    )

    try {
      const response = await fetch(`/api/hiring/job-postings/${posting.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          published_at: newStatus === "published" ? new Date().toISOString() : null,
        }),
      })

      if (response.ok) {
        toast({
          title: newStatus === "published" ? "Veröffentlicht" : "Als Entwurf gespeichert",
          description: `Status wurde geändert.`,
        })
        await mutateJobPostings()
        onUpdate?.()
      } else {
        // Rollback
        await mutateJobPostings(previousPostings, { revalidate: false })
        toast({ title: "Fehler", description: "Status konnte nicht geändert werden.", variant: "destructive" })
      }
    } catch (error) {
      // Rollback
      await mutateJobPostings(previousPostings, { revalidate: false })
    }
  }

  const handleDuplicate = async (posting: JobPosting) => {
    try {
      const response = await fetch(`/api/hiring/job-postings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...posting,
          id: undefined,
          title: `${posting.title} (Kopie)`,
          status: "draft",
          published_at: null,
          practice_id: currentPractice?.id,
        }),
      })

      if (response.ok) {
        toast({ title: "Stelle dupliziert", description: "Die Kopie wurde als Entwurf erstellt." })
        await mutateJobPostings()
        onUpdate?.()
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Stelle konnte nicht dupliziert werden.", variant: "destructive" })
    }
  }

  // ... existing code for getStatusConfig, getEmploymentTypeConfig, formatDepartment, formatStartDate, formatPublishedDate ...

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { variant: any; label: string; color: string; bgColor: string; icon: any }> = {
      draft: {
        variant: "secondary",
        label: t("hiring.status.draft", "Entwurf"),
        color: "text-slate-600",
        bgColor: "bg-slate-100",
        icon: FileEdit,
      },
      published: {
        variant: "default",
        label: t("hiring.status.published", "Veröffentlicht"),
        color: "text-emerald-600",
        bgColor: "bg-emerald-100",
        icon: Globe,
      },
      closed: {
        variant: "outline",
        label: t("hiring.status.closed", "Geschlossen"),
        color: "text-orange-600",
        bgColor: "bg-orange-100",
        icon: Archive,
      },
      filled: {
        variant: "success",
        label: t("hiring.status.filled", "Besetzt"),
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        icon: CheckCircle2,
      },
      template: {
        variant: "outline",
        label: t("hiring.status.template", "Vorlage"),
        color: "text-purple-600",
        bgColor: "bg-purple-100",
        icon: Copy,
      },
    }
    return configs[status] || configs.draft
  }

  const getEmploymentTypeConfig = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      "full-time": { label: "Vollzeit", color: "text-blue-600 bg-blue-50" },
      "part-time": { label: "Teilzeit", color: "text-amber-600 bg-amber-50" },
      contract: { label: "Vertrag", color: "text-purple-600 bg-purple-50" },
      internship: { label: "Praktikum", color: "text-teal-600 bg-teal-50" },
    }
    return types[type] || { label: type, color: "text-gray-600 bg-gray-50" }
  }

  const formatDepartment = (department: string) => {
    if (!department) return "-"
    if (department.toLowerCase() === "mfa") return "MFA"
    return department.charAt(0).toUpperCase() + department.slice(1)
  }

  const formatStartDate = (month: number | null | undefined, year: number | null | undefined) => {
    if (!month || !year) return null
    const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
    return `${monthNames[month - 1]} ${year}`
  }

  const formatPublishedDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  const getStatusCounts = () => {
    const counts = {
      active: jobPostings.filter((p) => p.status === "published").length,
      draft: jobPostings.filter((p) => p.status === "draft").length,
      completed: jobPostings.filter((p) => p.status === "filled").length,
      template: jobPostings.filter((p) => p.status === "template").length,
    }
    return counts
  }

  const getFilteredPostings = () => {
    switch (statusFilter) {
      case "active":
        return jobPostings.filter((p) => p.status === "published")
      case "draft":
        return jobPostings.filter((p) => p.status === "draft")
      case "completed":
        return jobPostings.filter((p) => p.status === "filled")
      case "template":
        return jobPostings.filter((p) => p.status === "template")
      default:
        return jobPostings
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">{t("common.loading", "Laden...")}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const statusCounts = getStatusCounts()
  const filteredPostings = getFilteredPostings()

  // Define distinct colors for job posting cards to differentiate them visually
  const cardColors = [
    { bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-300" },
    { bg: "bg-emerald-100", text: "text-emerald-600", border: "border-emerald-300" },
    { bg: "bg-violet-100", text: "text-violet-600", border: "border-violet-300" },
    { bg: "bg-amber-100", text: "text-amber-600", border: "border-amber-300" },
    { bg: "bg-rose-100", text: "text-rose-600", border: "border-rose-300" },
    { bg: "bg-cyan-100", text: "text-cyan-600", border: "border-cyan-300" },
    { bg: "bg-indigo-100", text: "text-indigo-600", border: "border-indigo-300" },
    { bg: "bg-teal-100", text: "text-teal-600", border: "border-teal-300" },
    { bg: "bg-orange-100", text: "text-orange-600", border: "border-orange-300" },
    { bg: "bg-pink-100", text: "text-pink-600", border: "border-pink-300" },
  ]

  const getCardColor = (index: number) => {
    return cardColors[index % cardColors.length]
  }

  const JobPostingCard = ({ posting, index }: { posting: JobPosting; index: number }) => {
    const statusConfig = getStatusConfig(posting.status)
    const employmentConfig = getEmploymentTypeConfig(posting.employment_type)
    const StatusIcon = statusConfig.icon
    const startDate = formatStartDate(posting.start_month, posting.start_year)
    const publishedDate = formatPublishedDate(posting.published_at)
    const cardColor = getCardColor(index)

    return (
      <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/30">
        <div className={cn("absolute top-0 left-0 right-0 h-1", cardColor.bg)} />

        <CardContent className="p-5 pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={cn("rounded-lg p-2.5 shrink-0", cardColor.bg)}>
                  <Briefcase className={cn("h-5 w-5", cardColor.text)} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base leading-tight truncate">{posting.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-medium border-0", statusConfig.bgColor, statusConfig.color)}
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                    <Badge variant="outline" className={cn("text-xs font-medium border-0", employmentConfig.color)}>
                      {employmentConfig.label}
                    </Badge>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setEditingPosting(posting)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicate(posting)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplizieren
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusToggle(posting)}>
                    {posting.status === "published" ? (
                      <>
                        <Archive className="h-4 w-4 mr-2" />
                        Als Entwurf speichern
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4 mr-2" />
                        Veröffentlichen
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(posting.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="truncate">{formatDepartment(posting.department)}</span>
              </div>

              {posting.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">{posting.location}</span>
                </div>
              )}

              {startDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  <span>Start: {startDate}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span>
                  {publishedDate
                    ? `Veröffentlicht: ${publishedDate}`
                    : `Erstellt: ${new Date(posting.created_at).toLocaleDateString("de-DE")}`}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{posting.candidates_count || 0} Bewerber</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingPosting(posting)} className="h-8">
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Bearbeiten
                </Button>
                {posting.status === "published" && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => router.push(`/hiring/candidates?jobId=${posting.id}`)}
                    className="h-8"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    Ansehen
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("hiring.jobPostingsTitle", "Stellenausschreibungen")}</CardTitle>
              <CardDescription>
                {t("hiring.jobPostingsDescription", "Verwalten Sie offene Positionen und Stellenangebote")}
              </CardDescription>
            </div>
            <Button onClick={() => router.push("/hiring/new")}>
              <Plus className="h-4 w-4 mr-2" />
              {t("hiring.newJobPosting", "Neue Stelle")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="active" className="flex items-center gap-2">
                {t("hiring.status.active", "Aktiv")}
                {statusCounts.active > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">
                    {statusCounts.active}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="draft" className="flex items-center gap-2">
                {t("hiring.status.drafts", "Entwürfe")}
                {statusCounts.draft > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">
                    {statusCounts.draft}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                {t("hiring.status.completed", "Abgeschlossen")}
                {statusCounts.completed > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">
                    {statusCounts.completed}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="template" className="flex items-center gap-2">
                {t("hiring.status.templates", "Vorlagen")}
                {statusCounts.template > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">
                    {statusCounts.template}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter} className="mt-0">
              {filteredPostings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Briefcase className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">
                    {statusFilter === "active" && "Keine aktiven Stellen"}
                    {statusFilter === "draft" && "Keine Entwürfe"}
                    {statusFilter === "completed" && "Keine abgeschlossenen Stellen"}
                    {statusFilter === "template" && "Keine Vorlagen"}
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    {statusFilter === "active" &&
                      "Erstellen Sie eine neue Stellenausschreibung und veröffentlichen Sie diese."}
                    {statusFilter === "draft" && "Entwürfe werden hier angezeigt, bevor sie veröffentlicht werden."}
                    {statusFilter === "completed" && "Abgeschlossene Stellenausschreibungen erscheinen hier."}
                    {statusFilter === "template" &&
                      "Erstellen Sie Vorlagen für häufig genutzte Stellenausschreibungen."}
                  </p>
                  <Button className="mt-4" onClick={() => router.push("/hiring/new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Neue Stelle erstellen
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredPostings.map((posting, index) => (
                    <JobPostingCard key={posting.id} posting={posting} index={index} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {editingPosting && (
        <EditJobPostingDialog
          open={!!editingPosting}
          onOpenChange={(open) => !open && setEditingPosting(null)}
          posting={editingPosting}
          onSuccess={async () => {
            await mutateJobPostings()
            onUpdate?.()
          }}
        />
      )}
    </>
  )
}
