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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Pencil, Trash2, Play, CheckCircle2, Sparkles, Loader2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Navigation, LayoutGrid, ChevronDown, FileText, CheckCircle } from "lucide-react"

interface TestingCategory {
  id: string
  name: string
  description: string | null
  color: string
}

interface ChecklistTemplate {
  id: string
  title: string
  description: string | null
  category_id: string | null
  is_active: boolean
  testing_categories?: TestingCategory
}

interface TestChecklist {
  id: string
  title: string
  description: string | null
  completed_at: string | null
  created_at: string
}

interface ChecklistItem {
  id: string
  title: string
  description: string | null
  is_completed: boolean
  category_id: string | null
  testing_categories?: TestingCategory
  notes: string | null
}

function TestChecklistManager() {
  const [activeTab, setActiveTab] = useState<"templates" | "checklists">("templates")
  const [categories, setCategories] = useState<TestingCategory[]>([])
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [checklists, setChecklists] = useState<TestChecklist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null)
  const [templateFormData, setTemplateFormData] = useState({
    title: "",
    description: "",
    category_id: "",
  })

  // Checklist execution state
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(null)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [isChecklistDialogOpen, setIsChecklistDialogOpen] = useState(false)

  // AI suggestion state
  const [isAiSuggesting, setIsAiSuggesting] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set())
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false)
  const [customPrompt, setCustomPrompt] = useState("")
  const [showPromptInput, setShowPromptInput] = useState(false)

  const { toast } = useToast()

  const [isGeneratingSidebar, setIsGeneratingSidebar] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [categoriesRes, templatesRes, checklistsRes] = await Promise.all([
        fetch("/api/testing-categories"),
        fetch("/api/test-templates"),
        fetch("/api/test-checklists"),
      ])

      if (categoriesRes.ok) {
        setCategories(await categoriesRes.json())
      }
      if (templatesRes.ok) {
        setTemplates(await templatesRes.json())
      }
      if (checklistsRes.ok) {
        setChecklists(await checklistsRes.json())
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Daten konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitTemplate = async () => {
    try {
      const url = editingTemplate ? `/api/test-templates/${editingTemplate.id}` : "/api/test-templates"
      const method = editingTemplate ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateFormData),
      })

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: editingTemplate ? "Vorlage wurde aktualisiert" : "Vorlage wurde erstellt",
        })
        loadData()
        setIsTemplateDialogOpen(false)
        resetTemplateForm()
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Vorlage konnte nicht gespeichert werden",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Möchten Sie diese Vorlage wirklich löschen?")) return

    try {
      const response = await fetch(`/api/test-templates/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: "Vorlage wurde gelöscht",
        })
        loadData()
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Vorlage konnte nicht gelöscht werden",
        variant: "destructive",
      })
    }
  }

  const handleGenerateChecklist = async () => {
    try {
      console.log("[v0] Generating checklist...")
      const response = await fetch("/api/test-checklists/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      console.log("[v0] Generate response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] Generate error:", errorData)
        throw new Error(errorData.error || "Failed to generate checklist")
      }

      const data = await response.json()
      console.log("[v0] Generated checklist:", data.id)

      toast({
        title: "Erfolg",
        description: "Checkliste wurde erstellt",
      })
      loadData()
      setSelectedChecklist(data.id)
      loadChecklistItems(data.id)
      setIsChecklistDialogOpen(true)
    } catch (error) {
      console.error("[v0] Error in handleGenerateChecklist:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Checkliste konnte nicht erstellt werden",
        variant: "destructive",
      })
    }
  }

  const loadChecklistItems = async (checklistId: string) => {
    try {
      const response = await fetch(`/api/test-checklists/${checklistId}/items`)
      if (response.ok) {
        const data = await response.json()
        setChecklistItems(data)
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Checklist-Items konnten nicht geladen werden",
        variant: "destructive",
      })
    }
  }

  const handleToggleItem = async (itemId: string, isCompleted: boolean) => {
    if (!selectedChecklist) return

    try {
      const response = await fetch(`/api/test-checklists/${selectedChecklist}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_completed: isCompleted }),
      })

      if (response.ok) {
        setChecklistItems((items) =>
          items.map((item) => (item.id === itemId ? { ...item, is_completed: isCompleted } : item)),
        )
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    }
  }

  const handleUpdateNotes = async (itemId: string, notes: string) => {
    if (!selectedChecklist) return

    try {
      await fetch(`/api/test-checklists/${selectedChecklist}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      })
    } catch (error) {
      console.error("Failed to update notes:", error)
    }
  }

  const openEditTemplate = (template: ChecklistTemplate) => {
    setEditingTemplate(template)
    setTemplateFormData({
      title: template.title,
      description: template.description || "",
      category_id: template.category_id || "",
    })
    setIsTemplateDialogOpen(true)
  }

  const resetTemplateForm = () => {
    setEditingTemplate(null)
    setTemplateFormData({
      title: "",
      description: "",
      category_id: "",
    })
  }

  const openChecklist = (checklistId: string) => {
    setSelectedChecklist(checklistId)
    loadChecklistItems(checklistId)
    setIsChecklistDialogOpen(true)
  }

  // AI suggestion function
  const handleAiSuggestItems = async () => {
    setIsAiSuggesting(true)
    try {
      console.log("[v0] Fetching AI suggestions with:", {
        templates: templates.length,
        categories: categories.length,
        customPrompt: customPrompt || "none",
      })

      const response = await fetch("/api/test-templates/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingTemplates: templates.map((t) => t.title),
          categories: categories.map((c) => ({ id: c.id, name: c.name })),
          customPrompt: customPrompt.trim() || undefined,
        }),
      })

      console.log("[v0] AI suggestions response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] AI suggestions received:", data.suggestions?.length)
        setAiSuggestions(data.suggestions)
        setSelectedSuggestions(new Set(data.suggestions.map((_: any, i: number) => i)))
        setIsAiDialogOpen(true)
        setShowPromptInput(false)
        setCustomPrompt("")
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("[v0] AI suggestions failed:", response.status, errorData)
        throw new Error(`API returned ${response.status}: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("[v0] Error generating AI suggestions:", error)
      toast({
        title: "Fehler",
        description: "KI-Vorschläge konnten nicht generiert werden",
        variant: "destructive",
      })
    } finally {
      setIsAiSuggesting(false)
    }
  }

  // Function to add selected AI suggestions
  const handleAddAiSuggestions = async () => {
    const suggestionsToAdd = aiSuggestions.filter((_, index) => selectedSuggestions.has(index))

    try {
      for (const suggestion of suggestionsToAdd) {
        await fetch("/api/test-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(suggestion),
        })
      }

      toast({
        title: "Erfolg",
        description: `${suggestionsToAdd.length} Vorlage(n) wurden hinzugefügt`,
      })
      loadData()
      setIsAiDialogOpen(false)
      setSelectedSuggestions(new Set())
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Vorlagen konnten nicht hinzugefügt werden",
        variant: "destructive",
      })
    }
  }

  const handleGenerateSidebarTemplates = async (includeAdminOnly: boolean) => {
    setIsGeneratingSidebar(true)
    try {
      const response = await fetch("/api/test-templates/generate-from-sidebar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeAdminOnly }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: data.message,
        })
        loadData()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Sidebar-Vorlagen konnten nicht generiert werden",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingSidebar(false)
    }
  }

  // Group items by category
  const groupedItems = checklistItems.reduce(
    (acc, item) => {
      const categoryName = item.testing_categories?.name || "Ohne Kategorie"
      if (!acc[categoryName]) {
        acc[categoryName] = []
      }
      acc[categoryName].push(item)
      return acc
    },
    {} as Record<string, ChecklistItem[]>,
  )

  const completionPercentage = checklistItems.length
    ? Math.round((checklistItems.filter((i) => i.is_completed).length / checklistItems.length) * 100)
    : 0

  if (isLoading) {
    return <div className="text-center py-8">Laden...</div>
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "templates" | "checklists")}>
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              Vorlagen
            </TabsTrigger>
            <TabsTrigger value="checklists" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Checklisten
            </TabsTrigger>
          </TabsList>

          {activeTab === "templates" && (
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-transparent" disabled={isGeneratingSidebar}>
                    <LayoutGrid className="h-4 w-4" />
                    Vorlage generieren
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem onClick={() => handleGenerateSidebarTemplates(true)} className="gap-2">
                    <Navigation className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Sidebar-Navigation (Alle)</span>
                      <span className="text-xs text-muted-foreground">Inkl. Admin-Menüpunkte</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleGenerateSidebarTemplates(false)} className="gap-2">
                    <Navigation className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Sidebar-Navigation (Standard)</span>
                      <span className="text-xs text-muted-foreground">Ohne Admin-Menüpunkte</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsAiDialogOpen(true)} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span>KI-Vorschläge</span>
                      <span className="text-xs text-muted-foreground">Intelligente Testvorschläge</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={() => {
                  resetTemplateForm()
                  setIsTemplateDialogOpen(true)
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Neue Vorlage
              </Button>
            </div>
          )}

          {activeTab === "checklists" && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {checklists.length} Checkliste{checklists.length !== 1 ? "n" : ""}
              </p>
              <Button onClick={handleGenerateChecklist}>
                <Play className="h-4 w-4 mr-2" />
                Neue Checkliste generieren
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {templates.length} Vorlage{templates.length !== 1 ? "n" : ""}
            </p>
            <div className="flex gap-2">
              <div className="relative">
                {!showPromptInput ? (
                  <Button
                    onClick={() => setShowPromptInput(true)}
                    disabled={isAiSuggesting}
                    className="bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isAiSuggesting ? "KI arbeitet..." : "KI-Vorschläge"}
                  </Button>
                ) : (
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="Was soll die KI vorschlagen? (Optional)"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="w-[300px]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAiSuggestItems()
                        } else if (e.key === "Escape") {
                          setShowPromptInput(false)
                          setCustomPrompt("")
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      onClick={handleAiSuggestItems}
                      disabled={isAiSuggesting}
                      className="bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg"
                    >
                      {isAiSuggesting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generiere...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generieren
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowPromptInput(false)
                        setCustomPrompt("")
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {templates.map((template) => (
              <Card key={template.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{template.title}</h4>
                      {template.testing_categories && (
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: `${template.testing_categories.color}20`,
                            color: template.testing_categories.color,
                            borderColor: template.testing_categories.color,
                          }}
                        >
                          {template.testing_categories.name}
                        </Badge>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditTemplate(template)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="checklists" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {checklists.length} Checkliste{checklists.length !== 1 ? "n" : ""}
            </p>
            <Button onClick={handleGenerateChecklist}>
              <Play className="h-4 w-4 mr-2" />
              Neue Checkliste generieren
            </Button>
          </div>

          <div className="grid gap-3">
            {checklists.map((checklist) => (
              <Card
                key={checklist.id}
                className="p-4 cursor-pointer hover:bg-accent"
                onClick={() => openChecklist(checklist.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{checklist.title}</h4>
                      {checklist.completed_at && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Abgeschlossen
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Erstellt: {new Date(checklist.created_at).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Vorlage bearbeiten" : "Neue Vorlage"}</DialogTitle>
            <DialogDescription>
              Erstellen Sie eine Test-Item-Vorlage, die in Checklisten verwendet wird
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-title">Titel</Label>
              <Input
                id="template-title"
                value={templateFormData.title}
                onChange={(e) => setTemplateFormData({ ...templateFormData, title: e.target.value })}
                placeholder="z.B. Login-Funktionalität testen"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Beschreibung</Label>
              <Textarea
                id="template-description"
                value={templateFormData.description}
                onChange={(e) =>
                  setTemplateFormData({
                    ...templateFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Detaillierte Testanweisungen..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-category">Kategorie</Label>
              <Select
                value={templateFormData.category_id}
                onValueChange={(value) => setTemplateFormData({ ...templateFormData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsTemplateDialogOpen(false)
                resetTemplateForm()
              }}
            >
              Abbrechen
            </Button>
            <Button onClick={handleSubmitTemplate}>{editingTemplate ? "Aktualisieren" : "Erstellen"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checklist Execution Dialog */}
      <Dialog open={isChecklistDialogOpen} onOpenChange={setIsChecklistDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Test-Checkliste durchführen</DialogTitle>
            <DialogDescription>Fortschritt: {completionPercentage}% abgeschlossen</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {Object.entries(groupedItems).map(([categoryName, items]) => (
              <div key={categoryName} className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  {items[0]?.testing_categories && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: items[0].testing_categories.color,
                      }}
                    />
                  )}
                  {categoryName}
                </h3>
                <div className="space-y-2">
                  {items.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={item.is_completed}
                            onCheckedChange={(checked) => handleToggleItem(item.id, checked as boolean)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h4
                              className={`font-medium ${item.is_completed ? "line-through text-muted-foreground" : ""}`}
                            >
                              {item.title}
                            </h4>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            )}
                          </div>
                        </div>
                        <Textarea
                          placeholder="Notizen hinzufügen..."
                          value={item.notes || ""}
                          onChange={(e) => handleUpdateNotes(item.id, e.target.value)}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChecklistDialogOpen(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Suggestions Dialog */}
      <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KI-Vorschläge für Test-Items</DialogTitle>
            <DialogDescription>
              Wählen Sie die Test-Items aus, die Sie zu Ihren Vorlagen hinzufügen möchten
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {aiSuggestions.map((suggestion, index) => {
              const category = categories.find((c) => c.id === suggestion.category_id)
              return (
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{suggestion.title}</h4>
                        {category && (
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: `${category.color}20`,
                              color: category.color,
                              borderColor: category.color,
                            }}
                          >
                            {category.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAiDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleAddAiSuggestions} disabled={selectedSuggestions.size === 0}>
              {selectedSuggestions.size} Vorlage(n) hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TestChecklistManager
