"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Calendar,
  Star,
  Target,
  TrendingUp,
  MessageSquare,
  Award,
  FileText,
  Edit,
  Trash2,
  Save,
  X,
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Loader2,
  RefreshCw,
  ArrowRight,
  Lightbulb,
  Zap,
} from "lucide-react"
import useSWR from "swr"
import { swrFetcher } from "@/lib/swr-fetcher"

interface SkillDefinition {
  id: string
  name: string
  category: string | null
  description: string | null
  current_level: number | null
  target_level: number | null
}

const SKILL_LEVEL_CONFIG = [
  { level: 0, title: "Kein Skill", color: "bg-gray-100 text-gray-600", dotColor: "bg-gray-400" },
  { level: 1, title: "Basis", color: "bg-amber-100 text-amber-700", dotColor: "bg-amber-500" },
  { level: 2, title: "Selbstständig", color: "bg-blue-100 text-blue-700", dotColor: "bg-blue-600" },
  { level: 3, title: "Experte", color: "bg-emerald-100 text-emerald-700", dotColor: "bg-emerald-600" },
]

interface Appraisal {
  id: string
  employee_id: string
  appraiser_id?: string
  appraisal_type: string
  appraisal_date: string
  period_start?: string
  period_end?: string
  status: string
  overall_rating?: number
  performance_areas?: Array<{ name: string; rating: number; weight: number }>
  competencies?: Array<{
    skill_id?: string
    name: string
    currentLevel: number
    targetLevel: number
    previousLevel?: number
    gap?: number
  }>
  goals_review?: Array<{ title: string; status: string; achievement?: number; comments?: string }>
  new_goals?: Array<{
    title: string
    description: string
    measurable?: string
    deadline?: string
    priority: string
    status: string
  }>
  development_plan?: Array<{
    title: string
    description: string
    type: string
    timeline?: string
    resources?: string
    status: string
    skill_id?: string // Link development actions to skills
  }>
  strengths?: string
  areas_for_improvement?: string
  achievements?: string
  challenges?: string
  employee_self_assessment?: string
  manager_comments?: string
  career_aspirations?: string
  promotion_readiness?: string
  succession_potential?: string
  salary_recommendation?: string
  next_review_date?: string
  summary?: string
  follow_up_actions?: Array<{ action: string; responsible: string; deadline?: string; status: string }>
  created_at: string
  updated_at: string
}

interface Props {
  memberId: string
  practiceId: string
  memberName: string
  isAdmin: boolean
  currentUserId?: string // Added to track the current user for skill updates
}

const DEFAULT_PERFORMANCE_AREAS = [
  { name: "Fachkompetenz", rating: 3, weight: 25 },
  { name: "Arbeitsqualität", rating: 3, weight: 20 },
  { name: "Zuverlässigkeit", rating: 3, weight: 15 },
  { name: "Teamarbeit", rating: 3, weight: 15 },
  { name: "Kommunikation", rating: 3, weight: 15 },
  { name: "Initiative", rating: 3, weight: 10 },
]

export function TeamMemberAppraisalsTab({ memberId, practiceId, memberName, isAdmin, currentUserId }: Props) {
  const [appraisals, setAppraisals] = useState<Appraisal[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAppraisal, setEditingAppraisal] = useState<Appraisal | null>(null)
  const [activeTab, setActiveTab] = useState("performance")
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<{
    goals?: Array<{ title: string; description: string; measurable: string; deadline: string; priority: string }>
    developmentActions?: Array<{
      title: string
      description: string
      type: string
      timeline: string
      resources: string
      skill_id?: string
    }>
    strengths?: string[]
    improvements?: string[]
    careerSteps?: Array<{ step: string; timeline: string; skills: string[] }>
  }>({})

  // Define formData and setFormData here
  const [formData, setFormData] = useState<Partial<Appraisal>>({})

  // Define toast here
  const { toast } = useToast()

  const { data: skillsData, mutate: mutateSkills } = useSWR<SkillDefinition[]>(
    practiceId && memberId ? `/api/practices/${practiceId}/team-members/${memberId}/skills` : null,
    swrFetcher,
  )
  
  // Ensure skills is always an array
  const skills = Array.isArray(skillsData) ? skillsData : []

  const [skillsLoading, setSkillsLoading] = useState(false)

  const convertSkillsToCompetencies = useCallback((skillsData: SkillDefinition[]) => {
    const safeSkills = Array.isArray(skillsData) ? skillsData : []
    return safeSkills
      .filter((s) => s && (s.current_level !== null || s.target_level !== null))
      .map((skill) => ({
        skill_id: skill.id,
        name: skill.name,
        currentLevel: skill.current_level ?? 0,
        targetLevel: skill.target_level ?? 3,
        previousLevel: skill.current_level ?? 0,
        gap: (skill.target_level ?? 3) - (skill.current_level ?? 0),
      }))
  }, [])

  const handleAIGenerate = useCallback(
    async (action: string, context?: Record<string, unknown>) => {
      if (!practiceId || !memberId) return

      setAiLoading(action)
      try {
        const res = await fetch(`/api/practices/${practiceId}/team-members/${memberId}/appraisals/ai-generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            memberName,
            formData,
            skills: (Array.isArray(skills) ? skills : []).filter(Boolean).map((s) => ({
              // Include skills in AI context
              name: s.name,
              category: s.category,
              currentLevel: s.current_level,
              targetLevel: s.target_level,
              gap: (s.target_level ?? 3) - (s.current_level ?? 0),
            })),
            ...context,
          }),
        })

        if (!res.ok) throw new Error("AI generation failed")

        const data = await res.json()

        switch (action) {
          case "summary":
            setFormData((prev) => ({ ...prev, summary: data.summary }))
            break
          case "goals":
            setAiSuggestions((prev) => ({ ...prev, goals: data.goals }))
            break
          case "development":
            setAiSuggestions((prev) => ({ ...prev, developmentActions: data.developmentActions }))
            break
          case "strengths":
            setAiSuggestions((prev) => ({ ...prev, strengths: data.strengths, improvements: data.improvements }))
            break
          case "feedback-strengths":
            setFormData((prev) => ({ ...prev, strengths: data.text }))
            break
          case "feedback-improvements":
            setFormData((prev) => ({ ...prev, areas_for_improvement: data.text }))
            break
          case "feedback-overall":
            setFormData((prev) => ({ ...prev, manager_comments: data.text }))
            break
          case "career":
            setAiSuggestions((prev) => ({ ...prev, careerSteps: data.careerSteps }))
            break
          case "skill-development":
            setAiSuggestions((prev) => ({ ...prev, developmentActions: data.developmentActions }))
            break
        }

        toast({ title: "Erfolgreich", description: "KI-Vorschlag generiert" })
      } catch {
        toast({ title: "Fehler", description: "KI-Generierung fehlgeschlagen", variant: "destructive" })
      } finally {
        setAiLoading(null)
      }
    },
    [practiceId, memberId, memberName, formData, skills, toast],
  )

  const loadAppraisals = useCallback(async () => {
    if (!practiceId || !memberId) return

    try {
      setLoading(true)
      const res = await fetch(`/api/practices/${practiceId}/team-members/${memberId}/appraisals`)
      if (res.ok) {
        const data = await res.json()
        setAppraisals(data)
      }
    } catch (error) {
      console.error("Failed to load appraisals:", error)
      toast({ title: "Fehler", description: "Gespräche konnten nicht geladen werden", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [practiceId, memberId, toast])

  useEffect(() => {
    loadAppraisals()
    // Remove loadSkills() from useEffect, as SWR handles it
  }, [loadAppraisals])

  const openNewDialog = () => {
    const competenciesFromSkills = convertSkillsToCompetencies(skills)

    setEditingAppraisal(null)
    setFormData({
      appraisal_type: "annual",
      appraisal_date: new Date().toISOString().split("T")[0],
      status: "draft",
      performance_areas: DEFAULT_PERFORMANCE_AREAS,
      competencies: competenciesFromSkills.length > 0 ? competenciesFromSkills : [],
      goals_review: [],
      new_goals: [],
      development_plan: [],
      follow_up_actions: [],
    })
    setAiSuggestions({})
    setActiveTab("performance")
    setDialogOpen(true)
  }

  const openEditDialog = (appraisal: Appraisal) => {
    setEditingAppraisal(appraisal)
    setFormData({
      ...appraisal,
      performance_areas: appraisal.performance_areas || DEFAULT_PERFORMANCE_AREAS,
      competencies: appraisal.competencies || convertSkillsToCompetencies(skills),
      goals_review: appraisal.goals_review || [],
      new_goals: appraisal.new_goals || [],
      development_plan: appraisal.development_plan || [],
      follow_up_actions: appraisal.follow_up_actions || [],
    })
    setAiSuggestions({})
    setActiveTab("performance")
    setDialogOpen(true)
  }

  const handleSave = async () => {
    // Renamed from handleSave to handleSubmit as per update
    if (!practiceId || !memberId) return

    setSaving(true)
    try {
      const url = `/api/practices/${practiceId}/team-members/${memberId}/appraisals`

      const res = await fetch(url, {
        method: editingAppraisal ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAppraisal ? { ...formData, id: editingAppraisal.id } : formData),
      })

      if (!res.ok) throw new Error("Save failed")

      toast({ title: "Erfolgreich", description: "Mitarbeitergespräch gespeichert" })
      setDialogOpen(false)
      loadAppraisals()
    } catch {
      toast({ title: "Fehler", description: "Speichern fehlgeschlagen", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie dieses Gespräch wirklich löschen?")) return

    try {
      const res = await fetch(`/api/practices/${practiceId}/team-members/${memberId}/appraisals?id=${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Delete failed")

      toast({ title: "Erfolgreich", description: "Gespräch gelöscht" })
      loadAppraisals()
    } catch {
      toast({ title: "Fehler", description: "Löschen fehlgeschlagen", variant: "destructive" })
    }
  }

  const calculateOverallRating = () => {
    const areas = formData.performance_areas || []
    if (areas.length === 0) return 0
    const totalWeight = areas.reduce((sum, a) => sum + a.weight, 0)
    const weightedSum = areas.reduce((sum, a) => sum + a.rating * a.weight, 0)
    return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(1) : "0"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Entwurf
          </Badge>
        )
      case "scheduled":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-600">
            <Calendar className="w-3 h-3 mr-1" />
            Geplant
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-600">
            <AlertCircle className="w-3 h-3 mr-1" />
            In Bearbeitung
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="border-emerald-500 text-emerald-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Abgeschlossen
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
    ))
  }

  const syncSkillsToSystem = async () => {
    if (!formData.competencies || formData.competencies.length === 0) return

    setAiLoading("sync-skills")
    try {
      // Update each skill in the system
      for (const comp of formData.competencies) {
        if (comp.skill_id && comp.currentLevel !== comp.previousLevel) {
          await fetch(`/api/practices/${practiceId}/team-members/${memberId}/skills`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              skill_id: comp.skill_id,
              current_level: comp.currentLevel,
              notes: `Aktualisiert im Mitarbeitergespräch am ${formData.appraisal_date}`,
            }),
          })
        }
      }

      toast({ title: "Erfolgreich", description: "Skills wurden im System aktualisiert" })
      await mutateSkills()
    } catch {
      toast({ title: "Fehler", description: "Skill-Synchronisation fehlgeschlagen", variant: "destructive" })
    } finally {
      setAiLoading(null)
    }
  }

  const refreshCompetenciesFromSkills = async () => {
    // Removed loadSkills() call here, SWR data will be available directly
    const competenciesFromSkills = convertSkillsToCompetencies(skills)
    if (competenciesFromSkills.length > 0) {
      setFormData((prev) => ({ ...prev, competencies: competenciesFromSkills }))
      toast({ title: "Aktualisiert", description: "Kompetenzen aus Skills geladen" })
    }
  }

  // Calculate skill statistics
  const skillStats = {
    total: skills.length, // Use skills directly from SWR data
    assessed: skills.filter((s) => s.current_level !== null && s.current_level !== undefined && s.current_level > 0)
      .length,
    gapsCount: skills.filter(
      (s) =>
        s.target_level !== null &&
        s.target_level !== undefined &&
        s.current_level !== null &&
        s.current_level !== undefined &&
        s.target_level > s.current_level,
    ).length,
    avgLevel:
      skills.length > 0 ? (skills.reduce((sum, s) => sum + (s.current_level ?? 0), 0) / skills.length).toFixed(1) : "0",
    expertCount: skills.filter((s) => s.current_level === 3).length,
  }

  if (!practiceId || !memberId) {
    return <div>Keine Praxis-ID oder Mitarbeiter-ID verfügbar</div>
  }

  if (loading && skills.length === 0) {
    // Adjust loading condition to check skills array length
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Mitarbeitergespräche</h3>
          <p className="text-sm text-muted-foreground">
            Professionelle Leistungsbeurteilungen und Entwicklungsgespräche
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openNewDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Neues Gespräch
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{appraisals.length}</p>
                <p className="text-xs text-muted-foreground">Gespräche gesamt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {appraisals.find((a) => a.status === "completed")?.overall_rating?.toFixed(1) || "-"}
                </p>
                <p className="text-xs text-muted-foreground">Letzte Bewertung</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{skills.length}</p>
                <p className="text-xs text-muted-foreground">Skills erfasst</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{appraisals.filter((a) => a.status === "completed").length}</p>
                <p className="text-xs text-muted-foreground">Abgeschlossen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appraisals List */}
      {appraisals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">Noch keine Mitarbeitergespräche</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Erstellen Sie das erste Mitarbeitergespräch für {memberName}
            </p>
            {isAdmin && (
              <Button onClick={openNewDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Gespräch erstellen
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appraisals.map((appraisal) => (
            <Card
              key={appraisal.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openEditDialog(appraisal)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {appraisal.appraisal_type === "annual"
                            ? "Jahresgespräch"
                            : appraisal.appraisal_type === "semi_annual"
                              ? "Halbjahresgespräch"
                              : appraisal.appraisal_type === "quarterly"
                                ? "Quartalsgespräch"
                                : appraisal.appraisal_type === "probation"
                                  ? "Probezeit-Gespräch"
                                  : appraisal.appraisal_type === "ad_hoc"
                                    ? "Zwischengespräch"
                                    : appraisal.appraisal_type}
                        </span>
                        {getStatusBadge(appraisal.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appraisal.appraisal_date).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {appraisal.overall_rating && (
                      <div className="flex items-center gap-1">
                        {getRatingStars(Math.round(appraisal.overall_rating))}
                        <span className="ml-2 font-medium">{appraisal.overall_rating.toFixed(1)}</span>
                      </div>
                    )}
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditDialog(appraisal)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(appraisal.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                <TabsTrigger value="performance" className="text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Leistung
                </TabsTrigger>
                <TabsTrigger value="skills" className="text-xs">
                  <GraduationCap className="w-3 h-3 mr-1" />
                  Skills
                </TabsTrigger>
                <TabsTrigger value="goals" className="text-xs">
                  <Target className="w-3 h-3 mr-1" />
                  Ziele
                </TabsTrigger>
                <TabsTrigger value="development" className="text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Entwicklung
                </TabsTrigger>
                <TabsTrigger value="feedback" className="text-xs">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Feedback
                </TabsTrigger>
                <TabsTrigger value="career" className="text-xs">
                  <Briefcase className="w-3 h-3 mr-1" />
                  Karriere
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 pr-4">
                {/* Performance Tab */}
                <TabsContent value="performance" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Gesprächsart</Label>
                      <Select
                        value={formData.appraisal_type || ""}
                        onValueChange={(v) => setFormData((prev) => ({ ...prev, appraisal_type: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Gesprächsart wählen" />
                        </SelectTrigger>
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
                      <Input
                        type="date"
                        value={formData.appraisal_date || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, appraisal_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Leistungsbereiche</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Gesamtbewertung:</span>
                        <Badge variant="secondary" className="text-lg px-3">
                          {calculateOverallRating()} / 5
                        </Badge>
                      </div>
                    </div>

                    {Array.isArray(formData.performance_areas) && formData.performance_areas.map((area, idx) => (
                      <div key={idx} className="space-y-2 p-3 rounded-lg border bg-card">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{area.name}</span>
                          <Badge variant="outline">{area.weight}% Gewichtung</Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[area.rating]}
                            min={1}
                            max={5}
                            step={1}
                            onValueChange={([v]) => {
                              const updated = [...(formData.performance_areas || [])]
                              updated[idx] = { ...updated[idx], rating: v }
                              setFormData((prev) => ({ ...prev, performance_areas: updated }))
                            }}
                            className="flex-1"
                          />
                          <div className="flex items-center gap-1 min-w-[100px]">{getRatingStars(area.rating)}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAIGenerate("summary")}
                      disabled={aiLoading === "summary"}
                    >
                      {aiLoading === "summary" ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
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

                <TabsContent value="skills" className="mt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Skills & Kompetenzen</h4>
                      <p className="text-sm text-muted-foreground">Basierend auf dem Skills-System der Praxis</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshCompetenciesFromSkills}
                        disabled={skillsLoading} // This state is no longer directly managed by SWR, but can be kept for visual feedback if needed.
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${skillsLoading ? "animate-spin" : ""}`} />
                        Skills aktualisieren
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAIGenerate("strengths")}
                        disabled={aiLoading === "strengths"}
                      >
                        {aiLoading === "strengths" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        KI-Analyse
                      </Button>
                    </div>
                  </div>

                  {/* Skills Statistics */}
                  <div className="grid grid-cols-5 gap-3">
                    <Card className="bg-muted/50">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold">{skillStats.total}</p>
                        <p className="text-xs text-muted-foreground">Skills gesamt</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/50">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold">{skillStats.assessed}</p>
                        <p className="text-xs text-muted-foreground">Bewertet</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/50">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold">{skillStats.avgLevel}</p>
                        <p className="text-xs text-muted-foreground">Ø Level</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-emerald-50">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-600">{skillStats.expertCount}</p>
                        <p className="text-xs text-muted-foreground">Experten-Skills</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-amber-50">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-amber-600">{skillStats.gapsCount}</p>
                        <p className="text-xs text-muted-foreground">Skill-Gaps</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* AI Strengths/Improvements Analysis */}
                  {(aiSuggestions.strengths || aiSuggestions.improvements) && (
                    <div className="grid grid-cols-2 gap-4">
                      {aiSuggestions.strengths && (
                        <Card className="bg-emerald-50 border-emerald-200">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
                              <Award className="w-4 h-4" />
                              Stärken (KI-Analyse)
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-1">
                              {aiSuggestions.strengths.map((s, i) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                      {aiSuggestions.improvements && (
                        <Card className="bg-amber-50 border-amber-200">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                              <Lightbulb className="w-4 h-4" />
                              Entwicklungspotenziale
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-1">
                              {aiSuggestions.improvements.map((s, i) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                  <ArrowRight className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Skills List by Category */}
                  {formData.competencies && formData.competencies.length > 0 ? (
                    <div className="space-y-4">
                      {/* Group by category from original skills */}
                      {Object.entries(
                        formData.competencies.reduce(
                          (acc, comp) => {
                            const skill = skills.find((s) => s.id === comp.skill_id)
                            const category = skill?.category || "Allgemein"
                            if (!acc[category]) acc[category] = []
                            acc[category].push({ ...comp, description: skill?.description })
                            return acc
                          },
                          {} as Record<
                            string,
                            Array<(typeof formData.competencies)[0] & { description?: string | null }>
                          >,
                        ),
                      ).map(([category, categorySkills]) => (
                        <Card key={category}>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium flex items-center justify-between">
                              <span>{category}</span>
                              <Badge variant="secondary">
                                {categorySkills.filter((s) => s.currentLevel > 0).length}/{categorySkills.length}{" "}
                                bewertet
                              </Badge>
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
                                          {hasGap && (
                                            <Badge
                                              variant="outline"
                                              className="text-amber-600 border-amber-300 text-xs"
                                            >
                                              Gap: {comp.gap} Level
                                            </Badge>
                                          )}
                                        </div>
                                        {comp.description && (
                                          <p className="text-xs text-muted-foreground mt-0.5">{comp.description}</p>
                                        )}
                                      </div>
                                      <Badge className={levelConfig.color}>{levelConfig.title}</Badge>
                                    </div>

                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground w-16">Aktuell:</span>
                                        <div className="flex-1">
                                          <Slider
                                            value={[comp.currentLevel]}
                                            min={0}
                                            max={3}
                                            step={1}
                                            onValueChange={([v]) => {
                                              if (globalIdx === -1) return
                                              const updated = [...(formData.competencies || [])]
                                              updated[globalIdx] = {
                                                ...updated[globalIdx],
                                                currentLevel: v,
                                                gap: updated[globalIdx].targetLevel - v,
                                              }
                                              setFormData((prev) => ({ ...prev, competencies: updated }))
                                            }}
                                          />
                                        </div>
                                        <div className="flex gap-1 min-w-[80px]">
                                          {[0, 1, 2, 3].map((l) => (
                                            <div
                                              key={l}
                                              className={`w-4 h-4 rounded-full ${
                                                l <= comp.currentLevel
                                                  ? SKILL_LEVEL_CONFIG[comp.currentLevel].dotColor
                                                  : "bg-gray-200"
                                              }`}
                                            />
                                          ))}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground w-16">Ziel:</span>
                                        <div className="flex-1">
                                          <Slider
                                            value={[comp.targetLevel]}
                                            min={0}
                                            max={3}
                                            step={1}
                                            onValueChange={([v]) => {
                                              if (globalIdx === -1) return
                                              const updated = [...(formData.competencies || [])]
                                              updated[globalIdx] = {
                                                ...updated[globalIdx],
                                                targetLevel: v,
                                                gap: v - updated[globalIdx].currentLevel,
                                              }
                                              setFormData((prev) => ({ ...prev, competencies: updated }))
                                            }}
                                          />
                                        </div>
                                        <div className="flex gap-1 min-w-[80px]">
                                          {[0, 1, 2, 3].map((l) => (
                                            <div
                                              key={l}
                                              className={`w-4 h-4 rounded-full border-2 ${
                                                l <= comp.targetLevel
                                                  ? "border-primary bg-primary/20"
                                                  : "border-gray-200 bg-transparent"
                                              }`}
                                            />
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

                      {/* Sync to System Button */}
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={syncSkillsToSystem} disabled={aiLoading === "sync-skills"}>
                          {aiLoading === "sync-skills" ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4 mr-2" />
                          )}
                          Skills im System aktualisieren
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Card className="bg-muted/50">
                      <CardContent className="py-8 text-center">
                        <GraduationCap className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                        <p className="font-medium mb-1">Keine Skills verfügbar</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Für diesen Mitarbeiter sind noch keine Skills definiert
                        </p>
                        <Button variant="outline" size="sm" onClick={refreshCompetenciesFromSkills}>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Skills laden
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="goals" className="mt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Ziele setzen & überprüfen</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAIGenerate("goals")}
                      disabled={aiLoading === "goals"}
                    >
                      {aiLoading === "goals" ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      KI-Ziele vorschlagen
                    </Button>
                  </div>

                  {/* AI Goal Suggestions */}
                  {aiSuggestions.goals && aiSuggestions.goals.length > 0 && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          KI-Vorschläge (basierend auf Skill-Gaps)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {aiSuggestions.goals.map((goal, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-background border flex items-start justify-between"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{goal.title}</p>
                              <p className="text-sm text-muted-foreground">{goal.description}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="secondary">{goal.priority}</Badge>
                                {goal.deadline && <Badge variant="outline">{goal.deadline}</Badge>}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  new_goals: [...(prev.new_goals || []), { ...goal, status: "not_started" }],
                                }))
                                setAiSuggestions((prev) => ({
                                  ...prev,
                                  goals: prev.goals?.filter((_, i) => i !== idx),
                                }))
                              }}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* New Goals */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Neue Ziele</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            new_goals: [
                              ...(prev.new_goals || []),
                              { title: "", description: "", priority: "medium", status: "not_started" },
                            ],
                          }))
                        }
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Ziel hinzufügen
                      </Button>
                    </div>

                    {Array.isArray(formData.new_goals) && formData.new_goals.map((goal, idx) => (
                      <Card key={idx}>
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <Input
                              placeholder="Zieltitel"
                              value={goal.title || ""}
                              onChange={(e) => {
                                const updated = [...(formData.new_goals || [])]
                                updated[idx] = { ...updated[idx], title: e.target.value }
                                setFormData((prev) => ({ ...prev, new_goals: updated }))
                              }}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const updated = formData.new_goals?.filter((_, i) => i !== idx)
                                setFormData((prev) => ({ ...prev, new_goals: updated }))
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <Textarea
                            placeholder="Beschreibung"
                            value={goal.description || ""}
                            onChange={(e) => {
                              const updated = [...(formData.new_goals || [])]
                              updated[idx] = { ...updated[idx], description: e.target.value }
                              setFormData((prev) => ({ ...prev, new_goals: updated }))
                            }}
                            rows={2}
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <Select
                              value={goal.priority || ""}
                              onValueChange={(v) => {
                                const updated = [...(formData.new_goals || [])]
                                updated[idx] = { ...updated[idx], priority: v }
                                setFormData((prev) => ({ ...prev, new_goals: updated }))
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Priorität" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="high">Hoch</SelectItem>
                                <SelectItem value="medium">Mittel</SelectItem>
                                <SelectItem value="low">Niedrig</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="date"
                              placeholder="Deadline"
                              value={goal.deadline || ""}
                              onChange={(e) => {
                                const updated = [...(formData.new_goals || [])]
                                updated[idx] = { ...updated[idx], deadline: e.target.value }
                                setFormData((prev) => ({ ...prev, new_goals: updated }))
                              }}
                            />
                            <Input
                              placeholder="Messbar (KPI)"
                              value={goal.measurable || ""}
                              onChange={(e) => {
                                const updated = [...(formData.new_goals || [])]
                                updated[idx] = { ...updated[idx], measurable: e.target.value }
                                setFormData((prev) => ({ ...prev, new_goals: updated }))
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="development" className="mt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Entwicklungsplan</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAIGenerate("skill-development")}
                      disabled={aiLoading === "skill-development"}
                    >
                      {aiLoading === "skill-development" ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      KI-Plan aus Skills
                    </Button>
                  </div>

                  {/* AI Development Suggestions */}
                  {aiSuggestions.developmentActions && aiSuggestions.developmentActions.length > 0 && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          KI-Entwicklungsvorschläge (basierend auf Skill-Gaps)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {aiSuggestions.developmentActions.map((action, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-background border flex items-start justify-between"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{action.title}</p>
                              <p className="text-sm text-muted-foreground">{action.description}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="secondary">{action.type}</Badge>
                                {action.timeline && <Badge variant="outline">{action.timeline}</Badge>}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  development_plan: [
                                    ...(prev.development_plan || []),
                                    { ...action, status: "planned", skill_id: action.skill_id },
                                  ],
                                }))
                                setAiSuggestions((prev) => ({
                                  ...prev,
                                  developmentActions: prev.developmentActions?.filter((_, i) => i !== idx),
                                }))
                              }}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Development Plan Items */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Entwicklungsmaßnahmen</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            development_plan: [
                              ...(prev.development_plan || []),
                              { title: "", description: "", type: "training", status: "planned" },
                            ],
                          }))
                        }
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Maßnahme hinzufügen
                      </Button>
                    </div>

                    {Array.isArray(formData.development_plan) && formData.development_plan.map((item, idx) => (
                      <Card key={idx}>
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <Input
                              placeholder="Maßnahme"
                              value={item.title || ""}
                              onChange={(e) => {
                                const updated = [...(Array.isArray(formData.development_plan) ? formData.development_plan : [])]
                                updated[idx] = { ...updated[idx], title: e.target.value }
                                setFormData((prev) => ({ ...prev, development_plan: updated }))
                              }}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const updated = Array.isArray(formData.development_plan) ? formData.development_plan.filter((_, i) => i !== idx) : []
                                setFormData((prev) => ({ ...prev, development_plan: updated }))
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <Textarea
                            placeholder="Beschreibung"
                            value={item.description || ""}
                            onChange={(e) => {
                              const updated = [...(Array.isArray(formData.development_plan) ? formData.development_plan : [])]
                              updated[idx] = { ...updated[idx], description: e.target.value }
                              setFormData((prev) => ({ ...prev, development_plan: updated }))
                            }}
                            rows={2}
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <Select
                              value={item.type || ""}
                              onValueChange={(v) => {
                                const updated = [...(formData.development_plan || [])]
                                updated[idx] = { ...updated[idx], type: v }
                                setFormData((prev) => ({ ...prev, development_plan: updated }))
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Art" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="training">Schulung</SelectItem>
                                <SelectItem value="certification">Zertifizierung</SelectItem>
                                <SelectItem value="mentoring">Mentoring</SelectItem>
                                <SelectItem value="project">Projekt</SelectItem>
                                <SelectItem value="self_study">Selbststudium</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Zeitrahmen"
                              value={item.timeline || ""}
                              onChange={(e) => {
                                const updated = [...(formData.development_plan || [])]
                                updated[idx] = { ...updated[idx], timeline: e.target.value }
                                setFormData((prev) => ({ ...prev, development_plan: updated }))
                              }}
                            />
                            <Select
                              value={item.skill_id || "no_skill"}
                              onValueChange={(v) => {
                                const updated = [...(formData.development_plan || [])]
                                updated[idx] = { ...updated[idx], skill_id: v === "no_skill" ? undefined : v }
                                setFormData((prev) => ({ ...prev, development_plan: updated }))
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Verknüpfter Skill" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="no_skill">Kein Skill</SelectItem>
                                {skills?.filter(Boolean).map((skill) => (
                                  <SelectItem key={skill.id} value={skill.id}>
                                    {skill.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="feedback" className="mt-0 space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Stärken</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAIGenerate("feedback-strengths")}
                          disabled={aiLoading === "feedback-strengths"}
                        >
                          {aiLoading === "feedback-strengths" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Welche besonderen Stärken zeigt der Mitarbeiter?"
                        value={formData.strengths || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, strengths: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Verbesserungspotenziale</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAIGenerate("feedback-improvements")}
                          disabled={aiLoading === "feedback-improvements"}
                        >
                          {aiLoading === "feedback-improvements" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <Textarea
                        placeholder="In welchen Bereichen kann sich der Mitarbeiter verbessern?"
                        value={formData.areas_for_improvement || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, areas_for_improvement: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Wichtigste Erfolge</Label>
                      <Textarea
                        placeholder="Welche besonderen Erfolge hat der Mitarbeiter erzielt?"
                        value={formData.achievements || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, achievements: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Herausforderungen</Label>
                      <Textarea
                        placeholder="Mit welchen Herausforderungen hatte der Mitarbeiter zu kämpfen?"
                        value={formData.challenges || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, challenges: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Selbsteinschätzung des Mitarbeiters</Label>
                      <Textarea
                        placeholder="Wie schätzt der Mitarbeiter seine eigene Leistung ein?"
                        value={formData.employee_self_assessment || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, employee_self_assessment: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Zusammenfassendes Feedback</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAIGenerate("feedback-overall")}
                          disabled={aiLoading === "feedback-overall"}
                        >
                          {aiLoading === "feedback-overall" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Gesamtfeedback der Führungskraft"
                        value={formData.manager_comments || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, manager_comments: e.target.value }))}
                        rows={4}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="career" className="mt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Karriereentwicklung</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAIGenerate("career")}
                      disabled={aiLoading === "career"}
                    >
                      {aiLoading === "career" ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      KI-Karriereberatung
                    </Button>
                  </div>

                  {/* AI Career Suggestions */}
                  {aiSuggestions.careerSteps && aiSuggestions.careerSteps.length > 0 && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          KI-Karrierevorschläge
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {aiSuggestions.careerSteps.map((step, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-background border">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">{step.timeline}</Badge>
                              <span className="font-medium">{step.step}</span>
                            </div>
                            {step.skills && step.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {step.skills.map((skill, sIdx) => (
                                  <Badge key={sIdx} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
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
                      <Textarea
                        placeholder="Welche beruflichen Ziele hat der Mitarbeiter?"
                        value={formData.career_aspirations || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, career_aspirations: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Beförderungsreife</Label>
                        <Select
                          value={formData.promotion_readiness || ""}
                          onValueChange={(v) => setFormData((prev) => ({ ...prev, promotion_readiness: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Einschätzung wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ready_now">Sofort beförderbar</SelectItem>
                            <SelectItem value="ready_6_months">In 6 Monaten</SelectItem>
                            <SelectItem value="ready_12_months">In 12 Monaten</SelectItem>
                            <SelectItem value="needs_development">Braucht Entwicklung</SelectItem>
                            <SelectItem value="not_interested">Kein Interesse</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Nachfolgepotenzial</Label>
                        <Select
                          value={formData.succession_potential || ""}
                          onValueChange={(v) => setFormData((prev) => ({ ...prev, succession_potential: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Einschätzung wählen" />
                          </SelectTrigger>
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
                      <Select
                        value={formData.salary_recommendation || ""}
                        onValueChange={(v) => setFormData((prev) => ({ ...prev, salary_recommendation: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Empfehlung wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="significant_increase">Deutliche Erhöhung (&gt;10%)</SelectItem>
                          <SelectItem value="moderate_increase">Moderate Erhöhung (5-10%)</SelectItem>
                          <SelectItem value="small_increase">Kleine Erhöhung (&lt;5%)</SelectItem>
                          <SelectItem value="no_change">Keine Änderung</SelectItem>
                          <SelectItem value="review_needed">Überprüfung erforderlich</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Nächstes Gespräch</Label>
                      <Input
                        type="date"
                        value={formData.next_review_date || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, next_review_date: e.target.value }))}
                      />
                    </div>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          <DialogFooter className="mt-4">
            <div className="flex items-center gap-2 w-full">
              <Select
                value={formData.status || ""}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Entwurf</SelectItem>
                  <SelectItem value="scheduled">Geplant</SelectItem>
                  <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                  <SelectItem value="completed">Abgeschlossen</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex-1" />
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {" "}
                {/* Use handleSave here */}
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Speichern
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TeamMemberAppraisalsTab
