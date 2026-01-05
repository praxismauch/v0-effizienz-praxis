"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { FormattedAIContent } from "@/components/formatted-ai-content"

interface AIFolderAnalysisDialogProps {
  isOpen: boolean
  onClose: () => void
  analysis: string | null
  folderName: string
  stats: {
    totalDocuments: number
    totalFolders: number
  } | null
  isLoading: boolean
}

function parseAnalysisToHTML(text: string): string {
  if (!text) return ""

  const html = text
    // Convert ### headers to h3 tags
    .replace(
      /### (\d+)\. (.+?)(\n|$)/g,
      '<h3 class="text-lg font-semibold mt-6 mb-3 flex items-center gap-2"><span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm">$1</span>$2</h3>',
    )
    // Convert **bold** to strong tags
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    // Convert bullet points to list items
    .replace(/^- (.+?)$/gm, '<li class="ml-4">$1</li>')
    // Wrap paragraphs
    .split("\n\n")
    .map((para) => {
      if (para.includes("<li")) {
        return `<ul class="space-y-2 my-4">${para}</ul>`
      }
      if (para.includes("<h3")) {
        return para
      }
      if (para.trim()) {
        return `<p class="text-sm leading-relaxed text-muted-foreground my-3">${para}</p>`
      }
      return ""
    })
    .join("")

  return html
}

export function AIFolderAnalysisDialog({
  isOpen,
  onClose,
  analysis,
  folderName,
  stats,
  isLoading,
}: AIFolderAnalysisDialogProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (isLoading) {
      setProgress(0)
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev
          return prev + Math.random() * 15
        })
      }, 500)
      return () => clearInterval(interval)
    } else {
      setProgress(100)
    }
  }, [isLoading])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI-Ordneranalyse: {folderName}
          </DialogTitle>
          <DialogDescription>Detaillierte Analyse der Ordnerstruktur und Dokumentenorganisation</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analysiere Ordnerstruktur...</p>
            <div className="w-full max-w-md space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">{Math.round(progress)}% abgeschlossen</p>
            </div>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            {stats && (
              <div className="flex gap-4">
                <Badge variant="outline" className="text-sm">
                  {stats.totalDocuments} Dokumente
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {stats.totalFolders} Unterordner
                </Badge>
              </div>
            )}

            <div className="p-5 bg-muted/30 rounded-lg border border-border/50">
              <FormattedAIContent content={analysis} />
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={onClose}>Schließen</Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">Keine Analyseergebnisse verfügbar</div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AIFolderAnalysisDialog
