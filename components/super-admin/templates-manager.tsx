"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Plus, Loader2 } from "lucide-react"

import { TemplateList } from "./templates/template-list"
import { TemplateDetail } from "./templates/template-detail"
import { TemplateFormDialog } from "./templates/template-form-dialog"
import { SkillFormDialog } from "./templates/skill-form-dialog"
import {
  DEFAULT_SKILL_FORM,
  type PracticeTemplate,
  type PracticeType,
  type TemplateSkill,
  type SkillFormData,
} from "./templates/types"

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

  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    specialty_ids: [] as string[],
    is_system_template: false,
  })

  const [skillForm, setSkillForm] = useState<SkillFormData>({ ...DEFAULT_SKILL_FORM })

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
      console.error("Error loading templates:", error)
      toast({ title: "Fehler", description: "Vorlagen konnten nicht geladen werden", variant: "destructive" })
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
      console.error("Error loading practice types:", error)
    }
  }

  // Template CRUD
  const handleCreateTemplate = async () => {
    if (!templateForm.name.trim()) {
      toast({ title: "Fehler", description: "Bitte geben Sie einen Namen ein", variant: "destructive" })
      return
    }
    try {
      setIsSaving(true)
      const response = await fetch("/api/super-admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateForm),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create template")
      }
      toast({ title: "Erfolg", description: "Vorlage wurde erstellt" })
      setTemplateForm({ name: "", description: "", specialty_ids: [], is_system_template: false })
      setIsCreateDialogOpen(false)
      loadTemplates()
    } catch (error) {
      toast({ title: "Fehler", description: error instanceof Error ? error.message : "Vorlage konnte nicht erstellt werden", variant: "destructive" })
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
        body: JSON.stringify(templateForm),
      })
      if (!response.ok) throw new Error("Failed to update template")
      toast({ title: "Erfolg", description: "Vorlage wurde aktualisiert" })
      setIsEditDialogOpen(false)
      loadTemplates()
    } catch (error) {
      console.error("Error updating template:", error)
      toast({ title: "Fehler", description: "Vorlage konnte nicht aktualisiert werden", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleSystemTemplate = async (template: PracticeTemplate) => {
    try {
      const response = await fetch(`/api/super-admin/templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_system_template: !template.is_system_template }),
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
      console.error("Error toggling system template:", error)
      toast({ title: "Fehler", description: "Status konnte nicht geändert werden", variant: "destructive" })
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Möchten Sie diese Vorlage wirklich löschen?")) return
    try {
      const response = await fetch(`/api/super-admin/templates/${templateId}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete template")
      toast({ title: "Erfolg", description: "Vorlage wurde gelöscht" })
      if (selectedTemplate?.id === templateId) setSelectedTemplate(null)
      loadTemplates()
    } catch (error) {
      console.error("Error deleting template:", error)
      toast({ title: "Fehler", description: "Vorlage konnte nicht gelöscht werden", variant: "destructive" })
    }
  }

  // Skill CRUD
  const handleGenerateSkills = async () => {
    if (!selectedTemplate) return
    try {
      setIsGenerating(true)
      const specialty = practiceTypes.find((t) => selectedTemplate.specialty_ids.includes(t.id))?.name
      const response = await fetch("/api/super-admin/templates/generate-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialty: specialty || "Allgemeinmedizin", templateName: selectedTemplate.name }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate skills")
      }
      const { skills } = await response.json()
      const saveResponse = await fetch(`/api/super-admin/templates/${selectedTemplate.id}/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills }),
      })
      if (!saveResponse.ok) throw new Error("Failed to save generated skills")
      toast({ title: "Erfolg", description: `${skills.length} Skills wurden generiert und gespeichert` })
      loadTemplates()
    } catch (error) {
      console.error("Error generating skills:", error)
      toast({ title: "Fehler", description: error instanceof Error ? error.message : "Skills konnten nicht generiert werden", variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveSkill = async () => {
    if (!selectedTemplate || !skillForm.name.trim()) return
    const cleanedSkill = {
      ...skillForm,
      level_0_criteria: skillForm.level_0_criteria.filter((c) => c.trim()),
      level_1_criteria: skillForm.level_1_criteria.filter((c) => c.trim()),
      level_2_criteria: skillForm.level_2_criteria.filter((c) => c.trim()),
      level_3_criteria: skillForm.level_3_criteria.filter((c) => c.trim()),
    }

    try {
      setIsSaving(true)
      const url = editingSkill
        ? `/api/super-admin/templates/${selectedTemplate.id}/skills/${editingSkill.id}`
        : `/api/super-admin/templates/${selectedTemplate.id}/skills`
      const method = editingSkill ? "PUT" : "POST"
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSkill ? cleanedSkill : cleanedSkill),
      })
      if (!response.ok) throw new Error(`Failed to ${editingSkill ? "update" : "add"} skill`)
      toast({ title: "Erfolg", description: editingSkill ? "Skill wurde aktualisiert" : "Skill wurde hinzugefügt" })
      setEditingSkill(null)
      setSkillForm({ ...DEFAULT_SKILL_FORM })
      setIsSkillDialogOpen(false)
      loadTemplates()
    } catch (error) {
      console.error("Error saving skill:", error)
      toast({ title: "Fehler", description: `Skill konnte nicht ${editingSkill ? "aktualisiert" : "hinzugefügt"} werden`, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSkill = async (skillId: string) => {
    if (!selectedTemplate || !confirm("Möchten Sie diesen Skill wirklich löschen?")) return
    try {
      const response = await fetch(`/api/super-admin/templates/${selectedTemplate.id}/skills/${skillId}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete skill")
      toast({ title: "Erfolg", description: "Skill wurde gelöscht" })
      loadTemplates()
    } catch (error) {
      console.error("Error deleting skill:", error)
      toast({ title: "Fehler", description: "Skill konnte nicht gelöscht werden", variant: "destructive" })
    }
  }

  // UI helpers
  const openEditTemplate = (template: PracticeTemplate) => {
    setSelectedTemplate(template)
    setTemplateForm({
      name: template.name,
      description: template.description || "",
      specialty_ids: template.specialty_ids || [],
      is_system_template: template.is_system_template || false,
    })
    setIsEditDialogOpen(true)
  }

  const openEditSkill = (skill: TemplateSkill) => {
    setEditingSkill(skill)
    setSkillForm({
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

  const toggleSkillExpanded = (skillId: string) => {
    setExpandedSkills((prev) => {
      const next = new Set(prev)
      if (next.has(skillId)) next.delete(skillId)
      else next.add(skillId)
      return next
    })
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
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Vorlage
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <TemplateList
          templates={templates}
          practiceTypes={practiceTypes}
          selectedTemplate={selectedTemplate}
          onSelect={setSelectedTemplate}
          onEdit={openEditTemplate}
          onDelete={handleDeleteTemplate}
          onToggleSystem={handleToggleSystemTemplate}
        />

        <TemplateDetail
          template={selectedTemplate}
          expandedSkills={expandedSkills}
          isGenerating={isGenerating}
          onToggleSkillExpanded={toggleSkillExpanded}
          onEditSkill={openEditSkill}
          onDeleteSkill={handleDeleteSkill}
          onGenerateSkills={handleGenerateSkills}
          onAddSkill={() => {
            setEditingSkill(null)
            setSkillForm({ ...DEFAULT_SKILL_FORM })
            setIsSkillDialogOpen(true)
          }}
        />
      </div>

      {/* Create Template Dialog */}
      <TemplateFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={templateForm}
        onFormChange={setTemplateForm}
        practiceTypes={practiceTypes}
        onSubmit={handleCreateTemplate}
        isSaving={isSaving}
        mode="create"
      />

      {/* Edit Template Dialog */}
      <TemplateFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={templateForm}
        onFormChange={setTemplateForm}
        practiceTypes={practiceTypes}
        onSubmit={handleUpdateTemplate}
        isSaving={isSaving}
        mode="edit"
      />

      {/* Skill Dialog */}
      <SkillFormDialog
        open={isSkillDialogOpen}
        onOpenChange={setIsSkillDialogOpen}
        formData={skillForm}
        onFormChange={setSkillForm}
        onSubmit={handleSaveSkill}
        onCancel={() => {
          setIsSkillDialogOpen(false)
          setEditingSkill(null)
          setSkillForm({ ...DEFAULT_SKILL_FORM })
        }}
        isSaving={isSaving}
        isEditing={!!editingSkill}
      />
    </div>
  )
}
