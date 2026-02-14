"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Edit, Trash2 } from "lucide-react"
import type { Skill } from "../types"
import { categoryLabels, categoryColors } from "../types"

interface SkillsGridViewProps {
  skills: Skill[]
  onViewSkill: (skill: Skill) => void
  onEditSkill: (skill: Skill) => void
  onDeleteSkill: (skill: Skill) => void
}

export function SkillsGridView({
  skills,
  onViewSkill,
  onEditSkill,
  onDeleteSkill,
}: SkillsGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {skills.map((skill) => (
        <Card key={skill.id} className="group hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewSkill(skill)}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base line-clamp-1">{skill.name}</CardTitle>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => { e.stopPropagation(); onEditSkill(skill) }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                  onClick={(e) => { e.stopPropagation(); onDeleteSkill(skill) }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {skill.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {skill.description}
              </p>
            )}
            <Badge
              variant="outline"
              className={categoryColors[skill.category || "other"]}
            >
              {categoryLabels[skill.category || "other"]}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
