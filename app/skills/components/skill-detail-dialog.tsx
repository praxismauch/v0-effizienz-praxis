"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Award, Edit, Calendar, Tag } from "lucide-react"
import type { Skill } from "../types"
import { categoryLabels, categoryColors } from "../types"

interface SkillDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skill: Skill | null
  onEdit?: (skill: Skill) => void
}

const levelLabels = [
  { level: 0, label: "Keine Erfahrung", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  { level: 1, label: "Grundkenntnisse", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { level: 2, label: "Fortgeschritten", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  { level: 3, label: "Experte", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
]

export function SkillDetailDialog({
  open,
  onOpenChange,
  skill,
  onEdit,
}: SkillDetailDialogProps) {
  if (!skill) return null

  const levelDescriptions = [
    skill.level_0_description,
    skill.level_1_description,
    skill.level_2_description,
    skill.level_3_description,
  ]

  const hasLevelDescriptions = levelDescriptions.some((d) => d)
  const createdDate = skill.created_at
    ? new Date(skill.created_at).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{skill.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={categoryColors[skill.category || "other"]}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {categoryLabels[skill.category || "other"]}
                  </Badge>
                  {createdDate && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {createdDate}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  onOpenChange(false)
                  onEdit(skill)
                }}
              >
                <Edit className="h-4 w-4 mr-1" />
                Bearbeiten
              </Button>
            )}
          </div>
        </DialogHeader>

        {skill.description && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Beschreibung</h4>
              <p className="text-sm leading-relaxed">{skill.description}</p>
            </div>
          </>
        )}

        {hasLevelDescriptions && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Level-Definitionen</h4>
              <div className="space-y-3">
                {levelLabels.map(({ level, label, color }) => {
                  const description = levelDescriptions[level]
                  if (!description) return null
                  return (
                    <div key={level} className="flex gap-3">
                      <Badge
                        variant="secondary"
                        className={`shrink-0 h-6 ${color}`}
                      >
                        {level}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {!skill.description && !hasLevelDescriptions && (
          <>
            <Separator />
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine weiteren Details vorhanden. Klicken Sie auf &quot;Bearbeiten&quot;, um Informationen hinzuzufugen.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
