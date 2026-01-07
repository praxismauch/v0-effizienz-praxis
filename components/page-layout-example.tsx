"use client"

/**
 * EXAMPLE: How to use the PageLayout component
 *
 * This file demonstrates the standardized page structure:
 * 1. Title with subtitle + action buttons (right-aligned)
 * 2. 5 Stats cards
 * 3. Search box + filters
 * 4. Main content
 */

import { useState } from "react"
import { PageLayout, type StatCardItem, type FilterOption } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Sparkles, Users, FileText, Clock, CheckCircle, AlertCircle, List, Grid } from "lucide-react"

export default function ExamplePageClient() {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  // Define stats cards
  const statsCards: StatCardItem[] = [
    {
      label: "Gesamt",
      value: 156,
      icon: FileText,
      color: "primary",
    },
    {
      label: "Aktiv",
      value: 89,
      icon: CheckCircle,
      color: "success",
      trend: { value: 12, positive: true, label: "vs. Vormonat" },
    },
    {
      label: "Ausstehend",
      value: 34,
      icon: Clock,
      color: "warning",
    },
    {
      label: "Überfällig",
      value: 7,
      icon: AlertCircle,
      color: "danger",
    },
    {
      label: "Team",
      value: 23,
      icon: Users,
      color: "info",
    },
  ]

  // Define filter options
  const statusOptions: FilterOption[] = [
    { value: "all", label: "Alle Status" },
    { value: "active", label: "Aktiv" },
    { value: "pending", label: "Ausstehend" },
    { value: "completed", label: "Abgeschlossen" },
  ]

  const categoryOptions: FilterOption[] = [
    { value: "all", label: "Alle Kategorien" },
    { value: "general", label: "Allgemein" },
    { value: "medical", label: "Medizinisch" },
    { value: "admin", label: "Verwaltung" },
  ]

  // Action buttons for header
  const headerActions = (
    <>
      <Button variant="outline" className="gap-2 bg-transparent">
        <Sparkles className="h-4 w-4" />
        KI-Analyse
      </Button>
      <Button className="gap-2">
        <Plus className="h-4 w-4" />
        Neu erstellen
      </Button>
    </>
  )

  // View mode toggle for toolbar
  const toolbarExtras = (
    <div className="flex border rounded-md">
      <Button
        variant={viewMode === "list" ? "secondary" : "ghost"}
        size="sm"
        className="rounded-r-none"
        onClick={() => setViewMode("list")}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "grid" ? "secondary" : "ghost"}
        size="sm"
        className="rounded-l-none"
        onClick={() => setViewMode("grid")}
      >
        <Grid className="h-4 w-4" />
      </Button>
    </div>
  )

  return (
    <PageLayout
      // Header Section
      title="Beispiel-Seite"
      subtitle="Dies ist eine Beispielseite mit der standardisierten Seitenstruktur für alle App-Ansichten"
      actions={headerActions}
      // Stats Cards Section (5 cards)
      stats={statsCards}
      statsColumns={5}
      // Search & Filter Section
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Einträge durchsuchen..."
      filters={[
        {
          id: "status",
          label: "Status",
          value: statusFilter,
          options: statusOptions,
          onChange: setStatusFilter,
        },
        {
          id: "category",
          label: "Kategorie",
          value: categoryFilter,
          options: categoryOptions,
          onChange: setCategoryFilter,
        },
      ]}
      toolbarExtras={toolbarExtras}
    >
      {/* Main Content Section */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="mine">Meine</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Your content here */}
          <div className="grid gap-4">
            <div className="p-8 border rounded-lg text-center text-muted-foreground">
              Hier kommt der Hauptinhalt der Seite
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}
