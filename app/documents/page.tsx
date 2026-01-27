"use client"

import PageHeader from "@/components/page-header"
import DocumentsManager from "@/components/documents-manager"
import { useTranslation } from "@/contexts/translation-context"
import AIDocumentAnalyzerDialog from "@/components/ai-document-analyzer-dialog"
import EmailUploadSettings from "@/components/email-upload-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FolderOpen, Mail, FileSignature } from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { DocumentsToSign } from "@/components/documents-to-sign"

export const dynamic = "force-dynamic"

export default function DocumentsPage() {
  const { t } = useTranslation()

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-4">
        <PageHeader
          title={t("sidebar.documents", "Dokumente")}
          subtitle={t("documents.subtitle", "Verwalten Sie Ihre Praxisdokumente und Berechtigungen")}
        />
        <AIDocumentAnalyzerDialog />
      </div>

      <Tabs defaultValue="files" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto gap-1">
          <TabsTrigger
            value="files"
            className="gap-2 hover:ring-2 hover:ring-primary/20 hover:shadow-sm transition-all duration-200"
          >
            <FolderOpen className="h-4 w-4" />
            {t("documents.tabs.files", "Dateien & Ordner")}
          </TabsTrigger>
          <TabsTrigger
            value="signatures"
            className="gap-2 hover:ring-2 hover:ring-primary/20 hover:shadow-sm transition-all duration-200"
          >
            <FileSignature className="h-4 w-4" />
            {t("documents.tabs.signatures", "Unterschriften")}
          </TabsTrigger>
          <TabsTrigger
            value="email"
            className="gap-2 hover:ring-2 hover:ring-primary/20 hover:shadow-sm transition-all duration-200"
          >
            <Mail className="h-4 w-4" />
            {t("documents.tabs.emailUpload", "E-Mail Upload")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files">
          <DocumentsManager />
        </TabsContent>

        <TabsContent value="signatures">
          <DocumentsToSign />
        </TabsContent>

        <TabsContent value="email">
          <EmailUploadSettings />
        </TabsContent>
      </Tabs>
    </AppLayout>
  )
}
