"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Package, LayoutDashboard, Lightbulb, Truck, Receipt, Archive, Settings } from "lucide-react"

import { useInventory } from "./hooks/use-inventory"
import { InventoryStatsCards } from "./components/inventory-stats-cards"
import { OverviewTab } from "./components/overview-tab"
import { InventoryListTab } from "./components/inventory-list-tab"
import { SuggestionsTab } from "./components/suggestions-tab"
import { SuppliersTab } from "./components/suppliers-tab"
import { BillsTab } from "./components/bills-tab"
import { ArchiveTab } from "./components/archive-tab"
import { SettingsTab } from "./components/settings-tab"
import { 
  CreateItemDialog, 
  EditItemDialog, 
  BillDetailDialog,
  DeleteItemDialog 
} from "./components/inventory-dialogs"
import type { InventoryItem, Supplier } from "./types"

export default function InventoryPage() {
  const {
    items,
    suppliers,
    bills,
    isLoading,
    settings,
    setSettings,
    stats,
    fetchInventory,
    fetchSuppliers,
    fetchBills,
    addItem,
    updateItem,
    deleteItem,
    archiveItem,
    restoreItem,
  } = useInventory()

  const [activeTab, setActiveTab] = useState("overview")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isCreating, setIsCreating] = useState(false)
  const [itemFormData, setItemFormData] = useState({
    name: "",
    sku: "",
    category: "",
    quantity: 0,
    min_quantity: 0,
    unit: "",
    price: 0,
    supplier_id: "",
    location: "",
    notes: "",
  })

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item)
    setShowEditDialog(true)
  }

  const handleCreateItem = async () => {
    setIsCreating(true)
    try {
      const success = await addItem(itemFormData)
      if (success) {
        setShowAddDialog(false)
        setItemFormData({
          name: "",
          sku: "",
          category: "",
          quantity: 0,
          min_quantity: 0,
          unit: "",
          price: 0,
          supplier_id: "",
          location: "",
          notes: "",
        })
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleSaveSettings = async () => {
    // Save settings logic
  }

  const activeItems = items.filter((i) => i.status !== "archived")
  const archivedItems = items.filter((i) => i.status === "archived")

  const filteredItems = activeItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Inventar</h1>
          <p className="text-muted-foreground">Verwalten Sie Ihr Praxisinventar</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Artikel hinzufügen
        </Button>
      </div>

      <InventoryStatsCards stats={stats} settings={settings} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 h-auto gap-1">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Übersicht</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Inventar</span>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Vorschläge</span>
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Truck className="h-4 w-4" />
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
            items={activeItems} 
            stats={stats} 
            settings={settings}
            onViewItem={handleEditItem}
          />
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <InventoryListTab
            items={filteredItems}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            categories={categories}
            onEditItem={handleEditItem}
            onDeleteItem={deleteItem}
            onArchiveItem={archiveItem}
          />
        </TabsContent>

        <TabsContent value="suggestions" className="mt-6">
          <SuggestionsTab 
            items={activeItems} 
            settings={settings}
            onReorder={(item) => {
              // Reorder logic
            }}
          />
        </TabsContent>

        <TabsContent value="suppliers" className="mt-6">
          <SuppliersTab
            suppliers={suppliers}
            onAddSupplier={() => {
              // Future feature: Add supplier functionality
              console.log('[v0] Add supplier feature - coming soon')
            }}
          />
        </TabsContent>

        <TabsContent value="bills" className="mt-6">
          <BillsTab
            bills={bills}
            onAddBill={() => {
              // Future feature: Add bill functionality
              console.log('[v0] Add bill feature - coming soon')
            }}
          />
        </TabsContent>

        <TabsContent value="archive" className="mt-6">
          <ArchiveTab
            items={archivedItems}
            onRestoreItem={restoreItem}
            onDeleteItem={deleteItem}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SettingsTab
            settings={settings}
            onSettingsChange={setSettings}
            onSaveSettings={handleSaveSettings}
          />
        </TabsContent>
      </Tabs>

      <CreateItemDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        formData={itemFormData}
        onFormChange={setItemFormData}
        onSubmit={handleCreateItem}
        disabled={isCreating}
      />

      {selectedItem && (
        <EditItemDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          item={selectedItem}
          onUpdate={updateItem}
          suppliers={suppliers}
          categories={categories}
        />
      )}

      {/* AddSupplierDialog and AddBillDialog - Future Implementation */}
      {/* <AddSupplierDialog
        open={showAddSupplierDialog}
        onOpenChange={setShowAddSupplierDialog}
        onAdd={async (supplier) => {
          // Add supplier logic
          fetchSuppliers()
          return true
        }}
      />

      <AddBillDialog
        open={showAddBillDialog}
        onOpenChange={setShowAddBillDialog}
        onAdd={async (bill) => {
          // Add bill logic
          fetchBills()
          return true
        }}
        suppliers={suppliers}
      /> */}
    </div>
  )
}
