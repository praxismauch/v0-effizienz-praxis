import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Edit2, Target, Clock, User, History } from "lucide-react"
import type { SkillDefinition, Team } from "./types"
import { LEVEL_CONFIG } from "./types"

interface SkillCardProps {
  skill: SkillDefinition
  teams: Team[]
  isAdmin: boolean
  onEdit: (skill: SkillDefinition) => void
  onShowHistory: (skillId: string) => void
}

export function SkillCard({ skill, teams, isAdmin, onEdit, onShowHistory }: SkillCardProps) {
  const levelConfig = LEVEL_CONFIG[skill.current_level ?? 0]
  const hasAssessment = skill.current_level !== null
  const progress = hasAssessment ? ((skill.current_level || 0) / 3) * 100 : 0
  const targetProgress = skill.target_level !== null ? (skill.target_level / 3) * 100 : null

  const getTeamColor = (teamId: string | null) => {
    if (!teamId) return "#6b7280"
    const team = teams.find((t) => t.id === teamId)
    return team?.color || "#6b7280"
  }

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return "Praxisweit"
    const team = teams.find((t) => t.id === teamId)
    return team?.name || "Unbekannt"
  }

  return (
    <div
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
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onShowHistory(skill.id)}>
                <History className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Änderungsverlauf</TooltipContent>
          </Tooltip>
        )}
        {isAdmin && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(skill)}>
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
                <div className="absolute h-full bg-gray-300 opacity-50" style={{ width: `${targetProgress}%` }} />
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
}
