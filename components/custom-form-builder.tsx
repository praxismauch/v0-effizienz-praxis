"use client"

import { useState, useEffect } from "react"
import { useTeam } from "@/contexts/team-context"
import { usePractice } from "@/contexts/practice-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Plus, Search, Filter } from "lucide-react"
import type { CustomForm, Parameter, FormSubmission } from "./form-builder/types"
import { DEFAULT_FORM_DATA } from "./form-builder/types"
import { FormDialog } from "./form-builder/form-dialog"
import { FormsTable } from "./form-builder/forms-table"
import { SubmissionsDialog } from "./form-builder/submissions-dialog"

export function CustomFormBuilder() {
  const { teamMembers: contextTeamMembers, loading: teamLoading } = useTeam()
  const { currentPractice } = usePractice()
  const [forms, setForms] = useState<CustomForm[]>([])
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [parameters, setParameters] = useState<Parameter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [editingForm, setEditingForm] = useState<CustomForm | null>(null)
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null)
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<CustomForm>>(DEFAULT_FORM_DATA)

  const [localTeamMembers, setLocalTeamMembers] = useState<any[]>([])
  const [loadingLocalMembers, setLoadingLocalMembers] = useState(false)

  const teamMembers = contextTeamMembers?.length > 0 ? contextTeamMembers : localTeamMembers

  useEffect(() => {
    if (!currentPractice?.id) return
    const fetchData = async () => {
      try {
        setLoading(true)
        const [formsRes, paramsRes] = await Promise.all([
          fetch(`/api/practices/${currentPractice.id}/forms`),
          fetch(`/api/practices/${currentPractice.id}/parameters`),
        ])
        if (formsRes.ok) {
          const formsData = await formsRes.json()
          setForms(
            formsData.map((f: any) => ({
              id: f.id,
              name: f.name,
              description: f.description || "",
              parameters: f.form_fields?.map((ff: any) => ff.parameter_id) || [],
              assignedUsers: f.assigned_users || [],
              isActive: f.status === "active",
              createdAt: f.created_at,
              updatedAt: f.updated_at,
              createdBy: f.created_by || "",
              frequency: "once",
            })),
          )
        }
        if (paramsRes.ok) {
          const paramsData = await paramsRes.json()
          setParameters(
            paramsData.parameters?.map((p: any) => ({
              id: p.id,
              name: p.name,
              description: p.description || "",
              type: "text",
              category: p.category || "general",
              unit: p.unit,
            })) || [],
          )
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentPractice?.id])

  useEffect(() => {
    const fetchLocalTeamMembers = async () => {
      if (!currentPractice?.id) return
      if (contextTeamMembers && contextTeamMembers.length > 0) return
      setLoadingLocalMembers(true)
      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/team-members`)
        if (response.ok) {
          const data = await response.json()
          const members = Array.isArray(data) ? data : data.teamMembers || data.members || []
          setLocalTeamMembers(members.filter((m: any) => m.id && m.id.trim() !== ""))
        }
      } catch {
        // silently handle
      } finally {
        setLoadingLocalMembers(false)
      }
    }
    fetchLocalTeamMembers()
  }, [currentPractice?.id, contextTeamMembers])

  const filteredForms = forms.filter((form) => {
    const matchesSearch =
      form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || (selectedStatus === "active" ? form.isActive : !form.isActive)
    return matchesSearch && matchesStatus
  })

  const handleCreateForm = async () => {
    if (!currentPractice?.id) return
    try {
      const res = await fetch(`/api/practices/${currentPractice.id}/forms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, createdBy: "Current User" }),
      })
      if (res.ok) {
        const form = await res.json()
        setForms([
          ...forms,
          {
            ...form,
            parameters: formData.parameters || [],
            assignedUsers: formData.assignedUsers || [],
            isActive: form.status === "active",
            createdAt: form.created_at,
            updatedAt: form.updated_at,
            frequency: formData.frequency || "once",
          },
        ])
        setFormData(DEFAULT_FORM_DATA)
        setIsCreateFormOpen(false)
      }
    } catch {
      // silently handle
    }
  }

  const handleEditForm = (form: CustomForm) => {
    setEditingForm(form)
    setFormData({
      name: form.name,
      description: form.description,
      parameters: form.parameters,
      assignedUsers: form.assignedUsers,
      isActive: form.isActive,
      frequency: form.frequency,
      dueDate: form.dueDate,
    })
    setIsEditFormOpen(true)
  }

  const handleUpdateForm = () => {
    if (!editingForm) return
    const updatedForm: CustomForm = {
      ...editingForm,
      ...formData,
      updatedAt: new Date().toISOString().split("T")[0],
    } as CustomForm
    setForms(forms.map((f) => (f.id === editingForm.id ? updatedForm : f)))
    setEditingForm(null)
    setFormData(DEFAULT_FORM_DATA)
    setIsEditFormOpen(false)
  }

  const handleDeleteForm = (formId: string) => {
    setForms(forms.filter((f) => f.id !== formId))
    setSubmissions(submissions.filter((s) => s.formId !== formId))
    setDeleteFormId(null)
  }

  if (loading || loadingLocalMembers) {
    return (
      <div className="space-y-6">
        <p>Lade Formulare...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Benutzerdefinierter Formular-Builder</h3>
        <p className="text-sm text-muted-foreground">
          Erstellen Sie benutzerdefinierte Dateneingabeformulare und weisen Sie diese Teammitgliedern zu
        </p>
      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Formulare suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Formulare</SelectItem>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="inactive">Inaktiv</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="gap-2" onClick={() => { setFormData(DEFAULT_FORM_DATA); setIsCreateFormOpen(true) }}>
          <Plus className="h-4 w-4" />
          Formular erstellen
        </Button>
      </div>

      <FormsTable
        forms={filteredForms}
        parameters={parameters}
        submissions={submissions}
        onEdit={handleEditForm}
        onDelete={(id) => setDeleteFormId(id)}
        onViewSubmissions={(id) => setSelectedFormId(id)}
      />

      {/* Create Form Dialog */}
      <FormDialog
        open={isCreateFormOpen}
        onOpenChange={setIsCreateFormOpen}
        formData={formData}
        onFormDataChange={setFormData}
        parameters={parameters}
        teamMembers={teamMembers}
        onSubmit={handleCreateForm}
        title="Benutzerdefiniertes Formular erstellen"
        description="Erstellen Sie ein neues Dateneingabeformular und weisen Sie es Teammitgliedern zu"
        submitLabel="Formular erstellen"
      />

      {/* Edit Form Dialog */}
      <FormDialog
        open={isEditFormOpen}
        onOpenChange={setIsEditFormOpen}
        formData={formData}
        onFormDataChange={setFormData}
        parameters={parameters}
        teamMembers={teamMembers}
        onSubmit={handleUpdateForm}
        title="Formular bearbeiten"
        description="Formulareinstellungen und Zuweisungen aktualisieren"
        submitLabel="Formular aktualisieren"
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteFormId} onOpenChange={(open) => !open && setDeleteFormId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Formular löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie dieses Formular löschen möchten? Alle zugehörigen Daten und Einreichungen werden
              dauerhaft entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteFormId && handleDeleteForm(deleteFormId)}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submissions Dialog */}
      <SubmissionsDialog
        selectedFormId={selectedFormId}
        onClose={() => setSelectedFormId(null)}
        forms={forms}
        submissions={submissions}
        parameters={parameters}
      />
    </div>
  )
}

export default CustomFormBuilder
