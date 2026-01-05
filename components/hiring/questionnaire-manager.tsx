"use client"

import { useState, useEffect } from "react"
import { usePractice } from "@/contexts/practice-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, Trash2, Sparkles } from 'lucide-react'
import { CreateQuestionnaireDialog } from "./create-questionnaire-dialog"
import { AIQuestionnaireGeneratorDialog } from "./ai-questionnaire-generator-dialog"
import { useToast } from "@/hooks/use-toast"

interface Questionnaire {
  id: string
  title: string
  description: string
  questions: any[]
  created_at: string
}

export function QuestionnaireManager() {
  const { currentPractice } = usePractice()
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAIGeneratorDialog, setShowAIGeneratorDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (currentPractice?.id) {
      loadQuestionnaires()
    }
  }, [currentPractice?.id])

  const loadQuestionnaires = async () => {
    try {
      const response = await fetch(`/api/hiring/questionnaires?practiceId=${currentPractice?.id}`)
      if (response.ok) {
        const data = await response.json()
        setQuestionnaires(data)
      }
    } catch (error) {
      console.error("Error loading questionnaires:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie diesen Fragebogen wirklich löschen?")) return

    try {
      const response = await fetch(`/api/hiring/questionnaires/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Fragebogen gelöscht",
          description: "Der Fragebogen wurde erfolgreich gelöscht.",
        })
        loadQuestionnaires()
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Der Fragebogen konnte nicht gelöscht werden.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div>Laden...</div>
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fragebögen</CardTitle>
              <CardDescription>Verwalten Sie Fragebögen für Kandidaten</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
                onClick={() => setShowAIGeneratorDialog(true)}
              >
                <Sparkles className="h-4 w-4" />
                KI-Fragebogen
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Neuer Fragebogen
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {questionnaires.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Keine Fragebögen vorhanden. Erstellen Sie Ihren ersten Fragebogen.
            </div>
          ) : (
            <div className="space-y-4">
              {questionnaires.map((questionnaire) => (
                <Card key={questionnaire.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{questionnaire.title}</CardTitle>
                        {questionnaire.description && (
                          <CardDescription>{questionnaire.description}</CardDescription>
                        )}
                        <p className="text-sm text-muted-foreground mt-2">
                          {questionnaire.questions?.length || 0} Fragen
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(questionnaire.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateQuestionnaireDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={loadQuestionnaires}
      />

      <AIQuestionnaireGeneratorDialog
        open={showAIGeneratorDialog}
        onOpenChange={setShowAIGeneratorDialog}
        onSuccess={loadQuestionnaires}
      />
    </>
  )
}
