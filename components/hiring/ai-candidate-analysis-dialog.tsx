"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, Loader2 } from "lucide-react"
import { usePractice } from "@/contexts/practice-context"
import { useToast } from "@/hooks/use-toast"

interface AICandidateAnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobPostingId?: string
}

export function AICandidateAnalysisDialog({ open, onOpenChange, jobPostingId }: AICandidateAnalysisDialogProps) {
  const { currentPractice } = usePractice()
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<{
    summary: string
    candidateCount: number
    analyzedAt: string
  } | null>(null)
  const { toast } = useToast()

  const handleAnalyze = async () => {
    if (!currentPractice?.id) return

    setLoading(true)
    try {
      const response = await fetch("/api/hiring/ai-analyze-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practiceId: currentPractice.id,
          jobPostingId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAnalysis(data)
      } else {
        toast({
          title: "Fehler",
          description: "Die KI-Analyse konnte nicht durchgeführt werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error analyzing candidates:", error)
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI-Kandidatenanalyse
          </DialogTitle>
          <DialogDescription>Lassen Sie die KI alle Kandidaten analysieren und Empfehlungen geben.</DialogDescription>
        </DialogHeader>

        {!analysis ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Sparkles className="h-12 w-12 text-muted-foreground" />
            <p className="text-center text-muted-foreground">
              Starten Sie die KI-Analyse, um eine Zusammenfassung und Empfehlungen zu erhalten.
            </p>
            <Button onClick={handleAnalyze} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analysiere...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyse starten
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{analysis.candidateCount} Kandidaten analysiert</span>
              <span>{new Date(analysis.analyzedAt).toLocaleString("de-DE")}</span>
            </div>

            <ScrollArea className="h-[500px] rounded-md border p-6">
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: analysis.summary
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/## (.*?)$/gm, '<h2 class="text-lg font-semibold mt-6 mb-3 text-foreground">$1</h2>')
                    .replace(/### (.*?)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2 text-foreground">$1</h3>')
                    .replace(/\n\n/g, '</p><p class="mb-3">')
                    .replace(/^(?!<h[23]|<p)/gm, '<p class="mb-3">'),
                }}
              />
            </ScrollArea>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAnalysis(null)}>
                Neue Analyse
              </Button>
              <Button onClick={() => onOpenChange(false)}>Schließen</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AICandidateAnalysisDialog
