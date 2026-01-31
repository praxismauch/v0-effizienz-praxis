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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { Team } from "../types"

interface CreateTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTeamCreated: (team: Team) => void
}

const TEAM_COLORS = [
  { value: "blue", label: "Blau", hex: "#3b82f6" },
  { value: "green", label: "Grün", hex: "#22c55e" },
  { value: "purple", label: "Lila", hex: "#a855f7" },
  { value: "orange", label: "Orange", hex: "#f97316" },
  { value: "pink", label: "Pink", hex: "#ec4899" },
  { value: "yellow", label: "Gelb", hex: "#eab308" },
  { value: "red", label: "Rot", hex: "#ef4444" },
  { value: "teal", label: "Türkis", hex: "#14b8a6" },
  { value: "indigo", label: "Indigo", hex: "#6366f1" },
]

export default function CreateTeamDialog({
  open,
  onOpenChange,
  onTeamCreated,
}: CreateTeamDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("blue")

  const resetForm = () => {
    setName("")
    setDescription("")
    setColor("blue")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    setIsSubmitting(true)

    // Create new team object
    const newTeam: Team = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim() || undefined,
      color,
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    onTeamCreated(newTeam)
    resetForm()
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Neues Team erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie ein neues Team, um Ihre Mitarbeiter zu organisieren.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Empfang, Labor, Ärzte"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kurze Beschreibung des Teams..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="color">Farbe</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger>
                  <SelectValue placeholder="Farbe wählen" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_COLORS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: c.hex }}
                        />
                        {c.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Team erstellen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
