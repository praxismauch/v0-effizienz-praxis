"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FolderPlus, Plus, Pencil, Trash2, GripVertical, Sparkles, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { useState, useEffect } from "react"
import type { OrgaCategory } from "@/types/orgaCategory"

export function OrgaCategoriesManager() {
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { currentUser } = useUser()
  const practiceId = currentPractice?.id || currentUser?.practice_id
  const [categories, setCategories] = useState<OrgaCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInitializing, setIsInitializing] = useState(false)
  const [editingCategory, setEditingCategory] = useState<OrgaCategory | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

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
          <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Neue Kategorie
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-4">
      {categories.map((category) => (
        <Card key={category.id} className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <h4 className="text-sm font-semibold">{category.name}</h4>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {category.is_active && (
              <Badge variant="secondary">Aktiv</Badge>
            )}
            <Button variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
