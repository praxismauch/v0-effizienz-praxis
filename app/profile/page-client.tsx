"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useSidebarSettings } from "@/contexts/sidebar-settings-context"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ProfileOverviewCard } from "@/components/profile/profile-overview-card"
import { DataManagementSection } from "@/components/profile/data-management-section"
import { BadgeVisibilitySettings } from "@/components/profile/badge-visibility-settings"
import { FavoritesManager } from "@/components/profile/favorites-manager"
import { useToast } from "@/hooks/use-toast"
import { useRoleColors } from "@/lib/use-role-colors"
import { User, Settings, Monitor, Lock, Database, PanelLeft } from "lucide-react"
import { ProfileFormTab } from "./profile-form-tab"
import { NotificationsTab } from "./notifications-tab"
import { SecuritySection } from "./security-section"

export default function ProfilePageClient() {
  const { currentUser, setCurrentUser } = useUser()
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const { roleColors } = useRoleColors()
  const { singleGroupMode, setSingleGroupMode } = useSidebarSettings()

  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          avatar: formData.avatar,
          preferred_language: formData.preferred_language,
        }),
      })
      if (!response.ok) throw new Error("Fehler beim Speichern")
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
      toast({ title: "Profil aktualisiert", description: "Ihre Anderungen wurden erfolgreich gespeichert." })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({ title: "Fehler", description: "Profil konnte nicht gespeichert werden.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarChange = (avatarUrl: string) => {
    setFormData((prev) => ({ ...prev, avatar: avatarUrl }))
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      superadmin: "Super Admin",
      admin: "Administrator",
      doctor: "Arzt/Arztin",
      nurse: "MFA/Pflege",
      receptionist: "Empfang",
    }
    return labels[role] || role
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mein Profil</h1>
            <p className="text-muted-foreground mt-1">
              Verwalten Sie Ihre personlichen Informationen und Einstellungen
            </p>
          </div>
        </div>

        {/* Profile Overview Card */}
        <ProfileOverviewCard
          currentUser={currentUser}
          formData={formData}
          currentPractice={currentPractice}
          roleColors={roleColors}
          onAvatarChange={handleAvatarChange}
          getRoleLabel={getRoleLabel}
        />

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

          <TabsContent value="profile" className="space-y-4">
            <ProfileFormTab
              formData={formData}
              setFormData={setFormData}
              onSave={handleSaveProfile}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <NotificationsTab />
          </TabsContent>

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
                    <Label>Einzelne Gruppe offnen</Label>
                    <p className="text-sm text-muted-foreground">
                      Wenn aktiviert, wird beim Offnen einer Menugruppe die vorherige automatisch geschlossen
                    </p>
                  </div>
                  <Switch checked={singleGroupMode} onCheckedChange={setSingleGroupMode} />
                </div>
              </CardContent>
            </Card>
            <FavoritesManager />
            <BadgeVisibilitySettings />
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <SecuritySection
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              toast={toast}
            />
          </TabsContent>

          <TabsContent value="data">
            <DataManagementSection />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
