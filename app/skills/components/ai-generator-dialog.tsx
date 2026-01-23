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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react"
import { categoryLabels, categoryColors, type GeneratedSkill } from "../types"

interface AIGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerate: (prompt: string) => Promise<void>
  onSaveSkills: (skills: GeneratedSkill[]) => Promise<void>
  generatedSkills: GeneratedSkill[]
  setGeneratedSkills: (skills: GeneratedSkill[]) => void
  isGenerating: boolean
  isSaving: boolean
}

export function AiGeneratorDialog({
  open,
  onOpenChange,
  onGenerate,
  onSaveSkills,
  generatedSkills,
  setGeneratedSkills,
  isGenerating,
  isSaving,
}: AIGeneratorDialogProps) {
  const [aiPrompt, setAiPrompt] = useState("")

  const handleGenerate = async () => {
    await onGenerate(aiPrompt)
  }

  const handleSave = async () => {
    const selected = generatedSkills.filter((s) => s.selected)
    await onSaveSkills(selected)
    setAiPrompt("")
  }

  const toggleSkillSelection = (index: number) => {
    const updated = [...generatedSkills]
    updated[index].selected = !updated[index].selected
    setGeneratedSkills(updated)
  }

  const selectAll = () => {
    setGeneratedSkills(generatedSkills.map((s) => ({ ...s, selected: true })))
  }

  const deselectAll = () => {
    setGeneratedSkills(generatedSkills.map((s) => ({ ...s, selected: false })))
  }

  const selectedCount = generatedSkills.filter((s) => s.selected).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI-Kompetenz Generator
          </DialogTitle>
          <DialogDescription>
            Beschreiben Sie Ihre Praxis und lassen Sie die KI passende Kompetenzen generieren.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Beschreiben Sie Ihre Praxis</Label>
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="z.B. Hausarztpraxis mit Schwerpunkt Diabetologie, 3 Ärzte, 5 MFAs, Labordiagnostik vor Ort..."
              rows={3}
            />
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating || !aiPrompt.trim()}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generiere...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Kompetenzen generieren
              </>
            )}
          </Button>

          {generatedSkills.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Generierte Kompetenzen ({generatedSkills.length})</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Alle auswählen
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    Keine auswählen
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-[300px] border rounded-lg">
                <div className="p-4 space-y-3">
                  {generatedSkills.map((skill, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        skill.selected
                          ? "bg-primary/5 border-primary"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => toggleSkillSelection(index)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={skill.selected}
                          onCheckedChange={() => toggleSkillSelection(index)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{skill.name}</span>
                            <Badge
                              variant="outline"
                              className={categoryColors[skill.category] || categoryColors.other}
                            >
                              {categoryLabels[skill.category] || skill.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {skill.description}
                          </p>
                        </div>
                        {skill.selected && (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          {generatedSkills.length > 0 && (
            <Button onClick={handleSave} disabled={selectedCount === 0 || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedCount} Kompetenz{selectedCount !== 1 ? "en" : ""} speichern
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
