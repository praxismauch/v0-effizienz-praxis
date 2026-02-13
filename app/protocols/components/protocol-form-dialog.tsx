"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Calendar, User, CheckSquare, X } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { AttendeesPickerInline } from "./attendees-picker"

interface ProtocolItem {
  id: string
  title: string
  responsibleId: string | null
  responsibleName: string
  dueDate: Date | null
}

interface TeamMember {
  id: string
  name: string
  role?: string
  avatar_url?: string
  user_id?: string
  team_member_id?: string
}

export interface ProtocolFormData {
  title: string
  description: string
  category: string
  content: string
  protocolDate: Date
  actionItems: ProtocolItem[]
  attendees: string[]
}

interface ProtocolFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: ProtocolFormData
  onFormDataChange: (data: ProtocolFormData) => void
  onSubmit: () => void
  isSaving: boolean
  mode: "create" | "edit"
  teamMembers: TeamMember[]
}

export function ProtocolFormDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  isSaving,
  mode,
  teamMembers,
}: ProtocolFormDialogProps) {
  const isCreate = mode === "create"

  const setField = <K extends keyof ProtocolFormData>(key: K, value: ProtocolFormData[K]) => {
    onFormDataChange({ ...formData, [key]: value })
  }

  const addActionItem = () => {
    const newItem: ProtocolItem = {
      id: crypto.randomUUID(),
      title: "",
      responsibleId: null,
      responsibleName: "",
      dueDate: null,
    }
    setField("actionItems", [...formData.actionItems, newItem])
  }

  const updateActionItem = (id: string, updates: Partial<ProtocolItem>) => {
    setField(
      "actionItems",
      formData.actionItems.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }

  const removeActionItem = (id: string) => {
    setField(
      "actionItems",
      formData.actionItems.filter((item) => item.id !== id)
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isCreate ? "Neues Protokoll erstellen" : "Protokoll bearbeiten"}</DialogTitle>
          <DialogDescription>
            {isCreate ? "Erstellen Sie ein neues Gesprächsprotokoll" : "Bearbeiten Sie das Gesprächsprotokoll"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${mode}-title`}>Titel *</Label>
              <Input
                id={`${mode}-title`}
                value={formData.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="z.B. Teambesprechung KW 48"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${mode}-category`}>Kategorie</Label>
              <Select value={formData.category} onValueChange={(value) => setField("category", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Allgemein</SelectItem>
                  <SelectItem value="team">Teambesprechung</SelectItem>
                  <SelectItem value="patient">Patientenbesprechung</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                  <SelectItem value="training">Schulung</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isCreate && (
            <div className="space-y-2">
              <Label htmlFor="protocolDate">Datum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.protocolDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.protocolDate
                      ? format(formData.protocolDate, "dd.MM.yyyy", { locale: de })
                      : "Datum auswählen"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.protocolDate}
                    onSelect={(date) => date && setField("protocolDate", date)}
                    locale={de}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={`${mode}-description`}>Beschreibung</Label>
            <Input
              id={`${mode}-description`}
              value={formData.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Kurze Beschreibung des Meetings"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${mode}-content`}>Inhalt / Notizen</Label>
            <Textarea
              id={`${mode}-content`}
              value={formData.content}
              onChange={(e) => setField("content", e.target.value)}
              placeholder="Protokollinhalt, Notizen, Beschlüsse..."
              rows={6}
            />
          </div>

          <AttendeesPickerInline
            teamMembers={teamMembers}
            selectedIds={formData.attendees || []}
            onChange={(attendees) => setField("attendees", attendees)}
          />

          {/* Action Items Section - only in create mode */}
          {isCreate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Aktionspunkte / Todos
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addActionItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Hinzufügen
                </Button>
              </div>

              {formData.actionItems.length > 0 && (
                <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                  {formData.actionItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 bg-background rounded-md border">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={item.title}
                          onChange={(e) => updateActionItem(item.id, { title: e.target.value })}
                          placeholder="Aufgabe beschreiben..."
                          className="font-medium"
                        />
                        <div className="flex items-center gap-2">
                          <Select
                            value={item.responsibleId || "unassigned"}
                            onValueChange={(value) => {
                              const member = teamMembers.find((m: any) => (m.user_id || m.id || m.team_member_id) === value)
                              updateActionItem(item.id, {
                                responsibleId: value === "unassigned" ? null : value,
                                responsibleName: member?.name || "",
                              })
                            }}
                          >
                            <SelectTrigger className="w-[200px]">
                              <User className="h-4 w-4 mr-2" />
                              <SelectValue placeholder="Verantwortlich" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="max-h-[300px]">
                              <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                              {teamMembers.map((member: any) => {
                                const memberId = member.user_id || member.id || member.team_member_id
                                if (!memberId) return null
                                return (
                                  <SelectItem key={memberId} value={memberId}>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                                        <AvatarFallback className="text-xs">
                                          {member.name?.charAt(0) || "?"}
                                        </AvatarFallback>
                                      </Avatar>
                                      {member.name}
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>

                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="w-[140px] bg-transparent">
                                <Calendar className="h-4 w-4 mr-2" />
                                {item.dueDate ? format(item.dueDate, "dd.MM.yy", { locale: de }) : "Fällig am"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={item.dueDate || undefined}
                                onSelect={(date) => updateActionItem(item.id, { dueDate: date || null })}
                                locale={de}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeActionItem(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSubmit} disabled={isSaving || !formData.title.trim()}>
            {isSaving
              ? isCreate
                ? "Wird erstellt..."
                : "Wird gespeichert..."
              : isCreate
                ? "Protokoll erstellen"
                : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
