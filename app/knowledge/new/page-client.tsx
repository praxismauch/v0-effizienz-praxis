"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Sparkles, BookOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAiEnabled } from "@/lib/hooks/use-ai-enabled"
import { AppLayout } from "@/components/app-layout"

const categoryOptions = [
  { value: "procedure", label: "Verfahren" },
  { value: "policy", label: "Richtlinie" },
  { value: "faq", label: "FAQ" },
  { value: "guide", label: "Anleitung" },
  { value: "template", label: "Vorlage" },
  { value: "other", label: "Sonstiges" },
]

export default function NewKnowledgeEntryPageClient() {
  const router = useRouter()
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const { isAiEnabled } = useAiEnabled()

  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "other",
    tags: "",
  })

  const handleSave = async () => {
    if (!currentPractice?.id || !formData.title.trim() || !formData.content.trim()) {
      toast({ title: "Fehler", description: "Bitte füllen Sie Titel und Inhalt aus.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/knowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      })

      if (response.ok) {
        toast({ title: "Eintrag erstellt", description: "Der Wissensdatenbank-Eintrag wurde erfolgreich erstellt." })
        router.push("/knowledge")
      } else {
        throw new Error("Failed to create entry")
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Der Eintrag konnte nicht erstellt werden.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleGenerateContent = async () => {
    if (!currentPractice?.id || !formData.title.trim()) {
      toast({ title: "Hinweis", description: "Bitte geben Sie zuerst einen Titel ein.", variant: "default" })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch(`/api/knowledge-base/auto-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practiceId: currentPractice.id,
          title: formData.title,
          category: formData.category,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setFormData((prev) => ({
          ...prev,
          content: data.content || prev.content,
          tags: data.tags?.join(", ") || prev.tags,
        }))
        toast({ title: "Inhalt generiert", description: "KI hat einen Entwurf erstellt." })
      } else {
        throw new Error("Failed to generate content")
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Inhalt konnte nicht generiert werden.", variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  if (!user || !currentPractice) {
    return <AppLayout loading loadingMessage="Laden..." />
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Neuer Wissensdatenbank-Eintrag</h1>
            <p className="text-muted-foreground">Erstellen Sie einen neuen Eintrag für die Wissensdatenbank</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Eintrag Details
            </CardTitle>
            <CardDescription>Füllen Sie die folgenden Felder aus, um einen neuen Eintrag zu erstellen.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="z.B. Einarbeitungsprozess für neue Mitarbeiter"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">Inhalt *</Label>
                {isAiEnabled && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateContent}
                    disabled={isGenerating || !formData.title.trim()}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isGenerating ? "Generiere..." : "Mit KI generieren"}
                  </Button>
                )}
              </div>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Geben Sie hier den Inhalt des Eintrags ein..."
                className="min-h-[300px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (kommagetrennt)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                placeholder="z.B. Onboarding, HR, Prozess"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !formData.title.trim() || !formData.content.trim()}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Speichere..." : "Speichern"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
