"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Workflow } from "@/contexts/workflow-context"
import { Save } from "lucide-react"
import { formatDateTimeDE } from "@/lib/utils"
import { categoryLabels, priorityLabels } from "./constants"

interface EditForm {
  title: string
  description: string
  category: string
  priority: "urgent" | "high" | "medium" | "low"
}

interface SettingsTabProps {
  workflow: Workflow
  editForm: EditForm
  isSaving: boolean
  onEditFormChange: (form: EditForm) => void
  onSave: () => void
}

export function SettingsTab({ workflow, editForm, isSaving, onEditFormChange, onSave }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workflow-Einstellungen</CardTitle>
          <CardDescription>Bearbeiten Sie die grundlegenden Einstellungen des Workflows</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-title">Name</Label>
            <Input
              id="settings-title"
              value={editForm.title}
              onChange={(e) => onEditFormChange({ ...editForm, title: e.target.value })}
              placeholder="Name des Workflows"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-description">Beschreibung</Label>
            <Textarea
              id="settings-description"
              value={editForm.description}
              onChange={(e) => onEditFormChange({ ...editForm, description: e.target.value })}
              placeholder="Beschreiben Sie den Workflow..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="settings-category">Kategorie</Label>
              <Select
                value={editForm.category}
                onValueChange={(value) => onEditFormChange({ ...editForm, category: value })}
              >
                <SelectTrigger id="settings-category">
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-priority">Priorität</Label>
              <Select
                value={editForm.priority}
                onValueChange={(value: "urgent" | "high" | "medium" | "low") =>
                  onEditFormChange({ ...editForm, priority: value })
                }
              >
                <SelectTrigger id="settings-priority">
                  <SelectValue placeholder="Priorität wählen" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={onSave} disabled={isSaving || !editForm.title.trim()}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Speichern..." : "Änderungen speichern"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workflow-Informationen</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Erstellt am</dt>
              <dd className="font-medium">{workflow.createdAt ? formatDateTimeDE(workflow.createdAt) : "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Zuletzt aktualisiert</dt>
              <dd className="font-medium">{workflow.updatedAt ? formatDateTimeDE(workflow.updatedAt) : "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Anzahl Schritte</dt>
              <dd className="font-medium">{workflow.steps.length}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Geschätzte Dauer</dt>
              <dd className="font-medium">
                {workflow.estimatedTotalDuration ? `${workflow.estimatedTotalDuration} Min.` : "-"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
