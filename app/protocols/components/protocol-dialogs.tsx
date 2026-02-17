"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, CheckSquare, Plus, User, Users, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { Protocol, TeamMember, ProtocolFormData, ProtocolItem } from "../types"
import { PROTOCOL_CATEGORIES } from "../types"
import { getRoleLabel } from "@/lib/roles"

interface CreateProtocolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: ProtocolFormData
  setFormData: React.Dispatch<React.SetStateAction<ProtocolFormData>>
  teamMembers: TeamMember[]
  isSaving: boolean
  onSave: () => void
  onAddActionItem: () => void
  onUpdateActionItem: (id: string, updates: Partial<ProtocolItem>) => void
  onRemoveActionItem: (id: string) => void
}

export function CreateProtocolDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  teamMembers,
  isSaving,
  onSave,
  onAddActionItem,
  onUpdateActionItem,
  onRemoveActionItem,
}: CreateProtocolDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neues Protokoll erstellen</DialogTitle>
          <DialogDescription>Erstellen Sie ein neues Gesprächsprotokoll</DialogDescription>
        </DialogHeader>

        <ProtocolForm
          formData={formData}
          setFormData={setFormData}
          teamMembers={teamMembers}
          onAddActionItem={onAddActionItem}
          onUpdateActionItem={onUpdateActionItem}
          onRemoveActionItem={onRemoveActionItem}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSave} disabled={isSaving || !formData.title.trim()}>
            {isSaving ? "Wird erstellt..." : "Protokoll erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface EditProtocolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: ProtocolFormData
  setFormData: React.Dispatch<React.SetStateAction<ProtocolFormData>>
  teamMembers: TeamMember[]
  isSaving: boolean
  onSave: () => void
}

export function EditProtocolDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  teamMembers,
  isSaving,
  onSave,
}: EditProtocolDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Protokoll bearbeiten</DialogTitle>
          <DialogDescription>Bearbeiten Sie das Gesprächsprotokoll</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titel *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="z.B. Teambesprechung KW 48"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Kategorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROTOCOL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Beschreibung</Label>
            <Input
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Kurze Beschreibung des Meetings"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-content">Inhalt / Notizen</Label>
            <Textarea
              id="edit-content"
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Protokollinhalt, Notizen, Beschlüsse..."
              rows={6}
            />
          </div>

          <AttendeesPicker
            teamMembers={teamMembers}
            selectedIds={formData.attendees || []}
            onChange={(attendees) => setFormData((prev) => ({ ...prev, attendees }))}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSave} disabled={isSaving || !formData.title.trim()}>
            {isSaving ? "Wird gespeichert..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteProtocolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  protocol: Protocol | null
  onConfirm: () => void
}

export function DeleteProtocolDialog({ open, onOpenChange, protocol, onConfirm }: DeleteProtocolDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Protokoll löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Sind Sie sicher, dass Sie das Protokoll "{protocol?.title}" löschen möchten? Diese Aktion kann
            nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Shared form component
interface ProtocolFormProps {
  formData: ProtocolFormData
  setFormData: React.Dispatch<React.SetStateAction<ProtocolFormData>>
  teamMembers: TeamMember[]
  onAddActionItem: () => void
  onUpdateActionItem: (id: string, updates: Partial<ProtocolItem>) => void
  onRemoveActionItem: (id: string) => void
}

function ProtocolForm({
  formData,
  setFormData,
  teamMembers,
  onAddActionItem,
  onUpdateActionItem,
  onRemoveActionItem,
}: ProtocolFormProps) {
  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Titel *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="z.B. Teambesprechung KW 48"
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
              {PROTOCOL_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="protocolDate">Datum</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.protocolDate && "text-muted-foreground",
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
              onSelect={(date) => date && setFormData((prev) => ({ ...prev, protocolDate: date }))}
              locale={de}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Kurze Beschreibung des Meetings"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Inhalt / Notizen</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
          placeholder="Protokollinhalt, Notizen, Beschlüsse..."
          rows={6}
        />
      </div>

      {/* Attendees Section */}
      <AttendeesPicker
        teamMembers={teamMembers}
        selectedIds={formData.attendees || []}
        onChange={(attendees) => setFormData((prev) => ({ ...prev, attendees }))}
      />

      {/* Action Items Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Aktionspunkte / Todos
          </Label>
          <Button type="button" variant="outline" size="sm" onClick={onAddActionItem}>
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
                    onChange={(e) => onUpdateActionItem(item.id, { title: e.target.value })}
                    placeholder="Aufgabe beschreiben..."
                    className="font-medium"
                  />
                  <div className="flex items-center gap-2">
                    <Select
                      value={item.responsibleId || "unassigned"}
                      onValueChange={(value) => {
                        const member = teamMembers.find((m) => m.id === value)
                        onUpdateActionItem(item.id, {
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
                        {teamMembers.map((member) => {
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
                          onSelect={(date) => onUpdateActionItem(item.id, { dueDate: date || null })}
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
                  onClick={() => onRemoveActionItem(item.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Attendees Picker Component
interface AttendeesPickerProps {
  teamMembers: TeamMember[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

function AttendeesPicker({ teamMembers, selectedIds, onChange }: AttendeesPickerProps) {
  const toggleMember = (memberId: string) => {
    if (selectedIds.includes(memberId)) {
      onChange(selectedIds.filter((id) => id !== memberId))
    } else {
      onChange([...selectedIds, memberId])
    }
  }

  const selectAll = () => {
    const allIds = teamMembers.map((m) => m.user_id || m.id || m.team_member_id).filter(Boolean) as string[]
    onChange(allIds)
  }

  const deselectAll = () => {
    onChange([])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Anwesende Teilnehmer
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {selectedIds.length} / {teamMembers.length} ausgewaehlt
          </span>
          {selectedIds.length < teamMembers.length ? (
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAll}>
              Alle
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={deselectAll}>
              Keine
            </Button>
          )}
        </div>
      </div>

      {teamMembers.length > 0 ? (
        <div className="border rounded-lg p-3 bg-muted/30 grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
          {teamMembers.map((member) => {
            const memberId = (member as any).user_id || member.id || (member as any).team_member_id
            if (!memberId) return null
            const isSelected = selectedIds.includes(memberId)
            return (
              <button
                key={memberId}
                type="button"
                onClick={() => toggleMember(memberId)}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md text-left transition-colors text-sm",
                  isSelected
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-background border border-transparent hover:bg-muted",
                )}
              >
                <Checkbox checked={isSelected} className="pointer-events-none" />
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">
                    {member.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <span className="truncate block">{member.name}</span>
                  {member.role && (
                    <span className="text-xs text-muted-foreground truncate block">{getRoleLabel(member.role)}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Keine Teammitglieder verfügbar</p>
      )}
    </div>
  )
}
