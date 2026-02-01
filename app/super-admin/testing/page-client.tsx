"use client"

import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TestTube, FolderCheck, Tags, Monitor, ImageIcon } from "lucide-react"
import UnitTestsPanel from "@/components/testing/unit-tests-panel"
import HeaderImagesPanel from "@/components/testing/header-images-panel"
import TestChecklistManager from "@/components/test-checklist-manager"
import TestingCategoriesManager from "@/components/testing-categories-manager"
import UIItemsTestManager from "@/components/super-admin/ui-items-test-manager"

export default function TestingPageClient() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "unit-tests"

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Testing & Qualitätssicherung</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Tests, Checklisten und Kategorien für die Qualitätssicherung
        </p>
      </div>

      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-[750px]">
          <TabsTrigger value="unit-tests" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            <span className="hidden sm:inline">Unit Tests</span>
          </TabsTrigger>
          <TabsTrigger value="ui-items" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">UI-Items</span>
          </TabsTrigger>
          <TabsTrigger value="checklists" className="flex items-center gap-2">
            <FolderCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Checklisten</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            <span className="hidden sm:inline">Kategorien</span>
          </TabsTrigger>
          <TabsTrigger value="header-images" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Header-Bilder</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unit-tests" className="space-y-6">
          <UnitTestsPanel />
        </TabsContent>

        <TabsContent value="ui-items" className="space-y-6">
          <UIItemsTestManager />
        </TabsContent>

        <TabsContent value="checklists" className="space-y-6">
          <TestChecklistManager />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <TestingCategoriesManager />
        </TabsContent>

        <TabsContent value="header-images" className="space-y-6">
          <HeaderImagesPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
