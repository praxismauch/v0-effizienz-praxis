"use client"

import { useState, useEffect } from "react"
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FolderPlus, MoreVertical, Edit, Trash2, GripVertical } from "lucide-react"

interface OrgaCategory {
  id: string
  name: string
  description?: string
  color: string
  icon: string
  is_active: boolean
  display_order: number
  practice_id: string | null
  created_at: string
  updated_at: string
}

interface SortableItemProps {
  category: OrgaCategory
  onEdit: (category: OrgaCategory) => void
  onDelete: (categoryId: string) => void
  isAdmin?: boolean
}

function SortableItem({ category, onEdit, onDelete, isAdmin = false }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isCustomCategory = category.practice_id !== null

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-0.5 pt-2">
          <div className="flex items-start justify-between gap-2">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-0.5">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-1.5 flex-1">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: category.color + "20" }}
              >
                <FolderPlus className="h-3.5 w-3.5" style={{ color: category.color }} />
              </div>
              <div className="flex-1">
                <CardTitle className="text-sm leading-tight">{category.name}</CardTitle>
                {category.description && (
                  <CardDescription className="text-xs mt-0.5">{category.description}</CardDescription>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" style={{ position: "absolute" } as const}>
                <DropdownMenuItem onClick={() => onEdit(category)} disabled={!isAdmin && !isCustomCategory}>
                  <Edit className="mr-2 h-4 w-4" />
                  Bearbeiten
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(category.id)}
                  disabled={!isAdmin && !isCustomCategory}
                  className="text-red-600 disabled:text-muted-foreground"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-1.5 pb-2">
          <Badge
            variant="outline"
            className="text-xs py-0"
            style={{ borderColor: category.color, color: category.color }}
          >
            {isCustomCategory ? "Benutzerdefiniert" : "Standard"}
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}

interface OrgaCategoriesSortableListProps {
  categories: OrgaCategory[]
  onReorder: (categories: OrgaCategory[]) => void
  onEdit: (category: OrgaCategory) => void
  onDelete: (categoryId: string) => void
  isAdmin?: boolean
}

function OrgaCategoriesSortableList({
  categories,
  onReorder,
  onEdit,
  onDelete,
  isAdmin = false,
}: OrgaCategoriesSortableListProps) {
  const [items, setItems] = useState<OrgaCategory[]>(Array.isArray(categories) ? categories : [])

  useEffect(() => {
    setItems(Array.isArray(categories) ? categories : [])
  }, [categories])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        const newItems = arrayMove(items, oldIndex, newIndex)
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          display_order: index + 1,
        }))

        onReorder(updatedItems)
        return updatedItems
      })
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5">
          {items.map((category) => (
            <SortableItem key={category.id} category={category} onEdit={onEdit} onDelete={onDelete} isAdmin={isAdmin} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export default OrgaCategoriesSortableList
