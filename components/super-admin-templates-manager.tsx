"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Target, ClipboardCheck, Workflow, Star, Users } from "lucide-react"
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
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teamGroupTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: template.color || "#3b82f6" }} />
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {template.team_group_template_specialties?.map((tgts: any) => (
                          <Badge key={tgts.specialty_group_id} variant="secondary" className="text-xs">
                            {tgts.specialty_groups?.name}
                          </Badge>
                        ))}
                      </div>
                      {template.icon && <div className="text-xs text-muted-foreground">Icon: {template.icon}</div>}
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
        open={showCreateTeamGroupDialog}
        onOpenChange={setShowCreateTeamGroupDialog}
        onSuccess={() => {
          fetchTeamGroupTemplates()
          setShowCreateTeamGroupDialog(false)
        }}
      />
    </div>
  )
}
