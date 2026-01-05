"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Plus, Pencil, Trash2, GripVertical, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

interface TestingCategory {
  id: string
  name: string
  description: string | null
  color: string
  display_order: number
}

function TestingCategoriesManager() {
  const [categories, setCategories] = useState<TestingCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<TestingCategory | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#6366f1",
  })
  const { toast } = useToast()

  const [isAiSuggesting, setIsAiSuggesting] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ name: string; description: string; color: string }>>([])
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false)
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/testing-categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Kategorien konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const url = editingCategory ? `/api/testing-categories/${editingCategory.id}` : "/api/testing-categories"
      const method = editingCategory ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: editingCategory ? "Kategorie wurde aktualisiert" : "Kategorie wurde erstellt",
        })
        loadCategories()
        setIsDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Kategorie konnte nicht gespeichert werden",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie diese Kategorie wirklich löschen?")) return

    try {
      const response = await fetch(`/api/testing-categories/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: "Kategorie wurde gelöscht",
        })
        loadCategories()
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Kategorie konnte nicht gelöscht werden",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (category: TestingCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color,
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingCategory(null)
    setFormData({
      name: "",
      description: "",
      color: "#6366f1",
    })
  }

  const handleAiSuggest = async () => {
    setIsAiSuggesting(true)
    try {
      console.log("[v0] Requesting AI suggestions for testing categories")

      const response = await fetch("/api/testing-categories/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ existingCategories: categories.map((c) => c.name) }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[v0] AI suggestion request failed:", response.status, errorData)
        throw new Error(errorData.details || errorData.error || "Request failed")
      }

      const data = await response.json()
      console.log("[v0] Received AI suggestions:", data.suggestions?.length, "items")

      if (!data.suggestions || data.suggestions.length === 0) {
        throw new Error("Keine Vorschläge erhalten")
      }

      setAiSuggestions(data.suggestions)
      setSelectedSuggestions(new Set(data.suggestions.map((_: any, i: number) => i)))
      setIsAiDialogOpen(true)
    } catch (error) {
      console.error("[v0] Error in handleAiSuggest:", error)
      const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler"
      toast({
        title: "Fehler",
        description: `KI-Vorschläge konnten nicht generiert werden: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setIsAiSuggesting(false)
    }
  }

  const handleAddAiSuggestions = async () => {
    const suggestionsToAdd = aiSuggestions.filter((_, index) => selectedSuggestions.has(index))

    try {
      for (const suggestion of suggestionsToAdd) {
        await fetch("/api/testing-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(suggestion),
        })
      }

      toast({
        title: "Erfolg",
        description: `${suggestionsToAdd.length} Kategorie(n) wurden hinzugefügt`,
      })
      loadCategories()
      setIsAiDialogOpen(false)
      setSelectedSuggestions(new Set())
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Kategorien konnten nicht hinzugefügt werden",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Laden...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {categories.length} Kategorie{categories.length !== 1 ? "n" : ""}
        </p>
        <div className="flex gap-2">
          <Button
            onClick={handleAiSuggest}
            disabled={isAiSuggesting}
            className="bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isAiSuggesting ? "KI arbeitet..." : "KI-Vorschläge"}
          </Button>
          <Button
            onClick={() => {
              resetForm()
              setIsDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Neue Kategorie
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {categories.map((category) => (
          <Card key={category.id} className="p-4">
            <div className="flex items-center gap-4">
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium">{category.name}</h4>
                {category.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">{category.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEditDialog(category)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(category.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KI-Vorschläge für Test-Kategorien</DialogTitle>
            <DialogDescription>Wählen Sie die Kategorien aus, die Sie hinzufügen möchten</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {aiSuggestions.map((suggestion, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedSuggestions.has(index)}
                    onCheckedChange={(checked) => {
                      const newSelected = new Set(selectedSuggestions)
                      if (checked) {
                        newSelected.add(index)
                      } else {
                        newSelected.delete(index)
                      }
                      setSelectedSuggestions(newSelected)
                    }}
                    className="mt-1"
                  />
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: suggestion.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium">{suggestion.name}</h4>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAiDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleAddAiSuggestions} disabled={selectedSuggestions.size === 0}>
              {selectedSuggestions.size} Kategorie(n) hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Kategorie bearbeiten" : "Neue Kategorie"}</DialogTitle>
            <DialogDescription>Definieren Sie eine Kategorie für Test-Checklisten</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Frontend, Backend, Sicherheit"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optionale Beschreibung der Kategorie"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Farbe</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#6366f1"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                resetForm()
              }}
            >
              Abbrechen
            </Button>
            <Button onClick={handleSubmit}>{editingCategory ? "Aktualisieren" : "Erstellen"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TestingCategoriesManager
