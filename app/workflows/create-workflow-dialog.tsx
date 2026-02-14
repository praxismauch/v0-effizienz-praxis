"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"

interface Category {
  id: string
  name: string
  is_active: boolean
}

interface CreateWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  newWorkflow: {
    title: string
    description: string
    category: string
    priority: "low" | "medium" | "high" | "urgent"
    teamIds: string[]
  }
  onWorkflowChange: (workflow: CreateWorkflowDialogProps["newWorkflow"]) => void
  categories: Category[]
  createError: string | null
  onSubmit: () => void
}

export function CreateWorkflowDialog({
  open,
  onOpenChange,
  newWorkflow,
  onWorkflowChange,
  categories,
  createError,
  onSubmit,
}: CreateWorkflowDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuer Workflow</DialogTitle>
          <DialogDescription>Erstellen Sie einen neuen Workflow für Ihre Praxis</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {createError && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {createError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={newWorkflow.title}
              onChange={(e) => onWorkflowChange({ ...newWorkflow, title: e.target.value })}
              placeholder="Workflow-Titel"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={newWorkflow.description}
              onChange={(e) => onWorkflowChange({ ...newWorkflow, description: e.target.value })}
              placeholder="Beschreiben Sie den Workflow..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Kategorie</Label>
            <Select
              value={newWorkflow.category}
              onValueChange={(value) => onWorkflowChange({ ...newWorkflow, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategorie auswählen" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((cat) => cat.is_active)
                  .map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priorität</Label>
            <Select
              value={newWorkflow.priority}
              onValueChange={(value: "low" | "medium" | "high" | "urgent") =>
                onWorkflowChange({ ...newWorkflow, priority: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Niedrig</SelectItem>
                <SelectItem value="medium">Mittel</SelectItem>
                <SelectItem value="high">Hoch</SelectItem>
                <SelectItem value="urgent">Dringend</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSubmit}>Erstellen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
