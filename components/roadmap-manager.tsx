"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RoadmapAIIdeasDialog } from "@/components/roadmap-ai-ideas-dialog"
import {
  Plus,
  Sparkles,
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lightbulb,
  Target,
  Zap,
  RefreshCw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RoadmapItem {
  id: string
  title: string
  description: string | null
  status: "planned" | "in_progress" | "completed" | "on_hold"
  priority: "high" | "medium" | "low"
  effort: "low" | "medium" | "high" | null
  impact: "low" | "medium" | "high" | null
  category: string | null
  tags: string[]
  target_date: string | null
  votes: number
  display_order: number
  assigned_to: string | null
  created_by: string | null
  metadata: Record<string, unknown>
  completed_at: string | null
  created_at: string
  updated_at: string
  is_ai_generated: boolean
  ai_reasoning: string
  ai_suggested_quarter: string
  target_quarter: string
}

interface AIFeatureSuggestion {
  title: string
  description: string
  priority: "high" | "medium" | "low"
  effort: "low" | "medium" | "high"
  impact: "low" | "medium" | "high"
  category: string
  reasoning: string
  suggestedQuarter: string
}

interface RoadmapManagerProps {
  userId?: string
}

const statusConfig = {
  planned: { label: "Geplant", color: "bg-muted text-muted-foreground", dotColor: "bg-muted-foreground" },
  in_progress: {
    label: "In Arbeit",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    dotColor: "bg-blue-500 animate-pulse",
  },
  completed: {
    label: "Fertig",
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    dotColor: "bg-green-500",
  },
  on_hold: {
    label: "Pausiert",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    dotColor: "bg-yellow-500",
  },
}

const priorityConfig = {
  high: { label: "Hoch", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", icon: Zap },
  medium: {
    label: "Mittel",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    icon: Target,
  },
  low: { label: "Niedrig", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: Clock },
}

const categoryConfig: Record<string, { label: string; color: string }> = {
  analytics: { label: "Analytics", color: "bg-purple-100 text-purple-700" },
  automation: { label: "Automation", color: "bg-cyan-100 text-cyan-700" },
  communication: { label: "Kommunikation", color: "bg-pink-100 text-pink-700" },
  integration: { label: "Integration", color: "bg-indigo-100 text-indigo-700" },
  ai: { label: "KI", color: "bg-emerald-100 text-emerald-700" },
  management: { label: "Management", color: "bg-amber-100 text-amber-700" },
  mobile: { label: "Mobile", color: "bg-sky-100 text-sky-700" },
  security: { label: "Sicherheit", color: "bg-rose-100 text-rose-700" },
}

function RoadmapManager({ userId }: RoadmapManagerProps) {
  const [items, setItems] = useState<RoadmapItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null)
  const [aiSuggestions, setAISuggestions] = useState<AIFeatureSuggestion[]>([])
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [sortBy, setSortBy] = useState<"priority" | "target_date" | "created_at" | "status">("priority")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "planned" as RoadmapItem["status"],
    priority: "medium" as RoadmapItem["priority"],
    effort: "" as string,
    impact: "" as string,
    category: "" as string,
    target_date: "",
  })

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.set("sortBy", sortBy)
      if (filterStatus !== "all") {
        params.set("status", filterStatus)
      }

      const response = await fetch(`/api/roadmap?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error("[v0] Error fetching roadmap items:", error)
      toast({
        title: "Fehler",
        description: "Roadmap konnte nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [sortBy, filterStatus, toast])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "planned",
      priority: "medium",
      effort: "",
      impact: "",
      category: "",
      target_date: "",
    })
  }

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Fehler",
        description: "Titel ist erforderlich",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          effort: formData.effort || null,
          impact: formData.impact || null,
          category: formData.category || null,
          target_date: formData.target_date || null,
          created_by: userId,
        }),
      })

      if (!response.ok) throw new Error("Failed to create")

      toast({
        title: "Erfolg",
        description: "Feature wurde zur Roadmap hinzugefügt",
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchItems()
    } catch (error) {
      console.error("[v0] Error creating roadmap item:", error)
      toast({
        title: "Fehler",
        description: "Feature konnte nicht erstellt werden",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedItem || !formData.title.trim()) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/roadmap/${selectedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          effort: formData.effort || null,
          impact: formData.impact || null,
          category: formData.category || null,
          target_date: formData.target_date || null,
        }),
      })

      if (!response.ok) throw new Error("Failed to update")

      toast({
        title: "Erfolg",
        description: "Feature wurde aktualisiert",
      })
      setIsEditDialogOpen(false)
      setSelectedItem(null)
      resetForm()
      fetchItems()
    } catch (error) {
      console.error("[v0] Error updating roadmap item:", error)
      toast({
        title: "Fehler",
        description: "Feature konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedItem) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/roadmap/${selectedItem.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete")

      setItems((prevItems) => prevItems.filter((item) => item.id !== selectedItem.id))

      toast({
        title: "Erfolg",
        description: "Feature wurde gelöscht",
      })
      setIsDeleteDialogOpen(false)
      setSelectedItem(null)
    } catch (error) {
      console.error("[v0] Error deleting roadmap item:", error)
      toast({
        title: "Fehler",
        description: "Feature konnte nicht gelöscht werden",
        variant: "destructive",
      })
      fetchItems()
    } finally {
      setIsSaving(false)
    }
  }

  const handleGenerateAI = async () => {
    try {
      setIsGeneratingAI(true)
      const existingFeatures = items.map((item) => item.title)

      const response = await fetch("/api/roadmap/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingFeatures,
          context: "Praxismanagement-Software für medizinische Einrichtungen",
        }),
      })

      if (!response.ok) throw new Error("Failed to generate")

      const data = await response.json()
      setAISuggestions(data.features || [])
      setIsAIDialogOpen(true)

      if (data.feedbackStats) {
        toast({
          title: "KI-Vorschläge generiert",
          description: `Basierend auf ${data.feedbackStats.good} guten und ${data.feedbackStats.bad} schlechten vergangenen Bewertungen`,
        })
      }
    } catch (error) {
      console.error("[v0] Error generating AI suggestions:", error)
      toast({
        title: "Fehler",
        description: "KI-Vorschläge konnten nicht generiert werden",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleAddAISuggestion = async (suggestion: AIFeatureSuggestion) => {
    try {
      setIsSaving(true)
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: suggestion.title,
          description: suggestion.description,
          status: "planned",
          priority: suggestion.priority,
          effort: suggestion.effort,
          impact: suggestion.impact,
          category: suggestion.category,
          is_ai_generated: true,
          ai_reasoning: suggestion.reasoning,
          ai_suggested_quarter: suggestion.suggestedQuarter,
          target_quarter: suggestion.suggestedQuarter,
          metadata: { aiGenerated: true, reasoning: suggestion.reasoning },
          created_by: userId,
        }),
      })

      if (!response.ok) throw new Error("Failed to create")

      toast({
        title: "Erfolg",
        description: `"${suggestion.title}" wurde zur Roadmap hinzugefügt`,
      })

      // Remove from suggestions list
      setAISuggestions((prev) => prev.filter((s) => s.title !== suggestion.title))
      fetchItems()
    } catch (error) {
      console.error("[v0] Error adding AI suggestion:", error)
      toast({
        title: "Fehler",
        description: "Feature konnte nicht hinzugefügt werden",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const openEditDialog = (item: RoadmapItem) => {
    setSelectedItem(item)
    setFormData({
      title: item.title,
      description: item.description || "",
      status: item.status,
      priority: item.priority,
      effort: item.effort || "",
      impact: item.impact || "",
      category: item.category || "",
      target_date: item.target_date || "",
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (item: RoadmapItem) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }

  const handleStatusChange = async (item: RoadmapItem, newStatus: RoadmapItem["status"]) => {
    try {
      const response = await fetch(`/api/roadmap/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("Failed to update")

      toast({
        title: "Status aktualisiert",
        description: `"${item.title}" ist jetzt ${statusConfig[newStatus].label}`,
      })
      fetchItems()
    } catch (error) {
      console.error("[v0] Error updating status:", error)
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    }
  }

  // Group items by status for Kanban-like view
  const groupedByStatus = items.reduce(
    (acc, item) => {
      if (!acc[item.status]) acc[item.status] = []
      acc[item.status].push(item)
      return acc
    },
    {} as Record<string, RoadmapItem[]>,
  )

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header mit Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Produkt-Roadmap</h2>
          <p className="text-muted-foreground">Planen und verfolgen Sie die Entwicklung neuer Features</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateAI}
            disabled={isGeneratingAI}
            className="gap-2 bg-transparent"
          >
            {isGeneratingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            KI-Ideen generieren
          </Button>
          <Button
            onClick={() => {
              resetForm()
              setIsCreateDialogOpen(true)
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Feature hinzufügen
          </Button>
        </div>
      </div>

      {/* Filter und Sortierung */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Status:</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="planned">Geplant</SelectItem>
              <SelectItem value="in_progress">In Arbeit</SelectItem>
              <SelectItem value="completed">Fertig</SelectItem>
              <SelectItem value="on_hold">Pausiert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Sortieren:</Label>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Nach Priorität</SelectItem>
              <SelectItem value="target_date">Nach Zieldatum</SelectItem>
              <SelectItem value="created_at">Nach Erstellung</SelectItem>
              <SelectItem value="status">Nach Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchItems} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Roadmap Items */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Features geplant</h3>
            <p className="text-muted-foreground text-center mb-4">
              Fügen Sie Ihr erstes Feature hinzu oder lassen Sie sich von der KI inspirieren.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleGenerateAI} className="gap-2 bg-transparent">
                <Sparkles className="h-4 w-4" />
                KI-Ideen
              </Button>
              <Button
                onClick={() => {
                  resetForm()
                  setIsCreateDialogOpen(true)
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Feature hinzufügen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`transition-all hover:shadow-md ${
                item.status === "completed"
                  ? "bg-green-50/50 dark:bg-green-950/20"
                  : item.status === "in_progress"
                    ? "bg-blue-50/50 dark:bg-blue-950/20"
                    : item.status === "on_hold"
                      ? "bg-yellow-50/50 dark:bg-yellow-950/20"
                      : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Status Dot */}
                  <div className={`h-3 w-3 rounded-full mt-1.5 flex-shrink-0 ${statusConfig[item.status].dotColor}`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        {item.description && (
                          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{item.description}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(item)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(item, "planned")}
                            disabled={item.status === "planned"}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Als Geplant markieren
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(item, "in_progress")}
                            disabled={item.status === "in_progress"}
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Als In Arbeit markieren
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(item, "completed")}
                            disabled={item.status === "completed"}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Als Fertig markieren
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(item)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Badge variant="outline" className={statusConfig[item.status].color}>
                        {statusConfig[item.status].label}
                      </Badge>
                      <Badge variant="outline" className={priorityConfig[item.priority].color}>
                        {priorityConfig[item.priority].label}
                      </Badge>
                      {item.category && categoryConfig[item.category] && (
                        <Badge variant="outline" className={categoryConfig[item.category].color}>
                          {categoryConfig[item.category].label}
                        </Badge>
                      )}
                      {item.effort && (
                        <Badge variant="outline" className="bg-slate-50">
                          Aufwand: {item.effort === "low" ? "Niedrig" : item.effort === "medium" ? "Mittel" : "Hoch"}
                        </Badge>
                      )}
                      {item.target_date && (
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(item.target_date)}
                        </Badge>
                      )}
                      {item.metadata && (item.metadata as any).aiGenerated && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                          <Sparkles className="h-3 w-3 mr-1" />
                          KI-generiert
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Neues Feature hinzufügen</DialogTitle>
            <DialogDescription>Fügen Sie ein neues Feature zur Produkt-Roadmap hinzu.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="z.B. Sprachsteuerung für Dokumentation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Beschreiben Sie das Feature und seinen Nutzen..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as RoadmapItem["status"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Geplant</SelectItem>
                    <SelectItem value="in_progress">In Arbeit</SelectItem>
                    <SelectItem value="completed">Fertig</SelectItem>
                    <SelectItem value="on_hold">Pausiert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priorität</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v as RoadmapItem["priority"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Hoch</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="low">Niedrig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Aufwand</Label>
                <Select value={formData.effort} onValueChange={(v) => setFormData({ ...formData, effort: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Impact</Label>
                <Select value={formData.impact} onValueChange={(v) => setFormData({ ...formData, impact: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategorie</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zieldatum</Label>
                <Input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Feature bearbeiten</DialogTitle>
            <DialogDescription>Aktualisieren Sie die Details dieses Features.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titel *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Beschreibung</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as RoadmapItem["status"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Geplant</SelectItem>
                    <SelectItem value="in_progress">In Arbeit</SelectItem>
                    <SelectItem value="completed">Fertig</SelectItem>
                    <SelectItem value="on_hold">Pausiert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priorität</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v as RoadmapItem["priority"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Hoch</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="low">Niedrig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Aufwand</Label>
                <Select value={formData.effort} onValueChange={(v) => setFormData({ ...formData, effort: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Impact</Label>
                <Select value={formData.impact} onValueChange={(v) => setFormData({ ...formData, impact: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategorie</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zieldatum</Label>
                <Input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEdit} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Suggestions Dialog */}
      <RoadmapAIIdeasDialog
        isOpen={isAIDialogOpen}
        onClose={() => setIsAIDialogOpen(false)}
        suggestions={aiSuggestions}
        onAddSuggestion={handleAddAISuggestion}
        userId={userId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Feature löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie "{selectedItem?.title}" löschen möchten? Diese Aktion kann nicht rückgängig
              gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default RoadmapManager
