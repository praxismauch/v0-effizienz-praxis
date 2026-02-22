"use client"

import type React from "react"

import { useState } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertTriangle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateSuperAdminDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSuperAdminDialog({ open, onOpenChange }: CreateSuperAdminDialogProps) {
  const { createSuperAdmin } = useUser()
  const { practices } = usePractice()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    defaultPracticeId: "none" as string,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.email.trim()) {
      alert("Bitte fuelleen Sie alle Pflichtfelder aus")
      return
    }

    if (!formData.email.includes("@")) {
      alert("Bitte geben Sie eine gueltige E-Mail-Adresse ein")
      return
    }

    setIsLoading(true)

    try {
      createSuperAdmin({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: "superadmin",
        practiceId: null,
        isActive: true,
        defaultPracticeId: formData.defaultPracticeId === "none" ? null : formData.defaultPracticeId,
      })

      // Reset form and close dialog
      setFormData({ name: "", email: "", defaultPracticeId: "none" })
      onOpenChange(false)

      alert(`Super-Admin "${formData.name}" wurde erfolgreich erstellt!`)
    } catch (error) {
      console.error("Error creating super admin:", error)
      alert("Super-Admin konnte nicht erstellt werden. Bitte versuchen Sie es erneut.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({ name: "", email: "", defaultPracticeId: "none" })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Super-Administrator erstellen
          </DialogTitle>
          <DialogDescription>
            Erstellen Sie einen neuen Systemadministrator mit vollem Zugriff auf alle Praxen und Einstellungen.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Super-Administratoren haben uneingeschränkten Zugriff auf alle Systemfunktionen, Praxen und Benutzerdaten. Erstellen Sie Super-Admin-Konten nur für vertrauenswürdiges Personal.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Vollstaendiger Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Vollstaendigen Namen eingeben"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-Mail-Adresse *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="E-Mail-Adresse eingeben"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultPractice">Standard-Praxis (Optional)</Label>
            <Select
              value={formData.defaultPracticeId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, defaultPracticeId: value }))}
            >
              <SelectTrigger id="defaultPractice">
                <SelectValue placeholder="Keine Standard-Praxis (manuell auswählen)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Standard-Praxis</SelectItem>
                {practices.map((practice) => (
                  <SelectItem key={practice.id} value={practice.id}>
                    {practice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Diese Praxis wird automatisch beim Login ausgewählt</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Wird erstellt..." : "Super-Admin erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateSuperAdminDialog
