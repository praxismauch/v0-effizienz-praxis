"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { ThumbsUp, ThumbsDown, Plus, Loader2, Sparkles, TrendingUp, Target, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AIFeatureSuggestion {
  title: string
  description: string
  priority: "high" | "medium" | "low"
  effort: "low" | "medium" | "high"
  impact: "low" | "medium" | "high"
  category: string
  reasoning: string
  suggestedQuarter: string
}

interface RoadmapAIIdeasDialogProps {
  isOpen: boolean
  onClose: () => void
  suggestions: AIFeatureSuggestion[]
  onAddSuggestion: (suggestion: AIFeatureSuggestion) => Promise<void>
  userId?: string
}

const priorityConfig = {
  high: { label: "Hoch", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", icon: Zap },
  medium: {
    label: "Mittel",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    icon: Target,
  },
  low: {
    label: "Niedrig",
    color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    icon: TrendingUp,
  },
}

const effortConfig = {
  low: { label: "Niedrig", color: "bg-green-100 text-green-700" },
  medium: { label: "Mittel", color: "bg-yellow-100 text-yellow-700" },
  high: { label: "Hoch", color: "bg-red-100 text-red-700" },
}

const impactConfig = {
  low: { label: "Niedrig", color: "bg-slate-100 text-slate-700" },
  medium: { label: "Mittel", color: "bg-blue-100 text-blue-700" },
  high: { label: "Hoch", color: "bg-purple-100 text-purple-700" },
}

export function RoadmapAIIdeasDialog({
  isOpen,
  onClose,
  suggestions,
  onAddSuggestion,
  userId,
}: RoadmapAIIdeasDialogProps) {
  const [feedbackStates, setFeedbackStates] = useState<Record<string, "good" | "bad" | null>>({})
  const [feedbackReasons, setFeedbackReasons] = useState<Record<string, string>>({})
  const [processingIdeas, setProcessingIdeas] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const handleFeedback = async (suggestion: AIFeatureSuggestion, type: "good" | "bad") => {
    const key = suggestion.title
    setFeedbackStates((prev) => ({ ...prev, [key]: type }))

    try {
      await fetch("/api/roadmap/idea-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaTitle: suggestion.title,
          ideaDescription: suggestion.description,
          ideaCategory: suggestion.category,
          ideaPriority: suggestion.priority,
          ideaEffort: suggestion.effort,
          ideaImpact: suggestion.impact,
          feedbackType: type,
          feedbackReason: feedbackReasons[key] || null,
          userId: userId || "super-admin",
          aiReasoning: suggestion.reasoning,
        }),
      })

      toast({
        title: type === "good" ? "Als gut markiert" : "Als schlecht markiert",
        description: "Ihr Feedback hilft, zukünftige Vorschläge zu verbessern",
      })
    } catch (error) {
      console.error("[v0] Error saving feedback:", error)
    }
  }

  const handleAdd = async (suggestion: AIFeatureSuggestion) => {
    const key = suggestion.title
    setProcessingIdeas((prev) => new Set(prev).add(key))

    try {
      await onAddSuggestion(suggestion)

      // Mark as implemented feedback
      await fetch("/api/roadmap/idea-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaTitle: suggestion.title,
          ideaDescription: suggestion.description,
          ideaCategory: suggestion.category,
          ideaPriority: suggestion.priority,
          ideaEffort: suggestion.effort,
          ideaImpact: suggestion.impact,
          feedbackType: "implemented",
          userId: userId || "super-admin",
          aiReasoning: suggestion.reasoning,
        }),
      })
    } finally {
      setProcessingIdeas((prev) => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            KI-generierte Feature-Ideen
          </DialogTitle>
          <DialogDescription>
            Bewerten Sie die Vorschläge mit Daumen hoch/runter. Ihr Feedback verbessert zukünftige KI-Generierungen.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => {
              const key = suggestion.title
              const feedback = feedbackStates[key]
              const isProcessing = processingIdeas.has(key)
              const PriorityIcon = priorityConfig[suggestion.priority].icon

              return (
                <div
                  key={index}
                  className={`p-4 border rounded-lg space-y-3 transition-all ${
                    feedback === "good"
                      ? "bg-green-50 border-green-200 dark:bg-green-950/20"
                      : feedback === "bad"
                        ? "bg-red-50 border-red-200 dark:bg-red-950/20"
                        : "bg-card"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <PriorityIcon className="h-4 w-4" />
                        {suggestion.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant={feedback === "good" ? "default" : "outline"}
                        onClick={() => handleFeedback(suggestion, "good")}
                        className="gap-1"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant={feedback === "bad" ? "destructive" : "outline"}
                        onClick={() => handleFeedback(suggestion, "bad")}
                        className="gap-1"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" onClick={() => handleAdd(suggestion)} disabled={isProcessing} className="gap-1">
                        {isProcessing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        Hinzufügen
                      </Button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={priorityConfig[suggestion.priority].color}>
                      {priorityConfig[suggestion.priority].label}
                    </Badge>
                    <Badge className={effortConfig[suggestion.effort].color}>
                      Aufwand: {effortConfig[suggestion.effort].label}
                    </Badge>
                    <Badge className={impactConfig[suggestion.impact].color}>
                      Impact: {impactConfig[suggestion.impact].label}
                    </Badge>
                    <Badge variant="outline">{suggestion.category}</Badge>
                    <Badge variant="secondary">{suggestion.suggestedQuarter}</Badge>
                  </div>

                  {/* Reasoning */}
                  <p className="text-xs text-muted-foreground italic">💡 {suggestion.reasoning}</p>

                  {/* Feedback reason textarea (shown after bad feedback) */}
                  {feedback === "bad" && (
                    <Textarea
                      placeholder="Warum ist diese Idee nicht gut? (Optional)"
                      value={feedbackReasons[key] || ""}
                      onChange={(e) => setFeedbackReasons((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="text-sm"
                      rows={2}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
