"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, FileText, Tag, Folder } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePractice } from "@/contexts/practice-context"

export function AIDocumentAnalyzerDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const { currentPractice } = usePractice()

  const analyzeDocuments = async () => {
    if (!currentPractice) return

    setLoading(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/documents/ai-analyze`, {
        method: "POST",
      })
      const data = await response.json()
      setAnalysis(data)
    } catch (error) {
      console.error("Error analyzing documents:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={analyzeDocuments} className="gap-2">
          <Sparkles className="h-4 w-4" />
          KI-Gesamtanalyse Dokumente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI-Gesamtanalyse Dokumente
          </DialogTitle>
          <DialogDescription>
            Intelligente Analyse Ihrer Dokumentenstruktur mit Organisationsvorschlägen
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            {analysis.organizationScore && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Organisationsbewertung</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="text-4xl font-bold text-primary">{analysis.organizationScore}/100</div>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                      {analysis.organizationSummary}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis.suggestedFolders && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Folder className="h-5 w-5 text-blue-500" />
                    Vorgeschlagene Ordnerstruktur
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.suggestedFolders.map((folder: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm font-medium">{folder}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {analysis.taggingSuggestions && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="h-5 w-5 text-green-500" />
                    Tag-Vorschläge
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.taggingSuggestions.map((suggestion: any, index: number) => (
                    <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                      <p className="font-semibold text-sm mb-2">{suggestion.document}</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestion.tags.map((tag: string, tagIndex: number) => (
                          <span
                            key={tagIndex}
                            className="text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-900"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {analysis.recommendations && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Empfehlungen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-sm leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center p-12 text-muted-foreground">
            Klicken Sie auf den Button, um Dokumentenanalyse zu starten
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AIDocumentAnalyzerDialog
