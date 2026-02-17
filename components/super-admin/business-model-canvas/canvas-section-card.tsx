"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, MoreVertical, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CanvasItem, CanvasSection } from "./types"
import { SectionIcon } from "./section-icon"

function getPriorityColor(priority?: string) {
  switch (priority) {
    case "high": return "bg-red-100 text-red-800 border-red-200"
    case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "low": return "bg-green-100 text-green-800 border-green-200"
    default: return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

function getPriorityLabel(priority?: string) {
  switch (priority) {
    case "high": return "Hoch"
    case "medium": return "Mittel"
    case "low": return "Niedrig"
    default: return "Mittel"
  }
}

function getStatusColor(status?: string) {
  switch (status) {
    case "active": return "bg-emerald-100 text-emerald-800"
    case "planned": return "bg-blue-100 text-blue-800"
    case "archived": return "bg-gray-100 text-gray-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "active": return "Aktiv"
    case "planned": return "Geplant"
    case "archived": return "Archiviert"
    default: return "Aktiv"
  }
}

interface CanvasSectionCardProps {
  section: CanvasSection | undefined
  sectionId: string
  className?: string
  showStatus?: boolean
  isAddingItem: string | null
  setIsAddingItem: (id: string | null) => void
  newItemText: string
  setNewItemText: (text: string) => void
  onAddItem: (sectionId: string) => void
  onDeleteItem: (sectionId: string, itemId: string) => void
  onEditItem: (sectionId: string, item: CanvasItem) => void
}

export function CanvasSectionCard({
  section,
  sectionId,
  className,
  showStatus = false,
  isAddingItem,
  setIsAddingItem,
  newItemText,
  setNewItemText,
  onAddItem,
  onDeleteItem,
  onEditItem,
}: CanvasSectionCardProps) {
  if (!section) return null

  return (
    <Card className={cn("border-2", section.color, className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <SectionIcon name={section.iconName} className="h-4 w-4" />
          {section.title}
        </CardTitle>
        <CardDescription className="text-xs">{section.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {section.items.map((item) => (
          <div key={item.id} className="group relative rounded-md border bg-white p-2 text-xs">
            <div className="flex items-start justify-between gap-1">
              <span className={showStatus ? "font-medium" : ""}>{item.text}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onEditItem(sectionId, item)}>
                    <Edit className="mr-2 h-3 w-3" />
                    Bearbeiten
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDeleteItem(sectionId, item.id)} className="text-red-600">
                    <Trash2 className="mr-2 h-3 w-3" />
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mt-1 flex gap-1">
              <Badge variant="outline" className={cn("text-[10px]", getPriorityColor(item.priority))}>
                {getPriorityLabel(item.priority)}
              </Badge>
              {showStatus && (
                <Badge variant="outline" className={cn("text-[10px]", getStatusColor(item.status))}>
                  {getStatusLabel(item.status)}
                </Badge>
              )}
            </div>
          </div>
        ))}
        {isAddingItem === sectionId ? (
          <div className="space-y-2">
            <Input
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Neuer Eintrag..."
              className="text-xs"
              onKeyDown={(e) => e.key === "Enter" && onAddItem(sectionId)}
            />
            <div className="flex gap-1">
              <Button size="sm" className="h-6 text-xs" onClick={() => onAddItem(sectionId)}>
                Hinzufuegen
              </Button>
              <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setIsAddingItem(null)}>
                Abbrechen
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-full text-xs"
            onClick={() => setIsAddingItem(sectionId)}
          >
            <Plus className="mr-1 h-3 w-3" />
            Hinzufuegen
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
