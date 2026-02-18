"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Check, Trash2, RotateCcw } from "lucide-react"
import { formatDateDE } from "@/lib/date-utils"
import type { LeitbildVersion } from "./types"

interface VersionHistoryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  versions: LeitbildVersion[]
  onActivate: (versionId: string) => void
  onRestore: (version: LeitbildVersion) => void
  onDelete: (version: LeitbildVersion) => void
  t: (key: string, fallback: string) => string
}

export function VersionHistoryDialog({
  isOpen,
  onOpenChange,
  versions,
  onActivate,
  onRestore,
  onDelete,
  t,
}: VersionHistoryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("leitbild.versionHistory", "Versionsverlauf")}</DialogTitle>
          <DialogDescription>
            {t("leitbild.versionHistoryDesc", "Alle gespeicherten Versionen Ihres Leitbilds")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {versions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t("leitbild.noVersions", "Keine Versionen vorhanden")}
            </p>
          ) : (
            versions.map((version) => (
              <Card key={version.id} className={version.is_active ? "border-green-500" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">Version {version.version}</CardTitle>
                      {version.is_active && (
                        <Badge variant="default" className="bg-green-500">
                          <Check className="mr-1 h-3 w-3" />
                          {t("leitbild.active", "Aktiv")}
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{formatDateDE(version.created_at)}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {version.leitbild_one_sentence && (
                    <p className="text-sm font-medium">&quot;{version.leitbild_one_sentence}&quot;</p>
                  )}
                  <div className="flex gap-2">
                    {!version.is_active && (
                      <Button variant="outline" size="sm" onClick={() => onActivate(version.id)}>
                        <Check className="mr-1 h-3 w-3" />
                        {t("leitbild.activate", "Aktivieren")}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => onRestore(version)}>
                      <RotateCcw className="mr-1 h-3 w-3" />
                      {t("leitbild.restore", "Wiederherstellen")}
                    </Button>
                    {!version.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 bg-transparent"
                        onClick={() => onDelete(version)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        {t("common.delete", "Loschen")}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close", "Schließen")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteVersionDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  t: (key: string, fallback: string) => string
}

export function DeleteVersionDialog({ isOpen, onOpenChange, onConfirm, t }: DeleteVersionDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("leitbild.deleteVersion", "Version löschen?")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              "leitbild.deleteVersionDesc",
              "Diese Aktion kann nicht rückgängig gemacht werden. Die Version wird permanent gelöscht.",
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel", "Abbrechen")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            {t("common.delete", "Loschen")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
