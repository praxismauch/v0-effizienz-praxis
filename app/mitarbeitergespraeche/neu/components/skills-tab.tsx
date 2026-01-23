"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Sparkles, Loader2 } from "lucide-react"
import type { Competency } from "../types"
import { SKILL_LEVEL_CONFIG } from "../types"

interface SkillsTabProps {
  competencies: Competency[]
  onUpdate: (competencies: Competency[]) => void
  onAIGenerate: () => void
  aiLoading: boolean
}

export function SkillsTab({ competencies, onUpdate, onAIGenerate, aiLoading }: SkillsTabProps) {
  const handleCurrentLevelChange = (index: number, value: number) => {
    const newComps = [...competencies]
    newComps[index] = { ...newComps[index], currentLevel: value }
    onUpdate(newComps)
  }

  const handleTargetLevelChange = (index: number, value: number) => {
    const newComps = [...competencies]
    newComps[index] = { ...newComps[index], targetLevel: value }
    onUpdate(newComps)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Kompetenzentwicklung</h3>
        <Button variant="outline" size="sm" onClick={onAIGenerate} disabled={aiLoading}>
          {aiLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          KI-Vorschläge
        </Button>
      </div>
      <div className="grid gap-4">
        {competencies.map((comp, index) => (
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
                    onValueChange={([value]) => handleCurrentLevelChange(index, value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Ziel-Level</Label>
                  <Slider
                    value={[comp.targetLevel]}
                    min={0}
                    max={3}
                    step={1}
                    onValueChange={([value]) => handleTargetLevelChange(index, value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {competencies.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Keine Kompetenzen definiert. Fügen Sie Skills im Mitarbeiterprofil hinzu.
          </div>
        )}
      </div>
    </div>
  )
}
