"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/contexts/translation-context"
import type { Document, DocumentFolder } from "./types"

interface DocumentMoveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: Document | null
  folders: DocumentFolder[]
  selectedFolderId: string | null
  onFolderSelect: (folderId: string | null) => void
  onMove: () => void
}

export function DocumentMoveDialog({
  open,
  onOpenChange,
  document,
  folders,
  selectedFolderId,
  onFolderSelect,
  onMove,
}: DocumentMoveDialogProps) {
  const { t } = useTranslation()

  if (!document) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("documents.moveDocument", "Dokument verschieben")}</DialogTitle>
          <DialogDescription>
            {t("documents.moveDescription", "Wählen Sie einen Zielordner für das Dokument")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">{t("documents.document", "Dokument")}</Label>
            <p className="font-medium">{document.name}</p>
          </div>
          <div>
            <Label htmlFor="move-folder">{t("documents.targetFolder", "Zielordner")}</Label>
            <Select
              value={selectedFolderId || "root"}
              onValueChange={(value) => onFolderSelect(value === "root" ? null : value)}
            >
              <SelectTrigger id="move-folder">
                <SelectValue placeholder={t("documents.selectFolder", "Ordner auswählen")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">{t("documents.mainFolder", "Hauptordner")}</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Abbrechen")}
          </Button>
          <Button onClick={onMove}>{t("documents.move", "Verschieben")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
