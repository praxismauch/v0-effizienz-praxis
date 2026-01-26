"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { AppLayout } from "@/components/app-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Package,
  Plus,
  BarChart3,
  Sparkles,
  Building2,
  Receipt,
  Archive,
  RefreshCw,
  Settings,
} from "lucide-react"

import { InventoryStatsCards } from "./components/inventory-stats-cards"
import { OverviewTab } from "./components/overview-tab"
import { InventoryListTab } from "./components/inventory-list-tab"
import { SuggestionsTab } from "./components/suggestions-tab"
import { SuppliersTab } from "./components/suppliers-tab"
import { BillsTab } from "./components/bills-tab"
import { ArchiveTab } from "./components/archive-tab"
import { SettingsTab } from "./components/settings-tab"
import { CreateItemDialog, EditItemDialog, ConsumeDialog, DeleteDialog } from "./components/inventory-dialogs"
import type { InventoryItem, InventoryStats, Supplier, OrderSuggestion, Bill } from "./types"

export default function InventoryPage() {
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const practiceId = currentPractice?.id || currentUser?.practice_id

  // State
  const [items, setItems] = useState<InventoryItem[]>([])
  const [archivedItems, setArchivedItems] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [suggestions, setSuggestions] = useState<OrderSuggestion[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [consumeDialogOpen, setConsumeDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  // Fetch functions
  const fetchItems = useCallback(async () => {
    if (!practiceId) return
    try {
      const response = await fetch(`/api/practices/${practiceId}/inventory`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      }
    } catch (error) {
      console.error("Error fetching items:", error)
    }
  }, [practiceId])

  const fetchArchivedItems = useCallback(async () => {
    if (!practiceId) return
    try {
      const response = await fetch(`/api/practices/${practiceId}/inventory?archived=true`)
      if (response.ok) {
        const data = await response.json()
        setArchivedItems(data.items || [])
      }
    } catch (error) {
      console.error("Error fetching archived items:", error)
    }
  }, [practiceId])

  const fetchSuppliers = useCallback(async () => {
    if (!practiceId) return
    try {
      const response = await fetch(`/api/practices/${practiceId}/suppliers`)
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.suppliers || [])
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error)
    }
  }, [practiceId])

  const fetchSuggestions = useCallback(async () => {
    if (!practiceId) return
    try {
      const response = await fetch(`/api/practices/${practiceId}/inventory/suggestions`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error)
    }
  }, [practiceId])

  const fetchBills = useCallback(async () => {
    if (!practiceId) return
    try {
      const response = await fetch(`/api/practices/${practiceId}/bills`)
      if (response.ok) {
        const data = await response.json()
        setBills(data.bills || [])
      }
    } catch (error) {
      console.error("Error fetching bills:", error)
    }
  }, [practiceId])

  const fetchStats = useCallback(async () => {
    if (!practiceId) return
    try {
      const response = await fetch(`/api/practices/${practiceId}/inventory/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }, [practiceId])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      fetchItems(),
      fetchArchivedItems(),
      fetchSuppliers(),
      fetchSuggestions(),
      fetchBills(),
      fetchStats(),
    ])
    setLoading(false)
  }, [fetchItems, fetchArchivedItems, fetchSuppliers, fetchSuggestions, fetchBills, fetchStats])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAll()
    setRefreshing(false)
    toast.success("Daten aktualisiert")
  }

  useEffect(() => {
    if (practiceId) {
      fetchAll()
    }
  }, [practiceId, fetchAll])

  // Handlers
  const handleCreateSuccess = () => {
    setCreateDialogOpen(false)
    fetchItems()
    fetchStats()
    toast.success("Artikel erfolgreich erstellt")
  }

  const handleEditSuccess = () => {
    setEditDialogOpen(false)
    setSelectedItem(null)
    fetchItems()
    fetchStats()
    toast.success("Artikel erfolgreich aktualisiert")
  }

  const handleConsumeSuccess = () => {
    setConsumeDialogOpen(false)
    setSelectedItem(null)
    fetchItems()
    fetchStats()
    toast.success("Verbrauch erfasst")
  }

  const handleDeleteSuccess = () => {
    setDeleteDialogOpen(false)
    setSelectedItem(null)
    fetchItems()
    fetchArchivedItems()
    fetchStats()
    toast.success("Artikel gelöscht")
  }

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item)
    setEditDialogOpen(true)
  }

  const handleConsume = (item: InventoryItem) => {
    setSelectedItem(item)
    setConsumeDialogOpen(true)
  }

  const handleDelete = (item: InventoryItem) => {
    setSelectedItem(item)
    setDeleteDialogOpen(true)
  }

  const handleArchive = async (item: InventoryItem) => {
    if (!practiceId) return
    try {
      const response = await fetch(`/api/practices/${practiceId}/inventory/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: true }),
      })
      if (response.ok) {
        fetchItems()
        fetchArchivedItems()
        toast.success("Artikel archiviert")
      }
    } catch (error) {
      toast.error("Fehler beim Archivieren")
    }
  }

  const handleRestore = async (item: InventoryItem) => {
    if (!practiceId) return
    try {
      const response = await fetch(`/api/practices/${practiceId}/inventory/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: false }),
      })
      if (response.ok) {
        fetchItems()
        fetchArchivedItems()
        toast.success("Artikel wiederhergestellt")
      }
    } catch (error) {
      toast.error("Fehler beim Wiederherstellen")
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Inventar</h1>
            <p className="text-muted-foreground">Verwalten Sie Ihren Praxisbestand</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Aktualisieren
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Artikel
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <InventoryStatsCards stats={stats} loading={loading} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 h-auto gap-1">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Übersicht</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Inventar</span>
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Vorschläge</span>
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Lieferanten</span>
            </TabsTrigger>
            <TabsTrigger value="bills" className="gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Rechnungen</span>
            </TabsTrigger>
            <TabsTrigger value="archive" className="gap-2">
              <Archive className="h-4 w-4" />
              <span className="hidden sm:inline">Archiv</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Einstellungen</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab
              items={items}
              stats={stats}
              loading={loading}
              onEdit={handleEdit}
              onConsume={handleConsume}
            />
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <InventoryListTab
              items={items}
              loading={loading}
              onEdit={handleEdit}
              onConsume={handleConsume}
              onDelete={handleDelete}
              onArchive={handleArchive}
            />
          </TabsContent>

          <TabsContent value="suggestions" className="mt-6">
            <SuggestionsTab
              suggestions={suggestions}
              loading={loading}
              practiceId={practiceId}
              onRefresh={fetchSuggestions}
            />
          </TabsContent>

          <TabsContent value="suppliers" className="mt-6">
            <SuppliersTab
              suppliers={suppliers}
              loading={loading}
              practiceId={practiceId}
              onRefresh={fetchSuppliers}
            />
          </TabsContent>

          <TabsContent value="bills" className="mt-6">
            <BillsTab
              bills={bills}
              loading={loading}
              practiceId={practiceId}
              onRefresh={fetchBills}
            />
          </TabsContent>

          <TabsContent value="archive" className="mt-6">
            <ArchiveTab
              items={archivedItems}
              loading={loading}
              onRestore={handleRestore}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SettingsTab practiceId={practiceId} />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <CreateItemDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          practiceId={practiceId}
          suppliers={suppliers}
          onSuccess={handleCreateSuccess}
        />

        {selectedItem && (
          <>
            <EditItemDialog
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              item={selectedItem}
              practiceId={practiceId}
              suppliers={suppliers}
              onSuccess={handleEditSuccess}
            />

            <ConsumeDialog
              open={consumeDialogOpen}
              onOpenChange={setConsumeDialogOpen}
              item={selectedItem}
              practiceId={practiceId}
              onSuccess={handleConsumeSuccess}
            />

            <DeleteDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              item={selectedItem}
              practiceId={practiceId}
              onSuccess={handleDeleteSuccess}
            />
          </>
        )}
      </div>
    </AppLayout>
  )
}
