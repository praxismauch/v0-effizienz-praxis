"use client"

import { useState, useMemo, useEffect, lazy, Suspense, useCallback } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTeam } from "@/contexts/team-context"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useTranslation } from "@/contexts/translation-context"
import {
  UserPlus,
  Shield,
  Users,
  Calendar,
  Sparkles,
  UsersIcon,
  Thermometer,
  Palmtree,
  Printer,
  ClipboardList,
  Clock,
  Building2,
  GripVertical,
} from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { PageHeader } from "@/components/page-header"
import { AITeamAnalysisDialog } from "@/components/team/ai-team-analysis-dialog"
import { CreateTeamMemberDialog } from "@/components/team/create-team-member-dialog"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { formatGermanNumber } from "@/lib/utils/number-format"
import { StatCard, statCardColors } from "@/components/ui/stat-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StaffingPlansManager } from "@/components/team/staffing-plans-manager"
import { StaffingPlanGrid } from "@/components/team/staffing-plan-grid"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { isPracticeAdminRole } from "@/lib/auth-utils"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

const HolidayPlanner = lazy(() =>
  import("@/components/holiday-planner").then((mod) => ({ default: mod.HolidayPlanner })),
)
const SickLeavesManager = lazy(() =>
  import("@/components/sick-leaves-manager").then((mod) => ({ default: mod.SickLeavesManager })),
)

const TabLoading = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
)

interface Responsibility {
  id: string
  name: string
  description?: string
  category?: string
  group_name?: string
  responsible_user_id?: string
  responsible_user_name?: string
  deputy_user_id?: string
  deputy_user_name?: string
  suggested_hours_per_week?: number
  cannot_complete_during_consultation?: boolean
  optimization_suggestions?: string
  is_active?: boolean
}

interface SortableTeamCardProps {
  team: {
    id: string
    name: string
    description?: string
    color?: string
  }
  teamMemberCount: number
  cardStyles: { backgroundColor: string; borderLeftColor: string }
  teamColor: string
  onEdit: () => void
  onDelete: () => void
  isPracticeAdmin: boolean
}

function SortableTeamCard({
  team,
  teamMemberCount,
  cardStyles,
  teamColor,
  onEdit,
  onDelete,
  isPracticeAdmin,
}: SortableTeamCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: team.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: cardStyles.backgroundColor,
    borderLeftColor: cardStyles.borderLeftColor,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border-l-4 p-4 transition-shadow hover:shadow-md ${isDragging ? "shadow-lg z-50" : ""}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Drag handle - only show for practice admins */}
          {isPracticeAdmin && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-black/5 rounded"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: teamColor }} />
          <h3 className="font-semibold text-foreground">{team.name}</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Bearbeiten
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{team.description || "Keine Beschreibung"}</p>
      <div>
        <span className="text-2xl font-bold text-foreground">{teamMemberCount}</span>
        <p className="text-sm text-muted-foreground">Mitglieder</p>
      </div>
    </div>
  )
}

export default function TeamPageClient() {
  const { currentUser, isLoading: userLoading, isSuperAdmin } = useUser()
  const { currentPractice } = usePractice()
  const router = useRouter()
  const { t } = useTranslation()
  const { toast } = useToast()
  const {
    teamMembers,
    pendingInvites,
    teams,
    addTeam,
    updateTeam,
    deleteTeam,
    reorderTeams, // Get reorderTeams from context
    assignMemberToTeam,
    removeMemberFromTeam,
    inviteTeamMember,
    updateTeamMember,
    removeTeamMember,
    refetchTeamMembers,
    departments,
    contracts,
  } = useTeam()

  const [isLoading, setIsLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [showNoPracticeError, setShowNoPracticeError] = useState(false)

  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") || "members"

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.push(`/team?${params.toString()}`, { scroll: false })
  }

  const [createMemberDialogOpen, setCreateMemberDialogOpen] = useState(false)

  const isAdmin = currentUser?.role === "admin"
  const isPracticeAdmin = isPracticeAdminRole(currentUser?.role)

  const [orgaCategories, setOrgaCategories] = useState<Array<{ id: string; name: string; color: string }>>([])

  const [useWorkloadCalculator, setUseWorkloadCalculator] = useState(false)
  const [totalHours, setTotalHours] = useState<string>("")
  const [timePeriod, setTimePeriod] = useState<"month" | "quarter" | "year">("month")

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleTeamDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = teams.findIndex((t) => t.id === active.id)
      const newIndex = teams.findIndex((t) => t.id === over.id)
      const newOrder = arrayMove(teams, oldIndex, newIndex)
      reorderTeams(newOrder.map((t) => t.id))
    }
  }

  useEffect(() => {
    if (useWorkloadCalculator && totalHours) {
      const hours = Number.parseFloat(totalHours.replace(",", "."))
      if (!isNaN(hours)) {
        let weeksInPeriod = 4
        if (timePeriod === "quarter") weeksInPeriod = 13
        if (timePeriod === "year") weeksInPeriod = 52

        const weeklyHours = hours / weeksInPeriod
        setResponsibilityFormData({
          ...responsibilityFormData,
          suggested_hours_per_week: weeklyHours,
        })
        setHoursDisplayValue(formatGermanNumber(weeklyHours))
      }
    }
  }, [useWorkloadCalculator, totalHours, timePeriod])

  useEffect(() => {
    if (userLoading) {
      return
    }

    setAuthChecked(true)

    if (!currentUser) {
      router.push("/auth/login")
      return
    }

    const isSuperAdminUser = currentUser?.role === "superadmin"

    if (!currentUser?.practice_id && !isSuperAdminUser) {
      setShowNoPracticeError(true)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
  }, [currentUser, router, userLoading, isSuperAdmin])

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("name")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [teamDialogOpen, setTeamDialogOpen] = useState(false)
  const [teamAssignDialogOpen, setTeamAssignDialogOpen] = useState(false)
  const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<any>(null)
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"doctor" | "nurse" | "receptionist">("doctor")
  const [newTeamName, setNewTeamName] = useState("")
  const [newTeamDescription, setNewTeamDescription] = useState("")
  const [newTeamColor, setNewTeamColor] = useState("#3b82f6")
  const [staffingPlan, setStaffingPlan] = useState<any[]>([])
  const [staffingPlans, setStaffingPlans] = useState<any[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const [responsibilities, setResponsibilities] = useState<Responsibility[]>([])
  const [responsibilitiesLoading, setResponsibilitiesLoading] = useState(false)
  const [aiResponsibilityDialogOpen, setAiResponsibilityDialogOpen] = useState(false)
  const [responsibilityDialogOpen, setResponsibilityDialogOpen] = useState(false)
  const [editingResponsibility, setEditingResponsibility] = useState<any>(null)
  const [responsibilityFormData, setResponsibilityFormData] = useState({
    name: "",
    description: "",
    group_name: "",
    responsible_user_id: null as string | null,
    deputy_user_id: null as string | null,
    team_member_ids: [] as string[],
    suggested_hours_per_week: null as number | null,
    cannot_complete_during_consultation: false,
    responsible_user_name: null as string | null,
    deputy_user_name: null as string | null,
  })
  const [hoursDisplayValue, setHoursDisplayValue] = useState<string>("")

  const [orgChartPositions, setOrgChartPositions] = useState<any[]>([])
  const [orgChartDialogOpen, setOrgChartDialogOpen] = useState(false)
  const [editingOrgChartPosition, setEditingOrgChartPosition] = useState<any>(null)
  const [editingPosition, setEditingPosition] = useState<any>(null)
  const [positionFormData, setPositionFormData] = useState({
    position_title: "",
    department: "",
    user_id: "none",
    reports_to_position_id: "none",
    level: 1,
    is_management: false,
    display_order: 0,
    color: "#3b82f6",
  })

  const [orgChartFullscreenOpen, setOrgChartFullscreenOpen] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState<{ id: string; name: string } | null>(null)

  const practiceId = currentPractice?.id || "0"

  const filteredAndSortedMembers = useMemo(() => {
    const filtered = teamMembers.filter((member) => {
      const matchesSearch =
        member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesRole = selectedRoles.length === 0 || selectedRoles.includes(member.role)

      const matchesTeam =
        selectedTeams.length === 0 ||
        (member.teamIds && member.teamIds.some((id: string) => selectedTeams.includes(id)))

      return matchesSearch && matchesRole && matchesTeam
    })

    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "")
      }
      if (sortBy === "role") {
        return (a.role || "").localeCompare(b.role || "")
      }
      return 0
    })

    return filtered
  }, [teamMembers, searchQuery, selectedRoles, selectedTeams, sortBy])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "doctor":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "nurse":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "receptionist":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator"
      case "doctor":
        return "Arzt"
      case "nurse":
        return "Krankenschwester"
      case "receptionist":
        return "Rezeptionist"
      default:
        return role
    }
  }

  const getTeamName = (teamId: string) => {
    return teams.find((team) => team.id === teamId)?.name || "Unknown Team"
  }

  const fetchStaffingPlan = async () => {
    if (!selectedPlanId || !currentPractice?.id) {
      if (!currentPractice?.id) {
        toast({
          title: "Fehler",
          description: "Keine Praxis-ID gefunden. Bitte laden Sie die Seite neu.",
          variant: "destructive",
        })
      }
      return
    }

    try {
      const res = await fetch(`/api/practices/${currentPractice.id}/staffing-plan?planId=${selectedPlanId}`)
      if (res.ok) {
        const data = await res.json()
        setStaffingPlan(data)
      } else {
        toast({
          title: "Fehler",
          description: "Personalplan konnte nicht geladen werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching staffing plan:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Laden des Personalplans.",
        variant: "destructive",
      })
    }
  }

  const fetchStaffingPlans = async () => {
    if (!currentPractice?.id) {
      toast({
        title: "Fehler",
        description: "Keine Praxis-ID gefunden. Bitte laden Sie die Seite neu.",
        variant: "destructive",
      })
      return
    }

    try {
      const res = await fetch(`/api/practices/${currentPractice.id}/staffing-plans`)
      if (res.ok) {
        const data = await res.json()
        setStaffingPlans(data)
        setSelectedPlanId((prevId) => {
          if (!prevId && data.length > 0) {
            return data[0].id
          }
          if (prevId && data.some((plan: { id: string }) => plan.id === prevId)) {
            return prevId
          }
          return data.length > 0 ? data[0].id : null
        })
      } else {
        toast({
          title: "Fehler",
          description: "Personalpläne konnten nicht geladen werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching staffing plans:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Personalpläne.",
        variant: "destructive",
      })
    }
  }

  const fetchResponsibilities = useCallback(async () => {
    if (!practiceId) {
      toast({
        title: "Fehler",
        description: "Keine Praxis-ID gefunden. Bitte laden Sie die Seite neu.",
        variant: "destructive",
      })
      return
    }

    setResponsibilitiesLoading(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/responsibilities`)
      if (response.ok) {
        const data = await response.json()
        setResponsibilities(data || [])
      } else {
        toast({
          title: "Fehler",
          description: "Verantwortlichkeiten konnten nicht geladen werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching responsibilities:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Verantwortlichkeiten.",
        variant: "destructive",
      })
    } finally {
      setResponsibilitiesLoading(false)
    }
  }, [practiceId])

  const fetchOrgaCategories = async () => {
    if (!practiceId) {
      toast({
        title: "Fehler",
        description: "Keine Praxis-ID gefunden. Bitte laden Sie die Seite neu.",
        variant: "destructive",
      })
      return
    }
    try {
      const response = await fetch(`/api/practices/${practiceId}/orga-categories`)
      if (response.ok) {
        const data = await response.json()
        setOrgaCategories(data || [])
      } else {
        toast({
          title: "Fehler",
          description: "Organisationskategorien konnten nicht geladen werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching organization categories:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Organisationskategorien.",
        variant: "destructive",
      })
    }
  }

  const fetchOrgChart = async () => {
    if (!practiceId) {
      toast({
        title: "Fehler",
        description: "Keine Praxis-ID gefunden. Bitte laden Sie die Seite neu.",
        variant: "destructive",
      })
      return
    }
    try {
      const response = await fetch(`/api/practices/${practiceId}/org-chart`)
      if (response.ok) {
        const data = await response.json()
        setOrgChartPositions(data || [])
      } else {
        toast({
          title: "Fehler",
          description: "Organigramm konnte nicht geladen werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching org chart positions:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Laden des Organigramms.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (practiceId && practiceId !== "0") {
      fetchStaffingPlans()
      fetchResponsibilities()
      fetchOrgaCategories()
      fetchOrgChart()
    }
  }, [practiceId])

  useEffect(() => {
    if (selectedPlanId) {
      fetchStaffingPlan()
    }
  }, [selectedPlanId])

  // Add fetchResponsibilities call inside this useEffect
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()

      const [{ data: responsibilitiesData }, { data: usersData }] = await Promise.all([
        supabase.from("responsibilities").select("*").eq("practice_id", practiceId).order("name"),
        supabase.from("users").select("id, name").eq("practice_id", practiceId),
      ])

      if (responsibilitiesData && usersData) {
        const usersMap = new Map(usersData.map((user) => [user.id, user]))

        const validResponsibilities = responsibilitiesData.map((resp: any) => ({
          ...resp,
          responsible_user_id:
            resp.responsible_user_id && resp.responsible_user_id.trim() !== "" ? resp.responsible_user_id : null,
          responsible_user_name: resp.responsible_user_id ? usersMap.get(resp.responsible_user_id)?.name || null : null,
          deputy_user_name: resp.deputy_user_id ? usersMap.get(resp.deputy_user_id)?.name || null : null,
          group_name: resp.group_name || "",
          cannot_complete_during_consultation: resp.cannot_complete_during_consultation || false,
        }))
        setResponsibilities(validResponsibilities)
      }

      const { data: positionsData } = await supabase
        .from("org_chart_positions")
        .select(
          "id, practice_id, position_title, department, user_id, reports_to_position_id, level, display_order, color, is_active, created_at, updated_at, created_by",
        )
        .eq("practice_id", practiceId)
        .order("position_title")

      if (positionsData) {
        const validPositions = positionsData.map((pos) => ({
          ...pos,
          user_id: pos.user_id && pos.user_id.trim() !== "" ? pos.user_id : null,
          reports_to_position_id:
            pos.reports_to_position_id && pos.reports_to_position_id.trim() !== "" ? pos.reports_to_position_id : null,
          title: pos.title || pos.position_title,
          color: pos.color || "#3b82f6",
          is_management: (pos.level ?? 99) <= 1,
        }))
        setOrgChartPositions(validPositions)
      }
    }

    if (practiceId && practiceId !== "0") {
      loadData()
    }
  }, [practiceId, teamMembers])

  const handleEditResponsibility = (resp: any) => {
    setEditingResponsibility(resp)
    setResponsibilityFormData({
      name: resp.name || "",
      description: resp.description || "",
      group_name: resp.group_name || "",
      responsible_user_id: resp.responsible_user_id || null,
      deputy_user_id: resp.deputy_user_id || null,
      team_member_ids: resp.team_member_ids || [],
      suggested_hours_per_week: resp.suggested_hours_per_week || null,
      cannot_complete_during_consultation: resp.cannot_complete_during_consultation || false,
      responsible_user_name: resp.responsible_user_name || null,
      deputy_user_name: resp.deputy_user_name || null,
    })
    setHoursDisplayValue(formatGermanNumber(resp.suggested_hours_per_week) || "")
    setUseWorkloadCalculator(false)
    setTotalHours("")
    setTimePeriod("month")
    setResponsibilityDialogOpen(true)
  }

  const handleEditPosition = (pos: any) => {
    setEditingPosition(pos)
    setEditingOrgChartPosition(pos)
    setPositionFormData({
      position_title: pos.position_title,
      department: pos.department || "",
      user_id: pos.user_id || "none",
      reports_to_position_id: pos.reports_to_position_id || "none",
      level: pos.level || 1,
      is_management: pos.is_management || false,
      display_order: pos.display_order || 0,
      color: pos.color || "#3b82f6",
    })
    setOrgChartDialogOpen(true)
  }

  const handlePrintResponsibilities = () => {
    window.print()
  }

  const getTeamCardStyles = (color: string) => {
    const hex = color.replace("#", "")
    const r = Number.parseInt(hex.substring(0, 2), 16)
    const g = Number.parseInt(hex.substring(2, 4), 16)
    const b = Number.parseInt(hex.substring(4, 6), 16)

    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`,
      borderLeftColor: color,
    }
  }

  const responsibilityStats = useMemo(() => {
    const insideConsultation = responsibilities.filter((r) => !r.cannot_complete_during_consultation)
    const outsideConsultation = responsibilities.filter((r) => r.cannot_complete_during_consultation)

    const insideHours = insideConsultation.reduce((sum, r) => sum + (r.suggested_hours_per_week || 0), 0)
    const outsideHours = outsideConsultation.reduce((sum, r) => sum + (r.suggested_hours_per_week || 0), 0)

    return {
      total: responsibilities.length,
      insideConsultation,
      outsideConsultation,
      insideHours,
      outsideHours,
      totalHours: insideHours + outsideHours,
    }
  }, [responsibilities])

  const handleCreateTeam = async () => {
    if (!currentPractice?.id || !newTeamName.trim()) return

    try {
      const res = await fetch(`/api/practices/${currentPractice.id}/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDescription,
          color: newTeamColor,
        }),
      })
      if (res.ok) {
        const newTeam = await res.json()
        toast({
          title: "Erfolg",
          description: "Team erfolgreich erstellt.",
        })
        setTeamDialogOpen(false)
        setNewTeamName("")
        setNewTeamDescription("")
        setNewTeamColor("#3b82f6")
        if (addTeam && newTeam) {
          addTeam(newTeam)
        }
      } else {
        const errorData = await res.json()
        toast({
          title: "Fehler",
          description: errorData.message || "Team konnte nicht erstellt werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating team:", error)
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTeam = async () => {
    if (!editingTeam || !currentPractice?.id || !newTeamName.trim()) return

    try {
      const res = await fetch(`/api/practices/${currentPractice.id}/teams/${editingTeam.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDescription,
          color: newTeamColor,
        }),
      })
      if (res.ok) {
        const updatedTeam = await res.json()
        toast({
          title: "Erfolg",
          description: "Team erfolgreich aktualisiert.",
        })
        setEditTeamDialogOpen(false)
        setEditingTeam(null)
        setNewTeamName("")
        setNewTeamDescription("")
        setNewTeamColor("#3b82f6")
        if (updatedTeam) {
          updateTeam(updatedTeam.id, updatedTeam)
        }
      } else {
        const errorData = await res.json()
        toast({
          title: "Fehler",
          description: errorData.message || "Team konnte nicht aktualisiert werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating team:", error)
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!currentPractice?.id) return

    try {
      const res = await fetch(`/api/practices/${currentPractice.id}/teams/${teamId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast({
          title: "Erfolg",
          description: "Team erfolgreich gelöscht.",
        })
        setTeamToDelete(null)
        // Re-fetch teams
        const { data: teamsData } = await createClient().from("teams").select("*").eq("practice_id", currentPractice.id)
        // Similar to handleCreateTeam, update context state or re-fetch
      } else {
        const errorData = await res.json()
        toast({
          title: "Fehler",
          description: errorData.message || "Team konnte nicht gelöscht werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting team:", error)
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      })
    }
  }

  if (isLoading || userLoading || !authChecked) {
    return (
      <AppLayout loading={true} loadingMessage="Team wird geladen...">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    )
  }

  if (showNoPracticeError) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Keine Praxis zugeordnet</CardTitle>
              <CardDescription>
                Sie sind keiner Praxis zugeordnet. Bitte kontaktieren Sie Ihren Administrator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/">Zurück zur Startseite</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout practiceId={practiceId} showTrialIndicator>
      <div className="flex min-h-screen w-full bg-background">
        <div className="flex flex-1 flex-col">
          <PageHeader
            title="Team"
            description="Verwalten Sie Ihr Praxisteam, Abteilungen und Personalplanung"
            icon={Users}
          />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Gesamt Team-Mitglieder"
              value={teamMembers.length.toString()}
              description="Aktive Mitarbeiter"
              icon={Users}
              color={statCardColors.blue}
            />
            <StatCard
              title="Ausstehende Einladungen"
              value={pendingInvites.length.toString()}
              description="Ausstehende Antworten"
              icon={UserPlus}
              color={statCardColors.yellow}
            />
            <StatCard
              title="Teams"
              value={teams.length.toString()}
              description="Aktive Teams"
              icon={Shield}
              color={statCardColors.green}
            />
          </div>

          {currentPractice && (
            <div className="flex justify-end">
              <AITeamAnalysisDialog practiceId={currentPractice.id}>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Sparkles className="h-4 w-4" />
                  AI Team-Analyse
                </Button>
              </AITeamAnalysisDialog>
            </div>
          )}

          <Card>
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger
                    value="members"
                    className="hover:ring-2 hover:ring-primary/20 hover:shadow-sm transition-all duration-200"
                  >
                    <UsersIcon className="h-4 w-4 mr-2" />
                    Mitglieder
                    {filteredAndSortedMembers.length > 0 && (
                      <Badge variant="secondary" className="ml-2 rounded-full">
                        {filteredAndSortedMembers.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="responsibilities"
                    className="hover:ring-2 hover:ring-primary/20 hover:shadow-sm transition-all duration-200"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Zuständigkeiten
                    {responsibilities.length > 0 && (
                      <Badge variant="secondary" className="ml-2 rounded-full">
                        {responsibilities.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="staffing"
                    className="hover:ring-2 hover:ring-primary/20 hover:shadow-sm transition-all duration-200"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Bedarfsplanung
                    {staffingPlans.length > 0 && (
                      <Badge variant="secondary" className="ml-2 rounded-full">
                        {staffingPlans.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="teams"
                    className="hover:ring-2 hover:ring-primary/20 hover:shadow-sm transition-all duration-200"
                  >
                    <UsersIcon className="h-4 w-4" />
                    Team / Gruppe
                    {teams.length > 0 && (
                      <Badge variant="secondary" className="ml-2 rounded-full">
                        {teams.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="holidays"
                    className="hover:ring-2 hover:ring-primary/20 hover:shadow-sm transition-all duration-200"
                  >
                    <Palmtree className="h-4 w-4 mr-2" />
                    Urlaubsplaner
                  </TabsTrigger>
                  <TabsTrigger
                    value="sickleaves"
                    className="hover:ring-2 hover:ring-primary/20 hover:shadow-sm transition-all duration-200"
                  >
                    <Thermometer className="h-4 w-4 mr-2" />
                    Krankmeldungen
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="space-y-4">
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                    <div className="flex flex-1 gap-2">
                      <Input
                        placeholder="Mitglieder suchen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-sm"
                      />
                    </div>
                    <Button onClick={() => setCreateMemberDialogOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Mitglied hinzufügen
                    </Button>
                  </div>

                  {filteredAndSortedMembers.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Keine Team-Mitglieder gefunden</h3>
                        <p className="text-muted-foreground text-center mb-4">
                          {searchQuery
                            ? "Keine Ergebnisse für Ihre Suche."
                            : "Fügen Sie Ihr erstes Team-Mitglied hinzu."}
                        </p>
                        <Button onClick={() => setCreateMemberDialogOpen(true)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Mitglied hinzufügen
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredAndSortedMembers.map((member) => (
                        <Card key={member.id} className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={member.avatar || undefined} alt={member.name} />
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {member.name?.charAt(0) || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <Link href={`/team/${member.id}`} className="hover:underline">
                                    <CardTitle className="text-base">{member.name}</CardTitle>
                                  </Link>
                                  <CardDescription className="text-xs">{member.email}</CardDescription>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {member.role || "Mitarbeiter"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm text-muted-foreground">
                              {member.department || "Keine Abteilung"}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="responsibilities" className="space-y-6">
                  {responsibilitiesLoading ? (
                    <TabLoading />
                  ) : (
                    <>
                      {/* Summary Cards */}
                      <div className="grid gap-4 md:grid-cols-4">
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/50">
                          <CardHeader className="pb-2">
                            <CardDescription className="text-blue-700 dark:text-blue-300">Gesamt</CardDescription>
                            <CardTitle className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                              {responsibilityStats.total}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                              {responsibilityStats.totalHours.toFixed(1)} Std/Woche
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200/50">
                          <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2 text-green-700 dark:text-green-300">
                              <Clock className="h-4 w-4" />
                              Während Sprechzeiten
                            </CardDescription>
                            <CardTitle className="text-3xl font-bold text-green-900 dark:text-green-100">
                              {responsibilityStats.insideConsultation.length}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              {responsibilityStats.insideHours.toFixed(1)} Std/Woche
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200/50">
                          <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                              <Building2 className="h-4 w-4" />
                              Außerhalb Sprechzeiten
                            </CardDescription>
                            <CardTitle className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                              {responsibilityStats.outsideConsultation.length}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                              {responsibilityStats.outsideHours.toFixed(1)} Std/Woche
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200/50">
                          <CardHeader className="pb-2">
                            <CardDescription className="text-purple-700 dark:text-purple-300">
                              Zeitverteilung
                            </CardDescription>
                            <CardTitle className="text-lg font-bold text-purple-900 dark:text-purple-100">
                              {responsibilityStats.totalHours > 0
                                ? `${((responsibilityStats.insideHours / responsibilityStats.totalHours) * 100).toFixed(0)}% / ${((responsibilityStats.outsideHours / responsibilityStats.totalHours) * 100).toFixed(0)}%`
                                : "0% / 0%"}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-purple-600 dark:text-purple-400">Innerhalb / Außerhalb</p>
                          </CardContent>
                        </Card>
                      </div>

                      {responsibilities.length === 0 ? (
                        <Card>
                          <CardContent className="flex flex-col items-center justify-center py-12">
                            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">Keine Zuständigkeiten vorhanden</h3>
                            <p className="text-muted-foreground text-center mb-4">
                              Definieren Sie Zuständigkeiten auf der Zuständigkeiten-Seite.
                            </p>
                            <Button variant="outline" onClick={() => router.push("/responsibilities")}>
                              <ClipboardList className="h-4 w-4 mr-2" />
                              Zur Zuständigkeiten-Seite
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid gap-6 lg:grid-cols-2">
                          {/* During Consultation Hours */}
                          <Card>
                            <CardHeader className="bg-green-50/50 dark:bg-green-950/20 border-b">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                    <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-lg">Während der Sprechzeiten</CardTitle>
                                    <CardDescription>
                                      Aufgaben, die während der Patientenbehandlung erledigt werden können
                                    </CardDescription>
                                  </div>
                                </div>
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                                >
                                  {responsibilityStats.insideHours.toFixed(1)} Std/Woche
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="divide-y">
                                {responsibilityStats.insideConsultation.length === 0 ? (
                                  <div className="p-6 text-center text-muted-foreground">
                                    Keine Aufgaben in dieser Kategorie
                                  </div>
                                ) : (
                                  responsibilityStats.insideConsultation.map((resp) => (
                                    <div key={resp.id} className="p-4 hover:bg-muted/50 transition-colors">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">{resp.name}</span>
                                            {resp.group_name && (
                                              <Badge variant="outline" className="text-xs">
                                                {resp.group_name}
                                              </Badge>
                                            )}
                                          </div>
                                          {resp.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                              {resp.description}
                                            </p>
                                          )}
                                          {resp.responsible_user_name && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              Verantwortlich: {resp.responsible_user_name}
                                              {resp.deputy_user_name && ` (Vertretung: ${resp.deputy_user_name})`}
                                            </p>
                                          )}
                                        </div>
                                        <div className="text-right ml-4">
                                          {resp.suggested_hours_per_week ? (
                                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                                              {resp.suggested_hours_per_week} Std/Wo
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-muted-foreground">
                                              Keine Zeit
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </CardContent>
                          </Card>

                          {/* Outside Consultation Hours */}
                          <Card>
                            <CardHeader className="bg-amber-50/50 dark:bg-amber-950/20 border-b">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                                    <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-lg">Außerhalb der Sprechzeiten</CardTitle>
                                    <CardDescription>
                                      Aufgaben, die außerhalb der Patientenbehandlung erledigt werden müssen
                                    </CardDescription>
                                  </div>
                                </div>
                                <Badge
                                  variant="secondary"
                                  className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                                >
                                  {responsibilityStats.outsideHours.toFixed(1)} Std/Woche
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="divide-y">
                                {responsibilityStats.outsideConsultation.length === 0 ? (
                                  <div className="p-6 text-center text-muted-foreground">
                                    Keine Aufgaben in dieser Kategorie
                                  </div>
                                ) : (
                                  responsibilityStats.outsideConsultation.map((resp) => (
                                    <div key={resp.id} className="p-4 hover:bg-muted/50 transition-colors">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">{resp.name}</span>
                                            {resp.group_name && (
                                              <Badge variant="outline" className="text-xs">
                                                {resp.group_name}
                                              </Badge>
                                            )}
                                          </div>
                                          {resp.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                              {resp.description}
                                            </p>
                                          )}
                                          {resp.responsible_user_name && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              Verantwortlich: {resp.responsible_user_name}
                                              {resp.deputy_user_name && ` (Vertretung: ${resp.deputy_user_name})`}
                                            </p>
                                          )}
                                        </div>
                                        <div className="text-right ml-4">
                                          {resp.suggested_hours_per_week ? (
                                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                              {resp.suggested_hours_per_week} Std/Wo
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-muted-foreground">
                                              Keine Zeit
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {/* Link to full responsibilities page */}
                      <div className="flex justify-center">
                        <Button variant="outline" onClick={() => router.push("/responsibilities")}>
                          <ClipboardList className="h-4 w-4 mr-2" />
                          Alle Zuständigkeiten verwalten
                        </Button>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="staffing" className="space-y-4">
                  <StaffingPlansManager
                    plans={staffingPlans}
                    selectedPlanId={selectedPlanId}
                    onSelectPlan={setSelectedPlanId}
                    onPlanCreated={fetchStaffingPlans}
                    onPlanUpdated={fetchStaffingPlans}
                    onPlanDeleted={fetchStaffingPlans}
                    practiceId={practiceId}
                    isAdmin={isPracticeAdminRole(currentUser?.role)}
                  />

                  <Card className="border-2 border-primary/10">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl font-bold">Personalbedarfsplanung</CardTitle>
                          <CardDescription className="mt-1">
                            Planen und verwalten Sie den Personalbedarf nach Wochentagen, Uhrzeiten und
                            Verantwortlichkeiten
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.print()
                          }}
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Drucken
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {selectedPlanId ? (
                        <StaffingPlanGrid
                          entries={staffingPlan}
                          teams={teams}
                          practiceId={practiceId}
                          selectedPlanId={selectedPlanId}
                          onRefresh={fetchStaffingPlan}
                          isAdmin={isPracticeAdminRole(currentUser?.role)}
                          responsibilities={responsibilities}
                        />
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Bitte wählen Sie einen Plan aus oder erstellen Sie einen neuen Plan</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="teams" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Team / Gruppe</h2>
                      <p className="text-muted-foreground">Organisieren Sie Ihre Praxis in Team / Gruppe</p>
                    </div>
                    <Button onClick={() => setTeamDialogOpen(true)}>
                      <UsersIcon className="h-4 w-4 mr-2" />
                      Team erstellen
                    </Button>
                  </div>

                  {teams.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Keine Teams vorhanden</h3>
                        <p className="text-muted-foreground text-center mb-4">
                          Erstellen Sie Teams, um Mitarbeiter zu organisieren.
                        </p>
                        <Button onClick={() => setTeamDialogOpen(true)}>
                          <UsersIcon className="h-4 w-4 mr-2" />
                          Erstes Team erstellen
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="p-6">
                      {isPracticeAdmin && (
                        <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                          <GripVertical className="h-4 w-4" />
                          Ziehen Sie die Teams per Drag & Drop, um die Reihenfolge zu ändern
                        </p>
                      )}
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTeamDragEnd}>
                        <SortableContext items={teams.map((t) => t.id)} strategy={rectSortingStrategy}>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {teams.map((team) => {
                              const teamMemberCount = teamMembers.filter(
                                (m) => m.team_ids?.includes(team.id) || m.team_id === team.id,
                              ).length
                              const teamColor = team.color || "#3b82f6"
                              const cardStyles = getTeamCardStyles(teamColor)

                              return (
                                <SortableTeamCard
                                  key={team.id}
                                  team={team}
                                  teamMemberCount={teamMemberCount}
                                  cardStyles={cardStyles}
                                  teamColor={teamColor}
                                  isPracticeAdmin={isPracticeAdmin}
                                  onEdit={() => {
                                    setEditingTeam(team)
                                    setNewTeamName(team.name)
                                    setNewTeamDescription(team.description || "")
                                    setNewTeamColor(team.color || "#3b82f6")
                                    setEditTeamDialogOpen(true)
                                  }}
                                  onDelete={() => setTeamToDelete({ id: team.id, name: team.name })}
                                />
                              )
                            })}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="holidays">
                  <Suspense fallback={<TabLoading />}>
                    <HolidayPlanner />
                  </Suspense>
                </TabsContent>

                <TabsContent value="sickleaves" className="space-y-4">
                  <Suspense fallback={<TabLoading />}>
                    <SickLeavesManager teamMembers={teamMembers} />
                  </Suspense>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <CreateTeamMemberDialog
            open={createMemberDialogOpen}
            onOpenChange={setCreateMemberDialogOpen}
            practiceId={currentPractice?.id || ""}
            onSuccess={refetchTeamMembers}
          />

          {/* Team Create Dialog */}
          <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neues Team erstellen</DialogTitle>
                <DialogDescription>Erstellen Sie ein neues Team, um Mitarbeiter zu organisieren.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Teamname</Label>
                  <Input
                    id="team-name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="z.B. Empfang, Labor, Ärzte"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-description">Beschreibung</Label>
                  <Input
                    id="team-description"
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    placeholder="Kurze Beschreibung des Teams"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-color">Teamfarbe</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="team-color"
                      value={newTeamColor}
                      onChange={(e) => setNewTeamColor(e.target.value)}
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                    <Input value={newTeamColor} onChange={(e) => setNewTeamColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTeamDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleCreateTeam} disabled={!newTeamName.trim()}>
                  Team erstellen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Team Edit Dialog */}
          <Dialog open={editTeamDialogOpen} onOpenChange={setEditTeamDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Team bearbeiten</DialogTitle>
                <DialogDescription>Bearbeiten Sie die Informationen des Teams.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-team-name">Teamname</Label>
                  <Input
                    id="edit-team-name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="z.B. Empfang, Labor, Ärzte"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-team-description">Beschreibung</Label>
                  <Input
                    id="edit-team-description"
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    placeholder="Kurze Beschreibung des Teams"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-team-color">Teamfarbe</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="edit-team-color"
                      value={newTeamColor}
                      onChange={(e) => setNewTeamColor(e.target.value)}
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                    <Input value={newTeamColor} onChange={(e) => setNewTeamColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditTeamDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleUpdateTeam} disabled={!newTeamName.trim()}>
                  Speichern
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Team Delete Confirmation Dialog */}
          <AlertDialog open={!!teamToDelete} onOpenChange={(open) => !open && setTeamToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Team löschen</AlertDialogTitle>
                <AlertDialogDescription>
                  Sind Sie sicher, dass Sie das Team "{teamToDelete?.name}" löschen möchten? Diese Aktion kann nicht
                  rückgängig gemacht werden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => teamToDelete && handleDeleteTeam(teamToDelete.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </AppLayout>
  )
}
