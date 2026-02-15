"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"
import type { WorkflowCategory } from "./types"
import { ColorPicker } from "@/components/color-picker"

interface CategoriesTabProps {
  categories: WorkflowCategory[]
  showDialog: boolean
  setShowDialog: (show: boolean) => void
  editingCategory: { id: string; name: string; color: string; description: string } | null
  categoryName: string
  setCategoryName: (name: string) => void
  categoryColor: string
  setCategoryColor: (color: string) => void
  categoryDescription: string
  setCategoryDescription: (description: string) => void
  onSave: () => void
  onEdit: (category: { id: string; name: string; color: string; description?: string }) => void
  onDelete: (categoryId: string) => void
  onReset: () => void
}

const colorPresets = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
]

export function CategoriesTab({
  categories,
  showDialog,
  setShowDialog,
  editingCategory,
  categoryName,
  setCategoryName,
  categoryColor,
  setCategoryColor,
  categoryDescription,
  setCategoryDescription,
  onSave,
  onEdit,
  onDelete,
  onReset,
}: CategoriesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Kategorien verwalten</h3>
          <p className="text-sm text-muted-foreground">
            Erstellen und verwalten Sie Kategorien für Ihre Transaktionen
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Kategorie
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <CardTitle className="text-base">{category.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(category)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:text-destructive"
                    onClick={() => onDelete(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}

        {categories.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Noch keine Kategorien vorhanden. Erstellen Sie Ihre erste Kategorie.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Category Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => !open && onReset()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Kategorie bearbeiten" : "Neue Kategorie erstellen"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Bearbeiten Sie die Kategorie-Einstellungen"
                : "Erstellen Sie eine neue Kategorie für Ihre Transaktionen"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="z.B. Miete, Gehalt, Material..."
              />
            </div>

            <ColorPicker
              value={categoryColor}
              onChange={setCategoryColor}
              label="Farbe"
            />

            <div className="space-y-2">
              <Label htmlFor="category-description">Beschreibung (optional)</Label>
              <Textarea
                id="category-description"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                placeholder="Beschreibung der Kategorie..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onReset}>
              Abbrechen
            </Button>
            <Button onClick={onSave}>
              {editingCategory ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
