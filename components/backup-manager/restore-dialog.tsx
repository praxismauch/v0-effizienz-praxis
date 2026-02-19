"use client"

import { useState, useEffect } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Loader2, Building2, Database, Table2 } from "lucide-react"
import type { Backup } from "./types"

interface BackupContents {
  backupId: string
  createdAt: string
  backupScope: string
  tables: Array<{ name: string; rowCount: number }>
  practices: Array<{ id: string; name: string; rowCount: number }>
  metadata: any
}

interface RestoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedBackup: Backup | null
  isRestoring: boolean
  onRestore: (
    backupId: string | null,
    file: File | null,
    mode: "full" | "practices" | "tables",
    practiceIds: string[],
    tables: string[]
  ) => Promise<boolean>
  onClose: () => void
}

export function RestoreDialog({
  open,
  onOpenChange,
  selectedBackup,
  isRestoring,
  onRestore,
  onClose,
}: RestoreDialogProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [restoreMode, setRestoreMode] = useState<"full" | "practices" | "tables">("full")
  const [backupContents, setBackupContents] = useState<BackupContents | null>(null)
  const [loadingContents, setLoadingContents] = useState(false)
  const [selectedPracticeIds, setSelectedPracticeIds] = useState<string[]>([])
  const [selectedTables, setSelectedTables] = useState<string[]>([])

  useEffect(() => {
    async function loadBackupContents() {
      if (!selectedBackup) {
        setBackupContents(null)
        return
      }
      setLoadingContents(true)
      try {
        const response = await fetch(`/api/super-admin/backups/contents?backupId=${selectedBackup.id}`)
        if (response.ok) {
          const data = await response.json()
          setBackupContents(data)
          setSelectedPracticeIds([])
          setSelectedTables([])
          setRestoreMode("full")
        }
      } catch (error) {
        console.error("Error loading backup contents:", error)
      } finally {
        setLoadingContents(false)
      }
    }
    loadBackupContents()
  }, [selectedBackup])

  const handleRestore = async () => {
    const success = await onRestore(
      selectedBackup?.id || null,
      uploadedFile,
      restoreMode,
      selectedPracticeIds,
      selectedTables
    )
    if (success) {
      resetState()
      onClose()
    }
  }

  const resetState = () => {
    setUploadedFile(null)
    setRestoreMode("full")
    setSelectedPracticeIds([])
    setSelectedTables([])
    setBackupContents(null)
  }

  const togglePracticeSelection = (id: string) => {
    setSelectedPracticeIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const toggleTableSelection = (name: string) => {
    setSelectedTables((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    )
  }

  const isDisabled =
    isRestoring ||
    (!selectedBackup && !uploadedFile) ||
    (restoreMode === "practices" && selectedPracticeIds.length === 0) ||
    (restoreMode === "tables" && selectedTables.length === 0)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle>Backup wiederherstellen</AlertDialogTitle>
          <AlertDialogDescription>
            {selectedBackup
              ? `Backup vom ${new Date(selectedBackup.created_at).toLocaleDateString("de-DE")} wiederherstellen`
              : "Wählen Sie eine Backup-Datei zum Wiederherstellen aus."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {!selectedBackup && (
            <div className="space-y-2">
              <Label>Backup-Datei hochladen</Label>
              <Input
                type="file"
                accept=".json"
                onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
              />
            </div>
          )}

          {selectedBackup && (
            <>
              {loadingContents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Backup-Inhalt wird geladen...</span>
                </div>
              ) : backupContents ? (
                <>
                  <RestoreModeSelector mode={restoreMode} onModeChange={setRestoreMode} />

                  {restoreMode === "practices" && backupContents.practices.length > 0 && (
                    <SelectionList
                      label="Praxen auswählen"
                      items={backupContents.practices.map((p) => ({ id: p.id, name: p.name, count: p.rowCount, countLabel: "Einträge" }))}
                      selectedIds={selectedPracticeIds}
                      onToggle={togglePracticeSelection}
                      onSelectAll={() => setSelectedPracticeIds(backupContents.practices.map((p) => p.id))}
                      onSelectNone={() => setSelectedPracticeIds([])}
                      summaryText={`${selectedPracticeIds.length} Praxis(en) ausgewählt`}
                    />
                  )}

                  {restoreMode === "tables" && backupContents.tables.length > 0 && (
                    <SelectionList
                      label="Tabellen auswählen"
                      items={backupContents.tables.map((t) => ({ id: t.name, name: t.name, count: t.rowCount, countLabel: "Zeilen", mono: true }))}
                      selectedIds={selectedTables}
                      onToggle={toggleTableSelection}
                      onSelectAll={() => setSelectedTables(backupContents.tables.map((t) => t.name))}
                      onSelectNone={() => setSelectedTables([])}
                      summaryText={`${selectedTables.length} Tabelle(n) ausgewählt`}
                    />
                  )}

                  <div className="bg-muted/50 p-3 rounded-lg text-sm">
                    <p className="font-medium mb-1">{"Backup-Übersicht:"}</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>{backupContents.tables.length} Tabellen im Backup</li>
                      <li>{backupContents.practices.length} Praxen im Backup</li>
                      <li>Erstellt am: {new Date(backupContents.createdAt).toLocaleString("de-DE")}</li>
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Backup-Inhalt konnte nicht geladen werden.
                </p>
              )}
            </>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => { resetState(); onClose() }}>
            Abbrechen
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRestore}
            disabled={isDisabled}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isRestoring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird wiederhergestellt...
              </>
            ) : (
              "Wiederherstellen"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function RestoreModeSelector({
  mode,
  onModeChange,
}: {
  mode: string
  onModeChange: (v: "full" | "practices" | "tables") => void
}) {
  const modes = [
    { value: "full", icon: Database, label: "Vollständige Wiederherstellung", desc: "Alle Daten aus dem Backup wiederherstellen" },
    { value: "practices", icon: Building2, label: "Nach Praxis wiederherstellen", desc: "Nur ausgewählte Praxen wiederherstellen" },
    { value: "tables", icon: Table2, label: "Nach Tabelle wiederherstellen", desc: "Nur ausgewählte Tabellen wiederherstellen" },
  ] as const

  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Wiederherstellungsmodus</Label>
      <RadioGroup value={mode} onValueChange={(v) => onModeChange(v as any)}>
        {modes.map(({ value, icon: Icon, label, desc }) => (
          <div key={value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
            <RadioGroupItem value={value} id={`mode-${value}`} />
            <Label htmlFor={`mode-${value}`} className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="font-medium">{label}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{desc}</p>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

function SelectionList({
  label,
  items,
  selectedIds,
  onToggle,
  onSelectAll,
  onSelectNone,
  summaryText,
}: {
  label: string
  items: Array<{ id: string; name: string; count: number; countLabel: string; mono?: boolean }>
  selectedIds: string[]
  onToggle: (id: string) => void
  onSelectAll: () => void
  onSelectNone: () => void
  summaryText: string
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">{label}</Label>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSelectAll}>Alle auswählen</Button>
          <Button variant="outline" size="sm" onClick={onSelectNone}>Keine auswählen</Button>
        </div>
      </div>
      <ScrollArea className="h-48 border rounded-lg p-3">
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded">
              <Checkbox
                id={`item-${item.id}`}
                checked={selectedIds.includes(item.id)}
                onCheckedChange={() => onToggle(item.id)}
              />
              <Label htmlFor={`item-${item.id}`} className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className={item.mono ? "font-mono text-sm" : ""}>{item.name}</span>
                  <Badge variant="secondary">{item.count} {item.countLabel}</Badge>
                </div>
              </Label>
            </div>
          ))}
        </div>
      </ScrollArea>
      {selectedIds.length > 0 && (
        <p className="text-sm text-muted-foreground">{summaryText}</p>
      )}
    </div>
  )
}
