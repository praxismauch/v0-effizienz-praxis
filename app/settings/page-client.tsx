"use client"

import { useState, useEffect } from "react"
import { 
  Settings, 
  Building2, 
  Clock, 
  Calendar, 
  Monitor, 
  Bell, 
  Mail, 
  Shield, 
  Home, 
  LayoutGrid, 
  Users,
  MapPin,
  Loader2 
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { AppLayout } from "@/components/app-layout"

// Import all extracted tab components
import { PracticeSettingsTab } from "@/components/settings/practice-settings-tab"
import { PracticeLocationsTab } from "@/components/settings/practice-locations-tab"
import { WorkingHoursTab } from "@/components/settings/working-hours-tab"
import { CalendarSettingsTab } from "@/components/settings/calendar-settings-tab"
import { AppearanceTab } from "@/components/settings/appearance-tab"
import { NotificationsTab } from "@/components/settings/notifications-tab"
import WeeklySummarySettings from "@/components/weekly-summary-settings"
import { SecurityTab } from "@/components/settings/security-tab"
import { HomeofficeTab } from "@/components/settings/homeoffice-tab"
import { OrgaCategoriesManager } from "@/components/settings/orga-categories-manager"
import { TeamRoleOrderSettings } from "@/components/settings/team-role-order-settings"

export default function SettingsPageClient() {
  const { currentUser } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("practice")

  useEffect(() => {
    setMounted(true)
  }, [])

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "practice_owner"

  if (!mounted || practiceLoading) {
    return <AppLayout loading loadingMessage="Einstellungen werden geladen..." />
  }

  if (!currentPractice) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Praxis wird geladen...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Einstellungen</h1>
            <p className="text-muted-foreground">Verwalten Sie Ihre Praxis- und Benutzereinstellungen</p>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 h-auto p-1 gap-1">
            <TabsTrigger value="practice" className="gap-2 flex-1">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Praxis</span>
            </TabsTrigger>
            <TabsTrigger value="locations" className="gap-2 flex-1">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Standorte</span>
            </TabsTrigger>
            <TabsTrigger value="hours" className="gap-2 flex-1">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Arbeitszeiten</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2 flex-1">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Kalender</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2 flex-1">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Anzeige</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 flex-1">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Benachrichtigungen</span>
            </TabsTrigger>
            <TabsTrigger value="weekly-summary" className="gap-2 flex-1">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Wochen-Report</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 flex-1">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Sicherheit</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="homeoffice" className="gap-2 flex-1">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Homeoffice</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="orga-categories" className="gap-2 flex-1">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Orga-Kategorien</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="team-order" className="gap-2 flex-1">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Team-Reihenfolge</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Practice Settings Tab */}
          <TabsContent value="practice">
            <PracticeSettingsTab />
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations">
            <PracticeLocationsTab />
          </TabsContent>

          {/* Working Hours Tab */}
          <TabsContent value="hours">
            <WorkingHoursTab />
          </TabsContent>

          {/* Calendar Settings Tab */}
          <TabsContent value="calendar">
            <CalendarSettingsTab />
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <AppearanceTab />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>

          {/* Weekly Summary Tab */}
          <TabsContent value="weekly-summary">
            <WeeklySummarySettings />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <SecurityTab />
          </TabsContent>

          {/* Homeoffice Tab (Admin only) */}
          {isAdmin && (
            <TabsContent value="homeoffice">
              <HomeofficeTab />
            </TabsContent>
          )}

          {/* Orga Categories Tab */}
          <TabsContent value="orga-categories">
            <OrgaCategoriesManager />
          </TabsContent>

          {/* Team Order Tab (Admin only) */}
          {isAdmin && (
            <TabsContent value="team-order">
              <TeamRoleOrderSettings />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  )
}
