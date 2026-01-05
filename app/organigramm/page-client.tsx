"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createBrowserClient } from "@/lib/supabase/client"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Trash2,
  Edit,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Users,
  Building2,
  UserPlus,
  Loader2,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Position {
  id: string
  practice_id: string
  position_title: string
  department?: string
  person_name?: string // Manual name input instead of user_id
  person_role?: string // Manual role input
  reports_to_position_id: string | null
  level: number
  display_order: number
  color?: string
  is_active: boolean
  is_management?: boolean
  created_at: string
  updated_at: string
}

interface Team {
  id: string
  name: string
  color?: string
  description?: string
}

const departmentColors: Record<string, string> = {
  Leitung: "#3B82F6",
  Ärzte: "#10B981",
  MFA: "#8B5CF6",
  Verwaltung: "#F59E0B",
  Labor: "#EC4899",
  Empfang: "#06B6D4",
  Sonstige: "#6B7280",
}

const getColorForDepartment = (department?: string): string => {
  if (!department) return departmentColors.Sonstige
  const key = Object.keys(departmentColors).find(
    (k) => department.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(department.toLowerCase()),
  )
  return key ? departmentColors[key] : departmentColors.Sonstige
}

const getInitials = (name: string): string => {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export default function OrganigrammPageClient() {
  const [positions, setPositions] = useState<Position[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)
  const [deletingPositionId, setDeletingPositionId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  const { toast } = useToast()
  const { currentPractice, user } = useAuth()
  const supabase = createBrowserClient()

  const loadData = useCallback(async () => {
    if (!currentPractice?.id) return

    try {
      setDataLoading(true)

      const [positionsRes, teamsRes] = await Promise.all([
        supabase
          .from("org_chart_positions")
          .select("*")
          .eq("practice_id", currentPractice.id)
          .is("deleted_at", null)
          .order("level", { ascending: true })
          .order("display_order", { ascending: true }),
        supabase
          .from("teams")
          .select("id, name, color, description")
          .eq("practice_id", currentPractice.id)
          .is("deleted_at", null),
      ])

      if (positionsRes.error) {
        throw positionsRes.error
      }

      setPositions(positionsRes.data || [])
      setTeams(teamsRes.data || [])
    } catch (error: any) {
      console.error("Error loading org chart:", error)
      toast({
        title: "Fehler",
        description: "Organigramm konnte nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setDataLoading(false)
    }
  }, [currentPractice?.id, supabase, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreatePosition = async (data: {
    position_title: string
    person_name?: string
    person_role?: string
    department?: string
    reports_to_position_id?: string
    level: number
    color?: string
  }) => {
    if (!currentPractice?.id || !user?.id) return

    try {
      const { data: newPosition, error } = await supabase
        .from("org_chart_positions")
        .insert({
          practice_id: currentPractice.id,
          position_title: data.position_title,
          person_name: data.person_name || null,
          person_role: data.person_role || null,
          department: data.department || null,
          reports_to_position_id: data.reports_to_position_id || null,
          level: data.level,
          display_order: positions.filter((p) => p.level === data.level).length,
          color: data.color || getColorForDepartment(data.department),
          is_active: true,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error

      setPositions((prev) => [...prev, newPosition])
      setShowCreateDialog(false)

      toast({
        title: "Erfolg",
        description: "Position wurde erstellt",
      })
    } catch (error: any) {
      console.error("Error creating position:", error)
      toast({
        title: "Fehler",
        description: error.message || "Position konnte nicht erstellt werden",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePosition = async (
    id: string,
    data: Partial<{
      position_title: string
      person_name?: string
      person_role?: string
      department?: string
      reports_to_position_id?: string
      level: number
      color?: string
    }>,
  ) => {
    try {
      const { error } = await supabase
        .from("org_chart_positions")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      setPositions((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))
      setEditingPosition(null)

      toast({
        title: "Erfolg",
        description: "Position wurde aktualisiert",
      })
    } catch (error: any) {
      console.error("Error updating position:", error)
      toast({
        title: "Fehler",
        description: error.message || "Position konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    }
  }

  const handleDeletePosition = async (id: string) => {
    try {
      const { error } = await supabase.from("org_chart_positions").delete().eq("id", id)

      if (error) throw error

      setPositions((prev) => prev.filter((p) => p.id !== id))
      setDeletingPositionId(null)

      toast({
        title: "Erfolg",
        description: "Position wurde gelöscht",
      })
    } catch (error: any) {
      console.error("Error deleting position:", error)
      toast({
        title: "Fehler",
        description: error.message || "Position konnte nicht gelöscht werden",
        variant: "destructive",
      })
    }
  }

  // Zoom and pan handlers
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 2))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5))
  const handleResetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }

  const handleMouseUp = () => setIsPanning(false)

  // Build hierarchy from positions
  const buildHierarchy = () => {
    const rootPositions = positions.filter((p) => !p.reports_to_position_id)
    const getChildren = (parentId: string): Position[] => {
      return positions
        .filter((p) => p.reports_to_position_id === parentId)
        .sort((a, b) => a.display_order - b.display_order)
    }

    return { rootPositions, getChildren }
  }

  const { rootPositions, getChildren } = buildHierarchy()

  const PositionCard = ({ position, depth = 0 }: { position: Position; depth?: number }) => {
    const children = getChildren(position.id)
    const [expanded, setExpanded] = useState(true)

    return (
      <div className="flex flex-col items-center">
        <div
          className="relative group"
          style={{
            marginLeft: depth > 0 ? "2rem" : 0,
          }}
        >
          {/* Connection line from parent */}
          {depth > 0 && (
            <div className="absolute -top-6 left-1/2 w-0.5 h-6 bg-border" style={{ transform: "translateX(-50%)" }} />
          )}

          <Card
            className={cn(
              "w-56 cursor-pointer transition-all hover:shadow-lg border-l-4",
              position.is_management && "ring-2 ring-primary/20",
            )}
            style={{ borderLeftColor: position.color || departmentColors.Sonstige }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{position.position_title}</p>
                  {position.person_name && (
                    <p className="text-sm text-muted-foreground truncate">{position.person_name}</p>
                  )}
                  {position.person_role && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {position.person_role}
                    </Badge>
                  )}
                  {position.department && (
                    <Badge variant="outline" className="mt-1 ml-1 text-xs">
                      {position.department}
                    </Badge>
                  )}
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
                  style={{ backgroundColor: position.color || departmentColors.Sonstige }}
                >
                  {position.person_name ? getInitials(position.person_name) : <Users className="h-4 w-4" />}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingPosition(position)
                  }}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeletingPositionId(position.id)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                {children.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 ml-auto"
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpanded(!expanded)
                    }}
                  >
                    {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Children */}
        {expanded && children.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-6 justify-center relative">
            {/* Horizontal connection line */}
            {children.length > 1 && (
              <div
                className="absolute top-0 h-0.5 bg-border"
                style={{
                  left: "25%",
                  right: "25%",
                  transform: "translateY(-12px)",
                }}
              />
            )}
            {children.map((child) => (
              <PositionCard key={child.id} position={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (dataLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Organigramm</h1>
            <p className="text-muted-foreground">Organisationsstruktur Ihrer Praxis</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Position hinzufügen
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{positions.length}</p>
                  <p className="text-sm text-muted-foreground">Positionen</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Building2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{teams.length}</p>
                  <p className="text-sm text-muted-foreground">Abteilungen</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <UserPlus className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{positions.filter((p) => p.person_name).length}</p>
                  <p className="text-sm text-muted-foreground">Besetzt</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <GripVertical className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{new Set(positions.map((p) => p.level)).size}</p>
                  <p className="text-sm text-muted-foreground">Ebenen</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-16 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetView}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Org Chart Canvas */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div
              ref={canvasRef}
              className="min-h-[500px] overflow-auto cursor-grab active:cursor-grabbing bg-muted/30"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                className="p-8 min-w-max"
                style={{
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  transformOrigin: "top left",
                }}
              >
                {positions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Noch keine Positionen</h3>
                    <p className="text-muted-foreground mb-4 max-w-sm">
                      Erstellen Sie manuell Positionen für Ihr Organigramm
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Erste Position erstellen
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6">
                    {rootPositions.map((position) => (
                      <PositionCard key={position.id} position={position} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teams/Departments Legend */}
        {teams.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Abteilungen / Teams</CardTitle>
              <CardDescription>Verfügbare Gruppen in Ihrer Praxis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {teams.map((team) => (
                  <Badge
                    key={team.id}
                    variant="outline"
                    className="px-3 py-1"
                    style={{
                      borderColor: team.color || departmentColors.Sonstige,
                      backgroundColor: `${team.color || departmentColors.Sonstige}15`,
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: team.color || departmentColors.Sonstige }}
                    />
                    {team.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Position Dialog */}
      <CreatePositionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreatePosition}
        positions={positions}
        teams={teams}
      />

      {/* Edit Position Dialog */}
      {editingPosition && (
        <EditPositionDialog
          open={!!editingPosition}
          onOpenChange={(open) => !open && setEditingPosition(null)}
          position={editingPosition}
          onSubmit={(data) => handleUpdatePosition(editingPosition.id, data)}
          positions={positions}
          teams={teams}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingPositionId} onOpenChange={(open) => !open && setDeletingPositionId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Position löschen</DialogTitle>
            <DialogDescription>
              Möchten Sie diese Position wirklich löschen? Untergeordnete Positionen verlieren ihre Zuordnung.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingPositionId(null)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingPositionId && handleDeletePosition(deletingPositionId)}
            >
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}

function CreatePositionDialog({
  open,
  onOpenChange,
  onSubmit,
  positions,
  teams,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  positions: Position[]
  teams: Team[]
}) {
  const [formData, setFormData] = useState({
    position_title: "",
    person_name: "",
    person_role: "",
    department: "",
    reports_to_position_id: "",
    level: 0,
    color: "",
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.position_title.trim()) return

    setSaving(true)
    try {
      await onSubmit({
        ...formData,
        reports_to_position_id: formData.reports_to_position_id || null,
        color: formData.color || getColorForDepartment(formData.department),
      })
      setFormData({
        position_title: "",
        person_name: "",
        person_role: "",
        department: "",
        reports_to_position_id: "",
        level: 0,
        color: "",
      })
    } finally {
      setSaving(false)
    }
  }

  // Calculate level based on parent
  useEffect(() => {
    if (formData.reports_to_position_id) {
      const parent = positions.find((p) => p.id === formData.reports_to_position_id)
      if (parent) {
        setFormData((prev) => ({ ...prev, level: parent.level + 1 }))
      }
    } else {
      setFormData((prev) => ({ ...prev, level: 0 }))
    }
  }, [formData.reports_to_position_id, positions])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Neue Position erstellen</DialogTitle>
          <DialogDescription>Fügen Sie manuell eine neue Position zum Organigramm hinzu</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="position_title">Positionsbezeichnung *</Label>
            <Input
              id="position_title"
              value={formData.position_title}
              onChange={(e) => setFormData((prev) => ({ ...prev, position_title: e.target.value }))}
              placeholder="z.B. Praxisleitung, MFA, Arzt"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="person_name">Name der Person (optional)</Label>
            <Input
              id="person_name"
              value={formData.person_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, person_name: e.target.value }))}
              placeholder="z.B. Dr. Max Mustermann"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="person_role">Rolle / Funktion (optional)</Label>
            <Input
              id="person_role"
              value={formData.person_role}
              onChange={(e) => setFormData((prev) => ({ ...prev, person_role: e.target.value }))}
              placeholder="z.B. Facharzt für Innere Medizin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Abteilung</Label>
            <Select
              value={formData.department}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Abteilung wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Abteilung</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.name}>
                    {team.name}
                  </SelectItem>
                ))}
                <SelectItem value="Leitung">Leitung</SelectItem>
                <SelectItem value="Ärzte">Ärzte</SelectItem>
                <SelectItem value="MFA">MFA</SelectItem>
                <SelectItem value="Verwaltung">Verwaltung</SelectItem>
                <SelectItem value="Labor">Labor</SelectItem>
                <SelectItem value="Empfang">Empfang</SelectItem>
                <SelectItem value="Sonstige">Sonstige</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reports_to">Berichtet an</Label>
            <Select
              value={formData.reports_to_position_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, reports_to_position_id: value === "none" ? "" : value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Übergeordnete Position wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine (oberste Ebene)</SelectItem>
                {positions.map((pos) => (
                  <SelectItem key={pos.id} value={pos.id}>
                    {pos.position_title} {pos.person_name ? `(${pos.person_name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Farbe</Label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(departmentColors).map(([name, color]) => (
                <button
                  key={name}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    formData.color === color ? "border-foreground scale-110" : "border-transparent",
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  title={name}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={saving || !formData.position_title.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Erstellen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditPositionDialog({
  open,
  onOpenChange,
  position,
  onSubmit,
  positions,
  teams,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  position: Position
  onSubmit: (data: any) => void
  positions: Position[]
  teams: Team[]
}) {
  const [formData, setFormData] = useState({
    position_title: position.position_title,
    person_name: position.person_name || "",
    person_role: position.person_role || "",
    department: position.department || "",
    reports_to_position_id: position.reports_to_position_id || "",
    level: position.level,
    color: position.color || "",
  })
  const [saving, setSaving] = useState(false)

  // Filter out current position and descendants from parent options
  const availableParents = positions.filter((p) => {
    if (p.id === position.id) return false
    // Check if p is a descendant of position
    let current: Position | undefined = p
    while (current) {
      if (current.reports_to_position_id === position.id) return false
      current = positions.find((pos) => pos.id === current?.reports_to_position_id)
    }
    return true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.position_title.trim()) return

    setSaving(true)
    try {
      await onSubmit({
        ...formData,
        reports_to_position_id: formData.reports_to_position_id || null,
      })
    } finally {
      setSaving(false)
    }
  }

  // Calculate level based on parent
  useEffect(() => {
    if (formData.reports_to_position_id) {
      const parent = positions.find((p) => p.id === formData.reports_to_position_id)
      if (parent) {
        setFormData((prev) => ({ ...prev, level: parent.level + 1 }))
      }
    } else {
      setFormData((prev) => ({ ...prev, level: 0 }))
    }
  }, [formData.reports_to_position_id, positions])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Position bearbeiten</DialogTitle>
          <DialogDescription>Ändern Sie die Details dieser Position</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit_position_title">Positionsbezeichnung *</Label>
            <Input
              id="edit_position_title"
              value={formData.position_title}
              onChange={(e) => setFormData((prev) => ({ ...prev, position_title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_person_name">Name der Person</Label>
            <Input
              id="edit_person_name"
              value={formData.person_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, person_name: e.target.value }))}
              placeholder="z.B. Dr. Max Mustermann"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_person_role">Rolle / Funktion</Label>
            <Input
              id="edit_person_role"
              value={formData.person_role}
              onChange={(e) => setFormData((prev) => ({ ...prev, person_role: e.target.value }))}
              placeholder="z.B. Facharzt für Innere Medizin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_department">Abteilung</Label>
            <Select
              value={formData.department || "none"}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value === "none" ? "" : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Abteilung wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Abteilung</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.name}>
                    {team.name}
                  </SelectItem>
                ))}
                <SelectItem value="Leitung">Leitung</SelectItem>
                <SelectItem value="Ärzte">Ärzte</SelectItem>
                <SelectItem value="MFA">MFA</SelectItem>
                <SelectItem value="Verwaltung">Verwaltung</SelectItem>
                <SelectItem value="Labor">Labor</SelectItem>
                <SelectItem value="Empfang">Empfang</SelectItem>
                <SelectItem value="Sonstige">Sonstige</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_reports_to">Berichtet an</Label>
            <Select
              value={formData.reports_to_position_id || "none"}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, reports_to_position_id: value === "none" ? "" : value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Übergeordnete Position wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine (oberste Ebene)</SelectItem>
                {availableParents.map((pos) => (
                  <SelectItem key={pos.id} value={pos.id}>
                    {pos.position_title} {pos.person_name ? `(${pos.person_name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Farbe</Label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(departmentColors).map(([name, color]) => (
                <button
                  key={name}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    formData.color === color ? "border-foreground scale-110" : "border-transparent",
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  title={name}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={saving || !formData.position_title.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
