"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { usePractice } from "@/contexts/practice-context"
import { useTeam } from "@/contexts/team-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  GraduationCap,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Package,
  Search,
  Filter,
  Plus,
  Loader2,
  Users,
  LayoutGrid,
  AlertCircle,
  ShieldCheck,
  Eye,
} from "lucide-react"
import { format, parseISO, isBefore, addDays } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { isActiveMember } from "@/lib/utils/team-member-filter"

interface Training {
  id: string
  device_id: string
  device_name?: string
  team_member_id: string
  team_member_name: string
  training_date: string
  trainer_name?: string
  trainer_role?: string
  training_type: string
  valid_until?: string
  is_valid: boolean
  notes?: string
  certificate_url?: string
  signature_url?: string
}

interface Device {
  id: string
  name: string
  manufacturer?: string
  model?: string
  image_url?: string
  is_active: boolean
  requires_training?: boolean
  training_interval_days?: number
}

interface TeamMember {
  id: string
  user_id?: string
  first_name: string
  last_name: string
  position?: string
  avatar_url?: string
  is_active?: boolean
  employment_status?: string
}

interface TrainingStats {
  totalDevices: number
  totalMembers: number
  trainedCombinations: number
  totalRequired: number
  expiringCount: number
  expiredCount: number
  completionRate: number
}

export function DeviceTrainingManagement({ devices }: { devices: Device[] }) {
  const { currentPractice } = usePractice()
  const { teamMembers } = useTeam()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<"matrix" | "members" | "devices">("matrix")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "trained" | "untrained" | "expiring" | "expired">("all")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    device_id: "",
    team_member_id: "",
    training_date: format(new Date(), "yyyy-MM-dd"),
    trainer_name: "",
    trainer_role: "internal",
    training_type: "initial",
    valid_until: "",
    notes: "",
  })

  const activeDevices = useMemo(() => devices.filter((d) => d.is_active), [devices])

  const activeMembers = useMemo(() => teamMembers.filter(isActiveMember), [teamMembers])

  const loadAllTrainings = useCallback(async () => {
    if (!currentPractice?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/device-trainings`)
      if (response.ok) {
        const data = await response.json()
        setTrainings(data.trainings || [])
      }
    } catch (error) {
      console.error("Error loading trainings:", error)
    } finally {
      setLoading(false)
    }
  }, [currentPractice?.id])

  useEffect(() => {
    loadAllTrainings()
  }, [loadAllTrainings])

  // Calculate training status for a member-device combination
  const getTrainingStatus = useCallback(
    (memberId: string, deviceId: string) => {
      const memberTrainings = trainings.filter(
        (t) => t.team_member_id === memberId && t.device_id === deviceId && t.is_valid,
      )

      if (memberTrainings.length === 0) {
        return { status: "untrained", training: null }
      }

      const latestTraining = memberTrainings.sort(
        (a, b) => new Date(b.training_date).getTime() - new Date(a.training_date).getTime(),
      )[0]

      if (latestTraining.valid_until) {
        const validUntil = parseISO(latestTraining.valid_until)
        const now = new Date()

        if (isBefore(validUntil, now)) {
          return { status: "expired", training: latestTraining }
        }

        if (isBefore(validUntil, addDays(now, 30))) {
          return { status: "expiring", training: latestTraining }
        }
      }

      return { status: "trained", training: latestTraining }
    },
    [trainings],
  )

  // Calculate statistics
  const stats: TrainingStats = useMemo(() => {
    const totalDevices = activeDevices.length
    const totalMembers = activeMembers.length
    const totalRequired = totalDevices * totalMembers

    let trainedCombinations = 0
    let expiringCount = 0
    let expiredCount = 0

    activeMembers.forEach((member) => {
      activeDevices.forEach((device) => {
        const { status } = getTrainingStatus(member.id, device.id)
        if (status === "trained") trainedCombinations++
        if (status === "expiring") {
          trainedCombinations++
          expiringCount++
        }
        if (status === "expired") expiredCount++
      })
    })

    return {
      totalDevices,
      totalMembers,
      trainedCombinations,
      totalRequired,
      expiringCount,
      expiredCount,
      completionRate: totalRequired > 0 ? Math.round((trainedCombinations / totalRequired) * 100) : 0,
    }
  }, [activeDevices, activeMembers, getTrainingStatus])

  // Get member's training summary
  const getMemberTrainingSummary = useCallback(
    (memberId: string) => {
      let trained = 0
      let expiring = 0
      let expired = 0
      let untrained = 0

      activeDevices.forEach((device) => {
        const { status } = getTrainingStatus(memberId, device.id)
        if (status === "trained") trained++
        else if (status === "expiring") {
          trained++
          expiring++
        } else if (status === "expired") expired++
        else untrained++
      })

      return { trained, expiring, expired, untrained, total: activeDevices.length }
    },
    [activeDevices, getTrainingStatus],
  )

  // Get device's training summary
  const getDeviceTrainingSummary = useCallback(
    (deviceId: string) => {
      let trained = 0
      let expiring = 0
      let expired = 0
      let untrained = 0

      activeMembers.forEach((member) => {
        const { status } = getTrainingStatus(member.id, deviceId)
        if (status === "trained") trained++
        else if (status === "expiring") {
          trained++
          expiring++
        } else if (status === "expired") expired++
        else untrained++
      })

      return { trained, expiring, expired, untrained, total: activeMembers.length }
    },
    [activeMembers, getTrainingStatus],
  )

  // Filter members based on search and status
  const filteredMembers = useMemo(() => {
    return activeMembers.filter((member) => {
      const fullName = `${member.first_name} ${member.last_name}`.toLowerCase()
      const matchesSearch = fullName.includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (filterStatus === "all") return true

      const summary = getMemberTrainingSummary(member.id)

      switch (filterStatus) {
        case "trained":
          return summary.trained === summary.total
        case "untrained":
          return summary.untrained > 0
        case "expiring":
          return summary.expiring > 0
        case "expired":
          return summary.expired > 0
        default:
          return true
      }
    })
  }, [activeMembers, searchQuery, filterStatus, getMemberTrainingSummary])

  // Handle add training
  const handleAddTraining = async () => {
    if (!formData.team_member_id || !formData.device_id || !currentPractice?.id) {
      toast({ title: "Fehler", description: "Bitte wählen Sie Mitarbeiter und Gerät aus.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const member = activeMembers.find((m) => m.id === formData.team_member_id)
      const device = activeDevices.find((d) => d.id === formData.device_id)

      const response = await fetch(`/api/practices/${currentPractice.id}/devices/${formData.device_id}/trainings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          team_member_name: member ? `${member.first_name} ${member.last_name}` : "",
          device_name: device?.name || "",
        }),
      })

      if (response.ok) {
        toast({ title: "Einweisung dokumentiert", description: "Die Einweisung wurde erfolgreich gespeichert." })
        loadAllTrainings()
        setAddDialogOpen(false)
        resetForm()
      } else {
        throw new Error("Failed to save training")
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Die Einweisung konnte nicht gespeichert werden.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      device_id: selectedDevice?.id || "",
      team_member_id: selectedMember?.id || "",
      training_date: format(new Date(), "yyyy-MM-dd"),
      trainer_name: "",
      trainer_role: "internal",
      training_type: "initial",
      valid_until: "",
      notes: "",
    })
  }

  const openAddDialog = (member?: TeamMember, device?: Device) => {
    setSelectedMember(member || null)
    setSelectedDevice(device || null)
    setFormData((prev) => ({
      ...prev,
      team_member_id: member?.id || "",
      device_id: device?.id || "",
    }))
    setAddDialogOpen(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "trained":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "expiring":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "expired":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "trained":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Eingewiesen</Badge>
      case "expiring":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Läuft ab</Badge>
      case "expired":
        return <Badge variant="destructive">Abgelaufen</Badge>
      default:
        return <Badge variant="outline">Nicht eingewiesen</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
                <p className="text-xs text-muted-foreground">Mitarbeiter</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalDevices}</p>
                <p className="text-xs text-muted-foreground">Geräte</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.trainedCombinations}</p>
                <p className="text-xs text-muted-foreground">Einweisungen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.expiringCount}</p>
                <p className="text-xs text-muted-foreground">Laufen ab</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.expiredCount}</p>
                <p className="text-xs text-muted-foreground">Abgelaufen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
              </div>
              <Progress value={stats.completionRate} className="h-2" />
              <p className="text-xs text-muted-foreground">Abdeckung</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Mitarbeiter suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle anzeigen</SelectItem>
              <SelectItem value="trained">Vollständig eingewiesen</SelectItem>
              <SelectItem value="untrained">Fehlende Einweisungen</SelectItem>
              <SelectItem value="expiring">Bald ablaufend</SelectItem>
              <SelectItem value="expired">Abgelaufen</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={activeView === "matrix" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveView("matrix")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={activeView === "members" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveView("members")}
            >
              <Users className="h-4 w-4" />
            </Button>
            <Button
              variant={activeView === "devices" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveView("devices")}
            >
              <Package className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => openAddDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Einweisung dokumentieren
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {activeView === "matrix" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" />
              Einweisungsmatrix
            </CardTitle>
            <CardDescription>Übersicht aller Mitarbeiter und ihrer Geräte-Einweisungen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px] sticky left-0 bg-background z-10">Mitarbeiter</TableHead>
                    {activeDevices.map((device) => (
                      <TableHead key={device.id} className="text-center min-w-[120px]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex flex-col items-center gap-1 cursor-help">
                                <span className="text-xs font-medium truncate max-w-[100px]">{device.name}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{device.name}</p>
                              {device.manufacturer && (
                                <p className="text-xs text-muted-foreground">
                                  {device.manufacturer} {device.model}
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                    ))}
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => {
                    const summary = getMemberTrainingSummary(member.id)
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="sticky left-0 bg-background z-10">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback>
                                {member.first_name?.[0]}
                                {member.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {member.first_name} {member.last_name}
                              </p>
                              {member.position && <p className="text-xs text-muted-foreground">{member.position}</p>}
                            </div>
                          </div>
                        </TableCell>
                        {activeDevices.map((device) => {
                          const { status, training } = getTrainingStatus(member.id, device.id)
                          return (
                            <TableCell key={device.id} className="text-center">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={cn(
                                        "h-8 w-8 p-0 rounded-full",
                                        status === "trained" && "hover:bg-green-100",
                                        status === "expiring" && "hover:bg-yellow-100",
                                        status === "expired" && "hover:bg-red-100",
                                        status === "untrained" && "hover:bg-muted",
                                      )}
                                      onClick={() => {
                                        if (status === "untrained") {
                                          openAddDialog(member, device)
                                        } else {
                                          setSelectedMember(member)
                                          setSelectedDevice(device)
                                          setDetailDialogOpen(true)
                                        }
                                      }}
                                    >
                                      {getStatusIcon(status)}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {status === "untrained" ? (
                                      <p>Klicken zum Einweisen</p>
                                    ) : (
                                      <div>
                                        <p className="font-medium">
                                          {status === "trained"
                                            ? "Eingewiesen"
                                            : status === "expiring"
                                              ? "Läuft bald ab"
                                              : "Abgelaufen"}
                                        </p>
                                        {training && (
                                          <>
                                            <p className="text-xs">
                                              Am {format(parseISO(training.training_date), "dd.MM.yyyy")}
                                            </p>
                                            {training.valid_until && (
                                              <p className="text-xs">
                                                Gültig bis {format(parseISO(training.valid_until), "dd.MM.yyyy")}
                                              </p>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          )
                        })}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-sm font-medium">
                              {summary.trained}/{summary.total}
                            </span>
                            {summary.expiring > 0 && (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-300 text-xs">
                                {summary.expiring} ⚠
                              </Badge>
                            )}
                            {summary.expired > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {summary.expired} ✗
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeView === "members" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => {
            const summary = getMemberTrainingSummary(member.id)
            const completionPercent = Math.round((summary.trained / summary.total) * 100) || 0

            return (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="text-lg">
                        {member.first_name?.[0]}
                        {member.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {member.first_name} {member.last_name}
                      </h3>
                      {member.position && <p className="text-sm text-muted-foreground truncate">{member.position}</p>}
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Einweisungen</span>
                          <span className="font-medium">
                            {summary.trained}/{summary.total}
                          </span>
                        </div>
                        <Progress value={completionPercent} className="h-2" />
                        <div className="flex items-center gap-2 flex-wrap">
                          {summary.untrained > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {summary.untrained} offen
                            </Badge>
                          )}
                          {summary.expiring > 0 && (
                            <Badge className="bg-yellow-100 text-yellow-700 text-xs">{summary.expiring} bald</Badge>
                          )}
                          {summary.expired > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {summary.expired} abgelaufen
                            </Badge>
                          )}
                          {summary.trained === summary.total && summary.expiring === 0 && (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Vollständig
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedMember(member)
                        setDetailDialogOpen(true)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                    <Button size="sm" onClick={() => openAddDialog(member)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Einweisung
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {activeView === "devices" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeDevices.map((device) => {
            const summary = getDeviceTrainingSummary(device.id)
            const completionPercent = Math.round((summary.trained / summary.total) * 100) || 0

            return (
              <Card key={device.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {device.image_url ? (
                      <img
                        src={device.image_url || "/placeholder.svg"}
                        alt={device.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{device.name}</h3>
                      {device.manufacturer && (
                        <p className="text-sm text-muted-foreground truncate">
                          {device.manufacturer} {device.model}
                        </p>
                      )}
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Eingewiesene Mitarbeiter</span>
                          <span className="font-medium">
                            {summary.trained}/{summary.total}
                          </span>
                        </div>
                        <Progress value={completionPercent} className="h-2" />
                        <div className="flex items-center gap-2 flex-wrap">
                          {summary.untrained > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {summary.untrained} nicht eingewiesen
                            </Badge>
                          )}
                          {summary.expiring > 0 && (
                            <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                              {summary.expiring} laufen ab
                            </Badge>
                          )}
                          {summary.expired > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {summary.expired} abgelaufen
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDevice(device)
                        setDetailDialogOpen(true)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                    <Button size="sm" onClick={() => openAddDialog(undefined, device)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Einweisung
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Training Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Neue Einweisung dokumentieren
            </DialogTitle>
            <DialogDescription>Dokumentieren Sie eine Geräteeinweisung für einen Mitarbeiter</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mitarbeiter *</Label>
                <Select
                  value={formData.team_member_id}
                  onValueChange={(value) => setFormData({ ...formData, team_member_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mitarbeiter auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Gerät *</Label>
                <Select
                  value={formData.device_id}
                  onValueChange={(value) => setFormData({ ...formData, device_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Gerät auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeDevices.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Einweisungsdatum *</Label>
                <Input
                  type="date"
                  value={formData.training_date}
                  onChange={(e) => setFormData({ ...formData, training_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Gültig bis</Label>
                <Input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Einweiser</Label>
                <Input
                  value={formData.trainer_name}
                  onChange={(e) => setFormData({ ...formData, trainer_name: e.target.value })}
                  placeholder="Name des Einweisenden"
                />
              </div>

              <div className="space-y-2">
                <Label>Einweiser-Typ</Label>
                <Select
                  value={formData.trainer_role}
                  onValueChange={(value) => setFormData({ ...formData, trainer_role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Intern</SelectItem>
                    <SelectItem value="manufacturer">Hersteller</SelectItem>
                    <SelectItem value="external">Extern</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Einweisungsart</Label>
                <Select
                  value={formData.training_type}
                  onValueChange={(value) => setFormData({ ...formData, training_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial">Ersteinweisung</SelectItem>
                    <SelectItem value="refresher">Auffrischung</SelectItem>
                    <SelectItem value="update">Update/Änderung</SelectItem>
                    <SelectItem value="recertification">Rezertifizierung</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Notizen</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Zusätzliche Anmerkungen zur Einweisung..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleAddTraining} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Einweisung speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {selectedMember && !selectedDevice && (
                <>
                  Einweisungen - {selectedMember.first_name} {selectedMember.last_name}
                </>
              )}
              {selectedDevice && !selectedMember && <>Einweisungen - {selectedDevice.name}</>}
              {selectedMember && selectedDevice && (
                <>
                  {selectedMember.first_name} {selectedMember.last_name} - {selectedDevice.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>Übersicht und Verwaltung der Geräte-Einweisungen</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {/* Show trainings for selected member */}
              {selectedMember &&
                !selectedDevice &&
                activeDevices.map((device) => {
                  const { status, training } = getTrainingStatus(selectedMember.id, device.id)
                  return (
                    <div
                      key={device.id}
                      className={cn(
                        "flex items-center justify-between p-4 border rounded-lg",
                        status === "expired" && "border-red-200 bg-red-50 dark:bg-red-950/20",
                        status === "expiring" && "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(status)}
                        <div>
                          <p className="font-medium">{device.name}</p>
                          {training ? (
                            <p className="text-sm text-muted-foreground">
                              Eingewiesen am {format(parseISO(training.training_date), "dd.MM.yyyy", { locale: de })}
                              {training.valid_until &&
                                ` • Gültig bis ${format(parseISO(training.valid_until), "dd.MM.yyyy")}`}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">Nicht eingewiesen</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(status)}
                        {status === "untrained" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedDevice(device)
                              setDetailDialogOpen(false)
                              openAddDialog(selectedMember, device)
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}

              {/* Show trainings for selected device */}
              {selectedDevice &&
                !selectedMember &&
                activeMembers.map((member) => {
                  const { status, training } = getTrainingStatus(member.id, selectedDevice.id)
                  return (
                    <div
                      key={member.id}
                      className={cn(
                        "flex items-center justify-between p-4 border rounded-lg",
                        status === "expired" && "border-red-200 bg-red-50 dark:bg-red-950/20",
                        status === "expiring" && "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>
                            {member.first_name?.[0]}
                            {member.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.first_name} {member.last_name}
                          </p>
                          {training ? (
                            <p className="text-sm text-muted-foreground">
                              Eingewiesen am {format(parseISO(training.training_date), "dd.MM.yyyy", { locale: de })}
                              {training.trainer_name && ` von ${training.trainer_name}`}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">Nicht eingewiesen</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(status)}
                        {status === "untrained" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member)
                              setDetailDialogOpen(false)
                              openAddDialog(member, selectedDevice)
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}

              {/* Show specific training details */}
              {selectedMember && selectedDevice && (
                <div className="space-y-4">
                  {trainings
                    .filter((t) => t.team_member_id === selectedMember.id && t.device_id === selectedDevice.id)
                    .sort((a, b) => new Date(b.training_date).getTime() - new Date(a.training_date).getTime())
                    .map((training) => (
                      <div key={training.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {training.training_type === "initial"
                                ? "Ersteinweisung"
                                : training.training_type === "refresher"
                                  ? "Auffrischung"
                                  : training.training_type === "update"
                                    ? "Update"
                                    : "Rezertifizierung"}
                            </Badge>
                            {training.valid_until && isBefore(parseISO(training.valid_until), new Date()) ? (
                              <Badge variant="destructive">Abgelaufen</Badge>
                            ) : training.valid_until &&
                              isBefore(parseISO(training.valid_until), addDays(new Date(), 30)) ? (
                              <Badge className="bg-yellow-100 text-yellow-700">Läuft bald ab</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-700">Gültig</Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Einweisungsdatum</p>
                            <p className="font-medium">
                              {format(parseISO(training.training_date), "dd.MM.yyyy", { locale: de })}
                            </p>
                          </div>
                          {training.valid_until && (
                            <div>
                              <p className="text-muted-foreground">Gültig bis</p>
                              <p className="font-medium">
                                {format(parseISO(training.valid_until), "dd.MM.yyyy", { locale: de })}
                              </p>
                            </div>
                          )}
                          {training.trainer_name && (
                            <div>
                              <p className="text-muted-foreground">Einweiser</p>
                              <p className="font-medium">{training.trainer_name}</p>
                            </div>
                          )}
                          {training.trainer_role && (
                            <div>
                              <p className="text-muted-foreground">Einweiser-Typ</p>
                              <p className="font-medium">
                                {training.trainer_role === "internal"
                                  ? "Intern"
                                  : training.trainer_role === "manufacturer"
                                    ? "Hersteller"
                                    : "Extern"}
                              </p>
                            </div>
                          )}
                        </div>
                        {training.notes && (
                          <div>
                            <p className="text-sm text-muted-foreground">Notizen</p>
                            <p className="text-sm">{training.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDetailDialogOpen(false)
                setSelectedMember(null)
                setSelectedDevice(null)
              }}
            >
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DeviceTrainingManagement
