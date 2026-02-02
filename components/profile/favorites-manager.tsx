"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/contexts/user-context"
import { toast } from "sonner"
import {
  Star,
  GripVertical,
  X,
  Plus,
  CalendarDays,
  CalendarClock,
  Clock,
  ClipboardList,
  Target,
  Workflow,
  ClipboardCheck,
  LineChart,
  FileText,
  TrendingUp,
  BookOpen,
  FileCheck,
  Shield,
  Compass,
  Crown,
  Heart,
  Sparkles,
  Lightbulb,
  Network,
  BriefcaseBusiness,
  Users,
  MessageCircle,
  Award,
  FolderKanban,
  Contact,
  Pin,
  Wrench,
  Package,
  Stethoscope,
  Settings,
  HelpCircle,
  type LucideIcon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"

// All available menu items for favorites
const ALL_MENU_ITEMS: { href: string; name: string; icon: LucideIcon; group: string }[] = [
  // Planung & Organisation
  { href: "/calendar", name: "Kalender", icon: CalendarDays, group: "Planung" },
  { href: "/dienstplan", name: "Dienstplan", icon: CalendarClock, group: "Planung" },
  { href: "/zeiterfassung", name: "Zeiterfassung", icon: Clock, group: "Planung" },
  { href: "/todos", name: "Aufgaben", icon: ClipboardList, group: "Planung" },
  { href: "/goals", name: "Ziele", icon: Target, group: "Planung" },
  { href: "/workflows", name: "Workflows", icon: Workflow, group: "Planung" },
  { href: "/responsibilities", name: "Zuständigkeiten", icon: ClipboardCheck, group: "Planung" },
  // Daten & Dokumente
  { href: "/analytics", name: "Kennzahlen", icon: LineChart, group: "Daten" },
  { href: "/documents", name: "Dokumente", icon: FileText, group: "Daten" },
  { href: "/practice-insights", name: "Journal", icon: TrendingUp, group: "Daten" },
  { href: "/knowledge", name: "Wissen", icon: BookOpen, group: "Daten" },
  { href: "/protocols", name: "Protokolle", icon: FileCheck, group: "Daten" },
  { href: "/cirs", name: "Verbesserungsmeldung", icon: Shield, group: "Daten" },
  // Qualität
  { href: "/hygieneplan", name: "Hygieneplan", icon: Shield, group: "Qualität" },
  // Strategie & Führung
  { href: "/strategy-journey", name: "Strategiepfad", icon: Compass, group: "Strategie" },
  { href: "/leadership", name: "Leadership", icon: Crown, group: "Strategie" },
  { href: "/wellbeing", name: "Mitarbeiter-Wellbeing", icon: Heart, group: "Strategie" },
  { href: "/leitbild", name: "Leitbild", icon: Sparkles, group: "Strategie" },
  { href: "/roi-analysis", name: "Lohnt-es-sich-Analyse", icon: LineChart, group: "Strategie" },
  { href: "/igel-analysis", name: "Selbstzahler-Analyse", icon: Lightbulb, group: "Strategie" },
  { href: "/competitor-analysis", name: "Konkurrenzanalyse", icon: Network, group: "Strategie" },
  { href: "/wunschpatient", name: "Wunschpatient", icon: Target, group: "Strategie" },
  // Team & Personal
  { href: "/hiring", name: "Personalsuche", icon: BriefcaseBusiness, group: "Team" },
  { href: "/team", name: "Team", icon: Users, group: "Team" },
  { href: "/mitarbeitergespraeche", name: "Mitarbeitergespräche", icon: MessageCircle, group: "Team" },
  { href: "/selbst-check", name: "Selbst-Check", icon: Heart, group: "Team" },
  { href: "/skills", name: "Kompetenzen", icon: Award, group: "Team" },
  { href: "/organigramm", name: "Organigramm", icon: FolderKanban, group: "Team" },
  { href: "/training", name: "Fortbildung", icon: Award, group: "Team" },
  // Praxis & Einstellungen
  { href: "/contacts", name: "Kontakte", icon: Contact, group: "Praxis" },
  { href: "/surveys", name: "Umfragen", icon: ClipboardList, group: "Praxis" },
  { href: "/arbeitsplaetze", name: "Arbeitsplätze", icon: BriefcaseBusiness, group: "Praxis" },
  { href: "/rooms", name: "Räume", icon: Pin, group: "Praxis" },
  { href: "/arbeitsmittel", name: "Arbeitsmittel", icon: Wrench, group: "Praxis" },
  { href: "/inventory", name: "Inventar", icon: Package, group: "Praxis" },
  { href: "/devices", name: "Medizingeräte", icon: Stethoscope, group: "Praxis" },
  // System
  { href: "/settings", name: "Einstellungen", icon: Settings, group: "System" },
  { href: "/support", name: "Support", icon: HelpCircle, group: "System" },
]

export function FavoritesManager() {
  const { currentUser } = useUser()
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Load favorites from API and localStorage
  useEffect(() => {
    const loadFavorites = async () => {
      if (!currentUser?.id) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/users/${currentUser.id}/favorites`)
        if (response.ok) {
          const data = await response.json()
          if (data.favorites?.length > 0) {
            setFavorites(data.favorites)
          } else {
            // Try localStorage
            const localFavorites = localStorage.getItem(`sidebar_favorites_${currentUser.id}`)
            if (localFavorites) {
              setFavorites(JSON.parse(localFavorites))
            }
          }
        }
      } catch (error) {
        // Try localStorage as fallback
        try {
          const localFavorites = localStorage.getItem(`sidebar_favorites_${currentUser.id}`)
          if (localFavorites) {
            setFavorites(JSON.parse(localFavorites))
          }
        } catch (e) {}
      } finally {
        setIsLoading(false)
      }
    }

    loadFavorites()
  }, [currentUser?.id])

  const saveFavorites = async (newFavorites: string[]) => {
    if (!currentUser?.id) return

    setIsSaving(true)
    
    // Save to localStorage immediately
    try {
      localStorage.setItem(`sidebar_favorites_${currentUser.id}`, JSON.stringify(newFavorites))
    } catch (e) {}

    // Dispatch event to update sidebar
    window.dispatchEvent(new CustomEvent("favorites-updated", { detail: newFavorites }))

    try {
      // Save reorder to API
      await fetch(`/api/users/${currentUser.id}/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", favorites: newFavorites }),
      })
    } catch (error) {
      console.debug("Error saving favorites to API:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const removeFavorite = async (href: string) => {
    const newFavorites = favorites.filter((f) => f !== href)
    setFavorites(newFavorites)
    await saveFavorites(newFavorites)
    toast.success("Favorit entfernt")
  }

  const addFavorite = async (href: string) => {
    if (favorites.includes(href)) return
    const newFavorites = [...favorites, href]
    setFavorites(newFavorites)
    await saveFavorites(newFavorites)
    setAddDialogOpen(false)
    toast.success("Favorit hinzugefügt")
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newFavorites = [...favorites]
    const draggedItem = newFavorites[draggedIndex]
    newFavorites.splice(draggedIndex, 1)
    newFavorites.splice(index, 0, draggedItem)
    setFavorites(newFavorites)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex !== null) {
      await saveFavorites(favorites)
      toast.success("Reihenfolge gespeichert")
    }
    setDraggedIndex(null)
  }

  const moveUp = async (index: number) => {
    if (index === 0) return
    const newFavorites = [...favorites]
    ;[newFavorites[index - 1], newFavorites[index]] = [newFavorites[index], newFavorites[index - 1]]
    setFavorites(newFavorites)
    await saveFavorites(newFavorites)
  }

  const moveDown = async (index: number) => {
    if (index === favorites.length - 1) return
    const newFavorites = [...favorites]
    ;[newFavorites[index], newFavorites[index + 1]] = [newFavorites[index + 1], newFavorites[index]]
    setFavorites(newFavorites)
    await saveFavorites(newFavorites)
  }

  const getMenuItem = (href: string) => ALL_MENU_ITEMS.find((item) => item.href === href)

  const availableItems = ALL_MENU_ITEMS.filter((item) => !favorites.includes(item.href))
  const filteredItems = searchQuery
    ? availableItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.group.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableItems

  const groupedItems = filteredItems.reduce(
    (acc, item) => {
      if (!acc[item.group]) acc[item.group] = []
      acc[item.group].push(item)
      return acc
    },
    {} as Record<string, typeof ALL_MENU_ITEMS>
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Favoriten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Favoriten verwalten
          {favorites.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {favorites.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Bearbeiten und sortieren Sie Ihre Menü-Favoriten per Drag & Drop
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {favorites.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Keine Favoriten vorhanden</p>
            <p className="text-sm">Fügen Sie Menüpunkte hinzu, um schnell darauf zuzugreifen</p>
          </div>
        ) : (
          <div className="space-y-2">
            {favorites.map((href, index) => {
              const item = getMenuItem(href)
              if (!item) return null
              const Icon = item.icon

              return (
                <div
                  key={href}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-move ${
                    draggedIndex === index ? "opacity-50 border-primary" : ""
                  }`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 font-medium">{item.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {item.group}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => moveUp(index)}
                      disabled={index === 0 || isSaving}
                    >
                      <span className="sr-only">Nach oben</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => moveDown(index)}
                      disabled={index === favorites.length - 1 || isSaving}
                    >
                      <span className="sr-only">Nach unten</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeFavorite(href)}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Entfernen</span>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Favorit hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Favorit hinzufügen</DialogTitle>
              <DialogDescription>
                Wählen Sie einen Menüpunkt aus, um ihn zu Ihren Favoriten hinzuzufügen
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <ScrollArea className="h-[300px] pr-4">
                {Object.keys(groupedItems).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "Keine Ergebnisse gefunden" : "Alle Menüpunkte sind bereits Favoriten"}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedItems).map(([group, items]) => (
                      <div key={group}>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">{group}</h4>
                        <div className="space-y-1">
                          {items.map((item) => {
                            const Icon = item.icon
                            return (
                              <button
                                key={item.href}
                                onClick={() => addFavorite(item.href)}
                                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left transition-colors"
                              >
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span>{item.name}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
