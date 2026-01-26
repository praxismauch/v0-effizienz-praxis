"use client"

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
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/contexts/translation-context"

interface TabDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTabId: string | null
  newTabName: string
  setNewTabName: (value: string) => void
  onSave: () => void
  onClose: () => void
}

export function TabDialog({
  open,
  onOpenChange,
  editingTabId,
  newTabName,
  setNewTabName,
  onSave,
  onClose,
}: TabDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingTabId
              ? t("analytics.customizer.editTab", "Tab bearbeiten")
              : t("analytics.customizer.addTab", "Neuen Tab hinzufügen")}
          </DialogTitle>
          <DialogDescription>
            {t("analytics.customizer.tabDescription", "Erstellen Sie einen neuen Tab für Ihre Analytics")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("analytics.customizer.tabName", "Tab-Name")}</Label>
            <Input
              value={newTabName}
              onChange={(e) => setNewTabName(e.target.value)}
              placeholder={t("analytics.customizer.tabNamePlaceholder", "z.B. Umsatz")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel", "Abbrechen")}
          </Button>
          <Button onClick={onSave} disabled={!newTabName.trim()}>
            {editingTabId
              ? t("common.save", "Speichern")
              : t("analytics.customizer.addTab", "Hinzufügen")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
