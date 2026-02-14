"use client"

import { useState } from "react"
import useSWR from "swr"
import { swrFetcher } from "@/lib/swr-fetcher"
import { SWR_KEYS } from "@/lib/swr-keys"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Award, AlertCircle, History, Filter, Users, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { SkillDefinition, SkillHistoryEntry, Team } from "./skills/types"
import { SkillCard } from "./skills/skill-card"
import { SkillsStatsOverview } from "./skills/skills-stats-overview"
import { EditSkillDialog } from "./skills/edit-skill-dialog"
import { HistoryDialog } from "./skills/history-dialog"

interface TeamMemberSkillsTabProps {
  memberId: string
  practiceId: string
  memberName: string
  memberTeamId?: string | null
  isAdmin: boolean
  currentUserId?: string
}

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

  const [editingSkill, setEditingSkill] = useState<SkillDefinition | null>(null)
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
    } catch {
      // silently fail
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleEditSkill = (skill: SkillDefinition) => {
    setEditingSkill(skill)
  }

  const handleShowHistory = (skillId?: string) => {
    setSelectedHistorySkill(skillId || null)
    setShowHistory(true)
    fetchHistory(skillId)
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
            Es wurden noch keine Skills definiert. Ein Administrator kann Skills unter dem
            {' '}Menupunkt &quot;Skills&quot; anlegen.
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
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Kompetenzen
                </CardTitle>
                <CardDescription>
                  {assessedSkills.length} von {filteredSkills.length} Skills bewertet
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
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
                <Button variant="outline" size="sm" onClick={() => handleShowHistory()}>
                  <History className="h-4 w-4 mr-2" />
                  {"Änderungsverlauf"}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Overview */}
        <SkillsStatsOverview
          assessedCount={assessedSkills.length}
          totalCount={filteredSkills.length}
          expertCount={expertSkills}
          averageLevel={averageLevel}
          targetsMet={targetsMet}
        />

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
                {categorySkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    teams={teams}
                    isAdmin={isAdmin}
                    onEdit={handleEditSkill}
                    onShowHistory={handleShowHistory}
                  />
                ))}
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
                {"Wählen Sie eine andere Kategorie oder fügen Sie Skills hinzu."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <EditSkillDialog
          skill={editingSkill}
          memberName={memberName}
          onSave={async (data) => {
            try {
              const res = await fetch(`/api/practices/${practiceId}/team-members/${memberId}/skills`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...data,
                  assessed_by: currentUserId,
                }),
              })
              if (res.ok) {
                await mutateSkills()
                toast({
                  title: "Skill aktualisiert",
                  description: `${editingSkill?.name} wurde erfolgreich aktualisiert.`,
                })
                return true
              }
              throw new Error("Failed to save")
            } catch {
              toast({
                title: "Fehler",
                description: "Skill konnte nicht gespeichert werden.",
                variant: "destructive",
              })
              return false
            }
          }}
          onClose={() => setEditingSkill(null)}
        />

        {/* History Dialog */}
        <HistoryDialog
          open={showHistory}
          onOpenChange={setShowHistory}
          history={history}
          loading={loadingHistory}
          title={
            selectedHistorySkill
              ? `Änderungsverlauf: ${skills.find((s) => s.id === selectedHistorySkill)?.name || "Skill"}`
              : `Änderungsverlauf: ${memberName}`
          }
        />
      </div>
    </TooltipProvider>
  )
}
