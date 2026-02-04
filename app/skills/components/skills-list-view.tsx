"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Award, ChevronDown, ChevronRight, Edit, Trash2 } from "lucide-react"
import type { Skill } from "../types"
import { categoryLabels, categoryColors } from "../types"

interface SkillsListViewProps {
  groupedSkills: Record<string, Skill[]>
  expandedCategories: Set<string>
  onToggleCategory: (category: string) => void
  onEditSkill: (skill: Skill) => void
  onDeleteSkill: (skill: Skill) => void
}

export function SkillsListView({
  groupedSkills,
  expandedCategories,
  onToggleCategory,
  onEditSkill,
  onDeleteSkill,
}: SkillsListViewProps) {
  return (
    <div className="space-y-4">
      {Object.entries(groupedSkills).map(([category, categorySkills]) => (
        <Collapsible
          key={category}
          open={expandedCategories.has(category)}
          onOpenChange={() => onToggleCategory(category)}
        >
          <Card>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-t-lg">
                <div className="flex items-center gap-3">
                  {expandedCategories.has(category) ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <h3 className="font-semibold">{categoryLabels[category] || category}</h3>
                  <Badge variant="secondary">{categorySkills.length}</Badge>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t">
                {categorySkills.map((skill) => (
                  <div
                    key={skill.id}
                    className="group flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{skill.name}</p>
                        {skill.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {skill.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={categoryColors[skill.category || "other"]}
                      >
                        {categoryLabels[skill.category || "other"]}
                      </Badge>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEditSkill(skill)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                          onClick={() => onDeleteSkill(skill)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  )
}
