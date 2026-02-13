"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Edit, Trash2, Globe, FileText } from "lucide-react"
import type { PracticeTemplate, PracticeType } from "./types"

interface TemplateListProps {
  templates: PracticeTemplate[]
  practiceTypes: PracticeType[]
  selectedTemplate: PracticeTemplate | null
  onSelect: (template: PracticeTemplate) => void
  onEdit: (template: PracticeTemplate) => void
  onDelete: (templateId: string) => void
  onToggleSystem: (template: PracticeTemplate) => void
}

export function TemplateList({
  templates,
  practiceTypes,
  selectedTemplate,
  onSelect,
  onEdit,
  onDelete,
  onToggleSystem,
}: TemplateListProps) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Vorlagen</CardTitle>
        <CardDescription>{templates.length} Vorlage(n) verfügbar</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`group relative cursor-pointer rounded-lg border p-3 transition-colors hover:bg-accent ${
                  selectedTemplate?.id === template.id ? "border-primary bg-accent" : ""
                }`}
                onClick={() => onSelect(template)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium truncate">{template.name}</h4>
                      {template.is_system_template && (
                        <Badge
                          variant="outline"
                          className="border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 font-bold text-xs px-2 py-0.5 flex items-center gap-1 shadow-sm"
                        >
                          <Globe className="h-3 w-3" />
                          SYSTEM
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {template.description || "Keine Beschreibung"}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {template.template_skills?.length || 0} Skills
                      </Badge>
                      {template.specialty_ids?.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {practiceTypes.find((t) => template.specialty_ids.includes(t.id))?.name || "Unbekannt"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${template.is_system_template ? "text-amber-600 hover:text-amber-700" : "text-muted-foreground hover:text-amber-600"}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleSystem(template)
                      }}
                      title={template.is_system_template ? "System-Vorlage deaktivieren" : "Als System-Vorlage markieren"}
                    >
                      <Globe className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(template)
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
                        onDelete(template.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {templates.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="mx-auto mb-2 h-8 w-8" />
                <p>Keine Vorlagen vorhanden</p>
                <p className="text-sm">Erstellen Sie Ihre erste Vorlage</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
