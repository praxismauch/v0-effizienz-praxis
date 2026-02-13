import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Lock,
  Shield,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Key,
  Loader2,
} from "lucide-react"

interface SecurityTabProps {
  currentUser: {
    mfa_enabled: boolean
  }
  isMfaLoading: boolean
  onStart2FASetup: () => void
  onOpen2FADisable: () => void
}

export function SecurityTab({ currentUser, isMfaLoading, onStart2FASetup, onOpen2FADisable }: SecurityTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Passwort ändern
          </CardTitle>
          <CardDescription>Aktualisieren Sie Ihr Passwort regelmäßig für mehr Sicherheit</CardDescription>
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
              <Label htmlFor="confirm-password">Passwort bestätigen</Label>
              <Input id="confirm-password" type="password" placeholder="••••••••" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Lock className="h-4 w-4" />
              Passwort ändern
            </Button>
          </div>
        </CardContent>
      </Card>

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
              ? "Ihr Konto ist durch 2FA geschützt"
              : "Erhöhen Sie die Sicherheit Ihres Kontos mit 2FA"}
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
                    Ihr Konto ist durch eine Authenticator-App geschützt
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 bg-transparent"
                onClick={onOpen2FADisable}
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
                  <p className="text-sm text-amber-600 dark:text-amber-500">Aktivieren Sie 2FA für zusätzliche Sicherheit</p>
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
                <Button onClick={onStart2FASetup} disabled={isMfaLoading}>
                  {isMfaLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                  2FA einrichten
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
