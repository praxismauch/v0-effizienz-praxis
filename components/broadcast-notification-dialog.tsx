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
import { useToast } from "@/hooks/use-toast"
import { Send, Loader2 } from "lucide-react"

interface BroadcastNotificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  practices?: Array<{ id: string; name: string }>
}

const BroadcastNotificationDialog = ({ open, onOpenChange, practices = [] }: BroadcastNotificationDialogProps) => {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [type, setType] = useState<string>("system_announcement")
  const [link, setLink] = useState("")
  const [practiceId, setPracticeId] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Fehler",
        description: "Titel und Nachricht sind erforderlich.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          type,
          link: link.trim() || undefined,
          practiceId: practiceId === "all" ? undefined : practiceId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to broadcast notification")
      }

      const data = await response.json()

      toast({
        title: "Benachrichtigung gesendet",
        description: `Erfolgreich an ${data.sentCount} Benutzer gesendet.`,
      })

      // Reset form
      setTitle("")
      setMessage("")
      setType("system_announcement")
      setLink("")
      setPracticeId("all")
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error broadcasting:", error)
      toast({
        title: "Fehler",
        description: "Benachrichtigung konnte nicht gesendet werden.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Benachrichtigung senden</DialogTitle>
          <DialogDescription>
            Senden Sie eine Benachrichtigung an alle Benutzer oder eine bestimmte Praxis.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Neue Funktion verfügbar"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">Nachricht *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Beschreiben Sie die Benachrichtigung..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Typ</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system_announcement">System-Ankündigung</SelectItem>
                  <SelectItem value="practice_update">Praxis-Update</SelectItem>
                  <SelectItem value="general">Allgemein</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="practice">Empfänger</Label>
              <Select value={practiceId} onValueChange={setPracticeId}>
                <SelectTrigger id="practice">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Benutzer</SelectItem>
                  {practices.map((practice) => (
                    <SelectItem key={practice.id} value={practice.id}>
                      {practice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="link">Link (optional)</Label>
            <Input
              id="link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="z.B. /dashboard oder /help"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Senden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default BroadcastNotificationDialog
