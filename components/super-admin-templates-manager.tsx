"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Target, ClipboardCheck, Workflow, Star, Users, Pencil, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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
import { CreateGoalTemplateDialog } from "@/components/create-goal-template-dialog"
import { CreateResponsibilityTemplateDialog } from "@/components/create-responsibility-template-dialog"
import { CreateTeamGroupTemplateDialog } from "@/components/create-team-group-template-dialog"

export function SuperAdminTemplatesManager() {
  const [activeTab, setActiveTab] = useState("workflows")
  const [workflowTemplates, setWorkflowTemplates] = useState<any[]>([])
  const [goalTemplates, setGoalTemplates] = useState<any[]>([])
  const [responsibilityTemplates, setResponsibilityTemplates] = useState<any[]>([])
  const [skillTemplates, setSkillTemplates] = useState<any[]>([])
  const [teamGroupTemplates, setTeamGroupTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [showCreateGoalDialog, setShowCreateGoalDialog] = useState(false)
  const [showCreateResponsibilityDialog, setShowCreateResponsibilityDialog] = useState(false)
  const [showCreateTeamGroupDialog, setShowCreateTeamGroupDialog] = useState(false)
  const [editingTeamGroup, setEditingTeamGroup] = useState<any>(null)
  const [deletingTeamGroup, setDeletingTeamGroup] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (activeTab === "workflows") {
      fetchWorkflowTemplates()
    } else if (activeTab === "goals") {
      fetchGoalTemplates()
    } else if (activeTab === "responsibilities") {
      fetchResponsibilityTemplates()
    } else if (activeTab === "skills") {
      fetchSkillTemplates()
    } else if (activeTab === "team-groups") {
      fetchTeamGroupTemplates()
    }
  }, [activeTab])

  const fetchWorkflowTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/super-admin/templates/workflows")
      const data = await response.json()
      setWorkflowTemplates(data.templates || [])
    } catch (error) {
      console.error("Error fetching workflow templates:", error)
      setWorkflowTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const fetchGoalTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/super-admin/templates/goals")
      const data = await response.json()
      setGoalTemplates(data.templates || [])
    } catch (error) {
      console.error("Error fetching goal templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchResponsibilityTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/super-admin/templates/responsibilities")
      const data = await response.json()
      setResponsibilityTemplates(data.templates || [])
    } catch (error) {
      console.error("Error fetching responsibility templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSkillTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/super-admin/templates/skills")
      const data = await response.json()
      setSkillTemplates(data.templates || [])
    } catch (error) {
      console.error("Error fetching skill templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamGroupTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/super-admin/templates/team-groups")
      const data = await response.json()
      setTeamGroupTemplates(data.templates || [])
    } catch (error) {
      console.error("Error fetching team group templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTeamGroup = async () => {
    if (!deletingTeamGroup) return
    try {
      const response = await fetch(`/api/super-admin/templates/team-groups?id=${deletingTeamGroup.id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete")
      toast({ title: "Erfolg", description: "Teamgruppen-Vorlage wurde gelöscht" })
      fetchTeamGroupTemplates()
    } catch (error) {
      toast({ title: "Fehler", description: "Löschen fehlgeschlagen", variant: "destructive" })
    } finally {
      setDeletingTeamGroup(null)
    }
  }

  const handleMoveTeamGroup = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= teamGroupTemplates.length) return

    const newOrder = [...teamGroupTemplates]
    const [moved] = newOrder.splice(index, 1)
    newOrder.splice(newIndex, 0, moved)
    
    setTeamGroupTemplates(newOrder)

    try {
      const response = await fetch("/api/super-admin/templates/team-groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: newOrder.map((t) => t.id) }),
      })
      if (!response.ok) throw new Error("Failed to reorder")
      toast({ title: "Erfolg", description: "Reihenfolge wurde aktualisiert" })
    } catch (error) {
      toast({ title: "Fehler", description: "Reihenfolge konnte nicht gespeichert werden", variant: "destructive" })
      fetchTeamGroupTemplates()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vorlagen Verwaltung</h2>
          <p className="text-muted-foreground">Definieren Sie Vorlagen für verschiedene Fachgruppen</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Ziele
          </TabsTrigger>
          <TabsTrigger value="responsibilities" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Zuständigkeiten
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Skills
          </TabsTrigger>
          <TabsTrigger value="team-groups" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Teamgruppen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4 mt-6">
          <div className="flex justify-end">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Workflow-Vorlage erstellen
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Lade Vorlagen...</div>
          ) : workflowTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Noch keine Workflow-Vorlagen vorhanden</p>
              <p className="text-sm mt-2">Erstellen Sie Ihre erste Workflow-Vorlage</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workflowTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Kategorie: {template.category || "Keine"}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.workflow_template_specialties?.map((wts: any) => (
                          <Badge key={wts.specialty_group_id} variant="secondary" className="text-xs">
                            {wts.specialty_groups?.name}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">{template.usage_count || 0} mal verwendet</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="goals" className="space-y-4 mt-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowCreateGoalDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ziel-Vorlage erstellen
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Lade Vorlagen...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {goalTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">{template.goal_type}</Badge>
                        <Badge variant={template.priority === "high" ? "destructive" : "secondary"}>
                          {template.priority}
                        </Badge>
                      </div>
                      {template.target_value && (
                        <div className="text-sm text-muted-foreground">
                          Zielwert: {template.target_value} {template.unit}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {template.goal_template_specialties?.map((gts: any) => (
                          <Badge key={gts.specialty_group_id} variant="secondary" className="text-xs">
                            {gts.specialty_groups?.name}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">{template.usage_count || 0} mal verwendet</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="responsibilities" className="space-y-4 mt-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowCreateResponsibilityDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Zuständigkeits-Vorlage erstellen
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Lade Vorlagen...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {responsibilityTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {template.group_name && <Badge variant="outline">{template.group_name}</Badge>}
                      {template.suggested_hours_per_week && (
                        <div className="text-sm text-muted-foreground">
                          ~{template.suggested_hours_per_week} Std./Woche
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {template.responsibility_template_specialties?.map((rts: any) => (
                          <Badge key={rts.specialty_group_id} variant="secondary" className="text-xs">
                            {rts.specialty_groups?.name}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">{template.usage_count || 0} mal verwendet</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="skills" className="space-y-4 mt-6">
          <div className="flex justify-end">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Skill-Fachgruppe zuordnen
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Lade Vorlagen...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {skillTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {template.category && <Badge variant="outline">{template.category}</Badge>}
                      <div className="flex flex-wrap gap-1">
                        {template.skill_template_specialties?.map((sts: any) => (
                          <Badge key={sts.specialty_group_id} variant="secondary" className="text-xs">
                            {sts.specialty_groups?.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="team-groups" className="space-y-4 mt-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowCreateTeamGroupDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Teamgruppen-Vorlage erstellen
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Lade Vorlagen...</div>
          ) : teamGroupTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Noch keine Teamgruppen-Vorlagen vorhanden</p>
              <p className="text-sm mt-2">Erstellen Sie Ihre erste Teamgruppen-Vorlage</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teamGroupTemplates.map((template, index) => (
                <Card key={template.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveTeamGroup(index, "up")}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveTeamGroup(index, "down")}
                          disabled={index === teamGroupTemplates.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: template.color || "#3b82f6" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-sm text-muted-foreground truncate">{template.description}</div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.team_group_template_specialties?.map((tgts: any) => (
                            <Badge key={tgts.specialty_group_id} variant="secondary" className="text-xs">
                              {tgts.specialty_groups?.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingTeamGroup(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingTeamGroup(template)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateGoalTemplateDialog
        open={showCreateGoalDialog}
        onOpenChange={setShowCreateGoalDialog}
        onSuccess={() => {
          fetchGoalTemplates()
          setShowCreateGoalDialog(false)
        }}
      />

      <CreateResponsibilityTemplateDialog
        open={showCreateResponsibilityDialog}
        onOpenChange={setShowCreateResponsibilityDialog}
        onSuccess={() => {
          fetchResponsibilityTemplates()
          setShowCreateResponsibilityDialog(false)
        }}
      />

      <CreateTeamGroupTemplateDialog
        open={showCreateTeamGroupDialog || !!editingTeamGroup}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateTeamGroupDialog(false)
            setEditingTeamGroup(null)
          } else {
            setShowCreateTeamGroupDialog(true)
          }
        }}
        editingTemplate={editingTeamGroup}
        onSuccess={() => {
          fetchTeamGroupTemplates()
          setShowCreateTeamGroupDialog(false)
          setEditingTeamGroup(null)
        }}
      />

      <AlertDialog open={!!deletingTeamGroup} onOpenChange={(open) => !open && setDeletingTeamGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Teamgruppen-Vorlage löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Vorlage &quot;{deletingTeamGroup?.name}&quot; wirklich löschen? Diese Aktion kann nicht
              rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTeamGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
