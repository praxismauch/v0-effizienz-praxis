"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { Loader2, UserPlus, Mail, User, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface InviteExternalUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function InviteExternalUserDialog({ open, onOpenChange, onSuccess }: InviteExternalUserDialogProps) {
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const [isLoading, setIsLoading] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({ firstName: "", lastName: "", email: "" })
      setInviteSent(false)
    }
  }, [open])

  const handleSubmit = async () => {
    const practiceId = currentPractice?.id

    if (!formData.firstName || !formData.lastName) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus.")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error("Bitte geben Sie eine gültige E-Mail-Adresse ein.")
      return
    }

    if (!practiceId) {
      toast.error("Keine Praxis zugeordnet. Bitte wenden Sie sich an den Administrator.")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/practices/${practiceId}/invite-external-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: "user", // External users always get "user" role
          teamName: "Extern", // Assign to "Extern" team
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Einladung konnte nicht gesendet werden")
      }

      setInviteSent(true)
      toast.success("Einladung erfolgreich gesendet!")

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error inviting external user:", error)
      toast.error(error instanceof Error ? error.message : "Einladung konnte nicht gesendet werden")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ firstName: "", lastName: "", email: "" })
    setInviteSent(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-cyan-500" />
            Externen Benutzer einladen
          </DialogTitle>
          <DialogDescription>
            Laden Sie einen externen Benutzer mit eingeschränkten Rechten ein. Externe Benutzer werden automatisch der
            Gruppe "Extern" zugewiesen und haben nur Lesezugriff auf ausgewählte Bereiche.
          </DialogDescription>
        </DialogHeader>

        {inviteSent ? (
          <div className="py-6 space-y-4">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Einladung gesendet!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Eine Einladung wurde an <span className="font-medium">{formData.email}</span> gesendet.
                </p>
              </div>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Der eingeladene Benutzer erhält eine E-Mail mit einem Link zur Registrierung. Nach der Registrierung
                wird er automatisch der Gruppe "Extern" zugewiesen.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800">
              <AlertCircle className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <AlertDescription className="text-cyan-700 dark:text-cyan-300">
                Externe Benutzer haben eingeschränkte Rechte:
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Nur Lesezugriff auf freigegebene Dokumente</li>
                  <li>Kein Zugriff auf sensible Praxisdaten</li>
                  <li>Können keine Änderungen vornehmen</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ext-firstName">Vorname *</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="ext-firstName"
                    placeholder="Max"
                    className="pl-10"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="ext-lastName">Nachname *</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="ext-lastName"
                    placeholder="Mustermann"
                    className="pl-10"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="ext-email">E-Mail-Adresse *</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="ext-email"
                  type="email"
                  placeholder="max.mustermann@extern.de"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#06b6d4" }} />
                <span className="font-medium">Zugewiesene Gruppe:</span>
                <span className="text-muted-foreground">Extern</span>
              </div>
              <div className="flex items-center gap-2 text-sm mt-1">
                <div className="h-3 w-3" />
                <span className="font-medium">Rolle:</span>
                <span className="text-muted-foreground">Standard Nutzer (eingeschränkt)</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {inviteSent ? (
            <Button onClick={handleClose}>Schließen</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Abbrechen
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !formData.firstName || !formData.lastName || !formData.email}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Einladung senden
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default InviteExternalUserDialog
