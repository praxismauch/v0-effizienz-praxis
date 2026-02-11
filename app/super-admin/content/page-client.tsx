"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Workflow, CheckSquare, FileText, UsersRound, Calendar } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const DocumentsManager = dynamic(() => import("@/components/documents-manager"), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
  ssr: false,
})

const DefaultTeamsManager = dynamic(() => import("@/components/default-teams-manager"), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
  ssr: false,
})

const WorkflowsPage = dynamic(() => import("@/components/workflows-page"), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
  ssr: false,
})

const TestChecklistManager = dynamic(() => import("@/components/test-checklist-manager"), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
  ssr: false,
})

const EventTypesManager = dynamic(() => import("@/components/event-types-manager"), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
  ssr: false,
})

function ContentManagementContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") || "workflows"

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.push(`/super-admin/content?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
        <p className="text-muted-foreground mt-2">Verwalten Sie Vorlagen, Skills, Workflows und Dokumente</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="workflows" className="gap-2">
            <Workflow className="h-4 w-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="checklisten" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            Checklisten
          </TabsTrigger>
          <TabsTrigger value="dokumente" className="gap-2">
            <FileText className="h-4 w-4" />
            Dokumente
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-2">
            <UsersRound className="h-4 w-4" />
            Team-Vorlagen
          </TabsTrigger>
          <TabsTrigger value="event-types" className="gap-2">
            <Calendar className="h-4 w-4" />
            Event-Typen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="mt-6 space-y-4">
          <WorkflowsPage />
        </TabsContent>

        <TabsContent value="checklisten" className="mt-6 space-y-4">
          <TestChecklistManager />
        </TabsContent>

        <TabsContent value="dokumente" className="mt-6 space-y-4">
          <DocumentsManager />
        </TabsContent>

        <TabsContent value="teams" className="mt-6 space-y-4">
          <DefaultTeamsManager />
        </TabsContent>

        <TabsContent value="event-types" className="mt-6 space-y-4">
          <EventTypesManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function ContentClient() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ContentManagementContent />
    </Suspense>
  )
}
