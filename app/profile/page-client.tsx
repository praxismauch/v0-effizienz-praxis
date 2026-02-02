"use client"

import { CardDescription } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"
import { Card } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useSidebarSettings } from "@/contexts/sidebar-settings-context"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProfileImageEditor } from "@/components/profile-image-editor"
import { DataManagementSection } from "@/components/profile/data-management-section"
import { BadgeVisibilitySettings } from "@/components/profile/badge-visibility-settings"
import { FavoritesManager } from "@/components/profile/favorites-manager"
import { useToast } from "@/hooks/use-toast"
import { useRoleColors } from "@/lib/use-role-colors"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"
import {
  User,
  Mail,
  Building2,
  Calendar,
  Shield,
  Camera,
  Bell,
  Globe,
  Save,
  Loader2,
  CheckCircle,
  Settings,
  Lock,
  Database,
  Smartphone,
  Key,
  ShieldCheck,
  ShieldOff,
  Copy,
  Check,
  Monitor,
  PanelLeft,
} from "lucide-react"

export default function ProfilePageClient() {
  const { currentUser, setCurrentUser } = useUser()
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const { roleColors } = useRoleColors()
  const { singleGroupMode, setSingleGroupMode } = useSidebarSettings()

  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("profile") // Changed default tab from "selfcheck" to "profile"

  // Form states - initialize empty, will be set in useEffect
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    avatar: "",
    preferred_language: "de",
  })

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || "",
        email: currentUser.email || "",
        avatar: currentUser.avatar || "",
        preferred_language: currentUser.preferred_language || "de",
      })
    }
  }, [currentUser])

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    taskReminders: true,
    teamUpdates: true,
    marketingEmails: false,
  })

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

  if (!currentUser) {
    return (
      <AppLayout loading={true} loadingMessage="Lade Profil...">
        <div />
      </AppLayout>
    )
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "PUT", // Use PUT instead of PATCH to match the API
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          avatar: formData.avatar,
          preferred_language: formData.preferred_language,
        }),
      })

      if (!response.ok) {
        throw new Error("Fehler beim Speichern")
      }

      const data = await response.json()

      if (data.user) {
        setCurrentUser({
          ...currentUser,
          name: data.user.name,
          email: data.user.email,
          avatar: data.user.avatar,
          preferred_language: data.user.preferred_language,
        })
      }

      toast({
        title: "Profil aktualisiert",
        description: "Ihre Änderungen wurden erfolgreich gespeichert.",
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Fehler",
        description: "Profil konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarChange = (avatarUrl: string) => {
    setFormData((prev) => ({ ...prev, avatar: avatarUrl }))
  }

  const handleStart2FASetup = async () => {
    setIsMfaLoading(true)
    try {
      const response = await fetch(`/api/users/${currentUser.id}/mfa/setup`, {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Fehler beim Generieren des 2FA-Geheimnisses")
      }

      const data = await response.json()
      setMfaSetupData(data)
      setShow2FADialog(true)
    } catch (error) {
      console.error("[v0] Error starting 2FA setup:", error)
      toast({
        title: "Fehler",
        description: "2FA-Einrichtung konnte nicht gestartet werden.",
        variant: "destructive",
      })
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
        body: JSON.stringify({
          code: mfaCode,
          secret: mfaSetupData.secret,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Verifizierung fehlgeschlagen")
      }

      const userResponse = await fetch(`/api/users/${currentUser.id}`)
      if (userResponse.ok) {
        const userData = await userResponse.json()
        if (userData.user) {
          setCurrentUser({ ...currentUser, ...userData.user })
        }
      }

      setShow2FADialog(false)
      setMfaSetupData(null)
      setMfaCode("")

      toast({
        title: "2FA aktiviert",
        description: "Zwei-Faktor-Authentifizierung wurde erfolgreich aktiviert.",
      })
    } catch (error: any) {
      console.error("Error verifying 2FA:", error)
      toast({
        title: "Fehler",
        description: error.message || "Der Verifizierungscode ist ungültig.",
        variant: "destructive",
      })
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
        body: JSON.stringify({
          code: disableCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Deaktivierung fehlgeschlagen")
      }

      const userResponse = await fetch(`/api/users/${currentUser.id}`)
      if (userResponse.ok) {
        const userData = await userResponse.json()
        if (userData.user) {
          setCurrentUser({ ...currentUser, ...userData.user })
        }
      }

      setShow2FADisableDialog(false)
      setDisableCode("")

      toast({
        title: "2FA deaktiviert",
        description: "Zwei-Faktor-Authentifizierung wurde deaktiviert.",
      })
    } catch (error: any) {
      console.error("Error disabling 2FA:", error)
      toast({
        title: "Fehler",
        description: error.message || "2FA konnte nicht deaktiviert werden.",
        variant: "destructive",
      })
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

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      superadmin: "Super Admin",
      admin: "Administrator",
      doctor: "Arzt/Ärztin",
      nurse: "MFA/Pflege",
      receptionist: "Empfang",
    }
    return labels[role] || role
  }

  // Assuming teams are fetched from another context or API call
  const userTeams = [] // Placeholder for user teams logic

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mein Profil</h1>
            <p className="text-muted-foreground mt-1">
              Verwalten Sie Ihre persönlichen Informationen und Einstellungen
            </p>
          </div>
        </div>

        {/* Profile Overview Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage
                    src={formData.avatar || "/placeholder.svg"}
                    alt={formData.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {formData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <ProfileImageEditor
                  currentAvatar={formData.avatar}
                  userName={formData.name}
                  onAvatarChange={handleAvatarChange}
                  trigger={
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-md"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>
              <div className="flex-1 text-center sm:text-left space-y-2">
                <h2 className="text-2xl font-semibold">{currentUser.name}</h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <Badge className={roleColors[currentUser.role] || "bg-gray-500"}>
                    {getRoleLabel(currentUser.role)}
                  </Badge>
                  {currentUser.isActive ? (
                    <Badge variant="outline" className="border-green-500 text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Aktiv
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-red-500 text-red-600">
                      Inaktiv
                    </Badge>
                  )}
                  {currentUser.mfa_enabled && (
                    <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      2FA
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {currentUser.email}
                  </span>
                  {currentPractice && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {currentPractice.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Mitglied seit {new Date(currentUser.joinedAt).toLocaleDateString("de-DE")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto gap-1">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profil</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Einstellungen</span>
            </TabsTrigger>
            <TabsTrigger value="display" className="gap-2">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Anzeige</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Sicherheit</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Daten</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Persönliche Informationen
                </CardTitle>
                <CardDescription>Aktualisieren Sie Ihre grundlegenden Profilinformationen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Vollständiger Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Ihr Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail-Adresse</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="ihre@email.de"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="language">Bevorzugte Sprache</Label>
                  <Select
                    value={formData.preferred_language}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, preferred_language: value }))}
                  >
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={isLoading} className="gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Speichere...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Änderungen speichern
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Teams */}
            {userTeams.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Meine Teams
                  </CardTitle>
                  <CardDescription>Teams, denen Sie zugewiesen sind</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {userTeams.map((team) => (
                      <Badge key={team.id} variant="secondary" className="py-1.5 px-3">
                        {team.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Benachrichtigungen
                </CardTitle>
                <CardDescription>Verwalten Sie Ihre Benachrichtigungseinstellungen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>E-Mail-Benachrichtigungen</Label>
                    <p className="text-sm text-muted-foreground">Erhalten Sie wichtige Updates per E-Mail</p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aufgaben-Erinnerungen</Label>
                    <p className="text-sm text-muted-foreground">Erinnerungen für anstehende Aufgaben</p>
                  </div>
                  <Switch
                    checked={notifications.taskReminders}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, taskReminders: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Team-Updates</Label>
                    <p className="text-sm text-muted-foreground">Benachrichtigungen über Team-Änderungen</p>
                  </div>
                  <Switch
                    checked={notifications.teamUpdates}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, teamUpdates: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing-E-Mails</Label>
                    <p className="text-sm text-muted-foreground">Produktneuheiten und Tipps</p>
                  </div>
                  <Switch
                    checked={notifications.marketingEmails}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, marketingEmails: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Display Tab */}
          <TabsContent value="display" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PanelLeft className="h-5 w-5" />
                  Seitenleiste
                </CardTitle>
                <CardDescription>Passen Sie das Verhalten der linken Navigation an</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Einzelne Gruppe öffnen</Label>
                    <p className="text-sm text-muted-foreground">
                      Wenn aktiviert, wird beim Öffnen einer Menügruppe die vorherige automatisch geschlossen
                    </p>
                  </div>
                  <Switch
                    checked={singleGroupMode}
                    onCheckedChange={setSingleGroupMode}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Favorites Manager */}
            <FavoritesManager />

            {/* Badge Visibility Settings */}
            <BadgeVisibilitySettings />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
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
                    <Input id="confirm-password" type="password" placeholder="��•••••••" />
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
                          Aktivieren Sie 2FA für zusätzliche Sicherheit
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
                          Verwenden Sie Google Authenticator, Microsoft Authenticator oder eine andere TOTP-kompatible
                          App
                        </p>
                      </div>
                      <Button onClick={handleStart2FASetup} disabled={isMfaLoading}>
                        {isMfaLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Key className="h-4 w-4 mr-2" />
                        )}
                        2FA einrichten
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="data">
            <DataManagementSection />
          </TabsContent>
        </Tabs>
      </div>

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
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={copySecretToClipboard}
                    className="shrink-0 bg-transparent"
                  >
                    {secretCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Verification Code Input */}
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
            <Button variant="outline" onClick={() => setShow2FADialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleVerify2FA} disabled={mfaCode.length !== 6 || isMfaLoading}>
              {isMfaLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4 mr-2" />
              )}
              Verifizieren & Aktivieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Button variant="outline" onClick={() => setShow2FADisableDialog(false)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable2FA}
              disabled={disableCode.length !== 6 || isMfaLoading}
            >
              {isMfaLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShieldOff className="h-4 w-4 mr-2" />
              )}
              2FA deaktivieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
