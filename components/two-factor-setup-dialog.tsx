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
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ShieldCheck, AlertCircle, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TwoFactorSetupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function TwoFactorSetupDialog({ open, onOpenChange, onSuccess }: TwoFactorSetupDialogProps) {
  const [step, setStep] = useState<"enroll" | "verify">("enroll")
  const [factorId, setFactorId] = useState("")
  const [qrCode, setQrCode] = useState("")
  const [secret, setSecret] = useState("")
  const [verifyCode, setVerifyCode] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleEnroll = async () => {
    setIsLoading(true)
    setError("")

    try {
      const supabase = createClient()

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Google Authenticator",
      })

      if (enrollError) throw enrollError

      if (data) {
        setFactorId(data.id)
        setSecret(data.totp.secret)

        // Generate QR code from the URI - dynamic import to avoid SSR issues
        const QRCode = (await import("qrcode")).default
        const qrCodeDataUrl = await QRCode.toDataURL(data.totp.qr_code)
        setQrCode(qrCodeDataUrl)
        setStep("verify")
      }
    } catch (err: any) {
      console.error("[v0] 2FA enrollment error:", err)
      setError(err.message || "Fehler bei der Aktivierung der Zwei-Faktor-Authentifizierung")
      toast({
        title: "Fehler",
        description: "2FA konnte nicht aktiviert werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      setError("Bitte geben Sie einen 6-stelligen Code ein")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const supabase = createClient()

      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      })

      if (challengeError) throw challengeError

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      })

      if (verifyError) throw verifyError

      toast({
        title: "2FA aktiviert",
        description: "Zwei-Faktor-Authentifizierung wurde erfolgreich eingerichtet.",
      })

      onSuccess()
      onOpenChange(false)

      // Reset state
      setStep("enroll")
      setFactorId("")
      setQrCode("")
      setSecret("")
      setVerifyCode("")
    } catch (err: any) {
      console.error("[v0] 2FA verification error:", err)
      setError("Ungültiger Code. Bitte versuchen Sie es erneut.")
      toast({
        title: "Verifizierung fehlgeschlagen",
        description: "Der eingegebene Code ist ungültig.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Kopiert",
      description: "Geheimer Schlüssel wurde in die Zwischenablage kopiert.",
    })
  }

  const handleCancel = () => {
    setStep("enroll")
    setFactorId("")
    setQrCode("")
    setSecret("")
    setVerifyCode("")
    setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Zwei-Faktor-Authentifizierung einrichten
          </DialogTitle>
          <DialogDescription>
            {step === "enroll"
              ? "Scannen Sie den QR-Code mit Ihrer Authenticator-App"
              : "Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein"}
          </DialogDescription>
        </DialogHeader>

        {step === "enroll" && !qrCode && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Sie benötigen eine Authenticator-App wie Google Authenticator, Authy, 1Password oder eine andere
                TOTP-App.
              </AlertDescription>
            </Alert>
            <Button onClick={handleEnroll} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird eingerichtet...
                </>
              ) : (
                "2FA einrichten"
              )}
            </Button>
          </div>
        )}

        {step === "verify" && qrCode && (
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <img src={qrCode || "/placeholder.svg"} alt="QR Code" className="w-48 h-48" />
              </div>

              <div className="w-full space-y-2">
                <Label className="text-sm font-medium">Oder geben Sie den Schlüssel manuell ein:</Label>
                <div className="flex items-center gap-2">
                  <Input value={secret} readOnly className="font-mono text-sm" />
                  <Button type="button" variant="outline" size="icon" onClick={handleCopySecret}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="w-full space-y-2">
                <Label htmlFor="verify-code">Bestätigungscode</Label>
                <Input
                  id="verify-code"
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "")
                    setVerifyCode(value)
                  }}
                  className="text-center text-2xl tracking-widest font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein
                </p>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Abbrechen
          </Button>
          {step === "verify" && (
            <Button onClick={handleVerify} disabled={isLoading || verifyCode.length !== 6}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird überprüft...
                </>
              ) : (
                "Bestätigen"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TwoFactorSetupDialog
