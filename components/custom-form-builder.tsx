"use client"

import { useState, useEffect } from "react"
import { useTeam } from "@/contexts/team-context"
import { usePractice } from "@/contexts/practice-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { Plus, Users, FileText, MoreHorizontal, Edit, Trash2, UserCheck, Search, Filter } from "lucide-react"
import { formatDateDE } from "@/lib/utils"

interface Parameter {
  id: string
  name: string
  description: string
  type: "number" | "text" | "boolean" | "date" | "select"
  category: string
  unit?: string
  options?: string[]
  isRequired?: boolean
}

interface CustomForm {
  id: string
  name: string
  description: string
  parameters: string[]
  assignedUsers: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  dueDate?: string
  frequency?: "once" | "daily" | "weekly" | "monthly" | "quarterly"
}

interface FormSubmission {
  id: string
  formId: string
  userId: string
  userName: string
  submittedAt: string
  data: Record<string, any>
  status: "draft" | "submitted" | "reviewed"
}

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

  const [newForm, setNewForm] = useState<Partial<CustomForm>>({
    name: "",
    description: "",
    parameters: [],
    assignedUsers: [],
    isActive: true,
    frequency: "once",
  })

  const [localTeamMembers, setLocalTeamMembers] = useState<any[]>([])
  const [loadingLocalMembers, setLoadingLocalMembers] = useState(false)

  // Use context team members if available, otherwise use local
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
              assignedUsers: [], // TODO: implement user assignments
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
      } catch (error) {
        console.error("[v0] Error fetching form data:", error)
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
          const members = Array.isArray(data) ? data : data.members || []
          setLocalTeamMembers(members.filter((m: any) => m.id && m.id.trim() !== ""))
        }
      } catch (error) {
        console.error("[v0] Error fetching local team members:", error)
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

  const getParameterName = (id: string) => {
    const param = parameters.find((p) => p.id === id)
    return param ? param.name : `Parameter ${id}`
  }

  const getUserName = (id: string) => {
    const user = teamMembers.find((u) => u.id === id)
    return user ? user.name : `User ${id}`
  }

  const handleCreateForm = async () => {
    if (!currentPractice?.id) return

    try {
      const res = await fetch(`/api/practices/${currentPractice.id}/forms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newForm,
          createdBy: "Current User", // TODO: get from user context
        }),
      })

      if (res.ok) {
        const form = await res.json()
        setForms([
          ...forms,
          {
            ...form,
            parameters: newForm.parameters || [],
            assignedUsers: newForm.assignedUsers || [],
            isActive: form.status === "active",
            createdAt: form.created_at,
            updatedAt: form.updated_at,
            frequency: newForm.frequency || "once",
          },
        ])
        setNewForm({
          name: "",
          description: "",
          parameters: [],
          assignedUsers: [],
          isActive: true,
          frequency: "once",
        })
        setIsCreateFormOpen(false)
      }
    } catch (error) {
      console.error("[v0] Error creating form:", error)
    }
  }

  const handleEditForm = (form: CustomForm) => {
    setEditingForm(form)
    setNewForm({
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
      ...newForm,
      updatedAt: new Date().toISOString().split("T")[0],
    } as CustomForm

    setForms(forms.map((f) => (f.id === editingForm.id ? updatedForm : f)))
    setEditingForm(null)
    setNewForm({
      name: "",
      description: "",
      parameters: [],
      assignedUsers: [],
      isActive: true,
      frequency: "once",
    })
    setIsEditFormOpen(false)
  }

  const handleDeleteForm = (formId: string) => {
    setForms(forms.filter((f) => f.id !== formId))
    setSubmissions(submissions.filter((s) => s.formId !== formId))
    setDeleteFormId(null)
  }

  const getFormSubmissions = (formId: string) => {
    return submissions.filter((s) => s.formId === formId)
  }

  const getFormStats = (formId: string) => {
    const formSubmissions = getFormSubmissions(formId)
    const form = forms.find((f) => f.id === formId)
    const assignedCount = form?.assignedUsers.length || 0
    const submittedCount = formSubmissions.length
    const pendingCount = assignedCount - submittedCount

    return {
      assigned: assignedCount,
      submitted: submittedCount,
      pending: pendingCount,
      completionRate: assignedCount > 0 ? Math.round((submittedCount / assignedCount) * 100) : 0,
    }
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
        <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Formular erstellen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Benutzerdefiniertes Formular erstellen</DialogTitle>
              <DialogDescription>
                Erstellen Sie ein neues Dateneingabeformular und weisen Sie es Teammitgliedern zu
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="form-name">Formularname</Label>
                  <Input
                    id="form-name"
                    value={newForm.name}
                    onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                    placeholder="z.B. Täglicher Praxisbericht"
                  />
                </div>
                <div>
                  <Label htmlFor="form-frequency">Häufigkeit</Label>
                  <Select
                    value={newForm.frequency}
                    onValueChange={(value: any) => setNewForm({ ...newForm, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Einmalig</SelectItem>
                      <SelectItem value="daily">Täglich</SelectItem>
                      <SelectItem value="weekly">Wöchentlich</SelectItem>
                      <SelectItem value="monthly">Monatlich</SelectItem>
                      <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="form-description">Beschreibung</Label>
                <Textarea
                  id="form-description"
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  placeholder="Beschreiben Sie den Zweck dieses Formulars..."
                  rows={3}
                />
              </div>

              {/* Parameter Selection */}
              <div>
                <Label>Parameter auswählen</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 p-4 border rounded-lg bg-muted/50 max-h-48 overflow-y-auto">
                  {parameters.map((param) => (
                    <div key={param.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`param-${param.id}`}
                        checked={newForm.parameters?.includes(param.id)}
                        onCheckedChange={(checked) => {
                          const currentParams = newForm.parameters || []
                          const newParams = checked
                            ? [...currentParams, param.id]
                            : currentParams.filter((id) => id !== param.id)
                          setNewForm({ ...newForm, parameters: newParams })
                        }}
                      />
                      <Label htmlFor={`param-${param.id}`} className="text-sm">
                        <div className="font-medium">{param.name}</div>
                        <div className="text-xs text-muted-foreground">{param.category}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Assignment */}
              <div>
                <Label>Teammitgliedern zuweisen</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 p-4 border rounded-lg bg-muted/50 max-h-48 overflow-y-auto">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${member.id}`}
                        checked={newForm.assignedUsers?.includes(member.id)}
                        onCheckedChange={(checked) => {
                          const currentUsers = newForm.assignedUsers || []
                          const newUsers = checked
                            ? [...currentUsers, member.id]
                            : currentUsers.filter((id) => id !== member.id)
                          setNewForm({ ...newForm, assignedUsers: newUsers })
                        }}
                      />
                      <Label htmlFor={`user-${member.id}`} className="text-sm">
                        <div className="font-medium">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.role}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="form-due-date">Fälligkeitsdatum (optional)</Label>
                  <Input
                    id="form-due-date"
                    type="date"
                    value={newForm.dueDate}
                    onChange={(e) => setNewForm({ ...newForm, dueDate: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="form-active"
                    checked={newForm.isActive}
                    onCheckedChange={(checked) => setNewForm({ ...newForm, isActive: checked })}
                  />
                  <Label htmlFor="form-active">Aktiv</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateFormOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreateForm}>Formular erstellen</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Forms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Benutzerdefinierte Formulare</CardTitle>
          <CardDescription>
            Verwalten Sie benutzerdefinierte Dateneingabeformulare und verfolgen Sie Einreichungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Formularname</TableHead>
                <TableHead>Parameter</TableHead>
                <TableHead>Zugewiesene Benutzer</TableHead>
                <TableHead>Häufigkeit</TableHead>
                <TableHead>Fortschritt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erstellt</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredForms.map((form) => {
                const stats = getFormStats(form.id)
                return (
                  <TableRow key={form.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{form.name}</div>
                        <div className="text-sm text-muted-foreground">{form.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {form.parameters.slice(0, 2).map((paramId) => (
                          <Badge key={paramId} variant="outline" className="text-xs">
                            {getParameterName(paramId)}
                          </Badge>
                        ))}
                        {form.parameters.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{form.parameters.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{form.assignedUsers.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{form.frequency}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span>
                            {stats.submitted}/{stats.assigned}
                          </span>
                          <Badge variant={stats.completionRate === 100 ? "default" : "outline"} className="text-xs">
                            {stats.completionRate}%
                          </Badge>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${stats.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={form.isActive ? "default" : "secondary"}>
                        {form.isActive ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateDE(form.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedFormId(form.id)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Einreichungen anzeigen
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditForm(form)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Formular bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Benutzer verwalten
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteFormId(form.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Formular löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Form Dialog */}
      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Formular bearbeiten</DialogTitle>
            <DialogDescription>Formulareinstellungen und Zuweisungen aktualisieren</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-form-name">Formularname</Label>
                <Input
                  id="edit-form-name"
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  placeholder="z.B. Täglicher Praxisbericht"
                />
              </div>
              <div>
                <Label htmlFor="edit-form-frequency">Häufigkeit</Label>
                <Select
                  value={newForm.frequency}
                  onValueChange={(value: any) => setNewForm({ ...newForm, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Einmalig</SelectItem>
                    <SelectItem value="daily">Täglich</SelectItem>
                    <SelectItem value="weekly">Wöchentlich</SelectItem>
                    <SelectItem value="monthly">Monatlich</SelectItem>
                    <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-form-description">Beschreibung</Label>
              <Textarea
                id="edit-form-description"
                value={newForm.description}
                onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Parameter Selection */}
            <div>
              <Label>Parameter auswählen</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 p-4 border rounded-lg bg-muted/50 max-h-48 overflow-y-auto">
                {parameters.map((param) => (
                  <div key={param.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-param-${param.id}`}
                      checked={newForm.parameters?.includes(param.id)}
                      onCheckedChange={(checked) => {
                        const currentParams = newForm.parameters || []
                        const newParams = checked
                          ? [...currentParams, param.id]
                          : currentParams.filter((id) => id !== param.id)
                        setNewForm({ ...newForm, parameters: newParams })
                      }}
                    />
                    <Label htmlFor={`edit-param-${param.id}`} className="text-sm">
                      <div className="font-medium">{param.name}</div>
                      <div className="text-xs text-muted-foreground">{param.category}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* User Assignment */}
            <div>
              <Label>Teammitgliedern zuweisen</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 p-4 border rounded-lg bg-muted/50 max-h-48 overflow-y-auto">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-user-${member.id}`}
                      checked={newForm.assignedUsers?.includes(member.id)}
                      onCheckedChange={(checked) => {
                        const currentUsers = newForm.assignedUsers || []
                        const newUsers = checked
                          ? [...currentUsers, member.id]
                          : currentUsers.filter((id) => id !== member.id)
                        setNewForm({ ...newForm, assignedUsers: newUsers })
                      }}
                    />
                    <Label htmlFor={`edit-user-${member.id}`} className="text-sm">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-xs text-muted-foreground">{member.role}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-form-due-date">Fälligkeitsdatum (optional)</Label>
                <Input
                  id="edit-form-due-date"
                  type="date"
                  value={newForm.dueDate}
                  onChange={(e) => setNewForm({ ...newForm, dueDate: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="edit-form-active"
                  checked={newForm.isActive}
                  onCheckedChange={(checked) => setNewForm({ ...newForm, isActive: checked })}
                />
                <Label htmlFor="edit-form-active">Aktiv</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditFormOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleUpdateForm}>Formular aktualisieren</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
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

      {/* Form Submissions Dialog */}
      <Dialog open={!!selectedFormId} onOpenChange={() => setSelectedFormId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Formular Einreichungen</DialogTitle>
            <DialogDescription>
              {selectedFormId && `Einreichungen für "${forms.find((f) => f.id === selectedFormId)?.name}"`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedFormId && getFormSubmissions(selectedFormId).length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Benutzer</TableHead>
                    <TableHead>Einreichungsdatum</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Daten</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFormSubmissions(selectedFormId).map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>{submission.userName}</TableCell>
                      <TableCell>{formatDateDE(submission.submittedAt)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            submission.status === "reviewed"
                              ? "default"
                              : submission.status === "submitted"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {Object.entries(submission.data).map(([paramId, value]) => (
                            <div key={paramId} className="text-sm">
                              <span className="font-medium">{getParameterName(paramId)}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Noch keine Einreichungen</h3>
                <p className="text-muted-foreground">Dieses Formular hat noch keine Einreichungen erhalten.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CustomFormBuilder
