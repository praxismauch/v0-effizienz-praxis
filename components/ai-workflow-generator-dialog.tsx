"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Loader2, Eye, Clock, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"
import { useWorkflow } from "@/contexts/workflow-context"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AIWorkflowGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onWorkflowCreated?: () => void
}

export function AIWorkflowGeneratorDialog({ open, onOpenChange, onWorkflowCreated }: AIWorkflowGeneratorDialogProps) {
  const { toast } = useToast()
  const { currentPractice } = usePractice()
  const { categories, createWorkflow, workflows } = useWorkflow()
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium")
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (categories.length > 0 && !category) {
      // Set first active category as default
      const firstActiveCategory = categories.find((cat) => cat.is_active)
      if (firstActiveCategory) {
        setCategory(firstActiveCategory.id)
      }
    }
  }, [categories, category])

  const recentWorkflows = workflows
    .filter((w) => w.practiceId === currentPractice?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const handleGenerate = async () => {
    if (!description.trim() || description.trim().length < 10) {
      toast({
        title: "Beschreibung zu kurz",
        description: "Bitte geben Sie eine detailliertere Beschreibung ein (mindestens 10 Zeichen).",
        variant: "destructive",
      })
      return
    }

    if (!currentPractice) {
      toast({
        title: "Fehler",
        description: "Keine Praxis ausgewählt.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/workflows/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          practiceId: currentPractice.id,
          category: category || categories[0]?.id || "administrative",
          priority,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Generieren des Workflows")
      }

      const workflowData = await response.json()

      // Create the workflow using the context
      createWorkflow({
        title: workflowData.title,
        description: workflowData.description,
        category: category || categories[0]?.id || "administrative",
        priority,
        status: "draft",
        createdBy: "Current User",
        isTemplate: false,
        steps: workflowData.steps,
        estimatedTotalDuration: workflowData.estimatedTotalDuration,
        teamIds: [],
      })

      toast({
        title: "Workflow erstellt",
        description: `Der Workflow "${workflowData.title}" wurde erfolgreich mit ${workflowData.steps.length} Schritten erstellt.`,
      })

      // Reset form and close dialog
      setDescription("")
      setCategory("")
      setPriority("medium")
      onOpenChange(false)

      // Navigate to goals page with draft tab
      window.location.href = "/goals?tab=draft"

      onWorkflowCreated?.()
    } catch (error: any) {
      console.error("Error generating workflow:", error)
      toast({
        title: "Fehler",
        description: error.message || "Workflow konnte nicht generiert werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePreview = (workflowId: string) => {
    // Close the dialog and navigate to the workflow
    onOpenChange(false)
    window.location.href = `/workflows?id=${workflowId}`
  }

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive"
      case "high":
        return "default"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "active":
        return "default"
      case "paused":
        return "secondary"
      case "draft":
        return "outline"
      default:
        return "secondary"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Workflow mit KI generieren
          </DialogTitle>
          <DialogDescription>
            Beschreiben Sie den gewünschten Workflow in eigenen Worten und lassen Sie KI einen strukturierten
            Arbeitsablauf mit einzelnen Schritten erstellen.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="space-y-4 py-4 pr-4">
            {recentWorkflows.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Aktuelle Berichte</h3>
                  <Badge variant="secondary" className="text-xs">
                    {recentWorkflows.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {recentWorkflows.map((workflow) => (
                    <Card key={workflow.id} className="p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-medium truncate">{workflow.title}</h4>
                            <Badge variant={getStatusVariant(workflow.status)} className="text-xs">
                              {workflow.status === "draft" && "Entwurf"}
                              {workflow.status === "active" && "Aktiv"}
                              {workflow.status === "completed" && "Abgeschlossen"}
                              {workflow.status === "paused" && "Pausiert"}
                              {workflow.status === "archived" && "Archiviert"}
                            </Badge>
                            <Badge variant={getPriorityVariant(workflow.priority)} className="text-xs">
                              {workflow.priority === "urgent" && "Dringend"}
                              {workflow.priority === "high" && "Hoch"}
                              {workflow.priority === "medium" && "Mittel"}
                              {workflow.priority === "low" && "Niedrig"}
                            </Badge>
                          </div>
                          {workflow.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{workflow.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(workflow.createdAt).toLocaleDateString("de-DE")}
                            </div>
                            {workflow.estimatedTotalDuration && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {workflow.estimatedTotalDuration} Min.
                              </div>
                            )}
                            <div className="text-xs">{workflow.steps.length} Schritte</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(workflow.id)}
                          className="shrink-0"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Vorschau
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="ai-description">Workflow-Beschreibung *</Label>
              <Textarea
                id="ai-description"
                placeholder="Beispiel: Erstelle einen Workflow für die Patientenaufnahme, der die Anmeldung, Datenerfassung, Versicherungsprüfung und Terminvergabe umfasst..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                disabled={isGenerating}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Je detaillierter Ihre Beschreibung, desto besser wird der generierte Workflow.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ai-category">Kategorie</Label>
                <Select value={category} onValueChange={setCategory} disabled={isGenerating}>
                  <SelectTrigger id="ai-category">
                    <SelectValue placeholder="Kategorie wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        Keine Kategorien verfügbar. Bitte erstellen Sie Kategorien unter Einstellungen →
                        Orga-Kategorien.
                      </div>
                    ) : (
                      categories
                        .filter((cat) => cat.is_active)
                        .sort((a, b) => a.display_order - b.display_order)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-priority">Priorität</Label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)} disabled={isGenerating}>
                  <SelectTrigger id="ai-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                    <SelectItem value="urgent">Dringend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Abbrechen
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating || description.trim().length < 10}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generiere...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Mit KI generieren
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AIWorkflowGeneratorDialog
