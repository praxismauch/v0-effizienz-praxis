import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"
import { ShieldOff, Loader2 } from "lucide-react"

interface TwoFactorDisableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  disableCode: string
  onDisableCodeChange: (value: string) => void
  isMfaLoading: boolean
  onDisable: () => void
}

export function TwoFactorDisableDialog({
  open,
  onOpenChange,
  disableCode,
  onDisableCodeChange,
  isMfaLoading,
  onDisable,
}: TwoFactorDisableDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="2fa-disable-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <ShieldOff className="h-5 w-5" />
            2FA deaktivieren
          </DialogTitle>
          <DialogDescription id="2fa-disable-description">
            Geben Sie Ihren aktuellen 2FA-Code ein, um die Zwei-Faktor-Authentifizierung zu deaktivieren
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">
              <strong>Warnung:</strong> Das Deaktivieren von 2FA verringert die Sicherheit Ihres Kontos.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Aktuellen 2FA-Code eingeben:</Label>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={disableCode} onChange={onDisableCodeChange}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button variant="destructive" onClick={onDisable} disabled={disableCode.length !== 6 || isMfaLoading}>
            {isMfaLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldOff className="h-4 w-4 mr-2" />}
            2FA deaktivieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
