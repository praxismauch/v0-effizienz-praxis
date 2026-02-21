"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Activity, Server, Palette, Send, ScrollText, Mail
} from "lucide-react"
import { DiagnosticsTab } from "./components/diagnostics-tab"
import { SmtpConfigTab } from "./components/smtp-config-tab"
import { TemplateDesignerTab } from "./components/template-designer-tab"
import { SendTab } from "./components/send-tab"
import { LogsTab } from "./components/logs-tab"

export default function EmailClient() {
  const [activeTab, setActiveTab] = useState("diagnostics")
  const [prefillHtml, setPrefillHtml] = useState("")
  const [prefillSubject, setPrefillSubject] = useState("")

  function handleUseTemplate(html: string, subject: string) {
    setPrefillHtml(html)
    setPrefillSubject(subject)
    setActiveTab("send")
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">E-Mail Verwaltung</h1>
        </div>
        <p className="text-muted-foreground ml-12">
          Konfigurieren, testen und verwalten Sie alle E-Mail-Einstellungen
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="diagnostics" className="gap-1.5">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Diagnose</span>
          </TabsTrigger>
          <TabsTrigger value="smtp" className="gap-1.5">
            <Server className="h-4 w-4" />
            <span className="hidden sm:inline">SMTP</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="send" className="gap-1.5">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Senden</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <ScrollText className="h-4 w-4" />
            <span className="hidden sm:inline">Protokoll</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diagnostics" className="mt-6">
          <DiagnosticsTab />
        </TabsContent>

        <TabsContent value="smtp" className="mt-6">
          <SmtpConfigTab />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <TemplateDesignerTab onUseTemplate={handleUseTemplate} />
        </TabsContent>

        <TabsContent value="send" className="mt-6">
          <SendTab prefillHtml={prefillHtml} prefillSubject={prefillSubject} />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <LogsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
