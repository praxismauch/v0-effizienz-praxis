"use client"

import { useState } from "react"
import useSWR from "swr"
import { swrFetcher } from "@/lib/swr-fetcher"
import { SWR_KEYS } from "@/lib/swr-keys"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Loader2,
  Edit2,
  Award,
  Target,
  TrendingUp,
  Clock,
  User,
  Star,
  Sparkles,
  AlertCircle,
  History,
  Filter,
  Users,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SkillDefinition {
  id: string
  name: string
  category: string | null
  description: string | null
  team_id: string | null
  level_0_description: string
  level_1_description: string
  level_2_description: string
  level_3_description: string
  current_level: number | null
  target_level: number | null
  assessed_at: string | null
  assessed_by: string | null
  notes: string | null
  team_member_skill_id: string | null
}

interface SkillHistoryEntry {
  id: string
  skill_id: string
  level: number
  version: number
  assessed_by: string | null
  change_reason: string | null
  notes: string | null
  changed_at: string
  skill_definitions?: {
    name: string
    category: string | null
  }
}

interface Team {
  id: string
  name: string
  color: string | null
}

interface TeamMemberSkillsTabProps {
  memberId: string
  practiceId: string
  memberName: string
  memberTeamId?: string | null
  isAdmin: boolean
  currentUserId?: string
}

const LEVEL_CONFIG = [
  {
    level: 0,
    title: "Kein Skill",
    shortTitle: "Keine",
    color: "bg-gray-100 text-gray-600 border-gray-300",
    bgColor: "bg-gray-50",
    progressColor: "bg-gray-300",
    dotColor: "bg-gray-400",
    icon: "○",
  },
  {
    level: 1,
    title: "Basis",
    shortTitle: "Basis",
    color: "bg-amber-100 text-amber-700 border-amber-300",
    bgColor: "bg-amber-50",
    progressColor: "bg-amber-400",
    dotColor: "bg-amber-500",
    icon: "◐",
  },
  {
    level: 2,
    title: "Selbstständig",
    shortTitle: "Selbst.",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    bgColor: "bg-blue-50",
    progressColor: "bg-blue-500",
    dotColor: "bg-blue-600",
    icon: "◑",
  },
  {
    level: 3,
    title: "Experte",
    shortTitle: "Experte",
    color: "bg-emerald-100 text-emerald-700 border-emerald-300",
    bgColor: "bg-emerald-50",
    progressColor: "bg-emerald-500",
    dotColor: "bg-emerald-600",
    icon: "●",
  },
]

export function TeamMemberSkillsTab({
  memberId,
  practiceId,
  memberName,
  memberTeamId,
  isAdmin,
  currentUserId,
}: TeamMemberSkillsTabProps) {
  const {
    data: skills = [],
    error: skillsError,
    mutate: mutateSkills,
  } = useSWR<SkillDefinition[]>(
    practiceId && memberId ? `/api/practices/${practiceId}/team-members/${memberId}/skills` : null,
    swrFetcher,
  )

  const { data: teams = [] } = useSWR<Team[]>(practiceId ? SWR_KEYS.teams(practiceId) : null, swrFetcher)

  const [loading, setLoading] = useState(false)
  const [editingSkill, setEditingSkill] = useState<SkillDefinition | null>(null)
  const [editLevel, setEditLevel] = useState<number>(0)
  const [editTargetLevel, setEditTargetLevel] = useState<number | null>(null)
  const [editNotes, setEditNotes] = useState("")
  const [editReason, setEditReason] = useState("")
  const [saving, setSaving] = useState(false)
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("all")
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<SkillHistoryEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedHistorySkill, setSelectedHistorySkill] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchHistory = async (skillId?: string) => {
    if (!practiceId || !memberId) return

    try {
      setLoadingHistory(true)
      const url = skillId
        ? `/api/practices/${practiceId}/team-members/${memberId}/skills/history?skillId=${skillId}`
        : `/api/practices/${practiceId}/team-members/${memberId}/skills/history`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setHistory(data || [])
      }
    } catch (error) {
      console.error("Error fetching history:", error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleEditSkill = (skill: SkillDefinition) => {
    setEditingSkill(skill)
    setEditLevel(skill.current_level ?? 0)
    setEditTargetLevel(skill.target_level)
    setEditNotes(skill.notes || "")
    setEditReason("")
  }

  const handleShowHistory = (skillId?: string) => {
    setSelectedHistorySkill(skillId || null)
    setShowHistory(true)
    fetchHistory(skillId)
  }

  const handleSaveSkill = async () => {
    if (!editingSkill || !practiceId || !memberId) return

    try {
      setSaving(true)
      const res = await fetch(`/api/practices/${practiceId}/team-members/${memberId}/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill_id: editingSkill.id,
          current_level: editLevel,
          target_level: editTargetLevel,
          assessed_by: currentUserId,
          notes: editNotes,
          change_reason: editReason,
        }),
      })

      if (res.ok) {
        await mutateSkills()
        setEditingSkill(null)
        toast({
          title: "Skill aktualisiert",
          description: `${editingSkill.name} wurde erfolgreich aktualisiert.`,
        })
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      console.error("Error saving skill:", error)
      toast({
        title: "Fehler",
        description: "Skill konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Filter skills by team
  const filteredSkills = skills.filter((skill) => {
    if (selectedTeamFilter === "all") return true
    if (selectedTeamFilter === "practice") return skill.team_id === null
    return skill.team_id === selectedTeamFilter
  })

  // Group skills by category
  const skillsByCategory = filteredSkills.reduce(
    (acc, skill) => {
      const category = skill.category || "Allgemein"
      if (!acc[category]) acc[category] = []
      acc[category].push(skill)
      return acc
    },
    {} as Record<string, SkillDefinition[]>,
  )

  // Calculate stats
  const assessedSkills = filteredSkills.filter((s) => s.current_level !== null)
  const averageLevel =
    assessedSkills.length > 0
      ? assessedSkills.reduce((sum, s) => sum + (s.current_level || 0), 0) / assessedSkills.length
      : 0
  const expertSkills = filteredSkills.filter((s) => s.current_level === 3).length
  const targetsMet = filteredSkills.filter(
    (s) => s.target_level !== null && s.current_level !== null && s.current_level >= s.target_level,
  ).length

  // Get team name helper
  const getTeamName = (teamId: string | null) => {
    if (!teamId) return "Praxisweit"
    const team = teams.find((t) => t.id === teamId)
    return team?.name || "Unbekannt"
  }

  const getTeamColor = (teamId: string | null) => {
    if (!teamId) return "#6b7280"
    const team = teams.find((t) => t.id === teamId)
    return team?.color || "#6b7280"
  }

  if (skillsError) {
    return (
      <div className="flex items-center justify-center py-12">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-lg font-medium text-destructive">Fehler beim Laden der Skills</p>
      </div>
    )
  }

  if (!skills || skills.length === 0) {
  return (
  <Card>
  <CardContent className="flex flex-col items-center justify-center py-12">
  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
  <h3 className="text-lg font-medium mb-2">Keine Skills definiert</h3>
  <p className="text-muted-foreground text-center max-w-md mb-4">
  Es wurden noch keine Skills für diese Praxis definiert. Ein Administrator kann Skills unter dem Menüpunkt
  "Skills" anlegen.
  </p>
  {isAdmin && (
    <Button asChild>
      <a href="/skills">
        <Award className="h-4 w-4 mr-2" />
        Skills verwalten
      </a>
    </Button>
  )}
  </CardContent>
  </Card>
  )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header with filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alle Skills" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Skills</SelectItem>
                <SelectItem value="practice">Praxisweite Skills</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color || "#6b7280" }} />
                      {team.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={() => handleShowHistory()}>
            <History className="h-4 w-4 mr-2" />
            Änderungsverlauf
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Bewertete Skills</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {assessedSkills.length}/{filteredSkills.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-emerald-600 font-medium">Experten-Skills</p>
                  <p className="text-2xl font-bold text-emerald-900">{expertSkills}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Durchschnitt</p>
                  <p className="text-2xl font-bold text-purple-900">{averageLevel.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-amber-600 font-medium">Ziele erreicht</p>
                  <p className="text-2xl font-bold text-amber-900">{targetsMet}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Gesamtfortschritt</span>
              <span className="text-sm text-muted-foreground">{Math.round((averageLevel / 3) * 100)}%</span>
            </div>
            <Progress value={(averageLevel / 3) * 100} className="h-3" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              {LEVEL_CONFIG.map((config) => (
                <span key={config.level}>{config.shortTitle}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Skills by Category */}
        {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {category}
              </CardTitle>
              <CardDescription>
                {categorySkills.filter((s) => s.current_level !== null).length} von {categorySkills.length} Skills
                bewertet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categorySkills.map((skill) => {
                  const levelConfig = LEVEL_CONFIG[skill.current_level ?? 0]
                  const hasAssessment = skill.current_level !== null
                  const progress = hasAssessment ? ((skill.current_level || 0) / 3) * 100 : 0
                  const targetProgress = skill.target_level !== null ? (skill.target_level / 3) * 100 : null

                  return (
                    <div
                      key={skill.id}
                      className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                        hasAssessment ? levelConfig.bgColor : "bg-gray-50"
                      } ${hasAssessment ? "border-opacity-50" : "border-dashed border-gray-300"}`}
                    >
                      {/* Team badge */}
                      {skill.team_id && (
                        <div
                          className="absolute top-2 left-2 w-2 h-2 rounded-full"
                          style={{ backgroundColor: getTeamColor(skill.team_id) }}
                          title={getTeamName(skill.team_id)}
                        />
                      )}

                      {/* Action buttons */}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {hasAssessment && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleShowHistory(skill.id)}
                              >
                                <History className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Änderungsverlauf</TooltipContent>
                          </Tooltip>
                        )}
                        {isAdmin && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleEditSkill(skill)}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Bearbeiten</TooltipContent>
                          </Tooltip>
                        )}
                      </div>

                      {/* Skill name and level badge */}
                      <div className="pr-16 mb-3">
                        <h4 className="font-semibold text-base">{skill.name}</h4>
                        {skill.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{skill.description}</p>
                        )}
                      </div>

                      {/* Level indicator */}
                      <div className="space-y-2">
                        {hasAssessment ? (
                          <>
                            <div className="flex items-center justify-between">
                              <Badge className={`${levelConfig.color} border`}>
                                {levelConfig.icon} {levelConfig.title}
                              </Badge>
                              {skill.target_level !== null && skill.target_level > (skill.current_level || 0) && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="text-xs">
                                      <Target className="h-3 w-3 mr-1" />
                                      Ziel: {LEVEL_CONFIG[skill.target_level].title}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>Ziel-Level für diesen Skill</TooltipContent>
                                </Tooltip>
                              )}
                            </div>

                            {/* Progress bar */}
                            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                              {targetProgress !== null && (
                                <div
                                  className="absolute h-full bg-gray-300 opacity-50"
                                  style={{ width: `${targetProgress}%` }}
                                />
                              )}
                              <div
                                className={`absolute h-full ${levelConfig.progressColor} transition-all duration-500`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>

                            {/* Level dots */}
                            <div className="flex justify-between mt-1">
                              {LEVEL_CONFIG.map((config) => (
                                <Tooltip key={config.level}>
                                  <TooltipTrigger>
                                    <div
                                      className={`w-3 h-3 rounded-full border-2 transition-all ${
                                        (skill.current_level || 0) >= config.level
                                          ? `${config.dotColor} border-transparent`
                                          : "bg-white border-gray-300"
                                      }`}
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="max-w-xs">
                                    <p className="font-medium">{config.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {config.level === 0 && skill.level_0_description}
                                      {config.level === 1 && skill.level_1_description}
                                      {config.level === 2 && skill.level_2_description}
                                      {config.level === 3 && skill.level_3_description}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">Noch nicht bewertet</span>
                          </div>
                        )}
                      </div>

                      {/* Assessment info */}
                      {hasAssessment && skill.assessed_at && (
                        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Bewertet am {new Date(skill.assessed_at).toLocaleDateString("de-DE")}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredSkills.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Keine Skills in dieser Kategorie</h3>
              <p className="text-muted-foreground text-center">
                Wählen Sie eine andere Kategorie oder fügen Sie Skills hinzu.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingSkill} onOpenChange={() => setEditingSkill(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Skill bewerten: {editingSkill?.name}</DialogTitle>
              <DialogDescription>Bewerten Sie den Skill-Level für {memberName}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Current Level Selection */}
              <div className="space-y-3">
                <Label>Aktuelles Level</Label>
                <div className="grid grid-cols-2 gap-2">
                  {LEVEL_CONFIG.map((config) => (
                    <button
                      key={config.level}
                      type="button"
                      onClick={() => setEditLevel(config.level)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        editLevel === config.level
                          ? `${config.color} border-current ring-2 ring-offset-2`
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{config.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{config.title}</p>
                          <p className="text-xs text-muted-foreground">Level {config.level}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {editingSkill && (
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {editLevel === 0 && editingSkill.level_0_description}
                    {editLevel === 1 && editingSkill.level_1_description}
                    {editLevel === 2 && editingSkill.level_2_description}
                    {editLevel === 3 && editingSkill.level_3_description}
                  </p>
                )}
              </div>

              {/* Target Level */}
              <div className="space-y-2">
                <Label>Ziel-Level (optional)</Label>
                <Select
                  value={editTargetLevel?.toString() || "none"}
                  onValueChange={(v) => setEditTargetLevel(v === "none" ? null : Number.parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kein Ziel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Ziel</SelectItem>
                    {LEVEL_CONFIG.map((config) => (
                      <SelectItem key={config.level} value={config.level.toString()}>
                        {config.icon} {config.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Change Reason */}
              {editingSkill?.current_level !== null && editLevel !== editingSkill.current_level && (
                <div className="space-y-2">
                  <Label>Grund für Änderung</Label>
                  <Textarea
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder="z.B. Fortbildung abgeschlossen, Praxiserfahrung gesammelt..."
                    rows={2}
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notizen (optional)</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Zusätzliche Anmerkungen zur Bewertung..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSkill(null)}>
                Abbrechen
              </Button>
              <Button onClick={handleSaveSkill} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {selectedHistorySkill
                  ? `Historie für ${skills.find((s) => s.id === selectedHistorySkill)?.name || "Skill"}`
                  : `Alle Skill-Änderungen für ${memberName}`}
              </DialogTitle>
              <DialogDescription>Zeigt alle Änderungen an den Skill-Bewertungen</DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-[400px] pr-4">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Keine Änderungen vorhanden</div>
              ) : (
                <div className="space-y-4">
                  {history.map((entry, index) => {
                    const levelConfig = LEVEL_CONFIG[entry.level ?? 0]
                    const skillName = entry.skill_definitions?.name || "Unbekannter Skill"
                    const date = new Date(entry.changed_at)

                    return (
                      <div key={entry.id} className="relative pl-6 pb-4">
                        {/* Timeline line */}
                        {index < history.length - 1 && (
                          <div className="absolute left-[9px] top-6 bottom-0 w-0.5 bg-gray-200" />
                        )}

                        {/* Timeline dot */}
                        <div
                          className={`absolute left-0 top-1 w-[18px] h-[18px] rounded-full ${levelConfig.dotColor}`}
                        />

                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{skillName}</span>
                              {/* Version badge */}
                              <Badge variant="outline" className="text-xs">
                                v{entry.version || 1}
                              </Badge>
                              <Badge className={`${levelConfig.color} border text-xs`}>
                                {levelConfig.icon} {levelConfig.title}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {date.toLocaleDateString("de-DE", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          {entry.change_reason && (
                            <p className="text-sm text-muted-foreground mb-1">
                              <span className="font-medium">Grund:</span> {entry.change_reason}
                            </p>
                          )}

                          {entry.notes && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Notizen:</span> {entry.notes}
                            </p>
                          )}

                          {entry.assessed_by && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Bewertet von: {entry.assessed_by}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowHistory(false)}>
                Schließen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
