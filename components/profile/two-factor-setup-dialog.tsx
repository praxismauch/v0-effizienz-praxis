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
import { Shield, ShieldCheck, Copy, Check, Loader2 } from "lucide-react"

interface TwoFactorSetupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mfaSetupData: {
    secret: string
    otpauthUrl: string
    qrCodeUrl: string
  } | null
  mfaCode: string
  onMfaCodeChange: (value: string) => void
  secretCopied: boolean
  onCopySecret: () => void
  isMfaLoading: boolean
  onVerify: () => void
}

export function TwoFactorSetupDialog({
  open,
  onOpenChange,
  mfaSetupData,
  mfaCode,
  onMfaCodeChange,
  secretCopied,
  onCopySecret,
  isMfaLoading,
  onVerify,
}: TwoFactorSetupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="2fa-setup-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            2FA einrichten
          </DialogTitle>
          <DialogDescription id="2fa-setup-description">
            Scannen Sie den QR-Code mit Ihrer Authenticator-App
          </DialogDescription>
        </DialogHeader>

        {mfaSetupData && (
          <div className="space-y-6">
            {/* QR Code */}
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-lg shadow-inner">
                <img src={mfaSetupData.qrCodeUrl || "/placeholder.svg"} alt="2FA QR Code" className="w-48 h-48" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Scannen Sie diesen QR-Code mit Ihrer Authenticator-App
              </p>
            </div>

            {/* Manual Secret */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Oder manuell eingeben:</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">{mfaSetupData.secret}</code>
                <Button size="icon" variant="outline" onClick={onCopySecret} className="shrink-0 bg-transparent">
                  {secretCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Verification Code Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Verifizierungscode eingeben:</Label>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={mfaCode} onChange={onMfaCodeChange}>
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
              <p className="text-xs text-muted-foreground text-center">
                Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onVerify} disabled={mfaCode.length !== 6 || isMfaLoading}>
            {isMfaLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
            Verifizieren & Aktivieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
