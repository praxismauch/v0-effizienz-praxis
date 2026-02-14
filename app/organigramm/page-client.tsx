"use client"

import type React from "react"
import useSWR from "swr"
import { swrFetcher } from "@/lib/swr-fetcher"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { usePractice } from "@/contexts/practice-context"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Plus, Trash2, Edit, ZoomIn, ZoomOut, RotateCcw, Users, Loader2, Printer, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface Position {
  id: string
  practice_id: string
  position_title: string
  department?: string
  user_id?: string | null
  reports_to_position_id: string | null
  level: number
  display_order: number
  color?: string
  is_active: boolean
  is_management?: boolean
  created_at: string
  updated_at: string
}

interface TreeNode {
  position: Position
  children: TreeNode[]
}

interface TeamMember {
  id: string
  user_id?: string | null
  team_member_id?: string
  first_name: string
  last_name: string
  name?: string
  avatar?: string | null
  avatar_url?: string | null
}

interface Team {
  id: string
  name: string
}

export default function OrganigrammClient() {
  const [loading, setLoading] = useState(false) // Changed from true to false since SWR handles loading
  const [positions, setPositions] = useState<Position[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)
  const [deletingPositionId, setDeletingPositionId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const chartRef = useRef<HTMLDivElement>(null)

  const { toast } = useToast()
  const { user } = useAuth()
  const { currentPractice, isLoading: practiceLoading } = usePractice()

  const { data: positionsData, error: positionsError } = useSWR<{ positions: Position[] }>(
    currentPractice?.id ? `/api/practices/${currentPractice.id}/org-chart-positions` : null,
    swrFetcher,
  )

  const { data: teamMembersData } = useSWR<{ teamMembers: TeamMember[] }>(
    currentPractice?.id ? `/api/practices/${currentPractice.id}/team-members` : null,
    swrFetcher,
  )

  const { data: teamsData } = useSWR<{ teams: Team[] }>(
    currentPractice?.id ? `/api/practices/${currentPractice.id}/teams` : null,
    swrFetcher,
  )

  useEffect(() => {
    if (positionsData?.positions) {
      setPositions(positionsData.positions)
    }
  }, [positionsData])

  useEffect(() => {
    if (teamMembersData?.teamMembers) {
      setTeamMembers(teamMembersData.teamMembers)
    }
  }, [teamMembersData])

  useEffect(() => {
    if (teamsData?.teams) {
      setTeams(teamsData.teams)
    }
  }, [teamsData])

  useEffect(() => {
    if (positionsError) {
      toast({
        title: "Fehler",
        description: "Organigramm konnte nicht geladen werden",
        variant: "destructive",
      })
    }
  }, [positionsError, toast])

  const buildTree = (): TreeNode[] => {
    const positionMap = new Map<string, TreeNode>()
    const rootNodes: TreeNode[] = []

    positions.forEach((pos) => {
      positionMap.set(pos.id, { position: pos, children: [] })
    })

    positions.forEach((pos) => {
      const node = positionMap.get(pos.id)!
      if (pos.reports_to_position_id) {
        const parent = positionMap.get(pos.reports_to_position_id)
        if (parent) {
          parent.children.push(node)
        } else {
          rootNodes.push(node)
        }
      } else {
        rootNodes.push(node)
      }
    })

    const sortChildren = (node: TreeNode) => {
      node.children.sort((a, b) => a.position.display_order - b.position.display_order)
      node.children.forEach(sortChildren)
    }
    rootNodes.forEach(sortChildren)

    return rootNodes
  }

  const handleCreate = async (data: {
    position_title: string
    department?: string
    reports_to_position_id?: string
  }) => {
    if (!currentPractice?.id || !user?.id) return

    try {
      const practiceIdString = String(currentPractice.id)
      const parentId = data.reports_to_position_id || null
      const parent = parentId ? positions.find((p) => p.id === parentId) : null
      const level = parent ? parent.level + 1 : 0

      const response = await fetch(`/api/practices/${practiceIdString}/org-chart-positions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          practice_id: practiceIdString,
          position_title: data.position_title,
          department: data.department || null,
          reports_to_position_id: parentId,
          level,
          display_order: positions.filter((p) => p.level === level).length,
          color: "#4F7CBA",
          is_active: true,
          created_by: user.id,
        }),
      })

      const newPosition = await response.json()

      setPositions((prev) => [...prev, newPosition])
      setShowCreateDialog(false)
      toast({ title: "Erfolg", description: "Position wurde erstellt" })
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Position konnte nicht erstellt werden",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async (id: string, data: Partial<Position>) => {
    try {
      const response = await fetch(`/api/practices/${currentPractice?.id}/org-chart-positions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, updated_at: new Date().toISOString() }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Position konnte nicht aktualisiert werden")
      }

      setPositions((prev) => prev.map((p) => (p.id === id ? result : p)))
      setEditingPosition(null)
      toast({ title: "Erfolg", description: "Position wurde aktualisiert" })
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Position konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/practices/${currentPractice?.id}/org-chart-positions/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Position konnte nicht gelöscht werden")

      setPositions((prev) => prev.filter((p) => p.id !== id))
      setDeletingPositionId(null)
      toast({ title: "Erfolg", description: "Position wurde gelöscht" })
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Position konnte nicht gelöscht werden",
        variant: "destructive",
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const tree = buildTree()

  const PositionCard = ({
    node,
    isRoot = false,
  }: {
    node: TreeNode
    isRoot?: boolean
  }) => {
    const { position, children } = node
    const displayName = position.position_title
    const displayRole = position.department || ""

    // Find assigned team member by user_id
    const assignedMember = position.user_id
      ? teamMembers.find(
          (m) => m.user_id === position.user_id || m.id === position.user_id || m.team_member_id === position.user_id,
        )
      : null
    const memberName = assignedMember
      ? `${assignedMember.first_name || ""} ${assignedMember.last_name || ""}`.trim() || assignedMember.name || ""
      : ""
    const memberAvatar = assignedMember?.avatar || assignedMember?.avatar_url || null

    return (
      <div className="flex flex-col items-center">
        {/* The card itself */}
        <div
          className={cn(
            "relative group bg-[#4F7CBA] text-white rounded-md px-4 py-3 min-w-[140px] max-w-[220px] text-center shadow-md transition-all hover:shadow-lg cursor-pointer",
            isRoot && "bg-[#3A5F8A] min-w-[180px]",
          )}
          onClick={() => setEditingPosition(position)}
        >
          <p className="font-semibold text-sm leading-tight break-words">{displayName}</p>
          {displayRole && <p className="text-xs text-white/80 mt-0.5 leading-tight">({displayRole})</p>}
          {memberName && (
            <div className="flex items-center justify-center gap-1.5 mt-2 pt-2 border-t border-white/20">
              {memberAvatar ? (
                <img
                  src={memberAvatar}
                  alt={memberName}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-white/30"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">
                    {memberName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-xs text-white/90 leading-tight truncate">{memberName}</span>
            </div>
          )}
          <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
            <button
              className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation()
                setEditingPosition(position)
              }}
            >
              <Edit className="h-3 w-3 text-gray-600" />
            </button>
            <button
              className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-100"
              onClick={(e) => {
                e.stopPropagation()
                setDeletingPositionId(position.id)
              }}
            >
              <Trash2 className="h-3 w-3 text-red-500" />
            </button>
          </div>
        </div>

        {/* Children with proper connectors */}
        {children.length > 0 && (
          <ChildrenConnector>
            {children.map((child) => (
              <PositionCard key={child.position.id} node={child} />
            ))}
          </ChildrenConnector>
        )}
      </div>
    )
  }

  /**
   * ChildrenConnector renders:
   * 1. A vertical stem down from the parent
   * 2. A horizontal rail spanning from the center of the first child to the center of the last child
   * 3. A vertical stem up into each child
   * It uses refs to measure actual rendered positions so lines always connect properly.
   */
  const ChildrenConnector = ({ children: childElements }: { children: React.ReactNode[] }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [lineStyle, setLineStyle] = useState<{ left: number; width: number } | null>(null)

    useEffect(() => {
      const el = containerRef.current
      if (!el) return

      const updateLine = () => {
        const childWrappers = el.querySelectorAll<HTMLElement>(":scope > .org-child-wrapper")
        if (childWrappers.length < 2) {
          setLineStyle(null)
          return
        }
        const containerRect = el.getBoundingClientRect()
        const firstChild = childWrappers[0]
        const lastChild = childWrappers[childWrappers.length - 1]
        const firstCenter = firstChild.getBoundingClientRect().left + firstChild.getBoundingClientRect().width / 2 - containerRect.left
        const lastCenter = lastChild.getBoundingClientRect().left + lastChild.getBoundingClientRect().width / 2 - containerRect.left
        setLineStyle({ left: firstCenter, width: lastCenter - firstCenter })
      }

      // Measure after paint
      const raf = requestAnimationFrame(updateLine)
      // Also observe resize
      const ro = new ResizeObserver(updateLine)
      ro.observe(el)

      return () => {
        cancelAnimationFrame(raf)
        ro.disconnect()
      }
    }, [childElements])

    const stemH = 24 // px – vertical stem height

    return (
      <div className="flex flex-col items-center w-full">
        {/* Vertical stem from parent down */}
        <div className="w-px bg-[#4F7CBA]" style={{ height: stemH }} />

        {/* Horizontal rail + children row */}
        <div ref={containerRef} className="relative flex gap-8 items-start">
          {/* The horizontal rail (absolute, drawn after measurement) */}
          {lineStyle && lineStyle.width > 0 && (
            <div
              className="absolute bg-[#4F7CBA]"
              style={{
                top: 0,
                left: lineStyle.left,
                width: lineStyle.width,
                height: 1,
              }}
            />
          )}

          {childElements.map((child, i) => (
            <div key={i} className="org-child-wrapper flex flex-col items-center">
              {/* Vertical stem into child */}
              <div className="w-px bg-[#4F7CBA]" style={{ height: stemH }} />
              {child}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (practiceLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (!currentPractice?.id) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Users className="h-16 w-16 text-muted-foreground/30" />
          <h3 className="text-lg font-medium">Keine Praxis ausgewählt</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Bitte wählen Sie eine Praxis aus, um das Organigramm anzuzeigen.
          </p>
        </div>
      </AppLayout>
    )
  }

  if (loading) {
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Organigramm</h1>
            <p className="text-muted-foreground">Organisationsstruktur Ihrer Praxis</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="flex items-center text-sm text-muted-foreground w-12 justify-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.min(z + 0.1, 2))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setZoom(1)}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLoading(true)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Drucken
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Position hinzufügen
            </Button>
          </div>
        </div>
        <div className="hidden print:block text-center mb-8">
          <h1 className="text-3xl font-bold">Organigramm</h1>
          <p className="text-lg text-gray-600 mt-2">{currentPractice?.name || "Praxis"}</p>
          <p className="text-sm text-gray-500 mt-1">
            Stand: {new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
          </p>
        </div>
        {positions.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{positions.length}</p>
                <p className="text-sm text-muted-foreground">Positionen</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{new Set(positions.map((p) => p.department).filter(Boolean)).size}</p>
                <p className="text-sm text-muted-foreground">Abteilungen</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{positions.filter((p) => p.user_id).length}</p>
                <p className="text-sm text-muted-foreground">Besetzt</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{new Set(positions.map((p) => p.level)).size}</p>
                <p className="text-sm text-muted-foreground">Ebenen</p>
              </CardContent>
            </Card>
          </div>
        )}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div ref={chartRef} className="min-h-[500px] overflow-auto bg-white print:bg-white print:overflow-visible">
              <div
                className="p-8 min-w-max flex justify-center"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top center",
                }}
              >
                {positions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Noch keine Positionen</h3>
                    <p className="text-muted-foreground mb-4 max-w-sm">
                      Erstellen Sie die erste Position für Ihr Organigramm, z.B. die Praxisleitung.
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Erste Position erstellen
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-0">
                    {tree.map((rootNode) => (
                      <PositionCard key={rootNode.position.id} node={rootNode} isRoot />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Position erstellen</DialogTitle>
            <DialogDescription>Fügen Sie eine neue Position zum Organigramm hinzu.</DialogDescription>
          </DialogHeader>
          <CreatePositionForm
            positions={positions}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>
      {editingPosition && (
        <Dialog open={!!editingPosition} onOpenChange={(open) => !open && setEditingPosition(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Position bearbeiten</DialogTitle>
              <DialogDescription>Ändern Sie die Details dieser Position.</DialogDescription>
            </DialogHeader>
            <EditPositionForm
              position={editingPosition}
              positions={positions}
              teamMembers={teamMembers}
              teams={teams}
              onSubmit={(data) => handleUpdate(editingPosition.id, data)}
              onCancel={() => setEditingPosition(null)}
            />
          </DialogContent>
        </Dialog>
      )}
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
            <Button variant="destructive" onClick={() => deletingPositionId && handleDelete(deletingPositionId)}>
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <style jsx global>{`
        @media print {
          @page {
            size: A3 landscape;
            margin: 1cm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          nav,
          header,
          footer,
          aside {
            display: none !important;
          }
        }
      `}</style>
    </AppLayout>
  )
}

function CreatePositionForm({
  positions,
  onSubmit,
  onCancel,
}: {
  positions: Position[]
  onSubmit: (data: { position_title: string; department?: string; reports_to_position_id?: string }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState("")
  const [department, setDepartment] = useState("")
  const [parentId, setParentId] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    await onSubmit({
      position_title: title.trim(),
      department: department.trim() || undefined,
      reports_to_position_id: parentId || undefined,
    })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Positionsbezeichnung *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z.B. Praxisleitung, MFA, Ärztin"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="department">Abteilung (optional)</Label>
        <Input
          id="department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="z.B. Personal, IT, Büro"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="parent">Berichtet an</Label>
        <Select value={parentId || "none"} onValueChange={(v) => setParentId(v === "none" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Keine (oberste Ebene)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Keine (oberste Ebene)</SelectItem>
            {positions.map((pos) => (
              <SelectItem key={pos.id} value={pos.id}>
                {pos.position_title}
                {pos.department && ` (${pos.department})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={saving || !title.trim()}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Erstellen
        </Button>
      </DialogFooter>
    </form>
  )
}

function EditPositionForm({
  position,
  positions,
  teamMembers,
  teams,
  onSubmit,
  onCancel,
}: {
  position: Position
  positions: Position[]
  teamMembers: TeamMember[]
  teams: Team[]
  onSubmit: (data: Partial<Position>) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(position.position_title)
  const [department, setDepartment] = useState(position.department || "")
  const [parentId, setParentId] = useState(position.reports_to_position_id || "")
  const [assignmentType, setAssignmentType] = useState<'none' | 'member' | 'team'>(
    position.user_id ? 'member' : 'none'
  )
  const [userId, setUserId] = useState(position.user_id || "")
  const [teamId, setTeamId] = useState("")
  const [saving, setSaving] = useState(false)

  const getDescendantIds = (id: string): string[] => {
    const children = positions.filter((p) => p.reports_to_position_id === id)
    return [id, ...children.flatMap((c) => getDescendantIds(c.id))]
  }
  const excludedIds = getDescendantIds(position.id)
  const availableParents = positions.filter((p) => !excludedIds.includes(p.id))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)

    const parent = parentId ? positions.find((p) => p.id === parentId) : null
    const level = parent ? parent.level + 1 : 0

    await onSubmit({
      position_title: title.trim(),
      department: department.trim() || null,
      reports_to_position_id: parentId || null,
      user_id: assignmentType === 'member' ? userId : null,
      team_id: assignmentType === 'team' ? teamId : null,
      level,
    })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-title">Positionsbezeichnung *</Label>
        <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-department">Abteilung (optional)</Label>
        <Input
          id="edit-department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="z.B. Personal, IT, Büro"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-parent">Berichtet an</Label>
        <Select value={parentId || "none"} onValueChange={(v) => setParentId(v === "none" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Keine (oberste Ebene)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Keine (oberste Ebene)</SelectItem>
            {availableParents.map((pos) => (
              <SelectItem key={pos.id} value={pos.id}>
                {pos.position_title}
                {pos.department && ` (${pos.department})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Zuweisung (optional)</Label>
        <Select 
          value={assignmentType} 
          onValueChange={(value: 'none' | 'member' | 'team') => {
            setAssignmentType(value)
            setUserId("")
            setTeamId("")
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Auswählen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Keine Zuweisung</SelectItem>
            <SelectItem value="member">Einzelne Person</SelectItem>
            <SelectItem value="team">Team/Gruppe</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {assignmentType === 'member' && (
        <div className="space-y-2">
          <Label>Person auswählen</Label>
          <Select value={userId || "none"} onValueChange={(v) => setUserId(v === "none" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Keine Person zugewiesen" />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-[300px]">
              <SelectItem value="none">Keine Person zugewiesen</SelectItem>
              {teamMembers.map((member) => {
                const memberId = member.user_id || member.id || member.team_member_id
                if (!memberId) return null
                return (
                  <SelectItem key={memberId} value={memberId}>
                    {member.first_name} {member.last_name}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {assignmentType === 'team' && (
        <div className="space-y-2">
          <Label>Team/Gruppe auswählen</Label>
          <Select value={teamId || "none"} onValueChange={(v) => setTeamId(v === "none" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Kein Team zugewiesen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Kein Team zugewiesen</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={saving || !title.trim()}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Speichern
        </Button>
      </DialogFooter>
    </form>
  )
}
