"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Workflow, CheckSquare, FolderOpen, UsersRound, Calendar, BookOpen, Building2 } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const FolderTemplatesManager = dynamic(() => import("@/components/super-admin/folder-templates-manager"), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
  ssr: false,
})

const TeamsManager = dynamic(() => import("@/components/super-admin/teams-manager"), {
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

const PraxisartenManager = dynamic(() => import("@/components/praxisarten-manager"), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
  ssr: false,
})

const BlogManager = dynamic(() => import("@/components/super-admin/blog-manager"), {
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
        <h1 className="text-3xl font-bold tracking-tight">Vorlagen</h1>
        <p className="text-muted-foreground mt-2">Verwalten Sie Vorlagen, Workflows, Dokumente und Blog-Inhalte</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="workflows" className="gap-2">
            <Workflow className="h-4 w-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="checklisten" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            Checklisten
          </TabsTrigger>
          <TabsTrigger value="dokumente" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Ordner-Vorlagen
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-2">
            <UsersRound className="h-4 w-4" />
            Team-Vorlagen
          </TabsTrigger>
          <TabsTrigger value="event-types" className="gap-2">
            <Calendar className="h-4 w-4" />
            Event-Typen
          </TabsTrigger>
          <TabsTrigger value="praxisarten" className="gap-2">
            <Building2 className="h-4 w-4" />
            Praxisarten
          </TabsTrigger>
          <TabsTrigger value="blog" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Blog / Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="mt-6 space-y-4">
          <WorkflowsPage />
        </TabsContent>

        <TabsContent value="checklisten" className="mt-6 space-y-4">
          <TestChecklistManager />
        </TabsContent>

        <TabsContent value="dokumente" className="mt-6 space-y-4">
          <FolderTemplatesManager />
        </TabsContent>

        <TabsContent value="teams" className="mt-6 space-y-4">
          <TeamsManager />
        </TabsContent>

        <TabsContent value="event-types" className="mt-6 space-y-4">
          <EventTypesManager />
        </TabsContent>

        <TabsContent value="praxisarten" className="mt-6 space-y-4">
          <PraxisartenManager />
        </TabsContent>

        <TabsContent value="blog" className="mt-6 space-y-4">
          <BlogManager />
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
