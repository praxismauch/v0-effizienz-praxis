"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Award, RefreshCw, Send } from "lucide-react"
import type { KudosForm, TeamMember } from "../types"
import { KUDOS_CATEGORIES } from "../types"

interface KudosDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kudosForm: KudosForm
  onKudosFormChange: (form: KudosForm) => void
  teamMembers: TeamMember[]
  currentUserId?: string
  isSubmitting: boolean
  onSubmit: () => void
}

export function KudosDialog({
  open, onOpenChange, kudosForm, onKudosFormChange,
  teamMembers, currentUserId, isSubmitting, onSubmit,
}: KudosDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Kudos senden
          </DialogTitle>
          <DialogDescription>{"Zeigen Sie Anerkennung für Ihre Kolleg:innen"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>An wen?</Label>
            <Select
              value={kudosForm.to_user_id}
              onValueChange={(v) => onKudosFormChange({ ...kudosForm, to_user_id: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={"Team-Mitglied auswählen"} />
              </SelectTrigger>
              <SelectContent>
                {teamMembers
                  .filter((m) => m.id !== currentUserId)
                  .map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={member.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{member.name?.[0]}</AvatarFallback>
                        </Avatar>
                        {member.name}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Kategorie</Label>
            <Select value={kudosForm.category} onValueChange={(v) => onKudosFormChange({ ...kudosForm, category: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={"Kategorie auswählen"} />
              </SelectTrigger>
              <SelectContent>
                {KUDOS_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${cat.color}`}>
                        <cat.icon className="h-3 w-3 text-white" />
                      </div>
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nachricht</Label>
            <Textarea
              placeholder={"Was möchten Sie sagen?"}
              value={kudosForm.message}
              onChange={(e) => onKudosFormChange({ ...kudosForm, message: e.target.value })}
              className="mt-1"
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={kudosForm.is_anonymous}
              onChange={(e) => onKudosFormChange({ ...kudosForm, is_anonymous: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="anonymous" className="text-sm cursor-pointer">Anonym senden</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Senden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
