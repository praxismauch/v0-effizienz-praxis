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
import { useTranslation } from "@/contexts/translation-context"
import type { FolderFormData } from "./types"

interface FolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: FolderFormData
  onFormDataChange: (data: FolderFormData) => void
  isEditing: boolean
  onSave: () => void
}

export function FolderDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  isEditing,
  onSave,
}: FolderDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("documents.editFolder", "Ordner bearbeiten") : t("documents.newFolder", "Neuer Ordner")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("documents.editFolderDescription", "Bearbeiten Sie die Ordnerdetails")
              : t("documents.newFolderDescription", "Erstellen Sie einen neuen Ordner")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="folder-name">{t("documents.folderName", "Ordnername")}</Label>
            <Input
              id="folder-name"
              placeholder={t("documents.folderNamePlaceholder", "Ordnername eingeben")}
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="folder-description">{t("documents.description", "Beschreibung")}</Label>
            <Textarea
              id="folder-description"
              placeholder={t("documents.folderDescriptionPlaceholder", "Ordnerbeschreibung eingeben")}
              value={formData.description}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="folder-color">{t("documents.color", "Farbe")}</Label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="color"
                id="folder-color"
                value={formData.color}
                onChange={(e) => onFormDataChange({ ...formData, color: e.target.value })}
                className="h-10 w-20 cursor-pointer rounded border"
              />
              <div className="flex gap-2">
                {["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6b7280"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      formData.color === color ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => onFormDataChange({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Abbrechen")}
          </Button>
          <Button onClick={onSave} disabled={!formData.name.trim()}>
            {isEditing ? t("common.save", "Speichern") : t("common.create", "Erstellen")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
