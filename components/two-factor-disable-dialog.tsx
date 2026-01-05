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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { Loader2, AlertTriangle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TwoFactorDisableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function TwoFactorDisableDialog({ open, onOpenChange, onSuccess }: TwoFactorDisableDialogProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleDisable = async () => {
    if (!password) {
      setError("Bitte geben Sie Ihr Passwort ein")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const supabase = createClient()

      // Get all enrolled factors
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors()

      if (listError) throw listError

      // Unenroll all TOTP factors
      if (factors?.totp && factors.totp.length > 0) {
        for (const factor of factors.totp) {
          const { error: unenrollError } = await supabase.auth.mfa.unenroll({
            factorId: factor.id,
          })

          if (unenrollError) throw unenrollError
        }
      }

      toast({
        title: "2FA deaktiviert",
        description: "Zwei-Faktor-Authentifizierung wurde erfolgreich deaktiviert.",
      })

      onSuccess()
      onOpenChange(false)
      setPassword("")
    } catch (err: any) {
      console.error("[v0] 2FA disable error:", err)
      setError("Fehler beim Deaktivieren der 2FA. Bitte überprüfen Sie Ihr Passwort.")
      toast({
        title: "Fehler",
        description: "2FA konnte nicht deaktiviert werden.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setPassword("")
    setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Zwei-Faktor-Authentifizierung deaktivieren
          </DialogTitle>
          <DialogDescription>
            Ihr Konto ist weniger sicher ohne 2FA. Geben Sie Ihr Passwort ein, um fortzufahren.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Warnung: Das Deaktivieren von 2FA macht Ihr Konto anfälliger für unbefugten Zugriff.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="password">Passwort bestätigen</Label>
            <Input
              id="password"
              type="password"
              placeholder="Ihr Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button variant="destructive" onClick={handleDisable} disabled={isLoading || !password}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird deaktiviert...
              </>
            ) : (
              "2FA deaktivieren"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TwoFactorDisableDialog
