"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"
import { Lock, Shield, ShieldCheck, ShieldOff, Smartphone, Key, Loader2, Check, Copy } from "lucide-react"

interface SecuritySectionProps {
  currentUser: any
  setCurrentUser: (user: any) => void
  toast: (opts: any) => void
}

export function SecuritySection({ currentUser, setCurrentUser, toast }: SecuritySectionProps) {
  const [show2FADialog, setShow2FADialog] = useState(false)
  const [show2FADisableDialog, setShow2FADisableDialog] = useState(false)
  const [mfaSetupData, setMfaSetupData] = useState<{
    secret: string
    otpauthUrl: string
    qrCodeUrl: string
  } | null>(null)
  const [mfaCode, setMfaCode] = useState("")
  const [disableCode, setDisableCode] = useState("")
  const [isMfaLoading, setIsMfaLoading] = useState(false)
  const [secretCopied, setSecretCopied] = useState(false)

  const handleStart2FASetup = async () => {
    setIsMfaLoading(true)
    try {
      const response = await fetch(`/api/users/${currentUser.id}/mfa/setup`, {
        method: "POST",
        credentials: "include",
      })
      if (!response.ok) throw new Error("Fehler beim Generieren des 2FA-Geheimnisses")
      const data = await response.json()
      setMfaSetupData(data)
      setShow2FADialog(true)
    } catch (error) {
      console.error("Error starting 2FA setup:", error)
      toast({ title: "Fehler", description: "2FA-Einrichtung konnte nicht gestartet werden.", variant: "destructive" })
    } finally {
      setIsMfaLoading(false)
    }
  }

  const handleVerify2FA = async () => {
    if (mfaCode.length !== 6 || !mfaSetupData) return
    setIsMfaLoading(true)
    try {
      const response = await fetch(`/api/users/${currentUser.id}/mfa/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: mfaCode, secret: mfaSetupData.secret }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Verifizierung fehlgeschlagen")

      const userResponse = await fetch(`/api/users/${currentUser.id}`)
      if (userResponse.ok) {
        const userData = await userResponse.json()
        if (userData.user) setCurrentUser({ ...currentUser, ...userData.user })
      }
      setShow2FADialog(false)
      setMfaSetupData(null)
      setMfaCode("")
      toast({ title: "2FA aktiviert", description: "Zwei-Faktor-Authentifizierung wurde erfolgreich aktiviert." })
    } catch (error: any) {
      console.error("Error verifying 2FA:", error)
      toast({ title: "Fehler", description: error.message || "Der Verifizierungscode ist ungultig.", variant: "destructive" })
    } finally {
      setIsMfaLoading(false)
    }
  }

  const handleDisable2FA = async () => {
    setIsMfaLoading(true)
    try {
      const response = await fetch(`/api/users/${currentUser.id}/mfa/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: disableCode }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Deaktivierung fehlgeschlagen")

      const userResponse = await fetch(`/api/users/${currentUser.id}`)
      if (userResponse.ok) {
        const userData = await userResponse.json()
        if (userData.user) setCurrentUser({ ...currentUser, ...userData.user })
      }
      setShow2FADisableDialog(false)
      setDisableCode("")
      toast({ title: "2FA deaktiviert", description: "Zwei-Faktor-Authentifizierung wurde deaktiviert." })
    } catch (error: any) {
      console.error("Error disabling 2FA:", error)
      toast({ title: "Fehler", description: error.message || "2FA konnte nicht deaktiviert werden.", variant: "destructive" })
    } finally {
      setIsMfaLoading(false)
    }
  }

  const copySecretToClipboard = () => {
    if (mfaSetupData?.secret) {
      navigator.clipboard.writeText(mfaSetupData.secret)
      setSecretCopied(true)
      setTimeout(() => setSecretCopied(false), 2000)
    }
  }

  return (
    <>
      {/* Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Passwort andern
          </CardTitle>
          <CardDescription>Aktualisieren Sie Ihr Passwort regelmasig fur mehr Sicherheit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Aktuelles Passwort</Label>
            <Input id="current-password" type="password" placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Neues Passwort</Label>
              <Input id="new-password" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Passwort bestatigen</Label>
              <Input id="confirm-password" type="password" placeholder="••••••••" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Lock className="h-4 w-4" />
              Passwort andern
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2FA Card */}
      <Card className={currentUser.mfa_enabled ? "border-emerald-500/50" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Zwei-Faktor-Authentifizierung
            {currentUser.mfa_enabled && (
              <Badge className="bg-emerald-500 text-white ml-2">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Aktiv
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {currentUser.mfa_enabled
              ? "Ihr Konto ist durch 2FA geschutzt"
              : "Erhohen Sie die Sicherheit Ihres Kontos mit 2FA"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentUser.mfa_enabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="font-medium text-emerald-700 dark:text-emerald-400">2FA ist aktiviert</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-500">
                    Ihr Konto ist durch eine Authenticator-App geschutzt
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 bg-transparent"
                onClick={() => setShow2FADisableDialog(true)}
              >
                <ShieldOff className="h-4 w-4 mr-2" />
                2FA deaktivieren
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <Shield className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-400">2FA nicht aktiviert</p>
                  <p className="text-sm text-amber-600 dark:text-amber-500">
                    Aktivieren Sie 2FA fur zusatzliche Sicherheit
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Authenticator-App erforderlich</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Verwenden Sie Google Authenticator, Microsoft Authenticator oder eine andere TOTP-kompatible App
                  </p>
                </div>
                <Button onClick={handleStart2FASetup} disabled={isMfaLoading}>
                  {isMfaLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                  2FA einrichten
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
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
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg shadow-inner">
                  <img src={mfaSetupData.qrCodeUrl || "/placeholder.svg"} alt="2FA QR Code" className="w-48 h-48" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Scannen Sie diesen QR-Code mit Ihrer Authenticator-App
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Oder manuell eingeben:</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">{mfaSetupData.secret}</code>
                  <Button size="icon" variant="outline" onClick={copySecretToClipboard} className="shrink-0 bg-transparent">
                    {secretCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Verifizierungscode eingeben:</Label>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={mfaCode} onChange={setMfaCode}>
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
            <Button variant="outline" onClick={() => setShow2FADialog(false)}>Abbrechen</Button>
            <Button onClick={handleVerify2FA} disabled={mfaCode.length !== 6 || isMfaLoading}>
              {isMfaLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              Verifizieren & Aktivieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Disable Dialog */}
      <Dialog open={show2FADisableDialog} onOpenChange={setShow2FADisableDialog}>
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
                <InputOTP maxLength={6} value={disableCode} onChange={setDisableCode}>
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
            <Button variant="outline" onClick={() => setShow2FADisableDialog(false)}>Abbrechen</Button>
            <Button variant="destructive" onClick={handleDisable2FA} disabled={disableCode.length !== 6 || isMfaLoading}>
              {isMfaLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldOff className="h-4 w-4 mr-2" />}
              2FA deaktivieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
