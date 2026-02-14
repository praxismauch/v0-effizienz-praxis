import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Award, Star, TrendingUp, Target } from "lucide-react"
import { LEVEL_CONFIG } from "./types"

interface SkillsStatsOverviewProps {
  assessedCount: number
  totalCount: number
  expertCount: number
  averageLevel: number
  targetsMet: number
}

export function SkillsStatsOverview({
  assessedCount,
  totalCount,
  expertCount,
  averageLevel,
  targetsMet,
}: SkillsStatsOverviewProps) {
  return (
    <>
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
                  {assessedCount}/{totalCount}
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
                <p className="text-2xl font-bold text-emerald-900">{expertCount}</p>
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
    </>
  )
}
