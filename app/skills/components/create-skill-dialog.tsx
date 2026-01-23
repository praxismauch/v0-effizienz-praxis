"use client"

import { useState } from "react"
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
import { categoryLabels, type Arbeitsplatz } from "../types"

interface CreateSkillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: SkillFormData) => Promise<void>
  arbeitsplaetze: Arbeitsplatz[]
  isSaving: boolean
}

export interface SkillFormData {
  name: string
  description: string
  category: string
  level_0_description: string
  level_1_description: string
  level_2_description: string
  level_3_description: string
  arbeitsplatzIds: string[]
}

const initialFormData: SkillFormData = {
  name: "",
  description: "",
  category: "other",
  level_0_description: "",
  level_1_description: "",
  level_2_description: "",
  level_3_description: "",
  arbeitsplatzIds: [],
}

export function CreateSkillDialog({
  open,
  onOpenChange,
  onSubmit,
  arbeitsplaetze,
  isSaving,
}: CreateSkillDialogProps) {
  const [formData, setFormData] = useState<SkillFormData>(initialFormData)

  const handleSubmit = async () => {
    await onSubmit(formData)
    setFormData(initialFormData)
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setFormData(initialFormData)
    }
    onOpenChange(isOpen)
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neue Skill-Anforderung</DialogTitle>
          <DialogDescription>
            Definieren Sie eine neue Kompetenz mit klaren, messbaren Level-Kriterien.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Grunddaten</TabsTrigger>
            <TabsTrigger value="levels">Level-Definitionen</TabsTrigger>
            <TabsTrigger value="arbeitsplaetze">Arbeitsplätze</TabsTrigger>
          </TabsList>
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="z.B. Blutabnahme"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Beschreiben Sie die Kompetenz..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategorie</Label>
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
                          id={`ap-${ap.id}`}
                          checked={formData.arbeitsplatzIds.includes(ap.id)}
                          onCheckedChange={() => toggleArbeitsplatz(ap.id)}
                        />
                        <label
                          htmlFor={`ap-${ap.id}`}
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
          <Button variant="outline" onClick={() => handleClose(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
