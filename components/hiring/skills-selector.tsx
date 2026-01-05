"use client"

import { useState, useEffect } from "react"
import { usePractice } from "@/contexts/practice-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Skill {
  id: string
  name: string
  category: string | null
  description: string | null
}

interface SkillsSelectorProps {
  selectedSkillIds: string[]
  onSelectionChange: (skillIds: string[]) => void
  placeholder?: string
  className?: string
}

export function SkillsSelector({
  selectedSkillIds,
  onSelectionChange,
  placeholder = "Skills auswählen...",
  className,
}: SkillsSelectorProps) {
  const { currentPractice } = usePractice()
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (currentPractice?.id) {
      fetchSkills()
    }
  }, [currentPractice?.id])

  const fetchSkills = async () => {
    if (!currentPractice?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/skills`)
      if (response.ok) {
        const data = await response.json()
        setSkills(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching skills:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSkill = (skillId: string) => {
    if (selectedSkillIds.includes(skillId)) {
      onSelectionChange(selectedSkillIds.filter((id) => id !== skillId))
    } else {
      onSelectionChange([...selectedSkillIds, skillId])
    }
  }

  const handleRemoveSkill = (skillId: string) => {
    onSelectionChange(selectedSkillIds.filter((id) => id !== skillId))
  }

  const selectedSkills = skills.filter((skill) => selectedSkillIds.includes(skill.id))

  // Group skills by category
  const groupedSkills = skills.reduce(
    (acc, skill) => {
      const category = skill.category || "Allgemein"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(skill)
      return acc
    },
    {} as Record<string, Skill[]>,
  )

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 h-10 px-3 py-2 border rounded-md bg-muted/50", className)}>
        <span className="text-muted-foreground text-sm">Skills werden geladen...</span>
      </div>
    )
  }

  if (skills.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 p-3 border rounded-md bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
          className,
        )}
      >
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <span className="text-sm text-amber-700 dark:text-amber-300">
          Keine Skills definiert. Erstellen Sie Skills unter Team → Skills.
        </span>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10 py-2 bg-transparent"
          >
            <span className="text-muted-foreground">
              {selectedSkillIds.length > 0 ? `${selectedSkillIds.length} Skill(s) ausgewählt` : placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <ScrollArea className="h-[300px]">
            <div className="p-2">
              {Object.entries(groupedSkills).map(([category, categorySkills], index) => (
                <div key={category}>
                  {index > 0 && <Separator className="my-2" />}
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">{category}</div>
                  {categorySkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-start gap-2 px-2 py-2 hover:bg-muted/50 rounded-md cursor-pointer"
                      onClick={() => handleToggleSkill(skill.id)}
                    >
                      <Checkbox
                        checked={selectedSkillIds.includes(skill.id)}
                        onCheckedChange={() => handleToggleSkill(skill.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <Label className="font-medium cursor-pointer">{skill.name}</Label>
                        {skill.description && (
                          <p className="text-xs text-muted-foreground truncate">{skill.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedSkills.map((skill) => (
            <Badge key={skill.id} variant="secondary" className="gap-1 pr-1">
              {skill.name}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemoveSkill(skill.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
