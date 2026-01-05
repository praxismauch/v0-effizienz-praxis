"use client"

import { useState, useEffect } from "react"
import { usePractice } from "@/contexts/practice-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface SendQuestionnaireDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidateId: string
  candidateName: string
}

interface Questionnaire {
  id: string
  title: string
  description: string
}

export function SendQuestionnaireDialog({
  open,
  onOpenChange,
  candidateId,
  candidateName,
}: SendQuestionnaireDialogProps) {
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState("")
  const [expiresInDays, setExpiresInDays] = useState("7")

  useEffect(() => {
    if (open && currentPractice?.id) {
      loadQuestionnaires()
    }
  }, [open, currentPractice?.id])

  const loadQuestionnaires = async () => {
    try {
      const response = await fetch(`/api/hiring/questionnaires?practiceId=${currentPractice?.id}`)
      if (response.ok) {
        const data = await response.json()
        setQuestionnaires(data)
      }
    } catch (error) {
      console.error("Error loading questionnaires:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/hiring/send-questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          questionnaireId: selectedQuestionnaire,
          practiceId: currentPractice?.id,
          expiresInDays: parseInt(expiresInDays),
        }),
      })

      if (!response.ok) throw new Error("Failed to send questionnaire")

      toast({
        title: "Fragebogen gesendet",
        description: `Der Fragebogen wurde erfolgreich an ${candidateName} gesendet.`,
      })

      onOpenChange(false)
      setSelectedQuestionnaire("")
      setExpiresInDays("7")
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Der Fragebogen konnte nicht gesendet werden.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fragebogen senden</DialogTitle>
          <DialogDescription>Senden Sie einen Fragebogen an {candidateName}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="questionnaire">Fragebogen *</Label>
            <Select value={selectedQuestionnaire} onValueChange={setSelectedQuestionnaire} required>
              <SelectTrigger>
                <SelectValue placeholder="Fragebogen auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {questionnaires.map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires">Gültig für (Tage)</Label>
            <Input
              id="expires"
              type="number"
              min="1"
              max="90"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || !selectedQuestionnaire}>
              {loading ? "Wird gesendet..." : "Senden"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
