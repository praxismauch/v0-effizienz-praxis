"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Plus,
  Trash2,
  Edit,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Loader2,
  FileText,
  X,
  Globe,
  Shield,
} from "lucide-react"

interface TemplateSkill {
  id: string
  template_id: string
  name: string
  category: string | null
  description: string | null
  color: string
  icon: string
  level_0_title: string
  level_0_description: string
  level_0_criteria: string[]
  level_1_title: string
  level_1_description: string
  level_1_criteria: string[]
  level_2_title: string
  level_2_description: string
  level_2_criteria: string[]
  level_3_title: string
  level_3_description: string
  level_3_criteria: string[]
  is_active: boolean
  display_order: number
}

interface PracticeTemplate {
  id: string
  name: string
  description: string | null
  specialty_ids: string[]
  is_active: boolean
  is_system_template?: boolean
  display_order: number
  created_at: string
  template_skills?: TemplateSkill[]
}

interface PracticeType {
  id: string
  name: string
}

const SKILL_COLORS = [
  { value: "#3b82f6", label: "Blau", className: "bg-blue-500" },
  { value: "#10b981", label: "Grün", className: "bg-emerald-500" },
  { value: "#f59e0b", label: "Orange", className: "bg-amber-500" },
  { value: "#8b5cf6", label: "Lila", className: "bg-violet-500" },
  { value: "#ec4899", label: "Pink", className: "bg-pink-500" },
  { value: "#ef4444", label: "Rot", className: "bg-red-500" },
  { value: "#06b6d4", label: "Cyan", className: "bg-cyan-500" },
  { value: "#84cc16", label: "Lime", className: "bg-lime-500" },
]

const SKILL_CATEGORIES = [
  "Medizinische Kompetenz",
  "Verwaltung",
  "Kommunikation",
  "Technik",
  "Hygiene",
  "Notfall",
  "Qualitätsmanagement",
  "Patientenbetreuung",
]

export function TemplatesManager() {
  const [templates, setTemplates] = useState<PracticeTemplate[]>([])
  const [practiceTypes, setPracticeTypes] = useState<PracticeType[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<PracticeTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<TemplateSkill | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  // Form states
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    specialty_ids: [] as string[],
    is_system_template: false,
  })

  const [newSkill, setNewSkill] = useState({
    name: "",
    category: "",
    description: "",
    color: "#3b82f6",
    level_0_title: "Kein Skill",
    level_0_description: "Keine Erfahrung, benötigt vollständige Anleitung",
    level_0_criteria: [""],
    level_1_title: "Basis",
    level_1_description: "Kann einfache Aufgaben mit Anleitung ausführen",
    level_1_criteria: [""],
    level_2_title: "Selbstständig",
    level_2_description: "Beherrscht Aufgaben sicher und zuverlässig ohne Hilfe",
    level_2_criteria: [""],
    level_3_title: "Experte",
    level_3_description: "Beherrscht komplexe Situationen, kann andere anleiten, optimiert Prozesse",
    level_3_criteria: [""],
  })

  useEffect(() => {
    loadTemplates()
    loadPracticeTypes()
  }, [])

  const loadTemplates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/super-admin/templates")
      if (!response.ok) throw new Error("Failed to load templates")
      const data = await response.json()
      setTemplates(data)
    } catch (error) {
      console.error("[v0] Error loading templates:", error)
      toast({
        title: "Fehler",
        description: "Vorlagen konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadPracticeTypes = async () => {
    try {
      const response = await fetch("/api/practice-types")
      if (!response.ok) throw new Error("Failed to load practice types")
      const data = await response.json()
      setPracticeTypes(data)
    } catch (error) {
      console.error("[v0] Error loading practice types:", error)
    }
  }

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Namen ein",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch("/api/super-admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTemplate),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create template")
      }

      toast({
        title: "Erfolg",
        description: "Vorlage wurde erstellt",
      })

      setNewTemplate({ name: "", description: "", specialty_ids: [], is_system_template: false })
      setIsCreateDialogOpen(false)
      loadTemplates()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Vorlage konnte nicht erstellt werden"
      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/super-admin/templates/${selectedTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplate.name,
          description: newTemplate.description,
          specialty_ids: newTemplate.specialty_ids,
          is_system_template: newTemplate.is_system_template,
        }),
      })

      if (!response.ok) throw new Error("Failed to update template")

      toast({
        title: "Erfolg",
        description: "Vorlage wurde aktualisiert",
      })

      setIsEditDialogOpen(false)
      loadTemplates()
    } catch (error) {
      console.error("[v0] Error updating template:", error)
      toast({
        title: "Fehler",
        description: "Vorlage konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleSystemTemplate = async (template: PracticeTemplate) => {
    try {
      const response = await fetch(`/api/super-admin/templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_system_template: !template.is_system_template,
        }),
      })

      if (!response.ok) throw new Error("Failed to update template")

      toast({
        title: "Erfolg",
        description: template.is_system_template
          ? "Vorlage ist nicht mehr als System-Vorlage markiert"
          : "Vorlage wurde als System-Vorlage markiert",
      })

      loadTemplates()
    } catch (error) {
      console.error("[v0] Error toggling system template:", error)
      toast({
        title: "Fehler",
        description: "Status konnte nicht geändert werden",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Möchten Sie diese Vorlage wirklich löschen?")) return

    try {
      const response = await fetch(`/api/super-admin/templates/${templateId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete template")

      toast({
        title: "Erfolg",
        description: "Vorlage wurde gelöscht",
      })

      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null)
      }
      loadTemplates()
    } catch (error) {
      console.error("[v0] Error deleting template:", error)
      toast({
        title: "Fehler",
        description: "Vorlage konnte nicht gelöscht werden",
        variant: "destructive",
      })
    }
  }

  const handleGenerateSkills = async () => {
    if (!selectedTemplate) return

    try {
      setIsGenerating(true)
      const specialty = practiceTypes.find((t) => selectedTemplate.specialty_ids.includes(t.id))?.name

      const response = await fetch("/api/super-admin/templates/generate-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialty: specialty || "Allgemeinmedizin",
          templateName: selectedTemplate.name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate skills")
      }

      const { skills } = await response.json()

      // Save generated skills to template
      const saveResponse = await fetch(`/api/super-admin/templates/${selectedTemplate.id}/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills }),
      })

      if (!saveResponse.ok) throw new Error("Failed to save generated skills")

      toast({
        title: "Erfolg",
        description: `${skills.length} Skills wurden generiert und gespeichert`,
      })

      loadTemplates()
    } catch (error) {
      console.error("[v0] Error generating skills:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Skills konnten nicht generiert werden",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddSkill = async () => {
    if (!selectedTemplate || !newSkill.name.trim()) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/super-admin/templates/${selectedTemplate.id}/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newSkill,
          level_0_criteria: newSkill.level_0_criteria.filter((c) => c.trim()),
          level_1_criteria: newSkill.level_1_criteria.filter((c) => c.trim()),
          level_2_criteria: newSkill.level_2_criteria.filter((c) => c.trim()),
          level_3_criteria: newSkill.level_3_criteria.filter((c) => c.trim()),
        }),
      })

      if (!response.ok) throw new Error("Failed to add skill")

      toast({
        title: "Erfolg",
        description: "Skill wurde hinzugefügt",
      })

      resetSkillForm()
      setIsSkillDialogOpen(false)
      loadTemplates()
    } catch (error) {
      console.error("[v0] Error adding skill:", error)
      toast({
        title: "Fehler",
        description: "Skill konnte nicht hinzugefügt werden",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateSkill = async () => {
    if (!selectedTemplate || !editingSkill) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/super-admin/templates/${selectedTemplate.id}/skills/${editingSkill.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newSkill,
          level_0_criteria: newSkill.level_0_criteria.filter((c) => c.trim()),
          level_1_criteria: newSkill.level_1_criteria.filter((c) => c.trim()),
          level_2_criteria: newSkill.level_2_criteria.filter((c) => c.trim()),
          level_3_criteria: newSkill.level_3_criteria.filter((c) => c.trim()),
        }),
      })

      if (!response.ok) throw new Error("Failed to update skill")

      toast({
        title: "Erfolg",
        description: "Skill wurde aktualisiert",
      })

      setEditingSkill(null)
      resetSkillForm()
      setIsSkillDialogOpen(false)
      loadTemplates()
    } catch (error) {
      console.error("[v0] Error updating skill:", error)
      toast({
        title: "Fehler",
        description: "Skill konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSkill = async (skillId: string) => {
    if (!selectedTemplate || !confirm("Möchten Sie diesen Skill wirklich löschen?")) return

    try {
      const response = await fetch(`/api/super-admin/templates/${selectedTemplate.id}/skills/${skillId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete skill")

      toast({
        title: "Erfolg",
        description: "Skill wurde gelöscht",
      })

      loadTemplates()
    } catch (error) {
      console.error("[v0] Error deleting skill:", error)
      toast({
        title: "Fehler",
        description: "Skill konnte nicht gelöscht werden",
        variant: "destructive",
      })
    }
  }

  const resetSkillForm = () => {
    setNewSkill({
      name: "",
      category: "",
      description: "",
      color: "#3b82f6",
      level_0_title: "Kein Skill",
      level_0_description: "Keine Erfahrung, benötigt vollständige Anleitung",
      level_0_criteria: [""],
      level_1_title: "Basis",
      level_1_description: "Kann einfache Aufgaben mit Anleitung ausführen",
      level_1_criteria: [""],
      level_2_title: "Selbstständig",
      level_2_description: "Beherrscht Aufgaben sicher und zuverlässig ohne Hilfe",
      level_2_criteria: [""],
      level_3_title: "Experte",
      level_3_description: "Beherrscht komplexe Situationen, kann andere anleiten, optimiert Prozesse",
      level_3_criteria: [""],
    })
  }

  const openEditSkill = (skill: TemplateSkill) => {
    setEditingSkill(skill)
    setNewSkill({
      name: skill.name,
      category: skill.category || "",
      description: skill.description || "",
      color: skill.color,
      level_0_title: skill.level_0_title,
      level_0_description: skill.level_0_description,
      level_0_criteria: skill.level_0_criteria?.length ? skill.level_0_criteria : [""],
      level_1_title: skill.level_1_title,
      level_1_description: skill.level_1_description,
      level_1_criteria: skill.level_1_criteria?.length ? skill.level_1_criteria : [""],
      level_2_title: skill.level_2_title,
      level_2_description: skill.level_2_description,
      level_2_criteria: skill.level_2_criteria?.length ? skill.level_2_criteria : [""],
      level_3_title: skill.level_3_title,
      level_3_description: skill.level_3_description,
      level_3_criteria: skill.level_3_criteria?.length ? skill.level_3_criteria : [""],
    })
    setIsSkillDialogOpen(true)
  }

  const openEditTemplate = (template: PracticeTemplate) => {
    setSelectedTemplate(template)
    setNewTemplate({
      name: template.name,
      description: template.description || "",
      specialty_ids: template.specialty_ids || [],
      is_system_template: template.is_system_template || false,
    })
    setIsEditDialogOpen(true)
  }

  const toggleSkillExpanded = (skillId: string) => {
    setExpandedSkills((prev) => {
      const next = new Set(prev)
      if (next.has(skillId)) {
        next.delete(skillId)
      } else {
        next.add(skillId)
      }
      return next
    })
  }

  const addCriteria = (level: 0 | 1 | 2 | 3) => {
    const key = `level_${level}_criteria` as keyof typeof newSkill
    setNewSkill((prev) => ({
      ...prev,
      [key]: [...(prev[key] as string[]), ""],
    }))
  }

  const updateCriteria = (level: 0 | 1 | 2 | 3, index: number, value: string) => {
    const key = `level_${level}_criteria` as keyof typeof newSkill
    setNewSkill((prev) => ({
      ...prev,
      [key]: (prev[key] as string[]).map((c, i) => (i === index ? value : c)),
    }))
  }

  const removeCriteria = (level: 0 | 1 | 2 | 3, index: number) => {
    const key = `level_${level}_criteria` as keyof typeof newSkill
    setNewSkill((prev) => ({
      ...prev,
      [key]: (prev[key] as string[]).filter((_, i) => i !== index),
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vorlagen-Verwaltung</h2>
          <p className="text-muted-foreground">
            Erstellen und verwalten Sie Skill-Vorlagen für verschiedene Praxistypen
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neue Vorlage
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Neue Vorlage erstellen</DialogTitle>
              <DialogDescription>Erstellen Sie eine neue Skill-Vorlage für einen Praxistyp</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="z.B. Zahnarztpraxis Standard"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optionale Beschreibung der Vorlage"
                />
              </div>

              <div className="space-y-2">
                <Label>Praxistypen</Label>
                <Select
                  value={newTemplate.specialty_ids[0] || ""}
                  onValueChange={(value) => setNewTemplate((prev) => ({ ...prev, specialty_ids: [value] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Praxistyp auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {practiceTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                    <Globe className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <Label htmlFor="is_system_template" className="text-sm font-semibold text-amber-900">
                      System-Vorlage
                    </Label>
                    <p className="text-xs text-amber-700">Für alle Benutzer sichtbar</p>
                  </div>
                </div>
                <Switch
                  id="is_system_template"
                  checked={newTemplate.is_system_template}
                  onCheckedChange={(checked) => setNewTemplate((prev) => ({ ...prev, is_system_template: checked }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreateTemplate} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Templates List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Vorlagen</CardTitle>
            <CardDescription>{templates.length} Vorlage(n) verfügbar</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`group relative cursor-pointer rounded-lg border p-3 transition-colors hover:bg-accent ${
                      selectedTemplate?.id === template.id ? "border-primary bg-accent" : ""
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium truncate">{template.name}</h4>
                          {template.is_system_template && (
                            <Badge
                              variant="outline"
                              className="border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 font-bold text-xs px-2 py-0.5 flex items-center gap-1 shadow-sm"
                            >
                              <Globe className="h-3 w-3" />
                              SYSTEM
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {template.description || "Keine Beschreibung"}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {template.template_skills?.length || 0} Skills
                          </Badge>
                          {template.specialty_ids?.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {practiceTypes.find((t) => template.specialty_ids.includes(t.id))?.name || "Unbekannt"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${template.is_system_template ? "text-amber-600 hover:text-amber-700" : "text-muted-foreground hover:text-amber-600"}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleSystemTemplate(template)
                          }}
                          title={
                            template.is_system_template ? "System-Vorlage deaktivieren" : "Als System-Vorlage markieren"
                          }
                        >
                          <Globe className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditTemplate(template)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTemplate(template.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {templates.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    <FileText className="mx-auto mb-2 h-8 w-8" />
                    <p>Keine Vorlagen vorhanden</p>
                    <p className="text-sm">Erstellen Sie Ihre erste Vorlage</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Template Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedTemplate?.name || "Vorlage auswählen"}
                  {selectedTemplate?.is_system_template && (
                    <Badge className="ml-2 border-2 border-amber-400 bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 text-amber-800 font-bold text-sm px-3 py-1 flex items-center gap-1.5 shadow-md animate-pulse">
                      <Shield className="h-4 w-4" />
                      GLOBALE SYSTEM-VORLAGE
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {selectedTemplate
                    ? `${selectedTemplate.template_skills?.length || 0} Skills definiert`
                    : "Wählen Sie eine Vorlage aus der Liste"}
                </CardDescription>
              </div>
              {selectedTemplate && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleGenerateSkills} disabled={isGenerating}>
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Skills generieren
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingSkill(null)
                      resetSkillForm()
                      setIsSkillDialogOpen(true)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Skill hinzufügen
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedTemplate ? (
              <ScrollArea className="h-[500px]">
                {selectedTemplate.is_system_template && (
                  <div className="mb-4 rounded-lg border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-200">
                        <Globe className="h-6 w-6 text-amber-700" />
                      </div>
                      <div>
                        <h4 className="font-bold text-amber-900">Globale System-Vorlage</h4>
                        <p className="text-sm text-amber-700">
                          Diese Vorlage ist für alle Benutzer im System sichtbar und kann als Grundlage für neue Praxen
                          verwendet werden.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {selectedTemplate.template_skills?.map((skill) => (
                    <Collapsible
                      key={skill.id}
                      open={expandedSkills.has(skill.id)}
                      onOpenChange={() => toggleSkillExpanded(skill.id)}
                    >
                      <div className="rounded-lg border">
                        <CollapsibleTrigger asChild>
                          <div className="flex cursor-pointer items-center justify-between p-4 hover:bg-accent">
                            <div className="flex items-center gap-3">
                              <div className="h-4 w-4 rounded-full" style={{ backgroundColor: skill.color }} />
                              <div>
                                <h4 className="font-medium">{skill.name}</h4>
                                <p className="text-sm text-muted-foreground">{skill.category || "Keine Kategorie"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openEditSkill(skill)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteSkill(skill.id)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              {expandedSkills.has(skill.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="border-t p-4">
                            {skill.description && (
                              <p className="mb-4 text-sm text-muted-foreground">{skill.description}</p>
                            )}
                            <div className="grid gap-4 md:grid-cols-2">
                              {[0, 1, 2, 3].map((level) => {
                                const title = skill[`level_${level}_title` as keyof TemplateSkill] as string
                                const description = skill[`level_${level}_description` as keyof TemplateSkill] as string
                                const criteria = skill[`level_${level}_criteria` as keyof TemplateSkill] as string[]

                                return (
                                  <div key={level} className="rounded-lg bg-muted/50 p-3">
                                    <div className="mb-2 flex items-center gap-2">
                                      <Badge variant="outline">Level {level}</Badge>
                                      <span className="font-medium">{title}</span>
                                    </div>
                                    <p className="mb-2 text-sm text-muted-foreground">{description}</p>
                                    {criteria?.length > 0 && (
                                      <ul className="list-inside list-disc text-sm">
                                        {criteria.map((c, i) => (
                                          <li key={i}>{c}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}

                  {(!selectedTemplate.template_skills || selectedTemplate.template_skills.length === 0) && (
                    <div className="py-8 text-center text-muted-foreground">
                      <Sparkles className="mx-auto mb-2 h-8 w-8" />
                      <p>Keine Skills definiert</p>
                      <p className="text-sm">Generieren Sie Skills mit KI oder fügen Sie manuell hinzu</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex h-[500px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileText className="mx-auto mb-2 h-12 w-12" />
                  <p>Wählen Sie eine Vorlage aus der Liste</p>
                  <p className="text-sm">um Details und Skills anzuzeigen</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vorlage bearbeiten</DialogTitle>
            <DialogDescription>Ändern Sie die Eigenschaften der Vorlage</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Beschreibung</Label>
              <Textarea
                id="edit-description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Praxistypen</Label>
              <Select
                value={newTemplate.specialty_ids[0] || ""}
                onValueChange={(value) => setNewTemplate((prev) => ({ ...prev, specialty_ids: [value] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Praxistyp auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {practiceTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <Globe className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <Label htmlFor="edit_is_system_template" className="text-sm font-semibold text-amber-900">
                    System-Vorlage
                  </Label>
                  <p className="text-xs text-amber-700">Für alle Benutzer sichtbar</p>
                </div>
              </div>
              <Switch
                id="edit_is_system_template"
                checked={newTemplate.is_system_template}
                onCheckedChange={(checked) => setNewTemplate((prev) => ({ ...prev, is_system_template: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleUpdateTemplate} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skill Dialog */}
      <Dialog open={isSkillDialogOpen} onOpenChange={setIsSkillDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingSkill ? "Skill bearbeiten" : "Neuen Skill hinzufügen"}</DialogTitle>
            <DialogDescription>Definieren Sie einen Skill mit 4 Kompetenz-Stufen</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 p-1">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="skill-name">Name *</Label>
                  <Input
                    id="skill-name"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="z.B. Patientenaufnahme"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skill-category">Kategorie</Label>
                  <Select
                    value={newSkill.category}
                    onValueChange={(value) => setNewSkill((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategorie auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skill-description">Beschreibung</Label>
                <Textarea
                  id="skill-description"
                  value={newSkill.description}
                  onChange={(e) => setNewSkill((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optionale Beschreibung des Skills"
                />
              </div>

              <div className="space-y-2">
                <Label>Farbe</Label>
                <div className="flex flex-wrap gap-2">
                  {SKILL_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        newSkill.color === color.value
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setNewSkill((prev) => ({ ...prev, color: color.value }))}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* Level Definitions */}
              <Tabs defaultValue="level-0" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="level-0">Level 0</TabsTrigger>
                  <TabsTrigger value="level-1">Level 1</TabsTrigger>
                  <TabsTrigger value="level-2">Level 2</TabsTrigger>
                  <TabsTrigger value="level-3">Level 3</TabsTrigger>
                </TabsList>

                {[0, 1, 2, 3].map((level) => (
                  <TabsContent key={level} value={`level-${level}`} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Titel</Label>
                        <Input
                          value={newSkill[`level_${level}_title` as keyof typeof newSkill] as string}
                          onChange={(e) =>
                            setNewSkill((prev) => ({
                              ...prev,
                              [`level_${level}_title`]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Beschreibung</Label>
                      <Textarea
                        value={newSkill[`level_${level}_description` as keyof typeof newSkill] as string}
                        onChange={(e) =>
                          setNewSkill((prev) => ({
                            ...prev,
                            [`level_${level}_description`]: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Kriterien</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addCriteria(level as 0 | 1 | 2 | 3)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Kriterium
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {(newSkill[`level_${level}_criteria` as keyof typeof newSkill] as string[]).map(
                          (criteria, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={criteria}
                                onChange={(e) => updateCriteria(level as 0 | 1 | 2 | 3, index, e.target.value)}
                                placeholder={`Kriterium ${index + 1}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0"
                                onClick={() => removeCriteria(level as 0 | 1 | 2 | 3, index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSkillDialogOpen(false)
                setEditingSkill(null)
                resetSkillForm()
              }}
            >
              Abbrechen
            </Button>
            <Button onClick={editingSkill ? handleUpdateSkill : handleAddSkill} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingSkill ? "Speichern" : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
