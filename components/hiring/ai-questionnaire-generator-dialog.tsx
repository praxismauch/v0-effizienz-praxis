"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, Loader2 } from "lucide-react"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"

interface AIQuestionnaireGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface GeneratedQuestionnaire {
  title: string
  description: string
  questions: Array<{
    question: string
    type: "text" | "textarea" | "radio" | "checkbox" | "number"
    options?: string[]
    required: boolean
  }>
}

export function AIQuestionnaireGeneratorDialog({ open, onOpenChange, onSuccess }: AIQuestionnaireGeneratorDialogProps) {
  const { currentPractice } = usePractice()
  const { user } = useUser()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [jobTitle, setJobTitle] = useState("")
  const [requirements, setRequirements] = useState("")
  const [generatedQuestionnaire, setGeneratedQuestionnaire] = useState<GeneratedQuestionnaire | null>(null)

  const handleGenerate = async () => {
    if (!currentPractice?.id || !jobTitle.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie mindestens eine Stellenbezeichnung ein.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/hiring/ai-generate-questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practiceId: currentPractice.id,
          jobTitle,
          requirements,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedQuestionnaire(data.questionnaire)
      } else {
        toast({
          title: "Fehler",
          description: "Der Fragebogen konnte nicht generiert werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating questionnaire:", error)
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!generatedQuestionnaire || !currentPractice?.id) return

    setSaving(true)
    try {
      const response = await fetch("/api/hiring/questionnaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practice_id: currentPractice.id,
          title: generatedQuestionnaire.title,
          description: generatedQuestionnaire.description || "",
          questions: generatedQuestionnaire.questions,
          created_by: user?.id || null,
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        console.error("[v0] Error saving questionnaire:", responseData)
        throw new Error(responseData.error || "Failed to save questionnaire")
      }

      toast({
        title: "Fragebogen erstellt",
        description: "Der KI-generierte Fragebogen wurde erfolgreich gespeichert.",
      })

      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("[v0] Error in handleSave:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Der Fragebogen konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setJobTitle("")
    setRequirements("")
    setGeneratedQuestionnaire(null)
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(resetForm, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI-Fragebogen Generator
          </DialogTitle>
          <DialogDescription>
            Lassen Sie die KI einen maßgeschneiderten Fragebogen für Ihre Stelle erstellen.
          </DialogDescription>
        </DialogHeader>

        {!generatedQuestionnaire ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Stellenbezeichnung *</Label>
              <Input
                id="jobTitle"
                placeholder="z.B. Medizinische Fachangestellte (MFA)"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Spezielle Anforderungen (optional)</Label>
              <Textarea
                id="requirements"
                placeholder="z.B. Erfahrung in der Kardiologie, Kenntnisse in Praxissoftware, Teamfähigkeit..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows={4}
                disabled={loading}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Abbrechen
              </Button>
              <Button onClick={handleGenerate} disabled={loading || !jobTitle.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generiere...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Fragebogen generieren
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ScrollArea className="max-h-[500px] rounded-md border p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1">{generatedQuestionnaire.title}</h3>
                  {generatedQuestionnaire.description && (
                    <p className="text-sm text-muted-foreground">{generatedQuestionnaire.description}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Fragen ({generatedQuestionnaire.questions.length})</h4>
                  {generatedQuestionnaire.questions.map((question, index) => (
                    <div key={index} className="border-l-2 border-primary/20 pl-4 py-2">
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-sm">{index + 1}.</span>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">
                            {question.question}
                            {question.required && <span className="text-destructive ml-1">*</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Typ:{" "}
                            {question.type === "text"
                              ? "Kurzer Text"
                              : question.type === "textarea"
                                ? "Langer Text"
                                : question.type === "number"
                                  ? "Zahl"
                                  : question.type === "radio"
                                    ? "Auswahl (einfach)"
                                    : "Auswahl (mehrfach)"}
                          </p>
                          {question.options && question.options.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <p className="text-xs font-medium">Optionen:</p>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {question.options.map((option, optIndex) => (
                                  <li key={optIndex} className="ml-4">
                                    • {option}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setGeneratedQuestionnaire(null)} disabled={saving}>
                Neu generieren
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Wird gespeichert...
                  </>
                ) : (
                  "Fragebogen speichern"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AIQuestionnaireGeneratorDialog
