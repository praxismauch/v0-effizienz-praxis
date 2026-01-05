"use client"

import { useState } from "react"
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
import { Sparkles, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FormattedAIContent } from "@/components/formatted-ai-content"

interface AITextGeneratorProps {
  onInsert: (text: string) => void
  fieldLabel: string
  context?: string
}

export function AITextGenerator({ onInsert, fieldLabel, context }: AITextGeneratorProps) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [generatedText, setGeneratedText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setError(null)
    setGeneratedText("")

    try {
      const response = await fetch("/api/hiring/ai-generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          context: context || "",
          fieldType: fieldLabel,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 402) {
          setError(errorData.error || "Kreditkarte erforderlich für AI Gateway")
        } else {
          setError(errorData.error || "Fehler beim Generieren des Textes")
        }
        return
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        setError("Fehler beim Lesen der Antwort")
        return
      }

      let accumulatedText = ""
      let chunkCount = 0
      while (true) {
        const { done, value } = await reader.read()

        chunkCount++

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        accumulatedText += chunk
        setGeneratedText(accumulatedText)
      }
    } catch (err) {
      console.error("[v0] AI generation error:", err)
      setError("Fehler beim Generieren des Textes")
    } finally {
      setLoading(false)
    }
  }

  const handleInsert = () => {
    if (generatedText) {
      onInsert(generatedText)
      setOpen(false)
      setPrompt("")
      setGeneratedText("")
      setError(null)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="ml-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 transition-colors"
      >
        <Sparkles className="h-4 w-4 mr-1 text-primary" />
        <span className="text-primary font-medium">KI</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>KI-Textgenerator</DialogTitle>
            <DialogDescription>Beschreiben Sie, was Sie für "{fieldLabel}" generieren möchten</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-prompt">Ihre Anfrage</Label>
              <Textarea
                id="ai-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="z.B. 'Erstelle eine Stellenbeschreibung für eine MFA-Position in einer Allgemeinarztpraxis'"
                rows={3}
              />
            </div>

            <Button onClick={handleGenerate} disabled={loading || !prompt.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generiere...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generieren
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {generatedText && (
              <div className="space-y-2">
                <Label>Generierter Text</Label>
                <div className="border border-border/50 rounded-lg p-5 bg-muted/50 max-h-80 overflow-y-auto">
                  <FormattedAIContent content={generatedText} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleInsert} disabled={!generatedText}>
              Text einfügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default AITextGenerator
