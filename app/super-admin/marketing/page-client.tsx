"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, BarChart3, MessageSquare, Map } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import dynamic from "next/dynamic"

const SEOKeywordsManager = dynamic(() => import("@/components/seo-keywords-manager"), {
  loading: () => <div className="flex items-center justify-center h-96">Lädt SEO Manager...</div>,
})

const SEOAnalyticsDashboard = dynamic(() => import("@/components/seo-analytics-dashboard"), {
  loading: () => <div className="flex items-center justify-center h-96">Lädt SEO Analytics...</div>,
})

const AnalyticsDashboard = dynamic(() => import("@/components/analytics-dashboard"), {
  loading: () => <div className="flex items-center justify-center h-96">Lädt Analytics...</div>,
})

const PopupManager = dynamic(() => import("@/components/popup-manager"), {
  loading: () => <div className="flex items-center justify-center h-96">Lädt Popup Manager...</div>,
})

const RoadmapManager = dynamic(() => import("@/components/roadmap-manager"), {
  loading: () => <div className="flex items-center justify-center h-96">Lädt Roadmap...</div>,
})

function MarketingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") || "seo"

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.push(`/super-admin/marketing?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketing & SEO</h1>
        <p className="text-muted-foreground mt-2">Verwalten Sie SEO, Analytics, Popups und Roadmap</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto gap-1">
          <TabsTrigger value="seo" className="gap-2">
            <Search className="h-4 w-4" />
            SEO Keywords
          </TabsTrigger>
          <TabsTrigger value="seo-analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            SEO Analytics
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            System Analytics
          </TabsTrigger>
          <TabsTrigger value="popups" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Popups
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="gap-2">
            <Map className="h-4 w-4" />
            Roadmap
          </TabsTrigger>
        </TabsList>

        <TabsContent value="seo" className="mt-6 space-y-4">
          <SEOKeywordsManager />
        </TabsContent>

        <TabsContent value="seo-analytics" className="mt-6 space-y-4">
          <SEOAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6 space-y-4">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="popups" className="mt-6 space-y-4">
          <PopupManager />
        </TabsContent>

        <TabsContent value="roadmap" className="mt-6 space-y-4">
          <RoadmapManager userId="super-admin" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function MarketingClient() {
  return (
    <Suspense fallback={<div>Lädt...</div>}>
      <MarketingContent />
    </Suspense>
  )
}
