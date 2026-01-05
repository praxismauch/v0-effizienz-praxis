"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Database, Mail, Zap, Brain } from "lucide-react"
import { CronSetupGuide } from "./cron-setup-guide"
import { AITrainingFilesManager } from "@/components/ai-training-files-manager"

export function SystemSettingsTabs() {
  const [activeTab, setActiveTab] = useState("general")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="general">
          <Settings className="mr-2 h-4 w-4" />
          Allgemein
        </TabsTrigger>
        <TabsTrigger value="database">
          <Database className="mr-2 h-4 w-4" />
          Datenbank
        </TabsTrigger>
        <TabsTrigger value="email">
          <Mail className="mr-2 h-4 w-4" />
          E-Mail
        </TabsTrigger>
        <TabsTrigger value="cron">
          <Zap className="mr-2 h-4 w-4" />
          Cron Jobs
        </TabsTrigger>
        <TabsTrigger value="ai-training">
          <Brain className="mr-2 h-4 w-4" />
          KI Training
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Allgemeine Einstellungen</CardTitle>
            <CardDescription>Systemweite Konfigurationen und Parameter</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Allgemeine Systemeinstellungen werden hier angezeigt.</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="database" className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Datenbank-Einstellungen</CardTitle>
            <CardDescription>Datenbankverbindung und -konfiguration</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Datenbank-Konfigurationen werden hier angezeigt.</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="email" className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>E-Mail-Einstellungen</CardTitle>
            <CardDescription>SMTP-Konfiguration und E-Mail-Vorlagen</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">E-Mail-Konfigurationen werden hier angezeigt.</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="cron" className="space-y-4 mt-4">
        <CronSetupGuide />
      </TabsContent>

      <TabsContent value="ai-training" className="space-y-4 mt-4">
        <AITrainingFilesManager />
      </TabsContent>
    </Tabs>
  )
}

export default SystemSettingsTabs
