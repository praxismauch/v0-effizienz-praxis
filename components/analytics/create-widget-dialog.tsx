"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Loader2, BarChart3, LineChart, PieChart, TrendingUp, Activity } from "lucide-react"
import type { WidgetItem } from "@/components/analytics/widget-library"

interface CreateWidgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingWidget?: WidgetItem | null
  onSave: (widget: Partial<WidgetItem>) => Promise<void>
}

export function CreateWidgetDialog({ open, onOpenChange, editingWidget, onSave }: CreateWidgetDialogProps) {
  const [title, setTitle] = useState(editingWidget?.title || "")
  const [description, setDescription] = useState(editingWidget?.description || "")
  const [category, setCategory] = useState(editingWidget?.category || "overview")
  const [type, setType] = useState<"chart" | "stat" | "table" | "custom">(editingWidget?.type || "chart")
  const [chartType, setChartType] = useState<"bar" | "line" | "pie" | "area" | "radar">(
    editingWidget?.chartType || "bar",
  )
  const [aiPrompt, setAiPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return

    setIsGenerating(true)
    try {
      const response = await fetch("/api/ai/generate-widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      })

      if (response.ok) {
        const data = await response.json()
        setTitle(data.title || "")
        setDescription(data.description || "")
        setCategory(data.category || "overview")
        setType(data.type || "chart")
        setChartType(data.chartType || "bar")
      }
    } catch (error) {
      console.error("Error generating widget:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        id: editingWidget?.id || `widget-${Date.now()}`,
        title,
        description,
        category,
        type,
        chartType: type === "chart" ? chartType : undefined,
        enabled: editingWidget?.enabled ?? true,
      })
      onOpenChange(false)
      // Reset form
      setTitle("")
      setDescription("")
      setCategory("overview")
      setType("chart")
      setChartType("bar")
      setAiPrompt("")
    } catch (error) {
      console.error("Error saving widget:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingWidget ? "Widget bearbeiten" : "Neues Widget erstellen"}</DialogTitle>
          <DialogDescription>
            Erstellen Sie ein neues Diagramm oder Widget für Ihre Praxis-Auswertung
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manuell</TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="h-4 w-4 mr-2" />
              KI-Assistent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                placeholder="z.B. Monatliche Patientenzahlen"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                placeholder="Beschreiben Sie, was dieses Widget anzeigt..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Übersicht</SelectItem>
                    <SelectItem value="financial">Finanzen</SelectItem>
                    <SelectItem value="patients">Patienten</SelectItem>
                    <SelectItem value="operations">Betrieb</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Typ</Label>
                <Select value={type} onValueChange={(v) => setType(v as any)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chart">Diagramm</SelectItem>
                    <SelectItem value="stat">Kennzahl</SelectItem>
                    <SelectItem value="table">Tabelle</SelectItem>
                    <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {type === "chart" && (
              <div className="space-y-2">
                <Label>Diagrammtyp</Label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { value: "bar", icon: BarChart3, label: "Balken" },
                    { value: "line", icon: LineChart, label: "Linie" },
                    { value: "pie", icon: PieChart, label: "Kreis" },
                    { value: "area", icon: TrendingUp, label: "Fläche" },
                    { value: "radar", icon: Activity, label: "Radar" },
                  ].map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setChartType(value as any)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                        chartType === value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 mt-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium">KI-gestützte Widget-Erstellung</p>
                  <p className="text-xs text-muted-foreground">
                    Beschreiben Sie, welches Widget Sie erstellen möchten, und die KI generiert automatisch die
                    Konfiguration für Sie.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-prompt">Beschreiben Sie Ihr Widget</Label>
              <Textarea
                id="ai-prompt"
                placeholder="z.B. Ich möchte ein Liniendiagramm, das die Entwicklung der Patientenzahlen über die letzten 12 Monate zeigt..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={4}
              />
            </div>

            <Button onClick={handleAiGenerate} disabled={!aiPrompt.trim() || isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generiere...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Widget generieren
                </>
              )}
            </Button>

            {title && (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Vorschau</Badge>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                  <div className="flex gap-2">
                    <Badge variant="outline">{category}</Badge>
                    <Badge variant="outline">{type}</Badge>
                    {type === "chart" && <Badge variant="outline">{chartType}</Badge>}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={!title || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Speichere...
              </>
            ) : (
              "Speichern"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
