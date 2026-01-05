"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AIRecruitingAnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  practiceId: string
}

function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split("\n")
  const elements: React.ReactElement[] = []
  let listItems: string[] = []
  let listType: "ul" | "ol" | null = null
  let key = 0

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType
      elements.push(
        <ListTag key={`list-${key++}`} className="space-y-2 my-4 ml-4">
          {listItems.map((item, i) => (
            <li
              key={i}
              className="leading-relaxed text-foreground/90 pl-2"
              dangerouslySetInnerHTML={{ __html: item }}
            />
          ))}
        </ListTag>,
      )
      listItems = []
      listType = null
    }
  }

  const parseInline = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
      .replace(/`(.+?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
  }

  for (let line of lines) {
    line = line.trim()

    if (!line) {
      flushList()
      continue
    }

    // Headings
    if (line.startsWith("# ")) {
      flushList()
      elements.push(
        <h1 key={`h1-${key++}`} className="flex items-center gap-2 text-2xl font-bold mb-6">
          <Sparkles className="h-6 w-6 text-primary" />
          {line.slice(2)}
        </h1>,
      )
    } else if (line.startsWith("## ")) {
      flushList()
      elements.push(
        <h2 key={`h2-${key++}`} className="flex items-center gap-2 text-xl font-bold mt-8 mb-4 pb-2 border-b">
          {line.slice(3)}
        </h2>,
      )
    } else if (line.startsWith("### ")) {
      flushList()
      elements.push(
        <h3 key={`h3-${key++}`} className="text-lg font-semibold mt-6 mb-3">
          {line.slice(4)}
        </h3>,
      )
    }
    // Unordered list
    else if (line.match(/^[-*]\s/)) {
      if (listType !== "ul") {
        flushList()
        listType = "ul"
      }
      listItems.push(parseInline(line.slice(2)))
    }
    // Ordered list
    else if (line.match(/^\d+\.\s/)) {
      if (listType !== "ol") {
        flushList()
        listType = "ol"
      }
      listItems.push(parseInline(line.replace(/^\d+\.\s/, "")))
    }
    // Paragraph
    else {
      flushList()
      elements.push(
        <p
          key={`p-${key++}`}
          className="leading-relaxed mb-4 text-foreground/90"
          dangerouslySetInnerHTML={{ __html: parseInline(line) }}
        />,
      )
    }
  }

  flushList()
  return <>{elements}</>
}

export function AIRecruitingAnalysisDialog({ open, onOpenChange, practiceId }: AIRecruitingAnalysisDialogProps) {
  const [analysis, setAnalysis] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleAnalyze = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/hiring/ai-analyze-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practiceId }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze recruiting data")
      }

      const data = await response.json()
      setAnalysis(data.analysis)
    } catch (error) {
      console.error("Error analyzing recruiting data:", error)
      toast({
        title: "Fehler",
        description: "Die Recruiting-Analyse konnte nicht erstellt werden.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([analysis], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `recruiting-analyse-${new Date().toISOString().split("T")[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI-Recruiting-Analyse
          </DialogTitle>
          <DialogDescription>Umfassende Analyse aller Recruiting-Daten mit Handlungsempfehlungen</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!analysis && !loading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Analysiere alle Recruiting-Daten inklusive Stellenausschreibungen, Kandidaten, Bewerbungen und
                Interviews.
              </p>
              <Button
                onClick={handleAnalyze}
                className="bg-gradient-to-r from-primary to-primary/70 text-white shadow-lg hover:shadow-xl font-semibold"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Analyse starten
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Analysiere Recruiting-Daten...</p>
            </div>
          )}

          {analysis && !loading && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleDownload} size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Als Markdown exportieren
                </Button>
              </div>
              <div className="rounded-lg border bg-card">
                <div className="p-6">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <SimpleMarkdown content={analysis} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AIRecruitingAnalysisDialog
