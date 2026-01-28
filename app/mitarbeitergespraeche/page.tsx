"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import useSWR from "swr"
import { AppLayout } from "@/components/app-layout"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Plus,
  Search,
  Calendar,
  Star,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Eye,
  Trash2,
  MessageSquare,
  Filter,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { TeamMemberAppraisalsTab } from "@/components/team/team-member-appraisals-tab"
import { format, parseISO, isAfter, isBefore, addMonths } from "date-fns"
import { de } from "date-fns/locale"
import { SWR_KEYS } from "@/lib/swr-keys"
import { swrFetcher } from "@/lib/swr-fetcher"

interface Appraisal {
  id: string
  practice_id: number
  employee_id: string
  appraiser_id: string
  appraisal_type: string
  appraisal_date: string
  period_start?: string
  period_end?: string
  status: string
  overall_rating?: number
  performance_areas?: Array<{ name: string; rating: number; weight: number; comment?: string }>
  competencies?: Array<{ name: string; current_level: number; target_level: number; gap: number }>
  goals_review?: Array<{ goal: string; achievement: number; comment?: string }>
  new_goals?: Array<{ goal: string; target_date?: string; success_criteria?: string }>
  development_plan?: Array<{ action: string; timeline?: string; resources?: string; status?: string }>
  strengths?: string
  areas_for_improvement?: string
  achievements?: string
  challenges?: string
  employee_self_rating?: number
  employee_comments?: string
  manager_summary?: string
  manager_recommendations?: string
  career_aspirations?: string
  promotion_readiness?: string
  succession_potential?: string
  salary_review_notes?: string
  salary_recommendation?: string
  bonus_recommendation?: string
  next_review_date?: string
  follow_up_actions?: Array<{ action: string; due_date?: string; responsible?: string }>
  created_at: string
  updated_at: string
  employee?: {
    id: string
    name: string
    email: string
    role: string
    avatar_url?: string
  }
  appraiser?: {
    id: string
    name: string
    email: string
    role: string
    avatar_url?: string
  }
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  avatar_url?: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Entwurf", color: "bg-gray-100 text-gray-700", icon: <FileText className="h-3 w-3" /> },
  scheduled: { label: "Geplant", color: "bg-blue-100 text-blue-700", icon: <Calendar className="h-3 w-3" /> },
  in_progress: { label: "In Bearbeitung", color: "bg-yellow-100 text-yellow-700", icon: <Clock className="h-3 w-3" /> },
  completed: {
    label: "Abgeschlossen",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  cancelled: { label: "Abgebrochen", color: "bg-red-100 text-red-700", icon: <AlertCircle className="h-3 w-3" /> },
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  annual: { label: "Jahresgespräch", color: "bg-purple-100 text-purple-700" },
  semi_annual: { label: "Halbjahresgespräch", color: "bg-indigo-100 text-indigo-700" },
  quarterly: { label: "Quartalsgespräch", color: "bg-cyan-100 text-cyan-700" },
  probation: { label: "Probezeit", color: "bg-orange-100 text-orange-700" },
  special: { label: "Sondergespräch", color: "bg-pink-100 text-pink-700" },
}

export default function MitarbeitergespraechePage() {
  const router = useRouter()
  const { currentPractice } = usePractice()
  const { currentUser, isAdmin, isSuperAdmin } = useUser()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedAppraisal, setSelectedAppraisal] = useState<Appraisal | null>(null)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [appraisalToDelete, setAppraisalToDelete] = useState<Appraisal | null>(null)

  const practiceId = currentPractice?.id?.toString()

  const {
    data: appraisals = [],
    isLoading: appraisalsLoading,
    mutate: mutateAppraisals,
  } = useSWR<Appraisal[]>(practiceId ? SWR_KEYS.appraisals(practiceId) : null, swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })

  const { data: teamMembers = [], isLoading: teamLoading } = useSWR<TeamMember[]>(
    practiceId ? SWR_KEYS.teamMembers(practiceId) : null,
    swrFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    },
  )

  const loading = appraisalsLoading || teamLoading

  // Filter team members based on user permissions
  const filteredTeamMembers = useMemo(() => {
    if (!Array.isArray(teamMembers)) return []
    return teamMembers.filter((m: TeamMember) => m.id !== currentUser?.id || isAdmin || isSuperAdmin)
  }, [teamMembers, currentUser?.id, isAdmin, isSuperAdmin])

  const handleDelete = async () => {
    if (!appraisalToDelete || !practiceId) return

    // Optimistic update - remove from UI immediately
    const previousAppraisals = appraisals
    const safeAppraisals = Array.isArray(appraisals) ? appraisals : []
    mutateAppraisals(
      safeAppraisals.filter((a) => a.id !== appraisalToDelete.id),
      { revalidate: false },
    )

    try {
      const res = await fetch(`/api/practices/${practiceId}/appraisals/${appraisalToDelete.id}`, { method: "DELETE" })

      if (res.ok) {
        toast.success("Mitarbeitergespräch gelöscht")
      } else {
        // Rollback on error
        mutateAppraisals(previousAppraisals, { revalidate: false })
        toast.error("Fehler beim Löschen")
      }
    } catch (error) {
      // Rollback on error
      mutateAppraisals(previousAppraisals, { revalidate: false })
      console.error("Error deleting appraisal:", error)
      toast.error("Fehler beim Löschen")
    } finally {
      setIsDeleteDialogOpen(false)
      setAppraisalToDelete(null)
    }
  }

  const filteredAppraisals = useMemo(() => {
    if (!Array.isArray(appraisals)) return []
    return appraisals.filter((appraisal) => {
      const matchesSearch =
        !searchQuery ||
        appraisal.employee?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appraisal.employee?.email?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || appraisal.status === statusFilter
      const matchesType = typeFilter === "all" || appraisal.appraisal_type === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })
  }, [appraisals, searchQuery, statusFilter, typeFilter])

  // Statistics
  const stats = useMemo(() => {
    const safeAppraisals = Array.isArray(appraisals) ? appraisals : []
    return {
      total: safeAppraisals.length,
      completed: safeAppraisals.filter((a) => a.status === "completed").length,
      pending: safeAppraisals.filter((a) => ["draft", "scheduled", "in_progress"].includes(a.status)).length,
      upcoming: safeAppraisals.filter((a) => {
        if (!a.next_review_date) return false
        const nextDate = parseISO(a.next_review_date)
        return isAfter(nextDate, new Date()) && isBefore(nextDate, addMonths(new Date(), 3))
      }).length,
      avgRating:
        safeAppraisals.filter((a) => a.overall_rating).reduce((sum, a) => sum + (a.overall_rating || 0), 0) /
          (safeAppraisals.filter((a) => a.overall_rating).length || 1) || 0,
    }
  }, [appraisals])

  const renderRating = (rating?: number) => {
    if (!rating) return <span className="text-muted-foreground">-</span>
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Mitarbeitergespräche</h1>
            <p className="text-muted-foreground">
              Planen und verwalten Sie strukturierte Mitarbeitergespräche für Ihr Team
            </p>
          </div>
          <Button onClick={() => router.push("/mitarbeitergespraeche/neu")}>
            <Plus className="h-4 w-4 mr-2" />
            Neues Gespräch
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Abgeschlossen</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ausstehend</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nächste 3 Monate</p>
                  <p className="text-2xl font-bold">{stats.upcoming}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100">
                  <Star className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ø Bewertung</p>
                  <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Mitarbeiter suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Appraisals List */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Listenansicht</TabsTrigger>
            <TabsTrigger value="team">Nach Mitarbeiter</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {filteredAppraisals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Keine Gespräche gefunden</h3>
                  <p className="text-muted-foreground text-center max-w-md mt-2">
                    {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                      ? "Versuchen Sie, Ihre Filter anzupassen"
                      : "Erstellen Sie Ihr erstes Mitarbeitergespräch, um loszulegen"}
                  </p>
                  {!searchQuery && statusFilter === "all" && typeFilter === "all" && (
                    <Button className="mt-4" onClick={() => router.push("/mitarbeitergespraeche/neu")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Neues Gespräch
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredAppraisals.map((appraisal) => {
                  const statusConfig = STATUS_CONFIG[appraisal.status] || STATUS_CONFIG.draft
                  const typeConfig = TYPE_CONFIG[appraisal.appraisal_type] || TYPE_CONFIG.annual

                  return (
                    <Card key={appraisal.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={appraisal.employee?.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback>
                                {appraisal.employee?.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("") || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{appraisal.employee?.name || "Unbekannt"}</h3>
                                <Badge variant="outline" className={typeConfig.color}>
                                  {typeConfig.label}
                                </Badge>
                                <Badge variant="outline" className={statusConfig.color}>
                                  <span className="mr-1">{statusConfig.icon}</span>
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {appraisal.employee?.role} •{" "}
                                {format(parseISO(appraisal.appraisal_date), "dd.MM.yyyy", { locale: de })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {renderRating(appraisal.overall_rating)}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    const member = filteredTeamMembers.find((m) => m.id === appraisal.employee_id)
                                    if (member) {
                                      setSelectedMember(member)
                                      setSelectedAppraisal(appraisal)
                                      setIsViewDialogOpen(true)
                                    }
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Anzeigen / Bearbeiten
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setAppraisalToDelete(appraisal)
                                    setIsDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Löschen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            {filteredTeamMembers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Keine Teammitglieder gefunden</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeamMembers.map((member) => {
                  const safeAppraisalsForMember = Array.isArray(appraisals) ? appraisals : []
                  const memberAppraisals = safeAppraisalsForMember.filter((a) => a.employee_id === member.id)
                  const latestAppraisal = memberAppraisals[0]

                  return (
                    <Card
                      key={member.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedMember(member)
                        setIsViewDialogOpen(true)
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {member.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("") || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold">{member.name}</h3>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{memberAppraisals.length} Gespräche</span>
                          {latestAppraisal && (
                            <Badge variant="outline" className={STATUS_CONFIG[latestAppraisal.status]?.color}>
                              {STATUS_CONFIG[latestAppraisal.status]?.label}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedMember?.name ? `Gespräche für ${selectedMember.name}` : "Mitarbeitergespräche"}
              </DialogTitle>
            </DialogHeader>
            {selectedMember && practiceId && (
              <TeamMemberAppraisalsTab
                memberId={selectedMember.id}
                practiceId={practiceId}
                memberName={selectedMember.name}
                isAdmin={isAdmin}
                currentUserId={currentUser?.id}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mitarbeitergespräch löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Sind Sie sicher, dass Sie dieses Mitarbeitergespräch löschen möchten? Diese Aktion kann nicht rückgängig
                gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  )
}
