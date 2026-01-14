"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"
import {
  ArrowLeft,
  Search,
  Plus,
  Star,
  Target,
  TrendingUp,
  MessageSquare,
  Award,
  FileText,
  Save,
  Sparkles,
  ChevronRight,
  Loader2,
  User,
  Trash2,
} from "lucide-react"

interface TeamMember {
  id: string
  name: string
  role: string
  avatar_url?: string
  email?: string
  department?: string
}

interface SkillDefinition {
  id: string
  name: string
  category: string | null
  description: string | null
  current_level: number | null
  target_level: number | null
}

interface Appraisal {
  id?: string
  team_member_id: string
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
    skill_id?: string
  }>
  strengths?: string
  areas_for_improvement?: string
  key_achievements?: string
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
}

const SKILL_LEVEL_CONFIG = [
  { level: 0, title: "Kein Skill", color: "bg-gray-100 text-gray-600", dotColor: "bg-gray-400" },
  { level: 1, title: "Basis", color: "bg-amber-100 text-amber-700", dotColor: "bg-amber-500" },
  { level: 2, title: "Selbstständig", color: "bg-blue-100 text-blue-700", dotColor: "bg-blue-600" },
  { level: 3, title: "Experte", color: "bg-emerald-100 text-emerald-700", dotColor: "bg-emerald-600" },
]

const DEFAULT_PERFORMANCE_AREAS = [
  { name: "Fachkompetenz", rating: 3, weight: 25 },
  { name: "Arbeitsqualität", rating: 3, weight: 20 },
  { name: "Zuverlässigkeit", rating: 3, weight: 15 },
  { name: "Teamarbeit", rating: 3, weight: 15 },
  { name: "Kommunikation", rating: 3, weight: 15 },
  { name: "Initiative", rating: 3, weight: 10 },
]

export default function NeuesMitarbeitergespraechPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { toast } = useToast()
  const practiceId = currentPractice?.id

  // Step management
  const [step, setStep] = useState<"select-member" | "form">("select-member")
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)

  // Team members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Skills
  const [skills, setSkills] = useState<SkillDefinition[]>([])

  // Form state
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

  const [formData, setFormData] = useState<Partial<Appraisal>>({
    appraisal_type: "annual",
    appraisal_date: new Date().toISOString().split("T")[0],
    status: "draft",
    performance_areas: DEFAULT_PERFORMANCE_AREAS,
    competencies: [],
    goals_review: [],
    new_goals: [],
    development_plan: [],
    follow_up_actions: [],
  })

  // Check for pre-selected member from URL
  useEffect(() => {
    const memberId = searchParams.get("memberId")
    if (memberId && teamMembers.length > 0) {
      const member = teamMembers.find((m) => m.id === memberId)
      if (member) {
        setSelectedMember(member)
        setStep("form")
      }
    }
  }, [searchParams, teamMembers])

  // Load team members
  useEffect(() => {
    if (!practiceId || practiceLoading) return
    const loadTeamMembers = async () => {
      try {
        console.log("[v0] Fetching team members for practice:", practiceId)
        const res = await fetch(`/api/practices/${practiceId}/team-members`)
        if (!res.ok) {
          const text = await res.text()
          console.error("[v0] Team members fetch error:", text)
          throw new Error("Failed to load team members")
        }
        const data = await res.json()
        const members = Array.isArray(data) ? data : data.teamMembers || data || []
        console.log("[v0] Loaded team members:", members.length)
        setTeamMembers(members)
      } catch (error) {
        console.error("[v0] Team members load error:", error)
        toast({ title: "Fehler", description: "Team konnte nicht geladen werden", variant: "destructive" })
      } finally {
        setLoadingMembers(false)
      }
    }
    loadTeamMembers()
  }, [practiceId, practiceLoading, toast])

  // Load skills when member selected
  useEffect(() => {
    if (!practiceId || !selectedMember) return
    const loadSkills = async () => {
      try {
        console.log("[v0] Fetching skills for practice:", practiceId)
        const res = await fetch(`/api/practices/${practiceId}/skills`)
        if (!res.ok) {
          console.error("[v0] Skills fetch failed:", await res.text())
          throw new Error()
        }
        const data = await res.json()
        // API returns array directly, not { skills: [] }
        const skillsArray = Array.isArray(data) ? data : []
        console.log("[v0] Loaded skills:", skillsArray.length)
        setSkills(skillsArray)

        // Convert skills to competencies
        const competencies = skillsArray.map((skill: SkillDefinition) => ({
          skill_id: skill.id,
          name: skill.name,
          currentLevel: skill.current_level || 0,
          targetLevel: skill.target_level || 0,
          previousLevel: skill.current_level || 0,
          gap: (skill.target_level || 0) - (skill.current_level || 0),
        }))

        setFormData((prev) => ({
          ...prev,
          team_member_id: selectedMember.id,
          competencies: competencies.length > 0 ? competencies : prev.competencies,
        }))
      } catch {
        console.error("Failed to load skills")
        toast({ title: "Fehler", description: "Kompetenzen konnten nicht geladen werden", variant: "destructive" })
      }
    }
    loadSkills()
  }, [practiceId, selectedMember, toast])

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSelectMember = (member: TeamMember) => {
    setSelectedMember(member)
    setFormData((prev) => ({ ...prev, team_member_id: member.id }))
    setStep("form")
  }

  const handleSave = async () => {
    console.log("[v0] Save clicked - practiceId:", practiceId, "selectedMember:", selectedMember?.id)

    if (!practiceId) {
      toast({
        title: "Fehler",
        description: "Praxis nicht geladen. Bitte warten Sie einen Moment.",
        variant: "destructive",
      })
      return
    }

    if (!selectedMember) {
      toast({
        title: "Fehler",
        description: "Kein Mitarbeiter ausgewählt",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...formData,
        employee_id: selectedMember.id, // API expects employee_id, not team_member_id
      }

      console.log("[v0] Sending appraisal save request:", {
        url: `/api/practices/${practiceId}/team-members/${selectedMember.id}/appraisals`,
        payloadKeys: Object.keys(payload),
      })

      const res = await fetch(`/api/practices/${practiceId}/team-members/${selectedMember.id}/appraisals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] Save appraisal error:", errorData)
        throw new Error(errorData.error || "Save failed")
      }

      toast({ title: "Erfolgreich", description: "Mitarbeitergespräch gespeichert" })
      router.push("/mitarbeitergespraeche")
    } catch (error: any) {
      console.error("[v0] Save appraisal exception:", error)
      toast({
        title: "Fehler",
        description: error.message || "Speichern fehlgeschlagen",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAIGenerate = async (type: string) => {
    if (!practiceId || !selectedMember) return

    setAiLoading(type)
    try {
      const res = await fetch(`/api/practices/${practiceId}/team-members/${selectedMember.id}/appraisals/ai-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          context: {
            memberName: selectedMember.name,
            role: selectedMember.role,
            performanceAreas: formData.performance_areas,
            competencies: formData.competencies,
            strengths: formData.strengths,
            improvements: formData.areas_for_improvement,
            goals: formData.new_goals,
          },
        }),
      })

      if (!res.ok) throw new Error()
      const data = await res.json()

      setAiSuggestions((prev) => ({ ...prev, [type]: data.suggestions }))
      toast({ title: "KI-Vorschläge generiert", description: "Übernehmen Sie passende Vorschläge" })
    } catch {
      toast({ title: "Fehler", description: "KI-Generierung fehlgeschlagen", variant: "destructive" })
    } finally {
      setAiLoading(null)
    }
  }

  const calculateOverallRating = () => {
    const areas = formData.performance_areas || []
    if (areas.length === 0) return 0
    const totalWeight = areas.reduce((sum, a) => sum + a.weight, 0)
    const weightedSum = areas.reduce((sum, a) => sum + a.rating * a.weight, 0)
    return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(1) : 0
  }

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return { label: "Herausragend", color: "text-emerald-600" }
    if (rating >= 3.5) return { label: "Sehr gut", color: "text-blue-600" }
    if (rating >= 2.5) return { label: "Gut", color: "text-amber-600" }
    if (rating >= 1.5) return { label: "Entwicklungsbedarf", color: "text-orange-600" }
    return { label: "Kritisch", color: "text-red-600" }
  }

  if (practiceLoading) {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  // Render step 1: Member selection
  if (step === "select-member") {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/mitarbeitergespraeche")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Neues Mitarbeitergespräch</h1>
            <p className="text-muted-foreground">Wählen Sie einen Mitarbeiter für das Gespräch aus</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Mitarbeiter auswählen
            </CardTitle>
            <CardDescription>Klicken Sie auf einen Mitarbeiter, um das Gespräch zu beginnen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Mitarbeiter suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loadingMembers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? "Keine Mitarbeiter gefunden" : "Keine Teammitglieder vorhanden"}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMembers.map((member) => (
                  <Card
                    key={member.id}
                    className="cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all"
                    onClick={() => handleSelectMember(member)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>
                            {member.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{member.name}</h4>
                          <p className="text-sm text-muted-foreground truncate">{member.role}</p>
                          {member.department && (
                            <p className="text-xs text-muted-foreground truncate">{member.department}</p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render step 2: Appraisal form
  const overallRating = Number(calculateOverallRating())
  const ratingInfo = getRatingLabel(overallRating)

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setStep("select-member")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedMember?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>
                {selectedMember?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">Neues Mitarbeitergespräch</h1>
              <p className="text-sm text-muted-foreground">
                {selectedMember?.name} - {selectedMember?.role}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={formData.status} onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v }))}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Entwurf</SelectItem>
              <SelectItem value="scheduled">Geplant</SelectItem>
              <SelectItem value="in_progress">In Bearbeitung</SelectItem>
              <SelectItem value="completed">Abgeschlossen</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => router.push("/mitarbeitergespraeche")}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Speichern
          </Button>
        </div>
      </div>

      {/* Overall Rating Card */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <Label className="text-xs text-muted-foreground">Gesamtbewertung</Label>
                <div className="flex items-center gap-2">
                  <span className={`text-3xl font-bold ${ratingInfo.color}`}>{overallRating}</span>
                  <span className="text-sm text-muted-foreground">/ 5</span>
                </div>
                <Badge variant="outline" className={ratingInfo.color}>
                  {ratingInfo.label}
                </Badge>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div>
                <Label className="text-xs text-muted-foreground">Gesprächstyp</Label>
                <Select
                  value={formData.appraisal_type}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, appraisal_type: v }))}
                >
                  <SelectTrigger className="w-[180px] mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Jahresgespräch</SelectItem>
                    <SelectItem value="probation">Probezeit</SelectItem>
                    <SelectItem value="project">Projektabschluss</SelectItem>
                    <SelectItem value="development">Entwicklung</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Datum</Label>
                <Input
                  type="date"
                  value={formData.appraisal_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, appraisal_date: e.target.value }))}
                  className="mt-1 w-[180px]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Form Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-6 mb-6">
              <TabsTrigger value="performance" className="text-xs">
                <Star className="w-3 h-3 mr-1" />
                Leistung
              </TabsTrigger>
              <TabsTrigger value="skills" className="text-xs">
                <Award className="w-3 h-3 mr-1" />
                Kompetenzen
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
              <TabsTrigger value="summary" className="text-xs">
                <FileText className="w-3 h-3 mr-1" />
                Zusammenfassung
              </TabsTrigger>
            </TabsList>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid gap-4">
                {(formData.performance_areas || []).map((area, index) => (
                  <div key={area.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">{area.name}</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Gewichtung: {area.weight}%</span>
                        <Badge variant="outline">{area.rating}/5</Badge>
                      </div>
                    </div>
                    <Slider
                      value={[area.rating]}
                      min={1}
                      max={5}
                      step={0.5}
                      onValueChange={([value]) => {
                        const newAreas = [...(formData.performance_areas || [])]
                        newAreas[index] = { ...newAreas[index], rating: value }
                        setFormData((prev) => ({ ...prev, performance_areas: newAreas }))
                      }}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Entwicklungsbedarf</span>
                      <span>Herausragend</span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Kompetenzentwicklung</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAIGenerate("skills")}
                  disabled={aiLoading === "skills"}
                >
                  {aiLoading === "skills" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  KI-Vorschläge
                </Button>
              </div>
              <div className="grid gap-4">
                {(formData.competencies || []).map((comp, index) => (
                  <Card key={comp.skill_id || index}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">{comp.name}</span>
                        <div className="flex gap-2">
                          <Badge className={SKILL_LEVEL_CONFIG[comp.currentLevel]?.color || "bg-gray-100"}>
                            Aktuell: {SKILL_LEVEL_CONFIG[comp.currentLevel]?.title || "N/A"}
                          </Badge>
                          <Badge className={SKILL_LEVEL_CONFIG[comp.targetLevel]?.color || "bg-gray-100"}>
                            Ziel: {SKILL_LEVEL_CONFIG[comp.targetLevel]?.title || "N/A"}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Aktuelles Level</Label>
                          <Slider
                            value={[comp.currentLevel]}
                            min={0}
                            max={3}
                            step={1}
                            onValueChange={([value]) => {
                              const newComps = [...(formData.competencies || [])]
                              newComps[index] = { ...newComps[index], currentLevel: value }
                              setFormData((prev) => ({ ...prev, competencies: newComps }))
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Ziel-Level</Label>
                          <Slider
                            value={[comp.targetLevel]}
                            min={0}
                            max={3}
                            step={1}
                            onValueChange={([value]) => {
                              const newComps = [...(formData.competencies || [])]
                              newComps[index] = { ...newComps[index], targetLevel: value }
                              setFormData((prev) => ({ ...prev, competencies: newComps }))
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(formData.competencies || []).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Keine Kompetenzen definiert. Fügen Sie Skills im Mitarbeiterprofil hinzu.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Goals Tab */}
            <TabsContent value="goals" className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Neue Ziele</h3>
                <div className="flex gap-2">
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
                    KI-Vorschläge
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        new_goals: [
                          ...(prev.new_goals || []),
                          { title: "", description: "", priority: "medium", status: "open" },
                        ],
                      }))
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ziel hinzufügen
                  </Button>
                </div>
              </div>

              {/* AI Suggestions */}
              {aiSuggestions.goals && aiSuggestions.goals.length > 0 && (
                <Card className="bg-purple-50 border-purple-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      KI-Vorschläge
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {aiSuggestions.goals.map((suggestion, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 bg-white rounded border cursor-pointer hover:border-purple-400"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            new_goals: [
                              ...(prev.new_goals || []),
                              {
                                title: suggestion.title,
                                description: suggestion.description,
                                measurable: suggestion.measurable,
                                deadline: suggestion.deadline,
                                priority: suggestion.priority as "low" | "medium" | "high",
                                status: "open",
                              },
                            ],
                          }))
                          toast({ title: "Ziel übernommen" })
                        }}
                      >
                        <div>
                          <p className="font-medium text-sm">{suggestion.title}</p>
                          <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                        </div>
                        <Plus className="w-4 h-4 text-purple-600" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Goals List */}
              <div className="space-y-3">
                {(formData.new_goals || []).map((goal, index) => (
                  <Card key={index}>
                    <CardContent className="py-4">
                      <div className="grid gap-3">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <Label className="text-xs">Titel</Label>
                            <Input
                              value={goal.title}
                              onChange={(e) => {
                                const newGoals = [...(formData.new_goals || [])]
                                newGoals[index] = { ...newGoals[index], title: e.target.value }
                                setFormData((prev) => ({ ...prev, new_goals: newGoals }))
                              }}
                              placeholder="Ziel-Titel"
                            />
                          </div>
                          <div className="w-32">
                            <Label className="text-xs">Priorität</Label>
                            <Select
                              value={goal.priority}
                              onValueChange={(v) => {
                                const newGoals = [...(formData.new_goals || [])]
                                newGoals[index] = { ...newGoals[index], priority: v }
                                setFormData((prev) => ({ ...prev, new_goals: newGoals }))
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Niedrig</SelectItem>
                                <SelectItem value="medium">Mittel</SelectItem>
                                <SelectItem value="high">Hoch</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="mt-5"
                            onClick={() => {
                              const newGoals = (formData.new_goals || []).filter((_, i) => i !== index)
                              setFormData((prev) => ({ ...prev, new_goals: newGoals }))
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <div>
                          <Label className="text-xs">Beschreibung</Label>
                          <Textarea
                            value={goal.description}
                            onChange={(e) => {
                              const newGoals = [...(formData.new_goals || [])]
                              newGoals[index] = { ...newGoals[index], description: e.target.value }
                              setFormData((prev) => ({ ...prev, new_goals: newGoals }))
                            }}
                            placeholder="Beschreibung des Ziels"
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Messbar durch</Label>
                            <Input
                              value={goal.measurable || ""}
                              onChange={(e) => {
                                const newGoals = [...(formData.new_goals || [])]
                                newGoals[index] = { ...newGoals[index], measurable: e.target.value }
                                setFormData((prev) => ({ ...prev, new_goals: newGoals }))
                              }}
                              placeholder="Wie wird Erfolg gemessen?"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Deadline</Label>
                            <Input
                              type="date"
                              value={goal.deadline || ""}
                              onChange={(e) => {
                                const newGoals = [...(formData.new_goals || [])]
                                newGoals[index] = { ...newGoals[index], deadline: e.target.value }
                                setFormData((prev) => ({ ...prev, new_goals: newGoals }))
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(formData.new_goals || []).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Noch keine Ziele definiert. Fügen Sie Ziele hinzu oder nutzen Sie KI-Vorschläge.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Development Tab */}
            <TabsContent value="development" className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Entwicklungsmaßnahmen</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAIGenerate("developmentActions")}
                    disabled={aiLoading === "developmentActions"}
                  >
                    {aiLoading === "developmentActions" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    KI-Vorschläge
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        development_plan: [
                          ...(prev.development_plan || []),
                          { title: "", description: "", type: "training", status: "planned" },
                        ],
                      }))
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Maßnahme hinzufügen
                  </Button>
                </div>
              </div>

              {/* Development List */}
              <div className="space-y-3">
                {(formData.development_plan || []).map((item, index) => (
                  <Card key={index}>
                    <CardContent className="py-4">
                      <div className="grid gap-3">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <Label className="text-xs">Titel</Label>
                            <Input
                              value={item.title}
                              onChange={(e) => {
                                const newPlan = [...(formData.development_plan || [])]
                                newPlan[index] = { ...newPlan[index], title: e.target.value }
                                setFormData((prev) => ({ ...prev, development_plan: newPlan }))
                              }}
                              placeholder="Maßnahme"
                            />
                          </div>
                          <div className="w-40">
                            <Label className="text-xs">Typ</Label>
                            <Select
                              value={item.type}
                              onValueChange={(v) => {
                                const newPlan = [...(formData.development_plan || [])]
                                newPlan[index] = { ...newPlan[index], type: v }
                                setFormData((prev) => ({ ...prev, development_plan: newPlan }))
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="training">Schulung</SelectItem>
                                <SelectItem value="coaching">Coaching</SelectItem>
                                <SelectItem value="mentoring">Mentoring</SelectItem>
                                <SelectItem value="project">Projekt</SelectItem>
                                <SelectItem value="certification">Zertifizierung</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="mt-5"
                            onClick={() => {
                              const newPlan = (formData.development_plan || []).filter((_, i) => i !== index)
                              setFormData((prev) => ({ ...prev, development_plan: newPlan }))
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <div>
                          <Label className="text-xs">Beschreibung</Label>
                          <Textarea
                            value={item.description}
                            onChange={(e) => {
                              const newPlan = [...(formData.development_plan || [])]
                              newPlan[index] = { ...newPlan[index], description: e.target.value }
                              setFormData((prev) => ({ ...prev, development_plan: newPlan }))
                            }}
                            placeholder="Details zur Maßnahme"
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Zeitrahmen</Label>
                            <Input
                              value={item.timeline || ""}
                              onChange={(e) => {
                                const newPlan = [...(formData.development_plan || [])]
                                newPlan[index] = { ...newPlan[index], timeline: e.target.value }
                                setFormData((prev) => ({ ...prev, development_plan: newPlan }))
                              }}
                              placeholder="z.B. Q2 2024"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Ressourcen</Label>
                            <Input
                              value={item.resources || ""}
                              onChange={(e) => {
                                const newPlan = [...(formData.development_plan || [])]
                                newPlan[index] = { ...newPlan[index], resources: e.target.value }
                                setFormData((prev) => ({ ...prev, development_plan: newPlan }))
                              }}
                              placeholder="Benötigte Ressourcen"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(formData.development_plan || []).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Noch keine Entwicklungsmaßnahmen definiert.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Feedback Tab */}
            <TabsContent value="feedback" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label>Stärken</Label>
                  <Textarea
                    value={formData.strengths || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, strengths: e.target.value }))}
                    placeholder="Was macht der Mitarbeiter besonders gut?"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Entwicklungsbereiche</Label>
                  <Textarea
                    value={formData.areas_for_improvement || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, areas_for_improvement: e.target.value }))}
                    placeholder="Wo gibt es Verbesserungspotenzial?"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Wichtige Erfolge</Label>
                  <Textarea
                    value={formData.key_achievements || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, key_achievements: e.target.value }))}
                    placeholder="Besondere Leistungen im Betrachtungszeitraum"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Herausforderungen</Label>
                  <Textarea
                    value={formData.challenges || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, challenges: e.target.value }))}
                    placeholder="Welche Schwierigkeiten gab es?"
                    rows={4}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Selbsteinschätzung des Mitarbeiters</Label>
                  <Textarea
                    value={formData.employee_self_assessment || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, employee_self_assessment: e.target.value }))}
                    placeholder="Wie schätzt sich der Mitarbeiter selbst ein?"
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Kommentare der Führungskraft</Label>
                  <Textarea
                    value={formData.manager_comments || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, manager_comments: e.target.value }))}
                    placeholder="Anmerkungen und Einschätzungen"
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-6">
              <div className="grid gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Zusammenfassung</Label>
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
                  <Textarea
                    value={formData.summary || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                    placeholder="Gesamtzusammenfassung des Gesprächs"
                    rows={5}
                  />
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Karrierewünsche</Label>
                    <Textarea
                      value={formData.career_aspirations || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, career_aspirations: e.target.value }))}
                      placeholder="Karriereziele des Mitarbeiters"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Beförderungsbereitschaft</Label>
                    <Select
                      value={formData.promotion_readiness || ""}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, promotion_readiness: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ready_now">Sofort bereit</SelectItem>
                        <SelectItem value="ready_1_year">In 1 Jahr bereit</SelectItem>
                        <SelectItem value="ready_2_years">In 2 Jahren bereit</SelectItem>
                        <SelectItem value="not_interested">Kein Interesse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Nächster Gesprächstermin</Label>
                  <Input
                    type="date"
                    value={formData.next_review_date || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, next_review_date: e.target.value }))}
                    className="w-[200px]"
                  />
                </div>

                <Separator />

                {/* Follow-up Actions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label>Folgeaktionen</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          follow_up_actions: [
                            ...(prev.follow_up_actions || []),
                            { action: "", responsible: "", status: "open" },
                          ],
                        }))
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Aktion hinzufügen
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(formData.follow_up_actions || []).map((action, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <Input
                          value={action.action}
                          onChange={(e) => {
                            const newActions = [...(formData.follow_up_actions || [])]
                            newActions[index] = { ...newActions[index], action: e.target.value }
                            setFormData((prev) => ({ ...prev, follow_up_actions: newActions }))
                          }}
                          placeholder="Aktion"
                          className="flex-1"
                        />
                        <Input
                          value={action.responsible}
                          onChange={(e) => {
                            const newActions = [...(formData.follow_up_actions || [])]
                            newActions[index] = { ...newActions[index], responsible: e.target.value }
                            setFormData((prev) => ({ ...prev, follow_up_actions: newActions }))
                          }}
                          placeholder="Verantwortlich"
                          className="w-40"
                        />
                        <Input
                          type="date"
                          value={action.deadline || ""}
                          onChange={(e) => {
                            const newActions = [...(formData.follow_up_actions || [])]
                            newActions[index] = { ...newActions[index], deadline: e.target.value }
                            setFormData((prev) => ({ ...prev, follow_up_actions: newActions }))
                          }}
                          className="w-40"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newActions = (formData.follow_up_actions || []).filter((_, i) => i !== index)
                            setFormData((prev) => ({ ...prev, follow_up_actions: newActions }))
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
