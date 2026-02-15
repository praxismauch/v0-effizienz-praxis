"use client"

import { Suspense, useState } from "react"
import { UserRightsManager } from "@/components/user-rights-manager"
import { RolesOverview } from "@/components/super-admin/roles-overview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Users } from "lucide-react"

export const dynamic = "force-dynamic"

export default function UserRightsPage() {
  const [activeTab, setActiveTab] = useState("roles")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Benutzerrechte
        </h1>
        <p className="text-muted-foreground mt-2">Verwalten Sie Rollen und Berechtigungen</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Rollen
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Berechtigungen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-6">
          <RolesOverview />
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Lade Berechtigungen...</p>
                </div>
              </div>
            }
          >
            <UserRightsManager />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
