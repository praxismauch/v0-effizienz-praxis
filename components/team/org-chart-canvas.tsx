"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Users, Plus, Edit, Trash2, ZoomIn, ZoomOut, Maximize2 } from "lucide-react"

interface Position {
  id: string
  position_title: string
  department?: string
  user_id?: string
  user_name?: string
  user_avatar?: string
  user_role?: string
  reports_to_position_id?: string
  level: number
  display_order: number
  color?: string
  x?: number
  y?: number
}

interface OrgChartCanvasProps {
  positions: Position[]
  onEdit: (position: Position) => void
  onDelete: (id: string) => void
  onCreate: () => void
  isAdmin: boolean
  practiceId: string
}

const getDepartmentColor = (department?: string, departments?: any[]): string => {
  if (!department || !departments) return "bg-background border-border"

  const dept = departments.find((d) => d.name === department)
  if (!dept) return "bg-background border-border"

  // Convert hex color to Tailwind-like classes (simplified approach)
  return `border-2`
}

function isColorDark(hexColor: string): boolean {
  // Convert hex to RGB
  const hex = hexColor.replace("#", "")
  const r = Number.parseInt(hex.substr(0, 2), 16)
  const g = Number.parseInt(hex.substr(2, 2), 16)
  const b = Number.parseInt(hex.substr(4, 2), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance < 0.5
}

export function OrgChartCanvas({ positions, onEdit, onDelete, onCreate, isAdmin, practiceId }: OrgChartCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [layoutPositions, setLayoutPositions] = useState<Map<string, { x: number; y: number }>>(new Map())
  const [departments, setDepartments] = useState<any[]>([])

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
    const nodeWidth = 280
    const nodeHeight = 120
    const horizontalGap = 60
    const verticalGap = 100

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
    let rootX = 400
    roots.forEach((root, index) => {
      if (index > 0) rootX += getSubtreeWidth(roots[index - 1].id) + 100
      positionNode(root.id, rootX, 50)
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
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.5), 2))
  }

  const handleFitToScreen = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Draw connections
  const renderConnections = () => {
    const connections: React.ReactElement[] = []

    positions.forEach((pos) => {
      if (pos.reports_to_position_id) {
        const parentPos = layoutPositions.get(pos.reports_to_position_id)
        const childPos = layoutPositions.get(pos.id)

        if (parentPos && childPos) {
          const x1 = parentPos.x
          const y1 = parentPos.y + 60
          const x2 = childPos.x
          const y2 = childPos.y - 10

          const midY = (y1 + y2) / 2

          connections.push(
            <path
              key={`conn-${pos.id}`}
              d={`M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`}
              stroke="hsl(var(--border))"
              strokeWidth="2"
              fill="none"
              opacity="0.5"
            />,
          )
        }
      }
    })

    return connections
  }

  useEffect(() => {
    if (practiceId) {
      fetch(`/api/practices/${practiceId}/departments`)
        .then((res) => res.json())
        .then((data) => setDepartments(data.departments || []))
        .catch((err) => console.error("[v0] Error fetching departments:", err))
    }
  }, [practiceId])

  return (
    <div className="relative w-full h-[800px] bg-muted/20 rounded-lg border overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-background border rounded-lg p-2 shadow-lg">
        {isAdmin && (
          <Button size="sm" onClick={onCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Position hinzufügen
          </Button>
        )}
        <div className="h-6 w-px bg-border mx-1" />
        <Button size="sm" variant="outline" onClick={() => handleZoom(-0.2)}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
        <Button size="sm" variant="outline" onClick={() => handleZoom(0.2)}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleFitToScreen}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {departments.length > 0 && (
        <div className="absolute top-4 right-4 z-10 bg-background border rounded-lg p-3 shadow-lg max-w-[200px]">
          <h3 className="text-xs font-semibold mb-2 text-muted-foreground">Abteilungen</h3>
          <div className="space-y-1.5">
            {departments.map((dept) => (
              <div key={dept.id} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border-2"
                  style={{ backgroundColor: dept.color, borderColor: dept.color }}
                />
                <span className="text-xs">{dept.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
              width: "3000px",
              height: "2000px",
              overflow: "visible",
            }}
          >
            {renderConnections()}
          </svg>

          {/* Position nodes */}
          {positions.map((position) => {
            const layout = layoutPositions.get(position.id)
            if (!layout) return null

            return (
              <div
                key={position.id}
                className="absolute"
                style={{
                  left: `${layout.x - 140}px`,
                  top: `${layout.y - 60}px`,
                  width: "280px",
                }}
              >
                <Card className="p-4 shadow-lg hover:shadow-xl transition-shadow border-2 bg-background">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-lg mb-1 truncate">{position.position_title}</h4>
                      {position.user_name && (
                        <p className="text-sm truncate text-muted-foreground">{position.user_name}</p>
                      )}
                      {position.department && (
                        <p className="text-xs mt-1 text-muted-foreground">{position.department}</p>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onEdit(position)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => onDelete(position.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {!position.user_id && <p className="text-sm italic text-muted-foreground">Vakante Position</p>}
                </Card>
              </div>
            )
          })}
        </div>
      </div>

      {/* Instructions */}
      {positions.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-3 p-8">
            <Users className="h-16 w-16 text-muted-foreground mx-auto" />
            <h3 className="text-xl font-semibold">Kein Organigramm definiert</h3>
            <p className="text-muted-foreground max-w-md">
              Erstellen Sie Positionen, um die Organisationsstruktur grafisch darzustellen.
            </p>
          </div>
        </div>
      )}

      {positions.length > 0 && !isPanning && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/95 border rounded-lg px-4 py-2 text-sm text-muted-foreground shadow-lg">
          Ziehen Sie die Ansicht mit der Maus • Scrollen zum Zoomen
        </div>
      )}
    </div>
  )
}
