"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface GoalsWidgetConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (config: GoalsWidgetConfig) => void
  currentConfig?: GoalsWidgetConfig
}

export interface GoalsWidgetConfig {
  maxGoals: number
  showStatuses: string[]
  showPriorities: string[]
  showTypes: string[]
  sortBy: "status" | "priority" | "progress" | "deadline"
}

const defaultConfig: GoalsWidgetConfig = {
  maxGoals: 5,
  showStatuses: ["not-started", "in-progress"],
  showPriorities: ["low", "medium", "high"],
  showTypes: ["practice", "personal", "team"],
  sortBy: "status",
}

export function GoalsWidgetConfigDialog({
  open,
  onOpenChange,
  onSave,
  currentConfig = defaultConfig,
}: GoalsWidgetConfigDialogProps) {
  const [config, setConfig] = useState<GoalsWidgetConfig>(currentConfig)

  useEffect(() => {
    if (open) {
      setConfig(currentConfig)
    }
  }, [open, currentConfig])

  const handleSave = () => {
    onSave(config)
    onOpenChange(false)
  }

  const statusOptions = [
    { value: "not-started", label: "Nicht begonnen" },
    { value: "in-progress", label: "In Bearbeitung" },
    { value: "completed", label: "Abgeschlossen" },
    { value: "cancelled", label: "Abgebrochen" },
  ]

  const priorityOptions = [
    { value: "low", label: "Niedrig" },
    { value: "medium", label: "Mittel" },
    { value: "high", label: "Hoch" },
  ]

  const typeOptions = [
    { value: "practice", label: "Praxis" },
    { value: "personal", label: "Privat" },
    { value: "team", label: "Team" },
  ]

  const sortOptions = [
    { value: "status", label: "Status" },
    { value: "priority", label: "Priorität" },
    { value: "progress", label: "Fortschritt" },
    { value: "deadline", label: "Fälligkeitsdatum" },
  ]

  const toggleStatus = (status: string) => {
    setConfig((prev) => ({
      ...prev,
      showStatuses: prev.showStatuses.includes(status)
        ? prev.showStatuses.filter((s) => s !== status)
        : [...prev.showStatuses, status],
    }))
  }

  const togglePriority = (priority: string) => {
    setConfig((prev) => ({
      ...prev,
      showPriorities: prev.showPriorities.includes(priority)
        ? prev.showPriorities.filter((p) => p !== priority)
        : [...prev.showPriorities, priority],
    }))
  }

  const toggleType = (type: string) => {
    setConfig((prev) => ({
      ...prev,
      showTypes: prev.showTypes.includes(type) ? prev.showTypes.filter((t) => t !== type) : [...prev.showTypes, type],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ziele-Widget konfigurieren</DialogTitle>
          <DialogDescription>
            Legen Sie fest, welche Ziele auf Ihrem Dashboard angezeigt werden sollen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Max Goals */}
          <div className="space-y-2">
            <Label>Maximale Anzahl anzuzeigender Ziele</Label>
            <Select
              value={config.maxGoals.toString()}
              onValueChange={(value) => setConfig({ ...config, maxGoals: Number.parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Ziele</SelectItem>
                <SelectItem value="5">5 Ziele</SelectItem>
                <SelectItem value="10">10 Ziele</SelectItem>
                <SelectItem value="15">15 Ziele</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Status Filter */}
          <div className="space-y-3">
            <div>
              <Label>Status-Filter</Label>
              <p className="text-sm text-muted-foreground">Wählen Sie, welche Status angezeigt werden sollen</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {statusOptions.map((status) => (
                <div key={status.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={config.showStatuses.includes(status.value)}
                    onCheckedChange={() => toggleStatus(status.value)}
                  />
                  <label
                    htmlFor={`status-${status.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {status.label}
                  </label>
                </div>
              ))}
            </div>
            {config.showStatuses.length === 0 && (
              <Badge variant="destructive" className="text-xs">
                Mindestens ein Status muss ausgewählt sein
              </Badge>
            )}
          </div>

          <Separator />

          {/* Priority Filter */}
          <div className="space-y-3">
            <div>
              <Label>Prioritäts-Filter</Label>
              <p className="text-sm text-muted-foreground">Wählen Sie, welche Prioritäten angezeigt werden sollen</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {priorityOptions.map((priority) => (
                <div key={priority.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`priority-${priority.value}`}
                    checked={config.showPriorities.includes(priority.value)}
                    onCheckedChange={() => togglePriority(priority.value)}
                  />
                  <label
                    htmlFor={`priority-${priority.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {priority.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Type Filter */}
          <div className="space-y-3">
            <div>
              <Label>Ziel-Typ Filter</Label>
              <p className="text-sm text-muted-foreground">Wählen Sie, welche Zieltypen angezeigt werden sollen</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {typeOptions.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type.value}`}
                    checked={config.showTypes.includes(type.value)}
                    onCheckedChange={() => toggleType(type.value)}
                  />
                  <label
                    htmlFor={`type-${type.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Sort By */}
          <div className="space-y-2">
            <Label>Sortierung</Label>
            <Select value={config.sortBy} onValueChange={(value: any) => setConfig({ ...config, sortBy: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={config.showStatuses.length === 0}>
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default GoalsWidgetConfigDialog
