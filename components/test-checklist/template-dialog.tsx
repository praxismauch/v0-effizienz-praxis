"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TestingCategory } from "./types"

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: { title: string; description: string; category_id: string }
  onFormDataChange: (data: { title: string; description: string; category_id: string }) => void
  categories: TestingCategory[]
  isEditing: boolean
  onSubmit: () => void
  onCancel: () => void
}

export function TemplateDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  categories,
  isEditing,
  onSubmit,
  onCancel,
}: TemplateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Vorlage bearbeiten" : "Neue Vorlage"}</DialogTitle>
          <DialogDescription>
            Erstellen Sie eine Test-Item-Vorlage, die in Checklisten verwendet wird
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-title">Titel</Label>
            <Input
              id="template-title"
              value={formData.title}
              onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
              placeholder="z.B. Login-Funktionalität testen"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Beschreibung</Label>
            <Textarea
              id="template-description"
              value={formData.description}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              placeholder="Detaillierte Testanweisungen..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-category">Kategorie</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => onFormDataChange({ ...formData, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button onClick={onSubmit}>{isEditing ? "Aktualisieren" : "Erstellen"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
