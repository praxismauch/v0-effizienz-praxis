"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@/contexts/user-context"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import {
  Package,
  Plus,
  Search,
  BarChart3,
  Sparkles,
  Building2,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  RefreshCw,
  MoreVertical,
  Edit,
  Trash2,
  PackageMinus,
  Box,
  CheckCircle2,
  Clock,
  Zap,
  Receipt,
  Upload,
  FileText,
  Eye,
  Archive,
  Brain,
  Loader2,
  CheckSquare,
  ImageIcon,
  Scan,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { upload } from "@vercel/blob/client"

import SmartInventoryDashboard from "@/components/inventory/smart-inventory-dashboard"

const CATEGORIES = [
  { value: "medical", label: "Medizinisch", icon: "🏥" },
  { value: "office", label: "Büro", icon: "📎" },
  { value: "hygiene", label: "Hygiene", icon: "🧴" },
  { value: "equipment", label: "Geräte", icon: "⚙️" },
  { value: "lab", label: "Labor", icon: "🔬" },
  { value: "general", label: "Allgemein", icon: "📦" },
]

const URGENCY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-green-100 text-green-700 border-green-200",
}

const URGENCY_LABELS: Record<string, string> = {
  critical: "Kritisch",
  high: "Hoch",
  medium: "Mittel",
  low: "Niedrig",
}

interface InventoryItem {
  id: string
  name: string
  sku?: string
  category: string
  current_stock: number
  minimum_stock: number
  reorder_point: number
  optimal_stock: number
  unit: string
  unit_cost?: number
  supplier_id?: string
  last_restocked_at?: string
}

interface Supplier {
  id: string
  name: string
  email?: string
  phone?: string
  contact_person?: string
  is_preferred?: boolean
}

interface OrderSuggestion {
  item: InventoryItem
  suggestedQuantity: number
  reason: string
  urgency: "critical" | "high" | "medium" | "low"
  estimatedCost: number
  daysUntilStockout: number
  confidence: number
}

interface InventoryBill {
  id: string
  file_name: string
  file_url: string
  file_type?: string
  file_size?: number
  status: "pending" | "processing" | "completed" | "failed"
  extracted_at?: string
  extraction_error?: string
  supplier_name?: string
  bill_date?: string
  bill_number?: string
  total_amount?: number
  currency?: string
  extracted_items?: Array<{
    name: string
    quantity: number
    unit: string
    unit_price: number
    total_price: number
  }>
  ai_confidence?: number
  is_archived: boolean
  created_at: string
}

export default function InventoryPage() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [orderSuggestions, setOrderSuggestions] = useState<OrderSuggestion[]>([])
  const [loadingPredictions, setLoadingPredictions] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // Dialog states
  const [createItemOpen, setCreateItemOpen] = useState(false)
  const [editItemOpen, setEditItemOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [consumeDialogOpen, setConsumeDialogOpen] = useState(false)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)

  // Bills state
  const [bills, setBills] = useState<InventoryBill[]>([])
  const [archivedBills, setArchivedBills] = useState<InventoryBill[]>([])
  const [loadingBills, setLoadingBills] = useState(false)
  const [uploadingBill, setUploadingBill] = useState(false)
  const [extractingBillId, setExtractingBillId] = useState<string | null>(null)
  const [selectedBill, setSelectedBill] = useState<InventoryBill | null>(null)
  const [billDetailOpen, setBillDetailOpen] = useState(false)
  const [applyingItems, setApplyingItems] = useState(false)
  const [selectedItemsToApply, setSelectedItemsToApply] = useState<number[]>([])

  // Form state for new item
  const [newItem, setNewItem] = useState({
    name: "",
    sku: "",
    category: "general",
    current_stock: 0,
    minimum_stock: 5,
    reorder_point: 10,
    optimal_stock: 50,
    unit: "Stück",
    unit_cost: 0,
  })

  const practiceId = user?.practice_id

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!practiceId) {
      toast.error("Keine Praxis-ID gefunden. Bitte Seite neu laden.")
      return
    }

    setLoading(true)
    try {
      const [itemsRes, suppliersRes] = await Promise.all([
        fetch(`/api/practices/${practiceId}/inventory`),
        fetch(`/api/practices/${practiceId}/inventory/suppliers`),
      ])

      if (itemsRes.ok) {
        const data = await itemsRes.json()
        setItems(data)
        generateOrderSuggestions(data)
      }

      if (suppliersRes.ok) {
        const data = await suppliersRes.json()
        setSuppliers(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching inventory data:", error)
      toast.error("Fehler beim Laden der Bestandsdaten")
    } finally {
      setLoading(false)
    }
  }, [practiceId])

  // Fetch bills
  const fetchBills = useCallback(async () => {
    if (!practiceId) {
      toast.error("Keine Praxis-ID gefunden. Bitte Seite neu laden.")
      return
    }

    setLoadingBills(true)
    try {
      const [billsRes, archivedRes] = await Promise.all([
        fetch(`/api/practices/${practiceId}/inventory/bills?archived=false`),
        fetch(`/api/practices/${practiceId}/inventory/bills?archived=true`),
      ])

      if (billsRes.ok) {
        const data = await billsRes.json()
        setBills(data)
      }

      if (archivedRes.ok) {
        const data = await archivedRes.json()
        setArchivedBills(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching bills:", error)
      toast.error("Fehler beim Laden der Rechnungen")
    } finally {
      setLoadingBills(false)
    }
  }, [practiceId])

  // Load data for SmartInventoryDashboard
  const loadData = useCallback(async () => {
    await fetchData()
    await fetchBills()
  }, [fetchData, fetchBills])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Generate order suggestions
  const generateOrderSuggestions = (inventoryItems: InventoryItem[]) => {
    const suggestions: OrderSuggestion[] = []

    for (const item of inventoryItems) {
      if (item.current_stock <= item.reorder_point) {
        const stockPercentage = (item.current_stock / item.optimal_stock) * 100
        let urgency: "critical" | "high" | "medium" | "low" = "low"

        if (item.current_stock <= item.minimum_stock) {
          urgency = "critical"
        } else if (stockPercentage < 30) {
          urgency = "high"
        } else if (stockPercentage < 50) {
          urgency = "medium"
        }

        const suggestedQuantity = item.optimal_stock - item.current_stock

        suggestions.push({
          item,
          suggestedQuantity,
          reason: `Bestand unter ${urgency === "critical" ? "Mindestbestand" : "Nachbestellpunkt"}`,
          urgency,
          estimatedCost: suggestedQuantity * (item.unit_cost || 0),
          daysUntilStockout: Math.max(1, Math.floor(item.current_stock / 2)),
          confidence: 0.85,
        })
      }
    }

    setOrderSuggestions(
      suggestions.sort((a, b) => {
        const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
      }),
    )
  }

  // Handle bill upload
  const handleBillUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) {
      toast.error("Keine Dateien ausgewählt")
      return
    }

    if (!practiceId) {
      toast.error("Keine Praxis-ID gefunden. Bitte Seite neu laden.")
      return
    }

    setUploadingBill(true)
    try {
      for (const file of Array.from(files)) {
        // Upload to Vercel Blob
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        })

        // Create bill record
        const res = await fetch(`/api/practices/${practiceId}/inventory/bills`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.JSON.stringify({
            file_name: file.name,
            file_url: blob.url,
            file_type: file.type,
            file_size: file.size,
            uploaded_by: user?.id,
          }),
        })

        if (res.ok) {
          toast.success(`${file.name} hochgeladen`)
        } else {
          toast.error(`Fehler beim Hochladen von ${file.name}`)
        }
      }

      fetchBills()
    } catch (error) {
      console.error("[v0] Error uploading bill:", error)
      toast.error("Fehler beim Hochladen")
    } finally {
      setUploadingBill(false)
      event.target.value = ""
    }
  }

  // Extract data from bill using AI
  const handleExtractBill = async (billId: string) => {
    if (!practiceId) {
      toast.error("Keine Praxis-ID gefunden. Bitte Seite neu laden.")
      return
    }

    setExtractingBillId(billId)
    try {
      const res = await fetch(`/api/practices/${practiceId}/inventory/bills/${billId}/extract`, {
        method: "POST",
      })

      if (res.ok) {
        const data = await res.json()
        toast.success("Rechnung erfolgreich analysiert")
        fetchBills()

        // Open detail dialog
        setSelectedBill(data)
        setBillDetailOpen(true)
      } else {
        const error = await res.json()
        toast.error(error.error || "Fehler bei der Analyse")
      }
    } catch (error) {
      console.error("[v0] Error extracting bill:", error)
      toast.error("Fehler bei der KI-Analyse")
    } finally {
      setExtractingBillId(null)
    }
  }

  // Apply extracted items to inventory
  const handleApplyItems = async () => {
    if (!practiceId) {
      toast.error("Keine Praxis-ID gefunden. Bitte Seite neu laden.")
      return
    }

    if (!selectedBill) {
      toast.error("Keine Rechnung ausgewählt")
      return
    }

    setApplyingItems(true)
    try {
      const res = await fetch(`/api/practices/${practiceId}/inventory/bills/${selectedBill.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items_to_apply: selectedItemsToApply.length > 0 ? selectedItemsToApply : undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(data.message)
        setBillDetailOpen(false)
        setSelectedBill(null)
        setSelectedItemsToApply([])
        fetchData()
        fetchBills()
      } else {
        const error = await res.json()
        toast.error(error.error || "Fehler beim Anwenden")
      }
    } catch (error) {
      console.error("[v0] Error applying items:", error)
      toast.error("Fehler beim Übernehmen der Artikel")
    } finally {
      setApplyingItems(false)
    }
  }

  // Handle item creation
  const handleCreateItem = async () => {
    console.log("[v0] handleCreateItem called", { practiceId, newItem })

    if (!practiceId) {
      console.log("[v0] No practiceId found")
      toast.error("Keine Praxis-ID gefunden. Bitte Seite neu laden.")
      return
    }

    try {
      console.log("[v0] Sending POST request to create item")
      const res = await fetch(`/api/practices/${practiceId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      })

      console.log("[v0] Response status:", res.status)

      if (res.ok) {
        toast.success("Artikel erstellt")
        setCreateItemOpen(false)
        setNewItem({
          name: "",
          sku: "",
          category: "general",
          current_stock: 0,
          minimum_stock: 5,
          reorder_point: 10,
          optimal_stock: 50,
          unit: "Stück",
          unit_cost: 0,
        })
        fetchData()
      } else {
        const errorData = await res.text()
        console.log("[v0] Error response:", errorData)
        toast.error("Fehler beim Erstellen")
      }
    } catch (error) {
      console.error("[v0] Error creating item:", error)
      toast.error("Fehler beim Erstellen")
    }
  }

  // Handle delete item
  const handleDeleteItem = async (itemId: string) => {
    if (!practiceId) {
      toast.error("Keine Praxis-ID gefunden. Bitte Seite neu laden.")
      return
    }

    try {
      const res = await fetch(`/api/practices/${practiceId}/inventory/${itemId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Artikel gelöscht")
        fetchData()
      } else {
        toast.error("Fehler beim Löschen")
      }
    } catch (error) {
      console.error("[v0] Error deleting item:", error)
      toast.error("Fehler beim Löschen")
    }
  }

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Stats
  const totalItems = items.length
  const lowStockItems = items.filter((i) => i.current_stock <= i.reorder_point).length
  const criticalItems = items.filter((i) => i.current_stock <= i.minimum_stock).length
  const totalValue = items.reduce((sum, i) => sum + i.current_stock * (i.unit_cost || 0), 0)

  // Consumption chart data (mock)
  const consumptionData = [
    { name: "Mo", value: 12 },
    { name: "Di", value: 19 },
    { name: "Mi", value: 15 },
    { name: "Do", value: 22 },
    { name: "Fr", value: 18 },
    { name: "Sa", value: 8 },
    { name: "So", value: 5 },
  ]

  // Category distribution
  const categoryData = CATEGORIES.map((cat) => ({
    name: cat.label,
    value: items.filter((i) => i.category === cat.value).length,
    color: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6b7280"][CATEGORIES.indexOf(cat)],
  })).filter((d) => d.value > 0)

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Material</h1>
            <p className="text-muted-foreground">Verwalten Sie Ihren Materialbestand mit KI-gestützter Analyse</p>
          </div>
          <Button onClick={() => setCreateItemOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Neuer Artikel
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Artikel gesamt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">{totalItems}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Niedriger Bestand</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span className="text-2xl font-bold">{lowStockItems}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Kritisch</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">{criticalItems}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gesamtwert</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <span className="text-2xl font-bold">{totalValue.toFixed(2)} €</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-7">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="h-4 w-4 hidden sm:inline" />
                Übersicht
              </TabsTrigger>
              <TabsTrigger value="inventory" className="gap-2">
                <Package className="h-4 w-4 hidden sm:inline" />
                Bestand
              </TabsTrigger>
              <TabsTrigger value="smart" className="gap-2">
                <Scan className="h-4 w-4 hidden sm:inline" />
                Smart
              </TabsTrigger>
              <TabsTrigger value="bills" className="gap-2 relative">
                <Receipt className="h-4 w-4 hidden sm:inline" />
                Rechnungen
                {bills.filter((b) => b.status === "pending").length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 text-[10px] text-white flex items-center justify-center">
                    {bills.filter((b) => b.status === "pending").length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="gap-2 relative">
                <Sparkles className="h-4 w-4 hidden sm:inline" />
                KI-Vorschläge
                {orderSuggestions.filter((s) => s.urgency === "critical" || s.urgency === "high").length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                    {orderSuggestions.filter((s) => s.urgency === "critical" || s.urgency === "high").length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="suppliers" className="gap-2">
                <Building2 className="h-4 w-4 hidden sm:inline" />
                Lieferanten
              </TabsTrigger>
              <TabsTrigger value="archive" className="gap-2">
                <Archive className="h-4 w-4 hidden sm:inline" />
                Archiv
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Consumption Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Verbrauchstrend
                  </CardTitle>
                  <CardDescription>Materialverbrauch der letzten 7 Tage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={consumptionData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: "#3b82f6" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-emerald-500" />
                    Kategorieverteilung
                  </CardTitle>
                  <CardDescription>Artikel nach Kategorie</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Keine Daten vorhanden
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="smart" className="space-y-4">
            <SmartInventoryDashboard
              practiceId={user?.practice_id || ""}
              items={items}
              suppliers={suppliers}
              onRefresh={loadData}
            />
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Bestandsliste</CardTitle>
                    <CardDescription>Alle Materialien und Verbrauchsgüter</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Suchen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Kategorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Kategorien</SelectItem>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Keine Artikel gefunden</p>
                    <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setCreateItemOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Ersten Artikel anlegen
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Artikel</TableHead>
                        <TableHead>Kategorie</TableHead>
                        <TableHead className="text-center">Bestand</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Stückpreis</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => {
                        const stockPercent = Math.round((item.current_stock / item.optimal_stock) * 100)
                        const isCritical = item.current_stock <= item.minimum_stock
                        const isLow = item.current_stock <= item.reorder_point
                        const category = CATEGORIES.find((c) => c.value === item.category)

                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.name}</p>
                                {item.sku && <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {category?.icon} {category?.label || item.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-medium">
                                  {item.current_stock} {item.unit}
                                </span>
                                <Progress
                                  value={stockPercent}
                                  className={`w-16 h-1.5 ${isCritical ? "[&>div]:bg-red-500" : isLow ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"}`}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={
                                  isCritical
                                    ? URGENCY_COLORS.critical
                                    : isLow
                                      ? URGENCY_COLORS.high
                                      : URGENCY_COLORS.low
                                }
                              >
                                {isCritical ? "Kritisch" : isLow ? "Niedrig" : "OK"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {item.unit_cost ? `${item.unit_cost.toFixed(2)} €` : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedItem(item)
                                      setConsumeDialogOpen(true)
                                    }}
                                  >
                                    <PackageMinus className="mr-2 h-4 w-4" />
                                    Verbrauch erfassen
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedItem(item)
                                      setEditItemOpen(true)
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Bearbeiten
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setItemToDelete(item)
                                      setDeleteDialogOpen(true)
                                    }}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Löschen
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bills" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-500" />
                      KI-Rechnungsanalyse
                    </CardTitle>
                    <CardDescription>
                      Laden Sie Rechnungen hoch und lassen Sie die KI automatisch Artikel, Mengen und Preise extrahieren
                    </CardDescription>
                  </div>
                  <div>
                    <Label htmlFor="bill-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        {uploadingBill ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Rechnung hochladen
                      </div>
                    </Label>
                    <Input
                      id="bill-upload"
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      className="hidden"
                      onChange={handleBillUpload}
                      disabled={uploadingBill}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingBills ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : bills.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium mb-2">Keine Rechnungen vorhanden</p>
                    <p className="text-sm mb-4">
                      Laden Sie Rechnungen oder Lieferscheine hoch, um den Materialfluss automatisch zu erfassen
                    </p>
                    <Label htmlFor="bill-upload-empty" className="cursor-pointer inline-block">
                      <div className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-md hover:bg-muted/50 transition-colors">
                        <Upload className="h-4 w-4" />
                        Erste Rechnung hochladen
                      </div>
                    </Label>
                    <Input
                      id="bill-upload-empty"
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      className="hidden"
                      onChange={handleBillUpload}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bills.map((bill) => (
                      <div
                        key={bill.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {/* Preview */}
                        <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {bill.file_type?.startsWith("image/") ? (
                            <img
                              src={bill.file_url || "/placeholder.svg"}
                              alt={bill.file_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">{bill.file_name}</p>
                            <Badge
                              variant="outline"
                              className={
                                bill.status === "completed"
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                  : bill.status === "processing"
                                    ? "bg-blue-100 text-blue-700 border-blue-200"
                                    : bill.status === "failed"
                                      ? "bg-red-100 text-red-700 border-red-200"
                                      : "bg-amber-100 text-amber-700 border-amber-200"
                              }
                            >
                              {bill.status === "completed"
                                ? "Analysiert"
                                : bill.status === "processing"
                                  ? "Wird analysiert..."
                                  : bill.status === "failed"
                                    ? "Fehler"
                                    : "Ausstehend"}
                            </Badge>
                          </div>

                          {bill.status === "completed" && (
                            <div className="text-sm text-muted-foreground space-y-1">
                              {bill.supplier_name && (
                                <p>
                                  Lieferant: <span className="font-medium">{bill.supplier_name}</span>
                                </p>
                              )}
                              <div className="flex items-center gap-4">
                                {bill.bill_date && (
                                  <span>Datum: {new Date(bill.bill_date).toLocaleDateString("de-DE")}</span>
                                )}
                                {bill.total_amount && (
                                  <span>
                                    Summe: {bill.total_amount.toFixed(2)} {bill.currency || "€"}
                                  </span>
                                )}
                                {bill.extracted_items && <span>{bill.extracted_items.length} Artikel</span>}
                              </div>
                              {bill.ai_confidence && (
                                <div className="flex items-center gap-1">
                                  <Zap className="h-3 w-3 text-purple-500" />
                                  <span className="text-xs">{Math.round(bill.ai_confidence * 100)}% Konfidenz</span>
                                </div>
                              )}
                            </div>
                          )}

                          {bill.status === "failed" && bill.extraction_error && (
                            <p className="text-sm text-red-600">{bill.extraction_error}</p>
                          )}

                          <p className="text-xs text-muted-foreground mt-1">
                            Hochgeladen am {new Date(bill.created_at).toLocaleDateString("de-DE")}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {bill.status === "pending" && (
                            <Button onClick={() => handleExtractBill(bill.id)} disabled={extractingBillId === bill.id}>
                              {extractingBillId === bill.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Brain className="mr-2 h-4 w-4" />
                              )}
                              Analysieren
                            </Button>
                          )}

                          {bill.status === "completed" && (
                            <>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedBill(bill)
                                  setBillDetailOpen(true)
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Details
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedBill(bill)
                                  setSelectedItemsToApply([])
                                  setBillDetailOpen(true)
                                }}
                              >
                                <CheckSquare className="mr-2 h-4 w-4" />
                                Übernehmen
                              </Button>
                            </>
                          )}

                          {bill.status === "failed" && (
                            <Button
                              variant="outline"
                              onClick={() => handleExtractBill(bill.id)}
                              disabled={extractingBillId === bill.id}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Erneut versuchen
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      KI-Bestellvorschläge
                    </CardTitle>
                    <CardDescription>Basierend auf Verbrauchsmustern und Bestandsdaten</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => generateOrderSuggestions(items)}
                    disabled={loadingPredictions}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${loadingPredictions ? "animate-spin" : ""}`} />
                    Aktualisieren
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {orderSuggestions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                    <p className="text-lg font-medium">Keine Bestellungen erforderlich</p>
                    <p className="text-sm">Alle Bestände sind auf einem guten Niveau.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.item.id}
                        className={`p-4 rounded-lg border ${
                          suggestion.urgency === "critical"
                            ? "border-red-500/50 bg-red-500/5"
                            : suggestion.urgency === "high"
                              ? "border-orange-500/50 bg-orange-500/5"
                              : suggestion.urgency === "medium"
                                ? "border-amber-500/50 bg-amber-500/5"
                                : "border-border bg-card"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div
                              className={`p-3 rounded-lg ${
                                suggestion.urgency === "critical"
                                  ? "bg-red-500/10"
                                  : suggestion.urgency === "high"
                                    ? "bg-orange-500/10"
                                    : suggestion.urgency === "medium"
                                      ? "bg-amber-500/10"
                                      : "bg-muted"
                              }`}
                            >
                              <Package
                                className={`h-6 w-6 ${
                                  suggestion.urgency === "critical"
                                    ? "text-red-500"
                                    : suggestion.urgency === "high"
                                      ? "text-orange-500"
                                      : suggestion.urgency === "medium"
                                        ? "text-amber-500"
                                        : "text-muted-foreground"
                                }`}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{suggestion.item.name}</h4>
                                <Badge variant="outline" className={URGENCY_COLORS[suggestion.urgency]}>
                                  {URGENCY_LABELS[suggestion.urgency]}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{suggestion.reason}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="flex items-center gap-1">
                                  <Box className="h-4 w-4 text-muted-foreground" />
                                  Aktuell: {suggestion.item.current_stock} {suggestion.item.unit}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4 text-muted-foreground" />~{suggestion.daysUntilStockout}{" "}
                                  Tage bis leer
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                              <p className="text-lg font-bold">
                                {suggestion.suggestedQuantity} {suggestion.item.unit}
                              </p>
                              <p className="text-sm text-muted-foreground">~{suggestion.estimatedCost.toFixed(2)} €</p>
                            </div>
                            <Button
                              size="sm"
                              className={
                                suggestion.urgency === "critical"
                                  ? "bg-red-500 hover:bg-red-600"
                                  : suggestion.urgency === "high"
                                    ? "bg-orange-500 hover:bg-orange-600"
                                    : ""
                              }
                            >
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Bestellen
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Lieferanten</CardTitle>
                    <CardDescription>Verwalten Sie Ihre Materiallieferanten</CardDescription>
                  </div>
                  <Button onClick={() => setSupplierDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Neuer Lieferant
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {suppliers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Noch keine Lieferanten angelegt</p>
                    <Button
                      variant="outline"
                      className="mt-4 bg-transparent"
                      onClick={() => setSupplierDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ersten Lieferanten anlegen
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {suppliers.map((supplier) => (
                      <Card key={supplier.id} className="hover:border-primary/50 transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-500/10">
                                <Building2 className="h-5 w-5 text-blue-500" />
                              </div>
                              <div>
                                <CardTitle className="text-base">{supplier.name}</CardTitle>
                                {supplier.contact_person && (
                                  <p className="text-sm text-muted-foreground">{supplier.contact_person}</p>
                                )}
                              </div>
                            </div>
                            {supplier.is_preferred && <Badge className="bg-emerald-500">Bevorzugt</Badge>}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          {supplier.email && <p className="text-muted-foreground">{supplier.email}</p>}
                          {supplier.phone && <p className="text-muted-foreground">{supplier.phone}</p>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archive" className="space-y-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Archive className="h-5 w-5 text-muted-foreground" />
                    Archivierte Rechnungen
                  </CardTitle>
                  <CardDescription>Rechnungen deren Artikel bereits in den Bestand übernommen wurden</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {loadingBills ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : archivedBills.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Archive className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Keine archivierten Rechnungen</p>
                    <p className="text-sm">
                      Analysierte Rechnungen werden hier archiviert, nachdem Sie die Artikel übernommen haben
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datei</TableHead>
                        <TableHead>Lieferant</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead className="text-right">Betrag</TableHead>
                        <TableHead className="text-center">Artikel</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivedBills.map((bill) => (
                        <TableRow key={bill.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {bill.file_type?.startsWith("image/") ? (
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <FileText className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="font-medium truncate max-w-[200px]">{bill.file_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{bill.supplier_name || "-"}</TableCell>
                          <TableCell>
                            {bill.bill_date ? new Date(bill.bill_date).toLocaleDateString("de-DE") : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {bill.total_amount ? `${bill.total_amount.toFixed(2)} ${bill.currency || "€"}` : "-"}
                          </TableCell>
                          <TableCell className="text-center">{bill.extracted_items?.length || 0}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBill(bill)
                                setBillDetailOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Item Dialog */}
        <Dialog open={createItemOpen} onOpenChange={setCreateItemOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Neuer Artikel</DialogTitle>
              <DialogDescription>Fügen Sie einen neuen Artikel zum Bestand hinzu</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Artikelname"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Kategorie</Label>
                  <Select value={newItem.category} onValueChange={(v) => setNewItem({ ...newItem, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit">Einheit</Label>
                  <Input
                    id="unit"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="Stück"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="current_stock">Aktueller Bestand</Label>
                  <Input
                    id="current_stock"
                    type="number"
                    value={newItem.current_stock}
                    onChange={(e) => setNewItem({ ...newItem, current_stock: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit_cost">Stückpreis (€)</Label>
                  <Input
                    id="unit_cost"
                    type="number"
                    step="0.01"
                    value={newItem.unit_cost}
                    onChange={(e) => setNewItem({ ...newItem, unit_cost: Number.parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="minimum_stock">Mindestbestand</Label>
                  <Input
                    id="minimum_stock"
                    type="number"
                    value={newItem.minimum_stock}
                    onChange={(e) => setNewItem({ ...newItem, minimum_stock: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reorder_point">Nachbestellpunkt</Label>
                  <Input
                    id="reorder_point"
                    type="number"
                    value={newItem.reorder_point}
                    onChange={(e) => setNewItem({ ...newItem, reorder_point: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="optimal_stock">Optimal</Label>
                  <Input
                    id="optimal_stock"
                    type="number"
                    value={newItem.optimal_stock}
                    onChange={(e) => setNewItem({ ...newItem, optimal_stock: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateItemOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreateItem} disabled={!newItem.name.trim() || !practiceId}>
                Erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bill Detail Dialog */}
        <Dialog open={billDetailOpen} onOpenChange={setBillDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Rechnungsdetails
              </DialogTitle>
              <DialogDescription>{selectedBill?.file_name}</DialogDescription>
            </DialogHeader>

            {selectedBill && (
              <div className="space-y-6 py-4">
                {/* Preview */}
                {selectedBill.file_type?.startsWith("image/") && (
                  <div className="rounded-lg border overflow-hidden">
                    <img
                      src={selectedBill.file_url || "/placeholder.svg"}
                      alt={selectedBill.file_name}
                      className="w-full max-h-[300px] object-contain bg-muted"
                    />
                  </div>
                )}

                {/* Extracted Info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Lieferant</Label>
                    <p className="font-medium">{selectedBill.supplier_name || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Rechnungsnummer</Label>
                    <p className="font-medium">{selectedBill.bill_number || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Datum</Label>
                    <p className="font-medium">
                      {selectedBill.bill_date ? new Date(selectedBill.bill_date).toLocaleDateString("de-DE") : "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Gesamtbetrag</Label>
                    <p className="font-medium">
                      {selectedBill.total_amount
                        ? `${selectedBill.total_amount.toFixed(2)} ${selectedBill.currency || "€"}`
                        : "-"}
                    </p>
                  </div>
                </div>

                {/* Extracted Items */}
                {selectedBill.extracted_items && selectedBill.extracted_items.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Extrahierte Artikel</Label>
                      {!selectedBill.is_archived && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (selectedItemsToApply.length === selectedBill.extracted_items!.length) {
                              setSelectedItemsToApply([])
                            } else {
                              setSelectedItemsToApply(selectedBill.extracted_items!.map((_, i) => i))
                            }
                          }}
                        >
                          {selectedItemsToApply.length === selectedBill.extracted_items.length
                            ? "Alle abwählen"
                            : "Alle auswählen"}
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {selectedBill.extracted_items.map((item, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            selectedItemsToApply.includes(index) ? "border-primary bg-primary/5" : "border-border"
                          }`}
                        >
                          {!selectedBill.is_archived && (
                            <Checkbox
                              checked={selectedItemsToApply.includes(index)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedItemsToApply([...selectedItemsToApply, index])
                                } else {
                                  setSelectedItemsToApply(selectedItemsToApply.filter((i) => i !== index))
                                }
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} {item.unit} × {item.unit_price?.toFixed(2) || "?"} € ={" "}
                              {item.total_price?.toFixed(2) || "?"} €
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Confidence */}
                {selectedBill.ai_confidence && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4 text-purple-500" />
                    KI-Konfidenz: {Math.round(selectedBill.ai_confidence * 100)}%
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setBillDetailOpen(false)}>
                Schließen
              </Button>
              {selectedBill && !selectedBill.is_archived && (
                <Button
                  onClick={handleApplyItems}
                  disabled={
                    applyingItems || (selectedItemsToApply.length === 0 && selectedBill.extracted_items?.length === 0)
                  }
                >
                  {applyingItems ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckSquare className="mr-2 h-4 w-4" />
                  )}
                  {selectedItemsToApply.length > 0
                    ? `${selectedItemsToApply.length} Artikel übernehmen`
                    : "Alle Artikel übernehmen"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Artikel löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie den Artikel "{itemToDelete?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig
                gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (itemToDelete) {
                    handleDeleteItem(itemToDelete.id)
                  }
                  setDeleteDialogOpen(false)
                  setItemToDelete(null)
                }}
              >
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  )
}
