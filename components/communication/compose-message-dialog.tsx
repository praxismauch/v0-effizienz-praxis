"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import type { TeamMember, NewMessageData } from "./types"

interface ComposeMessageDialogProps {
  teamMembers: TeamMember[]
  onSend: (message: NewMessageData) => Promise<boolean>
}

export function ComposeMessageDialog({ teamMembers, onSend }: ComposeMessageDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [newMessage, setNewMessage] = useState<NewMessageData>({
    recipient_id: "",
    subject: "",
    content: "",
  })

  const handleSend = async () => {
    if (!newMessage.recipient_id || !newMessage.subject || !newMessage.content) {
      toast.error("Bitte füllen Sie alle Felder aus")
      return
    }

    setIsSending(true)
    const success = await onSend(newMessage)
    if (success) {
      setIsOpen(false)
      setNewMessage({ recipient_id: "", subject: "", content: "" })
    }
    setIsSending(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Neue Nachricht
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Neue Nachricht</DialogTitle>
          <DialogDescription>Senden Sie eine Nachricht an ein Teammitglied.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Empfänger</label>
            <Select
              value={newMessage.recipient_id}
              onValueChange={(value) => setNewMessage((prev) => ({ ...prev, recipient_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Empfänger auswählen..." />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[300px]">
                {teamMembers.map((member) => {
                  const memberId = member.user_id || member.id || member.team_member_id
                  if (!memberId) return null
                  return (
                    <SelectItem key={memberId} value={memberId}>
                      {member.first_name} {member.last_name} ({member.role})
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Betreff</label>
            <Input
              placeholder="Betreff eingeben..."
              value={newMessage.subject}
              onChange={(e) => setNewMessage((prev) => ({ ...prev, subject: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nachricht</label>
            <Textarea
              placeholder="Ihre Nachricht..."
              rows={5}
              value={newMessage.content}
              onChange={(e) => setNewMessage((prev) => ({ ...prev, content: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? "Senden..." : "Senden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
