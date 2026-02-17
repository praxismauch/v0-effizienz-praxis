"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Sparkles, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Survey, SurveyTemplate, NewSurveyData, EditSurveyData, SurveyQuestion } from "../types"
import { SurveyQuestionEditor } from "./survey-question-editor"

// Create Survey Dialog
interface CreateSurveyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  newSurvey: NewSurveyData
  onNewSurveyChange: (data: NewSurveyData) => void
  onSubmit: () => void
  isCreating: boolean
}

export function CreateSurveyDialog({
  open,
  onOpenChange,
  newSurvey,
  onNewSurveyChange,
  onSubmit,
  isCreating,
}: CreateSurveyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Neue Umfrage erstellen</DialogTitle>
          <DialogDescription>Erstellen Sie eine neue Umfrage fur Ihr Team oder Ihre Patienten.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 overflow-y-auto">
        <div className="space-y-4 py-4 pr-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              placeholder="z.B. Mitarbeiterzufriedenheit Q1 2025"
              value={newSurvey.title}
              onChange={(e) => onNewSurveyChange({ ...newSurvey, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              placeholder="Worum geht es in dieser Umfrage?"
              value={newSurvey.description}
              onChange={(e) => onNewSurveyChange({ ...newSurvey, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Umfrageart</Label>
              <Select
                value={newSurvey.survey_type}
                onValueChange={(value: any) => onNewSurveyChange({ ...newSurvey, survey_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Intern (Team)</SelectItem>
                  <SelectItem value="external">Extern (Patienten)</SelectItem>
                  <SelectItem value="anonymous">Anonym</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Zielgruppe</Label>
              <Select
                value={newSurvey.target_audience}
                onValueChange={(value: any) => onNewSurveyChange({ ...newSurvey, target_audience: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                  <SelectItem value="specific">Ausgewahlte Benutzer</SelectItem>
                  <SelectItem value="patients">Patienten (Extern)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Startdatum (optional)</Label>
              <Input
                id="start_date"
                type="date"
                value={newSurvey.start_date}
                onChange={(e) => onNewSurveyChange({ ...newSurvey, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Enddatum (optional)</Label>
              <Input
                id="end_date"
                type="date"
                value={newSurvey.end_date}
                onChange={(e) => onNewSurveyChange({ ...newSurvey, end_date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Anonyme Antworten</Label>
              <p className="text-sm text-muted-foreground">
                Antworten werden ohne Benutzeridentifikation gespeichert
              </p>
            </div>
            <Switch
              checked={newSurvey.is_anonymous}
              onCheckedChange={(checked) => onNewSurveyChange({ ...newSurvey, is_anonymous: checked })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-violet-200 bg-violet-50/50 p-4">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-violet-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
                </svg>
                Admin benachrichtigen
              </Label>
              <p className="text-sm text-muted-foreground">
                Super-Admins erhalten eine E-Mail bei jeder neuen Antwort
              </p>
            </div>
            <Switch
              checked={newSurvey.notify_admin_on_response}
              onCheckedChange={(checked) =>
                onNewSurveyChange({ ...newSurvey, notify_admin_on_response: checked })
              }
            />
          </div>

          {/* Question Editor */}
          <div className="border-t pt-4">
            <SurveyQuestionEditor
              questions={newSurvey.questions || []}
              onChange={(questions) => onNewSurveyChange({ ...newSurvey, questions })}
            />
          </div>
        </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSubmit} disabled={!newSurvey.title.trim() || isCreating}>
            {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Template Selection Dialog
interface TemplateSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: SurveyTemplate[]
  onSelectTemplate: (template: SurveyTemplate) => void
  isCreating: boolean
}

export function TemplateSelectionDialog({
  open,
  onOpenChange,
  templates,
  onSelectTemplate,
  isCreating,
}: TemplateSelectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Vorlage auswählen</DialogTitle>
          <DialogDescription>Wählen Sie eine vorgefertigte Vorlage für Ihre Umfrage.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="grid gap-4 py-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer hover:border-violet-300 hover:shadow-md transition-all ${isCreating ? "opacity-50 pointer-events-none" : ""}`}
                onClick={() => onSelectTemplate(template)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {template.name}
                        {template.is_system_template && (
                          <Badge variant="secondary" className="text-xs">
                            System
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    <Badge variant="outline">{template.questions.length} Fragen</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {template.questions.slice(0, 3).map((q, i) => (
                      <Badge key={i} variant="secondary" className="text-xs font-normal">
                        {q.question_text.substring(0, 40)}...
                      </Badge>
                    ))}
                    {template.questions.length > 3 && (
                      <Badge variant="secondary" className="text-xs font-normal">
                        +{template.questions.length - 3} weitere
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {isCreating && (
              <div className="flex items-center justify-center p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
                  Umfrage wird erstellt...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// AI Generation Dialog
interface AIGenerationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  aiPrompt: string
  onAIPromptChange: (prompt: string) => void
  onGenerate: () => void
  isGenerating: boolean
}

export function AIGenerationDialog({
  open,
  onOpenChange,
  aiPrompt,
  onAIPromptChange,
  onGenerate,
  isGenerating,
}: AIGenerationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            Umfrage mit KI erstellen
          </DialogTitle>
          <DialogDescription>
            Beschreiben Sie, was Sie mit Ihrer Umfrage erreichen mochten, und die KI erstellt passende Fragen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Ihre Beschreibung</Label>
            <Textarea
              placeholder="z.B. Ich mochte herausfinden, wie zufrieden mein Team mit den Arbeitszeiten ist..."
              value={aiPrompt}
              onChange={(e) => onAIPromptChange(e.target.value)}
              rows={5}
            />
          </div>
          <div className="rounded-lg bg-violet-50 p-4 space-y-2">
            <p className="text-sm font-medium text-violet-700">Tipps fur gute Ergebnisse:</p>
            <ul className="text-sm text-violet-600 space-y-1 list-disc list-inside">
              <li>Beschreiben Sie das Ziel der Umfrage</li>
              <li>Nennen Sie die Zielgruppe (Team, Patienten, etc.)</li>
              <li>Erwähnen Sie spezifische Themen, die abgefragt werden sollen</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={onGenerate}
            disabled={!aiPrompt.trim() || isGenerating}
            className="bg-gradient-to-r from-violet-600 to-purple-600"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generiere...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generieren
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Results Dialog
interface ResultsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  survey: Survey | null
}

export function ResultsDialog({ open, onOpenChange, survey }: ResultsDialogProps) {
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Umfrageergebnisse: {survey?.title}</DialogTitle>
          <DialogDescription>{survey?.response_count || 0} Antworten erhalten</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-4">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Detaillierte Ergebnisansicht wird geladen...</p>
            <Button className="mt-4" onClick={() => router.push(`/surveys/${survey?.id}/results`)}>
              Vollständige Analyse öffnen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Edit Survey Dialog
interface EditSurveyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData: EditSurveyData
  onEditDataChange: (data: EditSurveyData) => void
  onSubmit: () => void
  isCreating: boolean
}

export function EditSurveyDialog({
  open,
  onOpenChange,
  editData,
  onEditDataChange,
  onSubmit,
  isCreating,
}: EditSurveyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Umfrage bearbeiten</DialogTitle>
          <DialogDescription>Passen Sie die Umfrageeinstellungen und Fragen an.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 overflow-y-auto">
        <div className="space-y-4 py-4 pr-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Titel *</Label>
            <Input
              id="edit-title"
              value={editData.title}
              onChange={(e) => onEditDataChange({ ...editData, title: e.target.value })}
              placeholder="Titel der Umfrage"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Beschreibung</Label>
            <Textarea
              id="edit-description"
              value={editData.description}
              onChange={(e) => onEditDataChange({ ...editData, description: e.target.value })}
              placeholder="Beschreibung der Umfrage"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Zielgruppe</Label>
            <Select
              value={editData.target_audience}
              onValueChange={(v) => onEditDataChange({ ...editData, target_audience: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="patients">Patienten</SelectItem>
                <SelectItem value="anonymous">Anonym</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-start">Startdatum</Label>
              <Input
                id="edit-start"
                type="date"
                value={editData.start_date}
                onChange={(e) => onEditDataChange({ ...editData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end">Enddatum</Label>
              <Input
                id="edit-end"
                type="date"
                value={editData.end_date}
                onChange={(e) => onEditDataChange({ ...editData, end_date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="edit-anon" className="cursor-pointer">
              Anonyme Umfrage
            </Label>
            <Switch
              id="edit-anon"
              checked={editData.is_anonymous}
              onCheckedChange={(v) => onEditDataChange({ ...editData, is_anonymous: v })}
            />
          </div>

          {/* Question Editor */}
          <div className="border-t pt-4">
            <SurveyQuestionEditor
              questions={editData.questions || []}
              onChange={(questions) => onEditDataChange({ ...editData, questions })}
            />
          </div>
        </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSubmit} disabled={isCreating || !editData.title.trim()}>
            {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
