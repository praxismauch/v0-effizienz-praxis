"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { CustomForm, Parameter } from "./types"
import { getRoleLabel } from "@/lib/roles"

interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: Partial<CustomForm>
  onFormDataChange: (data: Partial<CustomForm>) => void
  parameters: Parameter[]
  teamMembers: { id: string; name: string; role?: string }[]
  onSubmit: () => void
  title: string
  description: string
  submitLabel: string
}

export function FormDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  parameters,
  teamMembers,
  onSubmit,
  title,
  description,
  submitLabel,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="form-name">Formularname</Label>
              <Input
                id="form-name"
                value={formData.name}
                onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
                placeholder="z.B. Täglicher Praxisbericht"
              />
            </div>
            <div>
              <Label htmlFor="form-frequency">Häufigkeit</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: any) => onFormDataChange({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Einmalig</SelectItem>
                  <SelectItem value="daily">Täglich</SelectItem>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="form-description">Beschreibung</Label>
            <Textarea
              id="form-description"
              value={formData.description}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              placeholder="Beschreiben Sie den Zweck dieses Formulars..."
              rows={3}
            />
          </div>

          <div>
            <Label>Parameter auswählen</Label>
            <div className="grid grid-cols-2 gap-2 mt-2 p-4 border rounded-lg bg-muted/50 max-h-48 overflow-y-auto">
              {parameters.map((param) => (
                <div key={param.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`param-${param.id}`}
                    checked={formData.parameters?.includes(param.id)}
                    onCheckedChange={(checked) => {
                      const currentParams = formData.parameters || []
                      const newParams = checked
                        ? [...currentParams, param.id]
                        : currentParams.filter((id) => id !== param.id)
                      onFormDataChange({ ...formData, parameters: newParams })
                    }}
                  />
                  <Label htmlFor={`param-${param.id}`} className="text-sm">
                    <div className="font-medium">{param.name}</div>
                    <div className="text-xs text-muted-foreground">{param.category}</div>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Teammitgliedern zuweisen</Label>
            <div className="grid grid-cols-2 gap-2 mt-2 p-4 border rounded-lg bg-muted/50 max-h-48 overflow-y-auto">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`user-${member.id}`}
                    checked={formData.assignedUsers?.includes(member.id)}
                    onCheckedChange={(checked) => {
                      const currentUsers = formData.assignedUsers || []
                      const newUsers = checked
                        ? [...currentUsers, member.id]
                        : currentUsers.filter((id) => id !== member.id)
                      onFormDataChange({ ...formData, assignedUsers: newUsers })
                    }}
                  />
                  <Label htmlFor={`user-${member.id}`} className="text-sm">
                    <div className="font-medium">{member.name}</div>
                    {member.role && <div className="text-xs text-muted-foreground">{getRoleLabel(member.role)}</div>}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="form-due-date">Fälligkeitsdatum (optional)</Label>
              <Input
                id="form-due-date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => onFormDataChange({ ...formData, dueDate: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="form-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => onFormDataChange({ ...formData, isActive: checked })}
              />
              <Label htmlFor="form-active">Aktiv</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSubmit}>{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
