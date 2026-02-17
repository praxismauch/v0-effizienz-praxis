"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FolderPlus, Plus, Pencil, Trash2, GripVertical, Sparkles, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { useState, useEffect } from "react"
import type { OrgaCategory } from "@/types/orgaCategory"
import { ColorPicker } from "@/components/color-picker"

export function OrgaCategoriesManager() {
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { currentUser } = useUser()
  const practiceId = currentPractice?.id || currentUser?.practice_id
  const [categories, setCategories] = useState<OrgaCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInitializing, setIsInitializing] = useState(false)
  const [editingCategory, setEditingCategory] = useState<OrgaCategory | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formColor, setFormColor] = useState("#3b82f6")
  const [formIsActive, setFormIsActive] = useState(true)

  const openCreateDialog = () => {
    setEditingCategory(null)
    setFormName("")
    setFormDescription("")
    setFormColor("#3b82f6")
    setFormIsActive(true)
    setIsDialogOpen(true)
  }

  const openEditDialog = (category: OrgaCategory) => {
    setEditingCategory(category)
    setFormName(category.name)
    setFormDescription(category.description || "")
    setFormColor(category.color || "#3b82f6")
    setFormIsActive(category.is_active)
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formName.trim() || !practiceId) return

    setIsSaving(true)
    try {
      const url = editingCategory
        ? `/api/practices/${practiceId}/orga-categories/${editingCategory.id}`
        : `/api/practices/${practiceId}/orga-categories`
      const method = editingCategory ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim(),
          color: formColor,
          is_active: formIsActive,
        }),
      })

      if (!response.ok) throw new Error("Request failed")

      toast.success(editingCategory ? "Kategorie aktualisiert" : "Kategorie erstellt")
      setIsDialogOpen(false)
      await fetchCategories()
    } catch (error) {
      console.error("Error saving category:", error)
      toast.error("Fehler beim Speichern der Kategorie")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!practiceId) return

    try {
      const response = await fetch(`/api/practices/${practiceId}/orga-categories/${categoryId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Delete failed")

      toast.success("Kategorie gelöscht")
      await fetchCategories()
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error("Fehler beim Löschen der Kategorie")
    }
  }

  useEffect(() => {
    if (practiceId && !practiceLoading) {
      console.log("[v0] OrgaCategoriesManager - Fetching categories for practice:", practiceId)
      fetchCategories()
    } else if (!practiceLoading && !practiceId) {
      console.log("[v0] OrgaCategoriesManager - No practice ID available")
      setIsLoading(false)
    }
  }, [practiceId, practiceLoading])

  const fetchCategories = async () => {
    if (!practiceId) {
      console.log("[v0] OrgaCategoriesManager - No practiceId, skipping fetch")
      setIsLoading(false)
      return
    }

    console.log("[v0] OrgaCategoriesManager - Fetching categories from API")
    setIsLoading(true)
    setFetchError(null)
    try {
      const url = `/api/practices/${practiceId}/orga-categories`
      console.log("[v0] OrgaCategoriesManager - Fetch URL:", url)
      
      const response = await fetch(url)
      console.log("[v0] OrgaCategoriesManager - Response status:", response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("[v0] OrgaCategoriesManager - Received data:", data)
      console.log("[v0] OrgaCategoriesManager - Categories count:", data.categories?.length || 0)
      
      setCategories(data.categories || [])
    } catch (error) {
      console.error("[v0] OrgaCategoriesManager - Fetch error:", error)
      setFetchError("Fehler beim Laden der Kategorien")
      toast.error("Fehler beim Laden der Kategorien")
    } finally {
      setIsLoading(false)
    }
  }

  const initializeDefaultCategories = async () => {
    if (!practiceId || isInitializing) {
      if (!practiceId) {
        toast.error("Keine Praxis-ID gefunden. Bitte neu laden.")
      }
      return
    }

    console.log("[v0] OrgaCategoriesManager - Initializing default categories")
    setIsInitializing(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/orga-categories/init-defaults`, {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        console.log("[v0] OrgaCategoriesManager - Initialization success:", data)
        toast.success("Standard-Kategorien wurden erstellt")
        await fetchCategories() // Reload categories
      } else {
        console.error("[v0] OrgaCategoriesManager - Initialization failed:", data)
        toast.error("Fehler beim Erstellen der Kategorien")
      }
    } catch (error) {
      console.error("[v0] OrgaCategoriesManager - Initialization error:", error)
      toast.error("Fehler beim Erstellen der Kategorien")
    } finally {
      setIsInitializing(false)
    }
  }

  if (isLoading || practiceLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Kategorien werden geladen...</p>
        </div>
      </div>
    )
  }

  if (!practiceId) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Keine Praxis ausgewählt. Bitte wählen Sie zuerst eine Praxis aus.</p>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <FolderPlus className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Fehler beim Laden</h3>
        <p className="text-muted-foreground mb-6 max-w-md">{fetchError}</p>
        <Button onClick={() => fetchCategories()} variant="default">
          <RefreshCw className="h-4 w-4 mr-2" />
          Erneut versuchen
        </Button>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <FolderPlus className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Kategorien werden initialisiert</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Standard-Kategorien werden automatisch erstellt. Bitte warten Sie einen Moment...
        </p>
        <div className="flex gap-3">
          <Button onClick={() => fetchCategories()} disabled={isInitializing} variant="default">
            {isInitializing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Laden...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Erneut laden
              </>
            )}
          </Button>
          <Button onClick={openCreateDialog} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Neue Kategorie
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Organisationskategorien</h2>
          <p className="text-sm text-muted-foreground">Verwalten Sie Ihre Aufgabenkategorien</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Kategorie
        </Button>
      </div>

      <div className="grid gap-2">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="group relative overflow-hidden border hover:shadow-sm transition-all duration-200 cursor-pointer"
            style={{ borderLeftWidth: "4px", borderLeftColor: category.color || "#3b82f6" }}
            onClick={() => openEditDialog(category)}
          >
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
                  <GripVertical className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                </div>
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                  style={{ backgroundColor: `${category.color || "#3b82f6"}15` }}
                >
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: category.color || "#3b82f6" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{category.name}</h3>
                  {category.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{category.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-3">
                {category.is_active ? (
                  <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 text-xs px-2 py-0">
                    Aktiv
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs px-2 py-0">Inaktiv</Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation()
                    openEditDialog(category)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(category.id)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Kategorie bearbeiten" : "Neue Kategorie"}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Bearbeiten Sie die Eigenschaften dieser Kategorie"
                : "Erstellen Sie eine neue Organisationskategorie"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="z.B. Patientenversorgung"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-description">Beschreibung</Label>
              <Textarea
                id="cat-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Kurze Beschreibung der Kategorie"
                rows={2}
              />
            </div>

            <ColorPicker
              value={formColor}
              onChange={setFormColor}
              label="Farbe"
            />

            <div className="flex items-center justify-between">
              <Label htmlFor="cat-active">Aktiv</Label>
              <Switch
                id="cat-active"
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={!formName.trim() || isSaving}>
              {isSaving ? "Speichern..." : editingCategory ? "Aktualisieren" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
