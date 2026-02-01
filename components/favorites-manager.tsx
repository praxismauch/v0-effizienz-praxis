"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUser } from "@/contexts/user-context"
import { useTranslation } from "@/contexts/translation-context"
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  FileText,
  BarChart3,
  ClipboardList,
  Target,
  BookOpen,
  Contact,
  Workflow,
  CalendarDays,
  Crown,
  FolderKanban,
  LineChart,
  Package,
  Stethoscope,
  Lightbulb,
  BriefcaseBusiness,
  Star,
  Pin,
  Sparkles,
  Network,
  Wrench,
  ClipboardCheck,
  Compass,
  Award,
  GripVertical,
  Trash2,
  CalendarClock,
  Clock,
  Heart,
  MessageCircle,
  GraduationCap,
  TrendingUp,
  FileCheck,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Icon map for menu items
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": LayoutDashboard,
  "/analysis": BarChart3,
  "/academy": GraduationCap,
  "/training": Award,
  "/calendar": CalendarDays,
  "/dienstplan": CalendarClock,
  "/zeiterfassung": Clock,
  "/todos": ClipboardList,
  "/goals": Target,
  "/workflows": Workflow,
  "/responsibilities": ClipboardCheck,
  "/analytics": LineChart,
  "/documents": FileText,
  "/practice-insights": TrendingUp,
  "/knowledge": BookOpen,
  "/protocols": FileCheck,
  "/cirs": Shield,
  "/hygieneplan": Shield,
  "/strategy-journey": Compass,
  "/leadership": Crown,
  "/wellbeing": Heart,
  "/leitbild": Sparkles,
  "/roi-analysis": LineChart,
  "/igel-analysis": Lightbulb,
  "/competitor-analysis": Network,
  "/wunschpatient": Target,
  "/hiring": BriefcaseBusiness,
  "/team": Users,
  "/mitarbeitergespraeche": MessageCircle,
  "/selbst-check": Heart,
  "/skills": Award,
  "/organigramm": FolderKanban,
  "/contacts": Contact,
  "/surveys": ClipboardList,
  "/arbeitsplaetze": BriefcaseBusiness,
  "/rooms": Pin,
  "/arbeitsmittel": Wrench,
  "/inventory": Package,
  "/devices": Stethoscope,
  "/settings": Settings,
}

// Label map for menu items (German)
const labelMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/analysis": "KI-Analyse",
  "/academy": "Academy",
  "/training": "Fortbildung",
  "/calendar": "Kalender",
  "/dienstplan": "Dienstplan",
  "/zeiterfassung": "Zeiterfassung",
  "/todos": "Aufgaben",
  "/goals": "Ziele",
  "/workflows": "Workflows",
  "/responsibilities": "Zuständigkeiten",
  "/analytics": "Kennzahlen",
  "/documents": "Dokumente",
  "/practice-insights": "Journal",
  "/knowledge": "Wissen",
  "/protocols": "Protokolle",
  "/cirs": "Verbesserungsmeldung",
  "/hygieneplan": "Hygieneplan",
  "/strategy-journey": "Strategiepfad",
  "/leadership": "Leadership",
  "/wellbeing": "Mitarbeiter-Wellbeing",
  "/leitbild": "Leitbild",
  "/roi-analysis": "Lohnt-es-sich-Analyse",
  "/igel-analysis": "Selbstzahler-Analyse",
  "/competitor-analysis": "Konkurrenzanalyse",
  "/wunschpatient": "Wunschpatient",
  "/hiring": "Personalsuche",
  "/team": "Team",
  "/mitarbeitergespraeche": "Mitarbeitergespräche",
  "/selbst-check": "Selbst-Check",
  "/skills": "Kompetenzen",
  "/organigramm": "Organigramm",
  "/contacts": "Kontakte",
  "/surveys": "Umfragen",
  "/arbeitsplaetze": "Arbeitsplätze",
  "/rooms": "Räume",
  "/arbeitsmittel": "Arbeitsmittel",
  "/inventory": "Material",
  "/devices": "Geräte",
  "/settings": "Einstellungen",
}

interface FavoritesManagerProps {
  favorites: string[]
  onFavoritesChange: (favorites: string[]) => void
}

export function FavoritesManager({ favorites, onFavoritesChange }: FavoritesManagerProps) {
  const { t } = useTranslation()
  const { currentUser } = useUser()
  const [localFavorites, setLocalFavorites] = useState<string[]>(favorites)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setLocalFavorites(favorites)
  }, [favorites])

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newFavorites = [...localFavorites]
    const [draggedItem] = newFavorites.splice(draggedIndex, 1)
    newFavorites.splice(dropIndex, 0, draggedItem)
    
    setLocalFavorites(newFavorites)
    setDraggedIndex(null)
    setDragOverIndex(null)

    // Save to server
    await saveFavorites(newFavorites)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleRemove = async (path: string) => {
    const newFavorites = localFavorites.filter((f) => f !== path)
    setLocalFavorites(newFavorites)

    // Remove from server
    if (currentUser?.id) {
      try {
        await fetch(`/api/users/${currentUser.id}/favorites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item_path: path,
            action: "remove",
          }),
        })
        onFavoritesChange(newFavorites)
      } catch (error) {
        console.error("[v0] Error removing favorite:", error)
        setLocalFavorites(favorites) // Revert on error
      }
    }
  }

  const saveFavorites = async (newFavorites: string[]) => {
    if (!currentUser?.id) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/users/${currentUser.id}/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          favorites: newFavorites,
        }),
      })

      if (response.ok) {
        onFavoritesChange(newFavorites)
      } else {
        console.error("[v0] Error saving favorites order")
        setLocalFavorites(favorites) // Revert on error
      }
    } catch (error) {
      console.error("[v0] Error saving favorites:", error)
      setLocalFavorites(favorites) // Revert on error
    } finally {
      setIsSaving(false)
    }
  }

  const moveItem = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= localFavorites.length) return

    const newFavorites = [...localFavorites]
    const temp = newFavorites[index]
    newFavorites[index] = newFavorites[newIndex]
    newFavorites[newIndex] = temp

    setLocalFavorites(newFavorites)
    await saveFavorites(newFavorites)
  }

  if (localFavorites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            {t("favorites.manage", "Favoriten verwalten")}
          </CardTitle>
          <CardDescription>
            {t("favorites.manage_desc", "Ordnen Sie Ihre Favoriten per Drag & Drop neu an oder entfernen Sie sie")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Star className="h-12 w-12 mb-4 opacity-30" />
            <p className="font-medium">{t("favorites.empty", "Keine Favoriten vorhanden")}</p>
            <p className="text-sm mt-1">
              {t("favorites.empty_hint", "Klicken Sie mit der rechten Maustaste auf einen Menüpunkt, um ihn als Favorit hinzuzufügen")}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          {t("favorites.manage", "Favoriten verwalten")}
        </CardTitle>
        <CardDescription>
          {t("favorites.manage_desc", "Ordnen Sie Ihre Favoriten per Drag & Drop neu an oder entfernen Sie sie")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {localFavorites.map((path, index) => {
            const Icon = iconMap[path] || Star
            const label = labelMap[path] || path
            const isDragging = draggedIndex === index
            const isDragOver = dragOverIndex === index

            return (
              <div
                key={path}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all cursor-move",
                  isDragging && "opacity-50 scale-95",
                  isDragOver && "border-primary border-2 bg-primary/5",
                  !isDragging && !isDragOver && "hover:bg-accent"
                )}
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                  <span className="text-xs font-medium w-5 text-center">{index + 1}</span>
                </div>
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded-md bg-amber-500/10">
                    <Icon className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="font-medium">{label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveItem(index, "up")}
                    disabled={index === 0 || isSaving}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m18 15-6-6-6 6"/>
                    </svg>
                    <span className="sr-only">Nach oben</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveItem(index, "down")}
                    disabled={index === localFavorites.length - 1 || isSaving}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                    <span className="sr-only">Nach unten</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove(path)}
                    disabled={isSaving}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Entfernen</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
        {isSaving && (
          <p className="text-sm text-muted-foreground mt-3 text-center">Speichere...</p>
        )}
      </CardContent>
    </Card>
  )
}
