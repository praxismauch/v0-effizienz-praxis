"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Target, Eye, Loader2 } from "lucide-react"
import type { LeitbildVersion } from "./types"

interface StatementCardProps {
  icon: React.ReactNode
  title: string
  value: string | null
  editValue: string
  onEditChange: (value: string) => void
  isEditMode: boolean
  placeholder: string
  emptyText: string
  className?: string
  rows?: number
}

function StatementCard({ icon, title, value, editValue, onEditChange, isEditMode, placeholder, emptyText, className, rows = 6 }: StatementCardProps) {
  return (
    <Card className={className || "border-border bg-card"}>
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-6">
          {icon}
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        </div>
        {isEditMode ? (
          <Textarea
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            rows={rows}
            className="bg-background border-border resize-none text-base"
            placeholder={placeholder}
          />
        ) : (
          <div className="bg-background rounded-lg border border-border p-4">
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {value || emptyText}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface LeitbildDisplayProps {
  activeVersion: LeitbildVersion
  isEditMode: boolean
  editedOneSentence: string
  editedMission: string
  editedVision: string
  setEditedOneSentence: (value: string) => void
  setEditedMission: (value: string) => void
  setEditedVision: (value: string) => void
  onSave: () => void
  onRegenerate: () => void
  isSaving: boolean
  t: (key: string, fallback: string) => string
}

export function LeitbildDisplay({
  activeVersion,
  isEditMode,
  editedOneSentence,
  editedMission,
  editedVision,
  setEditedOneSentence,
  setEditedMission,
  setEditedVision,
  onSave,
  onRegenerate,
  isSaving,
  t,
}: LeitbildDisplayProps) {
  return (
    <div className="space-y-6">
      <StatementCard
        icon={<Sparkles className="h-6 w-6 text-primary" />}
        title={t("leitbild.leitbild", "Leitbild")}
        value={activeVersion.leitbild_one_sentence}
        editValue={editedOneSentence}
        onEditChange={setEditedOneSentence}
        isEditMode={isEditMode}
        placeholder="Ihr Leitbild in einem Satz..."
        emptyText="Kein Leitbild definiert"
        className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-blue-50/50 dark:from-primary/20 dark:via-primary/10 dark:to-blue-950/20"
        rows={3}
      />

      <StatementCard
        icon={<Target className="h-6 w-6 text-primary" />}
        title={t("leitbild.mission", "Mission Statement")}
        value={activeVersion.mission_statement}
        editValue={editedMission}
        onEditChange={setEditedMission}
        isEditMode={isEditMode}
        placeholder="Beschreiben Sie Ihre Mission..."
        emptyText="Keine Mission definiert"
      />

      <StatementCard
        icon={<Eye className="h-6 w-6 text-primary" />}
        title={t("leitbild.vision", "Vision Statement")}
        value={activeVersion.vision_statement}
        editValue={editedVision}
        onEditChange={setEditedVision}
        isEditMode={isEditMode}
        placeholder="Beschreiben Sie Ihre Vision..."
        emptyText="Keine Vision definiert"
      />

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={onRegenerate} className="px-6">
          Neu generieren
        </Button>
        <Button onClick={onSave} disabled={isSaving} className="px-6 bg-primary">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Speichern...
            </>
          ) : (
            "Leitbild speichern"
          )}
        </Button>
      </div>
    </div>
  )
}
