"use client"

import { useState } from "react"
import { usePractice } from "@/contexts/practice-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Search } from "lucide-react"
import { FormattedAIContent } from "@/components/formatted-ai-content"

interface AiSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AiSearchDialog({ open, onOpenChange }: AiSearchDialogProps) {
  const { currentPractice } = usePractice()
  const [query, setQuery] = useState("")
  const [answer, setAnswer] = useState("")
  const [relevantArticles, setRelevantArticles] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch("/api/knowledge-base/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          practiceId: currentPractice?.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAnswer(data.answer)
        setRelevantArticles(data.relevantArticles)
      }
    } catch (error) {
      console.error("[v0] Error in AI search:", error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            KI-gestützte Suche
          </DialogTitle>
          <DialogDescription>
            Stellen Sie eine Frage und die KI durchsucht die gesamte Wissensdatenbank für Sie.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="z.B. Wie führe ich eine Hygieneinspektion durch?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              <Search className="mr-2 h-4 w-4" />
              {isSearching ? "Suche..." : "Suchen"}
            </Button>
          </div>

          {answer && (
            <Card>
              <CardHeader>
                <CardTitle>Antwort</CardTitle>
              </CardHeader>
              <CardContent>
                <FormattedAIContent content={answer} />
              </CardContent>
            </Card>
          )}

          {relevantArticles.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Relevante Artikel:</h3>
              {relevantArticles.map((article) => (
                <Card key={article.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{article.title}</CardTitle>
                    <CardDescription>{article.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{article.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
