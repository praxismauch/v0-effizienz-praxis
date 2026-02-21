"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Database, Mail, Zap, Brain, ArrowRight, MailCheck } from "lucide-react"
import { CronSetupGuide } from "./cron-setup-guide"
import { AITrainingFilesManager } from "@/components/ai-training-files-manager"
import Link from "next/link"

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
            <CardDescription>SMTP-Konfiguration, Templates, Diagnose und E-Mail-Versand</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
              <div className="p-3 rounded-lg bg-primary/10">
                <MailCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">E-Mail Verwaltung</p>
                <p className="text-sm text-muted-foreground">
                  Konfigurieren und testen Sie SMTP-Einstellungen, gestalten Sie E-Mail-Templates, senden Sie Test-Mails und sehen Sie Protokolle ein.
                </p>
              </div>
              <Button asChild>
                <Link href="/super-admin/email">
                  Zur E-Mail Verwaltung
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
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
