"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TeamMemberSelectItem } from "@/components/team-member-select-item"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { isActiveMember } from "@/lib/utils/team-member-filter"
import { Plus, Trash2, GripVertical, MoreHorizontal, User, ChevronDown, ChevronRight } from "lucide-react"
import type { TemplateStep, TeamMemberOption } from "./types"

interface StepCardProps {
  step: TemplateStep
  index: number
  totalSteps: number
  allSteps: TemplateStep[]
  teamMembers: TeamMemberOption[]
  errors: Record<string, string>
  isExpanded: boolean
  onUpdate: (updates: Partial<TemplateStep>) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onToggleExpand: () => void
  onAddSubitem: () => void
  onUpdateSubitem: (subIndex: number, updates: Partial<TemplateStep>) => void
  onRemoveSubitem: (subIndex: number) => void
}

export function StepCard({
  step,
  index,
  totalSteps,
  allSteps,
  teamMembers,
  errors,
  isExpanded,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onToggleExpand,
  onAddSubitem,
  onUpdateSubitem,
  onRemoveSubitem,
}: StepCardProps) {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
              {index + 1}
            </div>
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveUp}
                disabled={index === 0}
                className="h-6 w-6 p-0"
              >
                <GripVertical className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveDown}
                disabled={index === totalSteps - 1}
                className="h-6 w-6 p-0"
              >
                <GripVertical className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="space-y-2">
              <Label htmlFor={`step-${index}-title`}>Schritt-Titel *</Label>
              <Input
                id={`step-${index}-title`}
                value={step.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Schritt-Titel eingeben..."
                className={errors[`step-${index}-title`] ? "border-red-500" : ""}
              />
              {errors[`step-${index}-title`] && (
                <p className="text-sm text-red-600">{errors[`step-${index}-title`]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`step-${index}-description`}>Beschreibung</Label>
              <Textarea
                id={`step-${index}-description`}
                value={step.description || ""}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Schritt-Beschreibung (optional)..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`step-${index}-assignedTo`}>Zugewiesen an (Verantwortlich)</Label>
                <Select
                  value={step.assignedUserId || step.assignedTo || "default"}
                  onValueChange={(value) => {
                    const member = teamMembers.find((m) => m.userId === value || m.id === value)
                    onUpdate({
                      assignedUserId: value === "default" ? undefined : value,
                      assignedTo: member?.name || (value === "default" ? undefined : value),
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Teammitglied auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Nicht zugewiesen</SelectItem>
                    {teamMembers.filter(isActiveMember).map((member) => (
                      <TeamMemberSelectItem
                        key={member.id}
                        value={member.userId || member.id}
                        name={member.name}
                        avatarUrl={member.avatar}
                      />
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`step-${index}-duration`}>Geschätzte Dauer (Min.)</Label>
                <Input
                  id={`step-${index}-duration`}
                  type="number"
                  min="1"
                  value={step.estimatedDuration || ""}
                  onChange={(e) =>
                    onUpdate({
                      estimatedDuration: e.target.value ? Number.parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="15"
                />
              </div>
            </div>

            {/* Dependencies */}
            {index > 0 && (
              <div className="space-y-2">
                <Label>Abhängigkeiten</Label>
                <div className="space-y-2 max-h-24 overflow-y-auto">
                  {allSteps.slice(0, index).map((_, depIndex) => (
                    <div key={depIndex} className="flex items-center space-x-2">
                      <Checkbox
                        id={`step-${index}-dep-${depIndex}`}
                        checked={step.dependencies.includes(depIndex.toString())}
                        onCheckedChange={(checked) => {
                          const newDeps = checked
                            ? [...step.dependencies, depIndex.toString()]
                            : step.dependencies.filter((dep) => dep !== depIndex.toString())
                          onUpdate({ dependencies: newDeps })
                        }}
                      />
                      <Label htmlFor={`step-${index}-dep-${depIndex}`} className="text-sm">
                        Schritt {depIndex + 1}: {allSteps[depIndex].title || "Unbenannt"}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subitems */}
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center justify-between mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleExpand}
                  className="gap-1 p-0 h-auto"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    Unterschritte ({step.subitems?.length || 0})
                  </span>
                </Button>
                <Button variant="outline" size="sm" onClick={onAddSubitem}>
                  <Plus className="mr-1 h-3 w-3" />
                  Unterschritt
                </Button>
              </div>

              {isExpanded && step.subitems && step.subitems.length > 0 && (
                <div className="space-y-3 ml-4 pl-4 border-l-2 border-blue-200">
                  {step.subitems.map((subitem, subIndex) => (
                    <div key={subIndex} className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Unterschritt {subIndex + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveSubitem(subIndex)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        value={subitem.title}
                        onChange={(e) => onUpdateSubitem(subIndex, { title: e.target.value })}
                        placeholder="Unterschritt-Titel..."
                        className="text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={subitem.assignedUserId || subitem.assignedTo || "default"}
                          onValueChange={(value) => {
                            const member = teamMembers.find((m) => m.userId === value || m.id === value)
                            onUpdateSubitem(subIndex, {
                              assignedUserId: value === "default" ? undefined : value,
                              assignedTo: member?.name || (value === "default" ? undefined : value),
                            })
                          }}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Verantwortlich..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Nicht zugewiesen</SelectItem>
                    {teamMembers.filter(isActiveMember).map((member) => (
                      <TeamMemberSelectItem
                        key={member.id}
                        value={member.userId || member.id}
                        name={member.name}
                        avatarUrl={member.avatar}
                      />
                    ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min="1"
                          value={subitem.estimatedDuration || ""}
                          onChange={(e) =>
                            onUpdateSubitem(subIndex, {
                              estimatedDuration: e.target.value
                                ? Number.parseInt(e.target.value)
                                : undefined,
                            })
                          }
                          placeholder="Min."
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onRemove} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Schritt löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
