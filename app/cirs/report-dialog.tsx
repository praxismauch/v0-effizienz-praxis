"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, Sparkles, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { categories } from "./cirs-constants"

import type { CIRSIncident } from "./cirs-constants"

interface ReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editIncident?: CIRSIncident | null
  onSubmit: (data: {
    incident_type: string
    severity: string
    category: string
    title: string
    description: string
    contributing_factors: string
    immediate_actions: string
    is_anonymous: boolean
    generate_ai_suggestions: boolean
    add_to_knowledge: boolean
  }) => Promise<void>
}

export function ReportDialog({ open, onOpenChange, onSubmit, editIncident }: ReportDialogProps) {
  const [incidentType, setIncidentType] = useState<"error" | "near_error" | "adverse_event">("near_error")
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium")
  const [category, setCategory] = useState("medication")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [contributingFactors, setContributingFactors] = useState("")
  const [immediateActions, setImmediateActions] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [generateAISuggestions, setGenerateAISuggestions] = useState(true)
  const [addToKnowledge, setAddToKnowledge] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pre-fill form when editing an existing incident
  useEffect(() => {
    if (editIncident && open) {
      setIncidentType((editIncident.incident_type as any) || "near_error")
      setSeverity((editIncident.severity as any) || "medium")
      setCategory(editIncident.category || "medication")
      setTitle(editIncident.title || "")
      setDescription(editIncident.description || "")
      setContributingFactors(editIncident.contributing_factors || "")
      setImmediateActions(editIncident.immediate_actions || "")
      setIsAnonymous(editIncident.is_anonymous || false)
    } else if (!editIncident && open) {
      resetForm()
    }
  }, [editIncident, open])

  const resetForm = () => {
    setIncidentType("near_error")
    setSeverity("medium")
    setCategory("medication")
    setTitle("")
    setDescription("")
    setContributingFactors("")
    setImmediateActions("")
    setIsAnonymous(false)
    setGenerateAISuggestions(true)
    setAddToKnowledge(true)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit({
        incident_type: incidentType,
        severity,
        category,
        title,
        description,
        contributing_factors: contributingFactors,
        immediate_actions: immediateActions,
        is_anonymous: isAnonymous,
        generate_ai_suggestions: generateAISuggestions,
        add_to_knowledge: addToKnowledge,
      })
      resetForm()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editIncident ? "Vorfall bearbeiten" : "Vorfall melden"}</DialogTitle>
          <DialogDescription>
            {editIncident
              ? "Bearbeiten Sie die Details dieses Vorfalls."
              : "Melden Sie Fehler, Beinahe-Fehler oder unerwunschte Ereignisse. Ihre Meldung hilft, die Patientensicherheit zu verbessern."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              {isAnonymous ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              <div>
                <Label className="font-medium">Anonyme Meldung</Label>
                <p className="text-sm text-muted-foreground">Ihr Name wird nicht gespeichert</p>
              </div>
            </div>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>

          <div className="space-y-2">
            <Label>Art des Vorfalls *</Label>
            <RadioGroup value={incidentType} onValueChange={(value: string) => setIncidentType(value as typeof incidentType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="near_error" id="near_error" />
                <Label htmlFor="near_error" className="font-normal cursor-pointer">
                  Beinahe-Fehler (rechtzeitig erkannt)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="error" id="error" />
                <Label htmlFor="error" className="font-normal cursor-pointer">
                  Fehler (ist aufgetreten)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="adverse_event" id="adverse_event" />
                <Label htmlFor="adverse_event" className="font-normal cursor-pointer">
                  Unerwunschtes Ereignis
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">Schweregrad *</Label>
            <Select value={severity} onValueChange={(value: string) => setSeverity(value as typeof severity)}>
              <SelectTrigger id="severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Niedrig</SelectItem>
                <SelectItem value="medium">Mittel</SelectItem>
                <SelectItem value="high">Hoch</SelectItem>
                <SelectItem value="critical">Kritisch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategorie *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              placeholder="Kurze Zusammenfassung des Vorfalls"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung *</Label>
            <Textarea
              id="description"
              placeholder="Was ist passiert? Beschreiben Sie den Vorfall im Detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contributing_factors">{"Mogliche Ursachen / Beitragende Faktoren"}</Label>
            <Textarea
              id="contributing_factors"
              placeholder="Was konnte zu diesem Vorfall beigetragen haben?"
              value={contributingFactors}
              onChange={(e) => setContributingFactors(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="immediate_actions">{"Sofortmassnahmen"}</Label>
            <Textarea
              id="immediate_actions"
              placeholder="Welche Massnahmen wurden unmittelbar ergriffen?"
              value={immediateActions}
              onChange={(e) => setImmediateActions(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <div>
                <Label className="font-medium">{"KI-basierte Vorschlage"}</Label>
                <p className="text-sm text-muted-foreground">{"Automatische Analyse und Praventionsvorschlage generieren"}</p>
              </div>
            </div>
            <Switch checked={generateAISuggestions} onCheckedChange={setGenerateAISuggestions} />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              <div>
                <Label className="font-medium">{"Zur Wissensdatenbank hinzufügen"}</Label>
                <p className="text-sm text-muted-foreground">{"Analyse und Lösungen im Wissensbereich speichern"}</p>
              </div>
            </div>
            <Switch checked={addToKnowledge} onCheckedChange={setAddToKnowledge} />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !title.trim() || !description.trim()}>
            {isSubmitting ? "Wird gemeldet..." : "Vorfall melden"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
