"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sparkles, Loader2 } from "lucide-react"
import type { DashboardTile } from "./types"

// AI Generation Dialog
interface AIGenerationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  aiPrompt: string
  onAIPromptChange: (prompt: string) => void
  aiMode: "diagram" | "tile"
  onAIModeChange: (mode: "diagram" | "tile") => void
  onGenerate: () => void
  isGenerating: boolean
  availableParameters: any[]
}

export function AIGenerationDialog({
  open,
  onOpenChange,
  aiPrompt,
  onAIPromptChange,
  aiMode,
  onAIModeChange,
  onGenerate,
  isGenerating,
  availableParameters,
}: AIGenerationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Mit KI erstellen
          </DialogTitle>
          <DialogDescription>Beschreiben Sie, was Sie erstellen mochten</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label>Was mochten Sie erstellen?</Label>
            <div className="flex gap-2">
              <Button
                variant={aiMode === "diagram" ? "default" : "outline"}
                size="sm"
                onClick={() => onAIModeChange("diagram")}
                className="flex-1"
              >
                Diagramm
              </Button>
              <Button
                variant={aiMode === "tile" ? "default" : "outline"}
                size="sm"
                onClick={() => onAIModeChange("tile")}
                className="flex-1"
              >
                Kachel
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ai-prompt">Beschreibung</Label>
            <Textarea
              id="ai-prompt"
              value={aiPrompt}
              onChange={(e) => onAIPromptChange(e.target.value)}
              placeholder={
                aiMode === "diagram"
                  ? "z.B. Zeige mir die Entwicklung der Patientenzahlen als Liniendiagramm"
                  : "z.B. Erstelle eine Kachel fur den aktuellen Tagesumsatz in grun"
              }
              rows={4}
            />
          </div>
          {aiMode === "diagram" && availableParameters.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Verfugbare KPI-Parameter:</p>
              <p className="truncate">{availableParameters.map((p: any) => p.name).join(", ")}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onGenerate} disabled={!aiPrompt.trim() || isGenerating} className="gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generiere...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generieren
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Custom Diagram Dialog
interface CustomDiagramDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableParameters: any[]
  onSubmit: (data: { title: string; description: string; chartType: "area" | "line" | "bar" | "pie"; parameterIds: string[] }) => void
}

export function CustomDiagramDialog({ open, onOpenChange, availableParameters, onSubmit }: CustomDiagramDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [chartType, setChartType] = useState<"area" | "line" | "bar" | "pie">("line")
  const [selectedParams, setSelectedParams] = useState<string[]>([])

  const handleSubmit = () => {
    if (!title.trim() || selectedParams.length === 0) return
    onSubmit({ title, description, chartType, parameterIds: selectedParams })
    setTitle("")
    setDescription("")
    setChartType("line")
    setSelectedParams([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Benutzerdefiniertes Diagramm erstellen</DialogTitle>
          <DialogDescription>Erstellen Sie ein neues Diagramm mit Ihren eigenen KPI-Parametern</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="diagram-title">Titel</Label>
            <Input id="diagram-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z.B. Umsatzentwicklung" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="diagram-description">Beschreibung</Label>
            <Textarea id="diagram-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="z.B. Monatlicher Umsatz im Vergleich" rows={2} />
          </div>
          <div className="grid gap-2">
            <Label>Diagrammtyp</Label>
            <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Liniendiagramm</SelectItem>
                <SelectItem value="area">Flachendiagramm</SelectItem>
                <SelectItem value="bar">Balkendiagramm</SelectItem>
                <SelectItem value="pie">Kreisdiagramm</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>KPI-Parameter auswahlen</Label>
            <ScrollArea className="h-48 rounded-md border p-4">
              {availableParameters.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Keine KPI-Parameter verfugbar.</p>
              ) : (
                <div className="space-y-2">
                  {availableParameters.map((param: any) => (
                    <div key={param.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`param-${param.id}`}
                        checked={selectedParams.includes(param.id)}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedParams([...selectedParams, param.id])
                          else setSelectedParams(selectedParams.filter((p) => p !== param.id))
                        }}
                      />
                      <label htmlFor={`param-${param.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {param.name}
                        {param.unit && <span className="text-muted-foreground ml-1">({param.unit})</span>}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <p className="text-xs text-muted-foreground">{selectedParams.length} Parameter ausgewahlt</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || selectedParams.length === 0}>Diagramm erstellen</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Tile Edit/Create Dialog
interface TileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTile: DashboardTile | null
  onSubmit: (data: { title: string; description: string; type: DashboardTile["type"]; color: DashboardTile["color"]; size: DashboardTile["size"]; value: string; unit: string }) => void
}

export function TileDialog({ open, onOpenChange, editingTile, onSubmit }: TileDialogProps) {
  const [title, setTitle] = useState(editingTile?.title || "")
  const [description, setDescription] = useState(editingTile?.description || "")
  const [type, setType] = useState<DashboardTile["type"]>(editingTile?.type || "stat")
  const [color, setColor] = useState<DashboardTile["color"]>(editingTile?.color || "default")
  const [size, setSize] = useState<DashboardTile["size"]>(editingTile?.size || "small")
  const [value, setValue] = useState(editingTile?.value || "")
  const [unit, setUnit] = useState(editingTile?.unit || "")

  // Reset form when editingTile changes
  const handleSubmit = () => {
    if (!title.trim()) return
    onSubmit({ title, description, type, color, size, value, unit })
    setTitle("")
    setDescription("")
    setType("stat")
    setColor("default")
    setSize("small")
    setValue("")
    setUnit("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingTile ? "Kachel bearbeiten" : "Neue Kachel erstellen"}</DialogTitle>
          <DialogDescription>{editingTile ? "Bearbeiten Sie die Eigenschaften der Kachel" : "Erstellen Sie eine neue Kachel fur Ihr Dashboard"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="tile-title">Titel</Label>
            <Input id="tile-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z.B. Patienten heute" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tile-description">Beschreibung</Label>
            <Input id="tile-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Typ</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="stat">Statistik</SelectItem>
                  <SelectItem value="chart">Mini-Chart</SelectItem>
                  <SelectItem value="progress">Fortschritt</SelectItem>
                  <SelectItem value="list">Liste</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Farbe</Label>
              <Select value={color} onValueChange={(v: any) => setColor(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Standard</SelectItem>
                  <SelectItem value="blue">Blau</SelectItem>
                  <SelectItem value="green">Grun</SelectItem>
                  <SelectItem value="yellow">Gelb</SelectItem>
                  <SelectItem value="red">Rot</SelectItem>
                  <SelectItem value="purple">Lila</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Grosse</Label>
            <Select value={size} onValueChange={(v: any) => setSize(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Klein (1 Spalte)</SelectItem>
                <SelectItem value="medium">Mittel (2 Spalten)</SelectItem>
                <SelectItem value="large">Gross (3 Spalten)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tile-value">Wert</Label>
              <Input id="tile-value" value={value} onChange={(e) => setValue(e.target.value)} placeholder="z.B. 24" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tile-unit">Einheit</Label>
              <Input id="tile-unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="z.B. Patienten" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>{editingTile ? "Speichern" : "Erstellen"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
