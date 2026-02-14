"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { SkillDefinition } from "./types"
import { LEVEL_CONFIG } from "./types"

interface EditSkillDialogProps {
  skill: SkillDefinition | null
  memberName: string
  onClose: () => void
  onSave: (data: {
    skill_id: string
    current_level: number
    target_level: number | null
    notes: string
    change_reason: string
  }) => Promise<boolean>
}

export function EditSkillDialog({ skill, memberName, onClose, onSave }: EditSkillDialogProps) {
  const [editLevel, setEditLevel] = useState<number>(skill?.current_level ?? 0)
  const [editTargetLevel, setEditTargetLevel] = useState<number | null>(skill?.target_level ?? null)
  const [editNotes, setEditNotes] = useState(skill?.notes || "")
  const [editReason, setEditReason] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!skill) return
    setSaving(true)
    const success = await onSave({
      skill_id: skill.id,
      current_level: editLevel,
      target_level: editTargetLevel,
      notes: editNotes,
      change_reason: editReason,
    })
    setSaving(false)
    if (success) onClose()
  }

  return (
    <Dialog open={!!skill} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Skill bewerten: {skill?.name}</DialogTitle>
          <DialogDescription>Bewerten Sie den Skill-Level für {memberName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Level Selection */}
          <div className="space-y-3">
            <Label>Aktuelles Level</Label>
            <div className="grid grid-cols-2 gap-2">
              {LEVEL_CONFIG.map((config) => (
                <button
                  key={config.level}
                  type="button"
                  onClick={() => setEditLevel(config.level)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    editLevel === config.level
                      ? `${config.color} border-current ring-2 ring-offset-2`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{config.title}</p>
                      <p className="text-xs text-muted-foreground">Level {config.level}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {skill && (
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                {editLevel === 0 && skill.level_0_description}
                {editLevel === 1 && skill.level_1_description}
                {editLevel === 2 && skill.level_2_description}
                {editLevel === 3 && skill.level_3_description}
              </p>
            )}
          </div>

          {/* Target Level */}
          <div className="space-y-2">
            <Label>Ziel-Level (optional)</Label>
            <Select
              value={editTargetLevel?.toString() || "none"}
              onValueChange={(v) => setEditTargetLevel(v === "none" ? null : Number.parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kein Ziel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Ziel</SelectItem>
                {LEVEL_CONFIG.map((config) => (
                  <SelectItem key={config.level} value={config.level.toString()}>
                    {config.icon} {config.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Change Reason */}
          {skill?.current_level !== null && editLevel !== skill?.current_level && (
            <div className="space-y-2">
              <Label>Grund für Änderung</Label>
              <Textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="z.B. Fortbildung abgeschlossen, Praxiserfahrung gesammelt..."
                rows={2}
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notizen (optional)</Label>
            <Textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Zusätzliche Anmerkungen zur Bewertung..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
