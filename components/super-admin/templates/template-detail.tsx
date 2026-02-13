"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Plus, Edit, Trash2, Sparkles, ChevronDown, ChevronRight, Loader2, FileText, Globe, Shield } from "lucide-react"
import type { PracticeTemplate, TemplateSkill } from "./types"

interface TemplateDetailProps {
  template: PracticeTemplate | null
  expandedSkills: Set<string>
  isGenerating: boolean
  onToggleSkillExpanded: (skillId: string) => void
  onEditSkill: (skill: TemplateSkill) => void
  onDeleteSkill: (skillId: string) => void
  onGenerateSkills: () => void
  onAddSkill: () => void
}

export function TemplateDetail({
  template,
  expandedSkills,
  isGenerating,
  onToggleSkillExpanded,
  onEditSkill,
  onDeleteSkill,
  onGenerateSkills,
  onAddSkill,
}: TemplateDetailProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {template?.name || "Vorlage auswählen"}
              {template?.is_system_template && (
                <Badge className="ml-2 border-2 border-amber-400 bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 text-amber-800 font-bold text-sm px-3 py-1 flex items-center gap-1.5 shadow-md animate-pulse">
                  <Shield className="h-4 w-4" />
                  GLOBALE SYSTEM-VORLAGE
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {template
                ? `${template.template_skills?.length || 0} Skills definiert`
                : "Wählen Sie eine Vorlage aus der Liste"}
            </CardDescription>
          </div>
          {template && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onGenerateSkills} disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Skills generieren
              </Button>
              <Button onClick={onAddSkill}>
                <Plus className="mr-2 h-4 w-4" />
                Skill hinzufügen
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {template ? (
          <ScrollArea className="h-[500px]">
            {template.is_system_template && (
              <div className="mb-4 rounded-lg border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-200">
                    <Globe className="h-6 w-6 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-900">Globale System-Vorlage</h4>
                    <p className="text-sm text-amber-700">
                      Diese Vorlage ist für alle Benutzer im System sichtbar und kann als Grundlage für neue Praxen
                      verwendet werden.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {template.template_skills?.map((skill) => (
                <Collapsible
                  key={skill.id}
                  open={expandedSkills.has(skill.id)}
                  onOpenChange={() => onToggleSkillExpanded(skill.id)}
                >
                  <div className="rounded-lg border">
                    <CollapsibleTrigger asChild>
                      <div className="flex cursor-pointer items-center justify-between p-4 hover:bg-accent">
                        <div className="flex items-center gap-3">
                          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: skill.color }} />
                          <div>
                            <h4 className="font-medium">{skill.name}</h4>
                            <p className="text-sm text-muted-foreground">{skill.category || "Keine Kategorie"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEditSkill(skill)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteSkill(skill.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {expandedSkills.has(skill.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t p-4">
                        {skill.description && (
                          <p className="mb-4 text-sm text-muted-foreground">{skill.description}</p>
                        )}
                        <div className="grid gap-4 md:grid-cols-2">
                          {[0, 1, 2, 3].map((level) => {
                            const title = skill[`level_${level}_title` as keyof TemplateSkill] as string
                            const description = skill[`level_${level}_description` as keyof TemplateSkill] as string
                            const criteria = skill[`level_${level}_criteria` as keyof TemplateSkill] as string[]

                            return (
                              <div key={level} className="rounded-lg bg-muted/50 p-3">
                                <div className="mb-2 flex items-center gap-2">
                                  <Badge variant="outline">Level {level}</Badge>
                                  <span className="font-medium">{title}</span>
                                </div>
                                <p className="mb-2 text-sm text-muted-foreground">{description}</p>
                                {criteria?.length > 0 && (
                                  <ul className="list-inside list-disc text-sm">
                                    {criteria.map((c, i) => (
                                      <li key={i}>{c}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}

              {(!template.template_skills || template.template_skills.length === 0) && (
                <div className="py-8 text-center text-muted-foreground">
                  <Sparkles className="mx-auto mb-2 h-8 w-8" />
                  <p>Keine Skills definiert</p>
                  <p className="text-sm">Generieren Sie Skills mit KI oder fügen Sie manuell hinzu</p>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-[500px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileText className="mx-auto mb-2 h-12 w-12" />
              <p>Wählen Sie eine Vorlage aus der Liste</p>
              <p className="text-sm">um Details und Skills anzuzeigen</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
