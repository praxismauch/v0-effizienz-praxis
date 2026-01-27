"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Loader2, Copy, Check } from "lucide-react"
import { FormattedAIContent } from "@/components/formatted-ai-content"

interface AIWritingAssistantProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (content: string) => void
  currentContent?: string
  defaultPrompt?: string
}

export function AIWritingAssistant({
  open,
  onOpenChange,
  onInsert,
  currentContent = "",
  defaultPrompt = "",
}: AIWritingAssistantProps) {
  const [prompt, setPrompt] = useState("")
  const [action, setAction] = useState<"generate" | "improve" | "expand" | "summarize">("generate")
  const [copied, setCopied] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)

  useEffect(() => {
    if (open && defaultPrompt && action === "generate") {
      setPrompt(defaultPrompt)
    }
  }, [open, defaultPrompt, action])

  const handleGenerate = async () => {
    if (!prompt.trim() && action === "generate") {
      return
    }

    setIsLoading(true)
    setGeneratedContent("")
    setError(null)
    setIsFallback(false)

    try {
      const requestBody = {
        prompt,
        action,
        context: currentContent,
      }

      const response = await fetch("/api/knowledge-base/ai-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to generate content: ${response.status}`)
      }

      const data = await response.json()
      const content = data.text || ""

      setGeneratedContent(content)
      if (data.isFallback) {
        setIsFallback(true)
        setError(data.message || "KI-Assistent ist derzeit nicht verfügbar.")
      }
    } catch (error) {
      console.error("Error generating content:", error)
      const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler"
      setError(`Fehler beim Generieren des Inhalts: ${errorMessage}`)
      setGeneratedContent("")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInsert = () => {
    if (generatedContent) {
      onInsert(generatedContent)
      onOpenChange(false)
      setPrompt("")
      setGeneratedContent("")
      setError(null)
      setIsFallback(false)
    }
  }

  const handleCopy = async () => {
    if (generatedContent) {
      await navigator.clipboard.writeText(generatedContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI-Schreibassistent
          </DialogTitle>
          <DialogDescription>Lassen Sie sich von KI beim Schreiben Ihrer Dokumentation unterstützen</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          <div className="space-y-2">
            <Label htmlFor="action">Aktion</Label>
            <Select value={action} onValueChange={(value: "generate" | "improve" | "expand" | "summarize") => setAction(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="generate">Neuen Text generieren</SelectItem>
                <SelectItem value="improve">Text verbessern</SelectItem>
                <SelectItem value="expand">Text erweitern</SelectItem>
                <SelectItem value="summarize">Text zusammenfassen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">
              {action === "generate" ? "Was möchten Sie schreiben?" : "Zusätzliche Anweisungen (optional)"}
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                action === "generate"
                  ? "z.B. 'Hygienemaßnahmen bei der Wundversorgung'"
                  : "z.B. 'Füge mehr Details zu den rechtlichen Anforderungen hinzu'"
              }
              rows={3}
              className="resize-none"
            />
          </div>

          {action !== "generate" && currentContent && (
            <div className="space-y-2">
              <Label>Aktueller Text</Label>
              <div className="p-3 bg-muted rounded-md text-sm max-h-32 overflow-auto">
                <div dangerouslySetInnerHTML={{ __html: currentContent }} />
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isLoading || (!prompt.trim() && action === "generate")}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generiere...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generieren
              </>
            )}
          </Button>

          {error && (
            <div
              className={`p-3 border rounded-md text-sm ${
                isFallback
                  ? "bg-warning/10 border-warning/20 text-warning-foreground"
                  : "bg-destructive/10 border-destructive/20 text-destructive"
              }`}
            >
              {error}
            </div>
          )}

          {generatedContent && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{isFallback ? "Platzhaltertext" : "Generierter Text"}</Label>
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="p-5 bg-muted/50 border border-border/50 rounded-lg max-h-96 overflow-auto">
                <FormattedAIContent content={generatedContent} />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setPrompt("")
              setGeneratedContent("")
              setError(null)
              setIsFallback(false)
            }}
          >
            Abbrechen
          </Button>
          <Button onClick={handleInsert} disabled={!generatedContent}>
            Text einfügen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
