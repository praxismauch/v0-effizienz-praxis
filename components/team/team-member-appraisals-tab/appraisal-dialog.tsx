"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus, Star, Target, TrendingUp, MessageSquare, Award, X, Sparkles,
  CheckCircle, Briefcase, GraduationCap, Loader2, RefreshCw, ArrowRight,
  Lightbulb, Zap, Save,
} from "lucide-react"
import type { Appraisal, AiSuggestions, SkillDefinition } from "./types"
import { SKILL_LEVEL_CONFIG } from "./types"

function getRatingStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={`w-4 h-4 ${i < rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
  ))
}

interface AppraisalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingAppraisal: Appraisal | null
  memberName: string
  activeTab: string
  setActiveTab: (tab: string) => void
  formData: Partial<Appraisal>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Appraisal>>>
  skills: SkillDefinition[]
  skillStats: { total: number; assessed: number; gapsCount: number; avgLevel: string; expertCount: number }
  aiLoading: string | null
  aiSuggestions: AiSuggestions
  setAiSuggestions: React.Dispatch<React.SetStateAction<AiSuggestions>>
  skillsLoading: boolean
  saving: boolean
  onSave: () => void
  onAIGenerate: (action: string, context?: Record<string, unknown>) => void
  onSyncSkills: () => void
  onRefreshCompetencies: () => void
  calculateOverallRating: () => string
}

export function AppraisalDialog({
  open, onOpenChange, editingAppraisal, memberName,
  activeTab, setActiveTab, formData, setFormData, skills,
  skillStats, aiLoading, aiSuggestions, setAiSuggestions,
  skillsLoading, saving, onSave, onAIGenerate, onSyncSkills,
  onRefreshCompetencies, calculateOverallRating,
}: AppraisalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {editingAppraisal ? "Mitarbeitergespräch bearbeiten" : "Neues Mitarbeitergespräch"}
          </DialogTitle>
          <DialogDescription>Strukturiertes Gespräch für {memberName}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid grid-cols-6 mb-4">
              <TabsTrigger value="performance" className="text-xs"><Star className="w-3 h-3 mr-1" />Leistung</TabsTrigger>
              <TabsTrigger value="skills" className="text-xs"><GraduationCap className="w-3 h-3 mr-1" />Skills</TabsTrigger>
              <TabsTrigger value="goals" className="text-xs"><Target className="w-3 h-3 mr-1" />Ziele</TabsTrigger>
              <TabsTrigger value="development" className="text-xs"><TrendingUp className="w-3 h-3 mr-1" />Entwicklung</TabsTrigger>
              <TabsTrigger value="feedback" className="text-xs"><MessageSquare className="w-3 h-3 mr-1" />Feedback</TabsTrigger>
              <TabsTrigger value="career" className="text-xs"><Briefcase className="w-3 h-3 mr-1" />Karriere</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 pr-4">
              {/* Performance Tab */}
              <TabsContent value="performance" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gesprächsart</Label>
                    <Select value={formData.appraisal_type || ""} onValueChange={(v) => setFormData((prev) => ({ ...prev, appraisal_type: v }))}>
                      <SelectTrigger><SelectValue placeholder="Gesprächsart wählen" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">Jahresgespräch</SelectItem>
                        <SelectItem value="semi_annual">Halbjahresgespräch</SelectItem>
                        <SelectItem value="quarterly">Quartalsgespräch</SelectItem>
                        <SelectItem value="probation">Probezeit-Gespräch</SelectItem>
                        <SelectItem value="ad_hoc">Zwischengespräch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Datum</Label>
                    <Input type="date" value={formData.appraisal_date || ""} onChange={(e) => setFormData((prev) => ({ ...prev, appraisal_date: e.target.value }))} />
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Leistungsbereiche</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Gesamtbewertung:</span>
                      <Badge variant="secondary" className="text-lg px-3">{calculateOverallRating()} / 5</Badge>
                    </div>
                  </div>
                  {Array.isArray(formData.performance_areas) && formData.performance_areas.map((area, idx) => (
                    <div key={idx} className="space-y-2 p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{area.name}</span>
                        <Badge variant="outline">{area.weight}% Gewichtung</Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <Slider value={[area.rating]} min={1} max={5} step={1} onValueChange={([v]) => {
                          const updated = [...(formData.performance_areas || [])]
                          updated[idx] = { ...updated[idx], rating: v }
                          setFormData((prev) => ({ ...prev, performance_areas: updated }))
                        }} className="flex-1" />
                        <div className="flex items-center gap-1 min-w-[100px]">{getRatingStars(area.rating)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => onAIGenerate("summary")} disabled={aiLoading === "summary"}>
                    {aiLoading === "summary" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    KI-Zusammenfassung
                  </Button>
                </div>
                {formData.summary && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <Label className="text-primary">KI-Zusammenfassung</Label>
                    <p className="mt-2 text-sm">{formData.summary}</p>
                  </div>
                )}
              </TabsContent>

              {/* Skills Tab */}
              <TabsContent value="skills" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Skills & Kompetenzen</h4>
                    <p className="text-sm text-muted-foreground">Basierend auf dem Skills-System der Praxis</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onRefreshCompetencies} disabled={skillsLoading}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${skillsLoading ? "animate-spin" : ""}`} />Skills aktualisieren
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onAIGenerate("strengths")} disabled={aiLoading === "strengths"}>
                      {aiLoading === "strengths" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      KI-Analyse
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  <Card className="bg-muted/50"><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{skillStats.total}</p><p className="text-xs text-muted-foreground">Skills gesamt</p></CardContent></Card>
                  <Card className="bg-muted/50"><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{skillStats.assessed}</p><p className="text-xs text-muted-foreground">Bewertet</p></CardContent></Card>
                  <Card className="bg-muted/50"><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{skillStats.avgLevel}</p><p className="text-xs text-muted-foreground">Durchschnitt Level</p></CardContent></Card>
                  <Card className="bg-emerald-50"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-emerald-600">{skillStats.expertCount}</p><p className="text-xs text-muted-foreground">Experten-Skills</p></CardContent></Card>
                  <Card className="bg-amber-50"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-amber-600">{skillStats.gapsCount}</p><p className="text-xs text-muted-foreground">Skill-Gaps</p></CardContent></Card>
                </div>
                {(aiSuggestions.strengths || aiSuggestions.improvements) && (
                  <div className="grid grid-cols-2 gap-4">
                    {aiSuggestions.strengths && (
                      <Card className="bg-emerald-50 border-emerald-200">
                        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-emerald-700"><Award className="w-4 h-4" />Stärken (KI-Analyse)</CardTitle></CardHeader>
                        <CardContent><ul className="space-y-1">{aiSuggestions.strengths.map((s, i) => (<li key={i} className="text-sm flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />{s}</li>))}</ul></CardContent>
                      </Card>
                    )}
                    {aiSuggestions.improvements && (
                      <Card className="bg-amber-50 border-amber-200">
                        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-amber-700"><Lightbulb className="w-4 h-4" />Entwicklungspotenziale</CardTitle></CardHeader>
                        <CardContent><ul className="space-y-1">{aiSuggestions.improvements.map((s, i) => (<li key={i} className="text-sm flex items-start gap-2"><ArrowRight className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />{s}</li>))}</ul></CardContent>
                      </Card>
                    )}
                  </div>
                )}
                {formData.competencies && formData.competencies.length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(
                      formData.competencies.reduce((acc, comp) => {
                        const skill = skills.find((s) => s.id === comp.skill_id)
                        const category = skill?.category || "Allgemein"
                        if (!acc[category]) acc[category] = []
                        acc[category].push({ ...comp, description: skill?.description })
                        return acc
                      }, {} as Record<string, Array<(typeof formData.competencies)[0] & { description?: string | null }>>)
                    ).map(([category, categorySkills]) => (
                      <Card key={category}>
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm font-medium flex items-center justify-between">
                            <span>{category}</span>
                            <Badge variant="secondary">{categorySkills.filter((s) => s.currentLevel > 0).length}/{categorySkills.length} bewertet</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-0 pb-3">
                          <div className="space-y-3">
                            {categorySkills.map((comp, idx) => {
                              const levelConfig = SKILL_LEVEL_CONFIG[comp.currentLevel] || SKILL_LEVEL_CONFIG[0]
                              const hasGap = comp.gap && comp.gap > 0
                              const globalIdx = formData.competencies!.findIndex((c) => c.skill_id === comp.skill_id)
                              return (
                                <div key={idx} className="p-3 rounded-lg border bg-card">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{comp.name}</span>
                                        {hasGap && <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">Gap: {comp.gap} Level</Badge>}
                                      </div>
                                      {comp.description && <p className="text-xs text-muted-foreground mt-0.5">{comp.description}</p>}
                                    </div>
                                    <Badge className={levelConfig.color}>{levelConfig.title}</Badge>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground w-16">Aktuell:</span>
                                      <div className="flex-1">
                                        <Slider value={[comp.currentLevel]} min={0} max={3} step={1} onValueChange={([v]) => {
                                          if (globalIdx === -1) return
                                          const updated = [...(formData.competencies || [])]
                                          updated[globalIdx] = { ...updated[globalIdx], currentLevel: v, gap: updated[globalIdx].targetLevel - v }
                                          setFormData((prev) => ({ ...prev, competencies: updated }))
                                        }} />
                                      </div>
                                      <div className="flex gap-1 min-w-[80px]">
                                        {[0, 1, 2, 3].map((l) => (
                                          <div key={l} className={`w-4 h-4 rounded-full ${l <= comp.currentLevel ? SKILL_LEVEL_CONFIG[comp.currentLevel].dotColor : "bg-gray-200"}`} />
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground w-16">Ziel:</span>
                                      <div className="flex-1">
                                        <Slider value={[comp.targetLevel]} min={0} max={3} step={1} onValueChange={([v]) => {
                                          if (globalIdx === -1) return
                                          const updated = [...(formData.competencies || [])]
                                          updated[globalIdx] = { ...updated[globalIdx], targetLevel: v, gap: v - updated[globalIdx].currentLevel }
                                          setFormData((prev) => ({ ...prev, competencies: updated }))
                                        }} />
                                      </div>
                                      <div className="flex gap-1 min-w-[80px]">
                                        {[0, 1, 2, 3].map((l) => (
                                          <div key={l} className={`w-4 h-4 rounded-full border-2 ${l <= comp.targetLevel ? "border-primary bg-primary/20" : "border-gray-200 bg-transparent"}`} />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={onSyncSkills} disabled={aiLoading === "sync-skills"}>
                        {aiLoading === "sync-skills" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                        Skills im System aktualisieren
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Card className="bg-muted/50">
                    <CardContent className="py-8 text-center">
                      <GraduationCap className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                      <p className="font-medium mb-1">Keine Skills verfügbar</p>
                      <p className="text-sm text-muted-foreground mb-4">Für diesen Mitarbeiter sind noch keine Skills definiert</p>
                      <Button variant="outline" size="sm" onClick={onRefreshCompetencies}><RefreshCw className="w-4 h-4 mr-2" />Skills laden</Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Goals Tab */}
              <TabsContent value="goals" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Ziele setzen & überprüfen</h4>
                  <Button variant="outline" size="sm" onClick={() => onAIGenerate("goals")} disabled={aiLoading === "goals"}>
                    {aiLoading === "goals" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    KI-Ziele vorschlagen
                  </Button>
                </div>
                {aiSuggestions.goals && aiSuggestions.goals.length > 0 && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />KI-Vorschläge (basierend auf Skill-Gaps)</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {aiSuggestions.goals.map((goal, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-background border flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{goal.title}</p>
                            <p className="text-sm text-muted-foreground">{goal.description}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="secondary">{goal.priority}</Badge>
                              {goal.deadline && <Badge variant="outline">{goal.deadline}</Badge>}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => {
                            setFormData((prev) => ({ ...prev, new_goals: [...(prev.new_goals || []), { ...goal, status: "not_started" }] }))
                            setAiSuggestions((prev) => ({ ...prev, goals: prev.goals?.filter((_, i) => i !== idx) }))
                          }}><Plus className="w-4 h-4" /></Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Neue Ziele</Label>
                    <Button variant="ghost" size="sm" onClick={() => setFormData((prev) => ({ ...prev, new_goals: [...(prev.new_goals || []), { title: "", description: "", priority: "medium", status: "not_started" }] }))}>
                      <Plus className="w-4 h-4 mr-1" />Ziel hinzufuegen
                    </Button>
                  </div>
                  {Array.isArray(formData.new_goals) && formData.new_goals.map((goal, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <Input placeholder="Zieltitel" value={goal.title || ""} onChange={(e) => {
                            const updated = [...(formData.new_goals || [])]; updated[idx] = { ...updated[idx], title: e.target.value }
                            setFormData((prev) => ({ ...prev, new_goals: updated }))
                          }} className="flex-1" />
                          <Button variant="ghost" size="icon" onClick={() => {
                            const updated = formData.new_goals?.filter((_, i) => i !== idx)
                            setFormData((prev) => ({ ...prev, new_goals: updated }))
                          }}><X className="w-4 h-4" /></Button>
                        </div>
                        <Textarea placeholder="Beschreibung" value={goal.description || ""} onChange={(e) => {
                          const updated = [...(formData.new_goals || [])]; updated[idx] = { ...updated[idx], description: e.target.value }
                          setFormData((prev) => ({ ...prev, new_goals: updated }))
                        }} rows={2} />
                        <div className="grid grid-cols-3 gap-2">
                          <Select value={goal.priority || ""} onValueChange={(v) => {
                            const updated = [...(formData.new_goals || [])]; updated[idx] = { ...updated[idx], priority: v }
                            setFormData((prev) => ({ ...prev, new_goals: updated }))
                          }}>
                            <SelectTrigger><SelectValue placeholder="Prioritaet" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">Hoch</SelectItem>
                              <SelectItem value="medium">Mittel</SelectItem>
                              <SelectItem value="low">Niedrig</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input type="date" placeholder="Deadline" value={goal.deadline || ""} onChange={(e) => {
                            const updated = [...(formData.new_goals || [])]; updated[idx] = { ...updated[idx], deadline: e.target.value }
                            setFormData((prev) => ({ ...prev, new_goals: updated }))
                          }} />
                          <Input placeholder="Messbar (KPI)" value={goal.measurable || ""} onChange={(e) => {
                            const updated = [...(formData.new_goals || [])]; updated[idx] = { ...updated[idx], measurable: e.target.value }
                            setFormData((prev) => ({ ...prev, new_goals: updated }))
                          }} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Development Tab */}
              <TabsContent value="development" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Entwicklungsplan</h4>
                  <Button variant="outline" size="sm" onClick={() => onAIGenerate("skill-development")} disabled={aiLoading === "skill-development"}>
                    {aiLoading === "skill-development" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    KI-Plan aus Skills
                  </Button>
                </div>
                {aiSuggestions.developmentActions && aiSuggestions.developmentActions.length > 0 && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />KI-Entwicklungsvorschlaege</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {aiSuggestions.developmentActions.map((action, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-background border flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{action.title}</p>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="secondary">{action.type}</Badge>
                              {action.timeline && <Badge variant="outline">{action.timeline}</Badge>}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => {
                            setFormData((prev) => ({ ...prev, development_plan: [...(prev.development_plan || []), { ...action, status: "planned", skill_id: action.skill_id }] }))
                            setAiSuggestions((prev) => ({ ...prev, developmentActions: prev.developmentActions?.filter((_, i) => i !== idx) }))
                          }}><Plus className="w-4 h-4" /></Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Entwicklungsmassnahmen</Label>
                    <Button variant="ghost" size="sm" onClick={() => setFormData((prev) => ({ ...prev, development_plan: [...(prev.development_plan || []), { title: "", description: "", type: "training", status: "planned" }] }))}>
                      <Plus className="w-4 h-4 mr-1" />Massnahme hinzufuegen
                    </Button>
                  </div>
                  {Array.isArray(formData.development_plan) && formData.development_plan.map((item, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <Input placeholder="Massnahme" value={item.title || ""} onChange={(e) => {
                            const updated = [...(Array.isArray(formData.development_plan) ? formData.development_plan : [])]
                            updated[idx] = { ...updated[idx], title: e.target.value }
                            setFormData((prev) => ({ ...prev, development_plan: updated }))
                          }} className="flex-1" />
                          <Button variant="ghost" size="icon" onClick={() => {
                            const updated = Array.isArray(formData.development_plan) ? formData.development_plan.filter((_, i) => i !== idx) : []
                            setFormData((prev) => ({ ...prev, development_plan: updated }))
                          }}><X className="w-4 h-4" /></Button>
                        </div>
                        <Textarea placeholder="Beschreibung" value={item.description || ""} onChange={(e) => {
                          const updated = [...(Array.isArray(formData.development_plan) ? formData.development_plan : [])]
                          updated[idx] = { ...updated[idx], description: e.target.value }
                          setFormData((prev) => ({ ...prev, development_plan: updated }))
                        }} rows={2} />
                        <div className="grid grid-cols-3 gap-2">
                          <Select value={item.type || ""} onValueChange={(v) => {
                            const updated = [...(formData.development_plan || [])]; updated[idx] = { ...updated[idx], type: v }
                            setFormData((prev) => ({ ...prev, development_plan: updated }))
                          }}>
                            <SelectTrigger><SelectValue placeholder="Art" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="training">Schulung</SelectItem>
                              <SelectItem value="certification">Zertifizierung</SelectItem>
                              <SelectItem value="mentoring">Mentoring</SelectItem>
                              <SelectItem value="project">Projekt</SelectItem>
                              <SelectItem value="self_study">Selbststudium</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input placeholder="Zeitrahmen" value={item.timeline || ""} onChange={(e) => {
                            const updated = [...(formData.development_plan || [])]; updated[idx] = { ...updated[idx], timeline: e.target.value }
                            setFormData((prev) => ({ ...prev, development_plan: updated }))
                          }} />
                          <Select value={item.skill_id || "no_skill"} onValueChange={(v) => {
                            const updated = [...(formData.development_plan || [])]; updated[idx] = { ...updated[idx], skill_id: v === "no_skill" ? undefined : v }
                            setFormData((prev) => ({ ...prev, development_plan: updated }))
                          }}>
                            <SelectTrigger><SelectValue placeholder="Verknuepfter Skill" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no_skill">Kein Skill</SelectItem>
                              {skills?.filter(Boolean).map((skill) => (<SelectItem key={skill.id} value={skill.id}>{skill.name}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Feedback Tab */}
              <TabsContent value="feedback" className="mt-0 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Staerken</Label>
                      <Button variant="ghost" size="sm" onClick={() => onAIGenerate("feedback-strengths")} disabled={aiLoading === "feedback-strengths"}>
                        {aiLoading === "feedback-strengths" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Textarea placeholder="Welche besonderen Staerken zeigt der Mitarbeiter?" value={formData.strengths || ""} onChange={(e) => setFormData((prev) => ({ ...prev, strengths: e.target.value }))} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Verbesserungspotenziale</Label>
                      <Button variant="ghost" size="sm" onClick={() => onAIGenerate("feedback-improvements")} disabled={aiLoading === "feedback-improvements"}>
                        {aiLoading === "feedback-improvements" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Textarea placeholder="In welchen Bereichen kann sich der Mitarbeiter verbessern?" value={formData.areas_for_improvement || ""} onChange={(e) => setFormData((prev) => ({ ...prev, areas_for_improvement: e.target.value }))} rows={3} />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Wichtigste Erfolge</Label>
                    <Textarea placeholder="Welche besonderen Erfolge hat der Mitarbeiter erzielt?" value={formData.achievements || ""} onChange={(e) => setFormData((prev) => ({ ...prev, achievements: e.target.value }))} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Herausforderungen</Label>
                    <Textarea placeholder="Mit welchen Herausforderungen hatte der Mitarbeiter zu kaempfen?" value={formData.challenges || ""} onChange={(e) => setFormData((prev) => ({ ...prev, challenges: e.target.value }))} rows={3} />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Selbsteinschaetzung des Mitarbeiters</Label>
                    <Textarea placeholder="Wie schaetzt der Mitarbeiter seine eigene Leistung ein?" value={formData.employee_self_assessment || ""} onChange={(e) => setFormData((prev) => ({ ...prev, employee_self_assessment: e.target.value }))} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Zusammenfassendes Feedback</Label>
                      <Button variant="ghost" size="sm" onClick={() => onAIGenerate("feedback-overall")} disabled={aiLoading === "feedback-overall"}>
                        {aiLoading === "feedback-overall" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Textarea placeholder="Gesamtfeedback der Führungskraft" value={formData.manager_comments || ""} onChange={(e) => setFormData((prev) => ({ ...prev, manager_comments: e.target.value }))} rows={4} />
                  </div>
                </div>
              </TabsContent>

              {/* Career Tab */}
              <TabsContent value="career" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Karriereentwicklung</h4>
                  <Button variant="outline" size="sm" onClick={() => onAIGenerate("career")} disabled={aiLoading === "career"}>
                    {aiLoading === "career" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    KI-Karriereberatung
                  </Button>
                </div>
                {aiSuggestions.careerSteps && aiSuggestions.careerSteps.length > 0 && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />KI-Karrierevorschlaege</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {aiSuggestions.careerSteps.map((step, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-background border">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">{step.timeline}</Badge>
                            <span className="font-medium">{step.step}</span>
                          </div>
                          {step.skills && step.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {step.skills.map((skill, sIdx) => (<Badge key={sIdx} variant="outline" className="text-xs">{skill}</Badge>))}
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Karriereziele & Aspirationen</Label>
                    <Textarea placeholder="Welche beruflichen Ziele hat der Mitarbeiter?" value={formData.career_aspirations || ""} onChange={(e) => setFormData((prev) => ({ ...prev, career_aspirations: e.target.value }))} rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Befoerderungsreife</Label>
                      <Select value={formData.promotion_readiness || ""} onValueChange={(v) => setFormData((prev) => ({ ...prev, promotion_readiness: v }))}>
                        <SelectTrigger><SelectValue placeholder="Einschätzung wählen" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ready_now">Sofort befoerderbar</SelectItem>
                          <SelectItem value="ready_6_months">In 6 Monaten</SelectItem>
                          <SelectItem value="ready_12_months">In 12 Monaten</SelectItem>
                          <SelectItem value="needs_development">Braucht Entwicklung</SelectItem>
                          <SelectItem value="not_interested">Kein Interesse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nachfolgepotenzial</Label>
                      <Select value={formData.succession_potential || ""} onValueChange={(v) => setFormData((prev) => ({ ...prev, succession_potential: v }))}>
                        <SelectTrigger><SelectValue placeholder="Einschätzung wählen" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">Hohes Potenzial</SelectItem>
                          <SelectItem value="medium">Mittleres Potenzial</SelectItem>
                          <SelectItem value="developing">In Entwicklung</SelectItem>
                          <SelectItem value="none">Kein Nachfolgepotenzial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Gehaltsempfehlung</Label>
                    <Select value={formData.salary_recommendation || ""} onValueChange={(v) => setFormData((prev) => ({ ...prev, salary_recommendation: v }))}>
                      <SelectTrigger><SelectValue placeholder="Empfehlung wählen" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="significant_increase">{'Deutliche Erhoehung (>10%)'}</SelectItem>
                        <SelectItem value="moderate_increase">Moderate Erhoehung (5-10%)</SelectItem>
                        <SelectItem value="small_increase">{'Kleine Erhoehung (<5%)'}</SelectItem>
                        <SelectItem value="no_change">Keine Änderung</SelectItem>
                        <SelectItem value="review_needed">Überprüfung erforderlich</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nächstes Gespräch</Label>
                    <Input type="date" value={formData.next_review_date || ""} onChange={(e) => setFormData((prev) => ({ ...prev, next_review_date: e.target.value }))} />
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        <DialogFooter className="mt-4">
          <div className="flex items-center gap-2 w-full">
            <Select value={formData.status || ""} onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v }))}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status wählen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Entwurf</SelectItem>
                <SelectItem value="scheduled">Geplant</SelectItem>
                <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                <SelectItem value="completed">Abgeschlossen</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Speichern
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
