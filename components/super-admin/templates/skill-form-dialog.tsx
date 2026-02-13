"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, X, Loader2 } from "lucide-react"
import { SKILL_COLORS, SKILL_CATEGORIES, type SkillFormData } from "./types"

interface SkillFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: SkillFormData
  onFormChange: (data: SkillFormData) => void
  onSubmit: () => void
  onCancel: () => void
  isSaving: boolean
  isEditing: boolean
}

export function SkillFormDialog({
  open,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  onCancel,
  isSaving,
  isEditing,
}: SkillFormDialogProps) {
  const addCriteria = (level: 0 | 1 | 2 | 3) => {
    const key = `level_${level}_criteria` as keyof SkillFormData
    onFormChange({
      ...formData,
      [key]: [...(formData[key] as string[]), ""],
    })
  }

  const updateCriteria = (level: 0 | 1 | 2 | 3, index: number, value: string) => {
    const key = `level_${level}_criteria` as keyof SkillFormData
    onFormChange({
      ...formData,
      [key]: (formData[key] as string[]).map((c, i) => (i === index ? value : c)),
    })
  }

  const removeCriteria = (level: 0 | 1 | 2 | 3, index: number) => {
    const key = `level_${level}_criteria` as keyof SkillFormData
    onFormChange({
      ...formData,
      [key]: (formData[key] as string[]).filter((_, i) => i !== index),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Skill bearbeiten" : "Neuen Skill hinzufügen"}</DialogTitle>
          <DialogDescription>Definieren Sie einen Skill mit 4 Kompetenz-Stufen</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 p-1">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="skill-name">Name *</Label>
                <Input
                  id="skill-name"
                  value={formData.name}
                  onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
                  placeholder="z.B. Patientenaufnahme"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skill-category">Kategorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => onFormChange({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategorie auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILL_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill-description">Beschreibung</Label>
              <Textarea
                id="skill-description"
                value={formData.description}
                onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
                placeholder="Optionale Beschreibung des Skills"
              />
            </div>

            <div className="space-y-2">
              <Label>Farbe</Label>
              <div className="flex flex-wrap gap-2">
                {SKILL_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      formData.color === color.value
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => onFormChange({ ...formData, color: color.value })}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            {/* Level Definitions */}
            <Tabs defaultValue="level-0" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="level-0">Level 0</TabsTrigger>
                <TabsTrigger value="level-1">Level 1</TabsTrigger>
                <TabsTrigger value="level-2">Level 2</TabsTrigger>
                <TabsTrigger value="level-3">Level 3</TabsTrigger>
              </TabsList>

              {[0, 1, 2, 3].map((level) => (
                <TabsContent key={level} value={`level-${level}`} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Titel</Label>
                      <Input
                        value={formData[`level_${level}_title` as keyof SkillFormData] as string}
                        onChange={(e) =>
                          onFormChange({
                            ...formData,
                            [`level_${level}_title`]: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Beschreibung</Label>
                    <Textarea
                      value={formData[`level_${level}_description` as keyof SkillFormData] as string}
                      onChange={(e) =>
                        onFormChange({
                          ...formData,
                          [`level_${level}_description`]: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Kriterien</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addCriteria(level as 0 | 1 | 2 | 3)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Kriterium
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(formData[`level_${level}_criteria` as keyof SkillFormData] as string[]).map(
                        (criteria, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={criteria}
                              onChange={(e) => updateCriteria(level as 0 | 1 | 2 | 3, index, e.target.value)}
                              placeholder={`Kriterium ${index + 1}`}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="shrink-0"
                              onClick={() => removeCriteria(level as 0 | 1 | 2 | 3, index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button onClick={onSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Speichern" : "Hinzufügen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
