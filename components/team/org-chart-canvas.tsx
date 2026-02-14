"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Edit, Trash2, ZoomIn, ZoomOut, Maximize2, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Position {
  id: string
  position_title: string
  department?: string
  user_id?: string
  user_name?: string
  user_avatar?: string
  user_role?: string
  user_email?: string
  user_phone?: string
  reports_to_position_id?: string
  level: number
  display_order: number
  color?: string
  x?: number
  y?: number
}

interface Department {
  id: string
  name: string
  color: string
}

interface OrgChartCanvasProps {
  positions: Position[]
  onEdit: (position: Position) => void
  onDelete: (id: string) => void
  onCreate: () => void
  isAdmin: boolean
  practiceId: string
}

const ROLE_COLORS: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  Arzt: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-400 dark:border-blue-600",
    text: "text-blue-700 dark:text-blue-300",
    gradient: "from-blue-500 to-blue-600",
  },
  MFA: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-400 dark:border-emerald-600",
    text: "text-emerald-700 dark:text-emerald-300",
    gradient: "from-emerald-500 to-emerald-600",
  },
  "Auszubildende-MFA": {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-400 dark:border-amber-600",
    text: "text-amber-700 dark:text-amber-300",
    gradient: "from-amber-500 to-amber-600",
  },
  Weiterbildungsassistent: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-400 dark:border-purple-600",
    text: "text-purple-700 dark:text-purple-300",
    gradient: "from-purple-500 to-purple-600",
  },
  Verwaltung: {
    bg: "bg-slate-50 dark:bg-slate-950/30",
    border: "border-slate-400 dark:border-slate-600",
    text: "text-slate-700 dark:text-slate-300",
    gradient: "from-slate-500 to-slate-600",
  },
  Extern: {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-400 dark:border-rose-600",
    text: "text-rose-700 dark:text-rose-300",
    gradient: "from-rose-500 to-rose-600",
  },
  default: {
    bg: "bg-gray-50 dark:bg-gray-950/30",
    border: "border-gray-300 dark:border-gray-700",
    text: "text-gray-700 dark:text-gray-300",
    gradient: "from-gray-500 to-gray-600",
  },
}

function getRoleColors(role?: string) {
  if (!role) return ROLE_COLORS.default

  // Check for exact match first
  if (ROLE_COLORS[role]) return ROLE_COLORS[role]

  // Check for partial matches
  const lowerRole = role.toLowerCase()
  if (lowerRole.includes("arzt") || lowerRole.includes("doctor")) return ROLE_COLORS.Arzt
  if (lowerRole.includes("mfa") && !lowerRole.includes("azubi") && !lowerRole.includes("auszubildende"))
    return ROLE_COLORS.MFA
  if (lowerRole.includes("azubi") || lowerRole.includes("auszubildende")) return ROLE_COLORS["Auszubildende-MFA"]
  if (lowerRole.includes("weiterbildung")) return ROLE_COLORS.Weiterbildungsassistent
  if (lowerRole.includes("verwaltung") || lowerRole.includes("admin")) return ROLE_COLORS.Verwaltung
  if (lowerRole.includes("extern")) return ROLE_COLORS.Extern

  return ROLE_COLORS.default
}

function getInitials(name?: string): string {
  if (!name) return "?"
  const parts = name.trim().split(" ")
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export function OrgChartCanvas({ positions, onEdit, onDelete, onCreate, isAdmin, practiceId }: OrgChartCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [layoutPositions, setLayoutPositions] = useState<Map<string, { x: number; y: number }>>(new Map())
  const [departments, setDepartments] = useState<Department[]>([])
  const [hoveredPosition, setHoveredPosition] = useState<string | null>(null)

  // Auto-layout algorithm
  const calculateLayout = useCallback(() => {
    const positionMap = new Map<string, Position>()
    positions.forEach((pos) => positionMap.set(pos.id, pos))

    // Build tree structure
    const roots: Position[] = []
    const children = new Map<string, Position[]>()

    positions.forEach((pos) => {
      if (!pos.reports_to_position_id) {
        roots.push(pos)
      } else {
        if (!children.has(pos.reports_to_position_id)) {
          children.set(pos.reports_to_position_id, [])
        }
        children.get(pos.reports_to_position_id)!.push(pos)
      }
    })

    // Sort children by display_order
    children.forEach((childList) => {
      childList.sort((a, b) => a.display_order - b.display_order)
    })

    const newLayout = new Map<string, { x: number; y: number }>()
    const nodeWidth = 300
    const nodeHeight = 140
    const horizontalGap = 80
    const verticalGap = 120

    // Calculate subtree width
    const getSubtreeWidth = (nodeId: string): number => {
      const childNodes = children.get(nodeId) || []
      if (childNodes.length === 0) return nodeWidth

      const childrenWidth = childNodes.reduce((sum, child) => {
        return sum + getSubtreeWidth(child.id)
      }, 0)

      return Math.max(nodeWidth, childrenWidth + horizontalGap * (childNodes.length - 1))
    }

    // Position nodes recursively
    const positionNode = (nodeId: string, x: number, y: number) => {
      newLayout.set(nodeId, { x, y })

      const childNodes = children.get(nodeId) || []
      if (childNodes.length === 0) return

      const subtreeWidth = getSubtreeWidth(nodeId)
      let currentX = x - subtreeWidth / 2 + nodeWidth / 2

      childNodes.forEach((child) => {
        const childWidth = getSubtreeWidth(child.id)
        positionNode(child.id, currentX + childWidth / 2, y + nodeHeight + verticalGap)
        currentX += childWidth + horizontalGap
      })
    }

    // Position root nodes
    let rootX = 500
    roots.forEach((root, index) => {
      if (index > 0) rootX += getSubtreeWidth(roots[index - 1].id) + 120
      positionNode(root.id, rootX, 80)
    })

    setLayoutPositions(newLayout)
  }, [positions])

  useEffect(() => {
    calculateLayout()
  }, [calculateLayout])

  // Handle mouse events for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.target === canvasRef.current) {
      setIsPanning(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  // Handle zoom
  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.3), 2))
  }

  const handleFitToScreen = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Draw connections with orthogonal (right-angle) lines
  const renderConnections = () => {
    const connections: React.ReactElement[] = []

    // Group children by parent so we can draw a single horizontal bar per parent
    const childrenByParent = new Map<string, Position[]>()
    positions.forEach((pos) => {
      if (pos.reports_to_position_id) {
        if (!childrenByParent.has(pos.reports_to_position_id)) {
          childrenByParent.set(pos.reports_to_position_id, [])
        }
        childrenByParent.get(pos.reports_to_position_id)!.push(pos)
      }
    })

    childrenByParent.forEach((children, parentId) => {
      const parentLayout = layoutPositions.get(parentId)
      if (!parentLayout) return

      const childLayouts = children
        .map((c) => ({ id: c.id, layout: layoutPositions.get(c.id) }))
        .filter((c) => c.layout != null)

      if (childLayouts.length === 0) return

      const isHovered = hoveredPosition === parentId || children.some((c) => hoveredPosition === c.id)
      const strokeColor = isHovered ? "hsl(var(--primary))" : "hsl(var(--border))"
      const shadowColor = "rgba(0,0,0,0.08)"

      // Parent bottom center
      const px = parentLayout.x
      const py = parentLayout.y + 70

      // Midpoint Y between parent bottom and children top
      const firstChildY = childLayouts[0].layout!.y - 10
      const midY = py + (firstChildY - py) / 2

      if (childLayouts.length === 1) {
        // Single child: straight vertical line
        const cx = childLayouts[0].layout!.x
        const cy = childLayouts[0].layout!.y - 10

        connections.push(
          <g key={`conn-${parentId}`}>
            <path d={`M ${px} ${py} L ${px} ${midY} L ${cx} ${midY} L ${cx} ${cy}`} stroke={shadowColor} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d={`M ${px} ${py} L ${px} ${midY} L ${cx} ${midY} L ${cx} ${cy}`} stroke={strokeColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-200" />
          </g>
        )
      } else {
        // Multiple children: vertical from parent, horizontal bar, vertical drops to each child
        const childXs = childLayouts.map((c) => c.layout!.x).sort((a, b) => a - b)
        const leftX = childXs[0]
        const rightX = childXs[childXs.length - 1]

        // Vertical line from parent down to midY
        connections.push(
          <g key={`conn-trunk-${parentId}`}>
            <line x1={px} y1={py} x2={px} y2={midY} stroke={shadowColor} strokeWidth="4" strokeLinecap="round" />
            <line x1={px} y1={py} x2={px} y2={midY} stroke={strokeColor} strokeWidth="2" strokeLinecap="round" className="transition-colors duration-200" />
          </g>
        )

        // Horizontal bar across all children
        connections.push(
          <g key={`conn-bar-${parentId}`}>
            <line x1={leftX} y1={midY} x2={rightX} y2={midY} stroke={shadowColor} strokeWidth="4" strokeLinecap="round" />
            <line x1={leftX} y1={midY} x2={rightX} y2={midY} stroke={strokeColor} strokeWidth="2" strokeLinecap="round" className="transition-colors duration-200" />
          </g>
        )

        // Vertical drops from horizontal bar to each child
        childLayouts.forEach((child) => {
          const cx = child.layout!.x
          const cy = child.layout!.y - 10

          connections.push(
            <g key={`conn-drop-${child.id}`}>
              <line x1={cx} y1={midY} x2={cx} y2={cy} stroke={shadowColor} strokeWidth="4" strokeLinecap="round" />
              <line x1={cx} y1={midY} x2={cx} y2={cy} stroke={strokeColor} strokeWidth="2" strokeLinecap="round" className="transition-colors duration-200" />
            </g>
          )
        })
      }
    })

    return connections
  }

  useEffect(() => {
    if (practiceId) {
      fetch(`/api/practices/${practiceId}/departments`)
        .then((res) => res.json())
        .then((data) => setDepartments(data.departments || []))
        .catch((err) => console.error("Error fetching departments:", err))
    }
  }, [practiceId])

  return (
    <div className="relative w-full h-[800px] bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20 rounded-xl border shadow-inner overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-background/95 backdrop-blur-sm border rounded-xl p-2 shadow-lg">
        {isAdmin && (
          <Button
            size="sm"
            onClick={onCreate}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Position hinzufügen
          </Button>
        )}
        <div className="h-6 w-px bg-border mx-1" />
        <Button size="sm" variant="outline" onClick={() => handleZoom(-0.2)} className="hover:bg-muted">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
        <Button size="sm" variant="outline" onClick={() => handleZoom(0.2)} className="hover:bg-muted">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleFitToScreen} className="hover:bg-muted bg-transparent">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 bg-background/95 backdrop-blur-sm border rounded-xl p-4 shadow-lg max-w-[220px]">
        <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Rollen-Legende</h3>
        <div className="space-y-2">
          {Object.entries(ROLE_COLORS)
            .filter(([key]) => key !== "default")
            .map(([role, colors]) => (
              <div key={role} className="flex items-center gap-2">
                <div className={cn("w-4 h-4 rounded-full bg-gradient-to-r", colors.gradient)} />
                <span className="text-xs font-medium">{role}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="relative"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            transition: isPanning ? "none" : "transform 0.2s ease",
            width: "max-content",
            height: "max-content",
            minWidth: "100%",
            minHeight: "100%",
          }}
        >
          {/* SVG for connections */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{
              width: "4000px",
              height: "3000px",
              overflow: "visible",
            }}
          >
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
              </filter>
            </defs>
            {renderConnections()}
          </svg>

          {/* Position nodes */}
          {positions.map((position) => {
            const layout = layoutPositions.get(position.id)
            if (!layout) return null

            const roleColors = getRoleColors(position.user_role || position.department)
            const isHovered = hoveredPosition === position.id

            return (
              <div
                key={position.id}
                className="absolute transition-all duration-200"
                style={{
                  left: `${layout.x - 150}px`,
                  top: `${layout.y - 70}px`,
                  width: "300px",
                  transform: isHovered ? "scale(1.02)" : "scale(1)",
                }}
                onMouseEnter={() => setHoveredPosition(position.id)}
                onMouseLeave={() => setHoveredPosition(null)}
              >
                <Card
                  className={cn(
                    "overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-2",
                    roleColors.bg,
                    roleColors.border,
                    isHovered && "ring-2 ring-primary/20",
                  )}
                >
                  {/* Colored top bar */}
                  <div className={cn("h-1.5 bg-gradient-to-r", roleColors.gradient)} />

                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                        <AvatarImage src={position.user_avatar || ""} />
                        <AvatarFallback
                          className={cn("bg-gradient-to-br text-white font-semibold", roleColors.gradient)}
                        >
                          {getInitials(position.user_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base mb-0.5 truncate">{position.position_title}</h4>
                        {position.user_name && (
                          <p className="text-sm font-medium truncate text-foreground/80">{position.user_name}</p>
                        )}
                        {position.user_role && (
                          <Badge
                            variant="secondary"
                            className={cn("mt-1.5 text-xs font-medium", roleColors.text, roleColors.bg)}
                          >
                            {position.user_role}
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      {isAdmin && (
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-background/80"
                            onClick={() => onEdit(position)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => onDelete(position.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Department */}
                    {position.department && (
                      <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{position.department}</span>
                      </div>
                    )}

                    {/* Vacant position indicator */}
                    {!position.user_id && (
                      <div className="mt-3 px-2 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Vakante Position</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      </div>

      {/* Empty state */}
      {positions.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-4 p-8 bg-background/80 backdrop-blur-sm rounded-2xl border shadow-lg">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
              <Users className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold">Kein Organigramm definiert</h3>
            <p className="text-muted-foreground max-w-md">
              Erstellen Sie Positionen, um die Organisationsstruktur Ihrer Praxis grafisch darzustellen.
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {positions.length > 0 && !isPanning && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/95 backdrop-blur-sm border rounded-xl px-4 py-2.5 text-sm text-muted-foreground shadow-lg flex items-center gap-4">
          <span>🖱️ Ziehen zum Verschieben</span>
          <div className="h-4 w-px bg-border" />
          <span>🔍 Scrollen zum Zoomen</span>
        </div>
      )}
    </div>
  )
}
