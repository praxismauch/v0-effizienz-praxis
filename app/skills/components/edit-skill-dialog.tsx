"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import { categoryLabels, type Skill, type Arbeitsplatz } from "../types"

interface EditSkillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skill: Skill | null
  onSubmit: (id: string, data: SkillUpdateData) => Promise<void>
  arbeitsplaetze: Arbeitsplatz[]
  skillArbeitsplatzIds: string[]
  isSaving: boolean
}

export interface SkillUpdateData {
  name: string
  description: string
  category: string
  level_0_description: string
  level_1_description: string
  level_2_description: string
  level_3_description: string
  arbeitsplatzIds: string[]
}

export function EditSkillDialog({
  open,
  onOpenChange,
  skill,
  onSubmit,
  arbeitsplaetze,
  skillArbeitsplatzIds,
  isSaving,
}: EditSkillDialogProps) {
  const [formData, setFormData] = useState<SkillUpdateData>({
    name: "",
    description: "",
    category: "other",
    level_0_description: "",
    level_1_description: "",
    level_2_description: "",
    level_3_description: "",
    arbeitsplatzIds: [],
  })

  useEffect(() => {
    if (skill) {
      setFormData({
        name: skill.name || "",
        description: skill.description || "",
        category: skill.category || "other",
        level_0_description: skill.level_0_description || "",
        level_1_description: skill.level_1_description || "",
        level_2_description: skill.level_2_description || "",
        level_3_description: skill.level_3_description || "",
        arbeitsplatzIds: skillArbeitsplatzIds,
      })
    }
  }, [skill, skillArbeitsplatzIds])

  const handleSubmit = async () => {
    if (skill) {
      await onSubmit(skill.id, formData)
    }
  }

  const toggleArbeitsplatz = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      arbeitsplatzIds: prev.arbeitsplatzIds.includes(id)
        ? prev.arbeitsplatzIds.filter((apId) => apId !== id)
        : [...prev.arbeitsplatzIds, id],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kompetenz bearbeiten</DialogTitle>
          <DialogDescription>
            Bearbeiten Sie die Kompetenz und ihre Level-Definitionen.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto gap-1">
            <TabsTrigger value="basic">Grunddaten</TabsTrigger>
            <TabsTrigger value="levels">Level-Definitionen</TabsTrigger>
            <TabsTrigger value="arbeitsplaetze">Arbeitsplätze</TabsTrigger>
          </TabsList>
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="z.B. Blutabnahme"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Beschreibung</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Beschreiben Sie die Kompetenz..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Kategorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          <TabsContent value="levels" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Level 0 - Keine Erfahrung</Label>
              <Textarea
                value={formData.level_0_description}
                onChange={(e) => setFormData((prev) => ({ ...prev, level_0_description: e.target.value }))}
                placeholder="Beschreibung für Level 0..."
              />
            </div>
            <div className="space-y-2">
              <Label>Level 1 - Grundkenntnisse</Label>
              <Textarea
                value={formData.level_1_description}
                onChange={(e) => setFormData((prev) => ({ ...prev, level_1_description: e.target.value }))}
                placeholder="Beschreibung für Level 1..."
              />
            </div>
            <div className="space-y-2">
              <Label>Level 2 - Fortgeschritten</Label>
              <Textarea
                value={formData.level_2_description}
                onChange={(e) => setFormData((prev) => ({ ...prev, level_2_description: e.target.value }))}
                placeholder="Beschreibung für Level 2..."
              />
            </div>
            <div className="space-y-2">
              <Label>Level 3 - Experte</Label>
              <Textarea
                value={formData.level_3_description}
                onChange={(e) => setFormData((prev) => ({ ...prev, level_3_description: e.target.value }))}
                placeholder="Beschreibung für Level 3..."
              />
            </div>
          </TabsContent>
          <TabsContent value="arbeitsplaetze" className="mt-4">
            <div className="space-y-2">
              <Label>Arbeitsplätze zuweisen</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Wählen Sie die Arbeitsplätze, an denen diese Kompetenz benötigt wird.
              </p>
              <ScrollArea className="h-[200px] border rounded-md p-4">
                <div className="space-y-3">
                  {arbeitsplaetze.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Keine Arbeitsplätze vorhanden
                    </p>
                  ) : (
                    arbeitsplaetze.map((ap) => (
                      <div key={ap.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-ap-${ap.id}`}
                          checked={formData.arbeitsplatzIds.includes(ap.id)}
                          onCheckedChange={() => toggleArbeitsplatz(ap.id)}
                        />
                        <label
                          htmlFor={`edit-ap-${ap.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {ap.name}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
