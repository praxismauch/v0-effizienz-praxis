"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
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
  Scan,
  QrCode,
  AlertTriangle,
  Calendar,
  TrendingDown,
  ShoppingCart,
  Check,
  X,
  Loader2,
  Camera,
  History,
  BarChart3,
  RefreshCw,
  Euro,
  PackageMinus,
  CheckCircle2,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface SmartInventoryDashboardProps {
  practiceId: string | number
  items: any[]
  suppliers: any[]
  onRefresh: () => void
}

const TREATMENT_TYPES = [
  { value: "prophylaxe", label: "Prophylaxe" },
  { value: "fuellungen", label: "Füllungen" },
  { value: "wurzelbehandlung", label: "Wurzelbehandlung" },
  { value: "extraktion", label: "Extraktion" },
  { value: "implantologie", label: "Implantologie" },
  { value: "parodontologie", label: "Parodontologie" },
  { value: "kieferorthopaedie", label: "Kieferorthopädie" },
  { value: "aesthetik", label: "Ästhetische Behandlung" },
  { value: "allgemein", label: "Allgemeine Untersuchung" },
]

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

export default function SmartInventoryDashboard({
  practiceId,
  items,
  suppliers,
  onRefresh,
}: SmartInventoryDashboardProps) {
  const [activeTab, setActiveTab] = useState("scanner")
  const [scannerActive, setScannerActive] = useState(false)
  const [manualBarcode, setManualBarcode] = useState("")
  const [scanResult, setScanResult] = useState<any>(null)
  const [scanHistory, setScanHistory] = useState<any[]>([])
  const [expirationAlerts, setExpirationAlerts] = useState<any[]>([])
  const [autoOrders, setAutoOrders] = useState<any[]>([])
  const [priceComparisons, setPriceComparisons] = useState<any[]>([])
  const [consumptionByTreatment, setConsumptionByTreatment] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [scanDialogOpen, setScanDialogOpen] = useState(false)
  const [consumeQuantity, setConsumeQuantity] = useState(1)
  const [selectedTreatment, setSelectedTreatment] = useState("")
  const [autoOrderRules, setAutoOrderRules] = useState<any[]>([])
  const [editingRule, setEditingRule] = useState<any>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Load data on mount
  useEffect(() => {
    loadExpirationAlerts()
    loadAutoOrders()
    loadConsumptionAnalytics()
    loadPriceComparisons()
    loadAutoOrderRules()
  }, [practiceId])

  const loadExpirationAlerts = async () => {
    // Simulate expiration data based on items
    const alerts = items
      .filter((item) => item.expiration_date)
      .map((item) => {
        const expDate = new Date(item.expiration_date)
        const today = new Date()
        const daysUntil = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return {
          id: item.id,
          item_name: item.name,
          expiration_date: item.expiration_date,
          days_until_expiry: daysUntil,
          quantity: item.current_stock,
          alert_type: daysUntil < 0 ? "expired" : daysUntil < 30 ? "expiring_soon" : "ok",
        }
      })
      .filter((a) => a.alert_type !== "ok")
      .sort((a, b) => a.days_until_expiry - b.days_until_expiry)

    setExpirationAlerts(alerts)
  }

  const loadAutoOrders = async () => {
    // Simulate auto-orders based on low stock items
    const lowStockItems = items.filter((item) => item.current_stock <= item.reorder_point)
    const orders = lowStockItems.map((item) => ({
      id: `auto-${item.id}`,
      item_id: item.id,
      item_name: item.name,
      quantity: item.optimal_stock - item.current_stock,
      unit_price: item.unit_cost || 10,
      total_price: (item.optimal_stock - item.current_stock) * (item.unit_cost || 10),
      status: "pending",
      trigger_reason: `Bestand unter Meldebestand (${item.current_stock}/${item.reorder_point})`,
      created_at: new Date().toISOString(),
    }))
    setAutoOrders(orders)
  }

  const loadConsumptionAnalytics = async () => {
    // Simulate consumption data by treatment
    const analytics = TREATMENT_TYPES.slice(0, 6).map((type) => ({
      treatment_type: type.value,
      treatment_name: type.label,
      total_treatments: Math.floor(Math.random() * 100) + 20,
      total_cost: Math.floor(Math.random() * 5000) + 500,
      top_items: items.slice(0, 3).map((item) => ({
        name: item.name,
        quantity: Math.floor(Math.random() * 50) + 5,
      })),
    }))
    setConsumptionByTreatment(analytics)
  }

  const loadPriceComparisons = async () => {
    // Simulate price comparison data
    const comparisons = items.slice(0, 5).map((item) => ({
      item_id: item.id,
      item_name: item.name,
      current_price: item.unit_cost || 10,
      suppliers: suppliers.slice(0, 3).map((supplier, idx) => ({
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        price: (item.unit_cost || 10) * (0.8 + idx * 0.15),
        delivery_days: 2 + idx,
      })),
      best_price: (item.unit_cost || 10) * 0.8,
      potential_savings: (item.unit_cost || 10) * 0.2 * item.current_stock,
    }))
    setPriceComparisons(comparisons)
  }

  const loadAutoOrderRules = async () => {
    // Simulate rules based on items with auto_order_enabled
    const rules = items
      .filter((item) => item.auto_order_enabled || item.current_stock <= item.reorder_point)
      .slice(0, 5)
      .map((item) => ({
        id: `rule-${item.id}`,
        item_id: item.id,
        item_name: item.name,
        trigger_type: "min_stock",
        trigger_threshold: item.reorder_point || item.minimum_stock,
        order_quantity: item.optimal_stock - (item.reorder_point || item.minimum_stock),
        is_active: item.auto_order_enabled || false,
        preferred_supplier: suppliers[0]?.name || "Nicht festgelegt",
      }))
    setAutoOrderRules(rules)
  }

  // Start camera for barcode scanning
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setScannerActive(true)
      toast.success("Kamera aktiviert")
    } catch (error) {
      toast.error("Kamera konnte nicht aktiviert werden. Bitte manuell eingeben.")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setScannerActive(false)
  }

  // Handle barcode scan (manual or camera)
  const handleBarcodeScan = async (barcode: string) => {
    if (!barcode.trim()) return

    setLoading(true)
    try {
      // Find item by barcode or SKU
      const item = items.find(
        (i) =>
          i.barcode === barcode ||
          i.sku === barcode ||
          i.qr_code === barcode ||
          i.name.toLowerCase().includes(barcode.toLowerCase()),
      )

      if (item) {
        setScanResult({
          found: true,
          item,
          barcode,
        })
        setScanDialogOpen(true)

        // Log scan
        setScanHistory((prev) => [
          {
            id: Date.now().toString(),
            barcode,
            item_name: item.name,
            scan_type: "lookup",
            timestamp: new Date().toISOString(),
          },
          ...prev.slice(0, 19),
        ])
      } else {
        setScanResult({
          found: false,
          barcode,
          message: "Artikel nicht gefunden. Möchten Sie einen neuen Artikel anlegen?",
        })
        setScanDialogOpen(true)
      }
    } catch (error) {
      toast.error("Fehler beim Scannen")
    } finally {
      setLoading(false)
      setManualBarcode("")
    }
  }

  // Handle consumption from scan
  const handleConsumption = async () => {
    if (!scanResult?.item) return

    setLoading(true)
    try {
      // Update item stock (simulated)
      const newStock = Math.max(0, scanResult.item.current_stock - consumeQuantity)

      toast.success(
        `${consumeQuantity}x ${scanResult.item.name} entnommen. Neuer Bestand: ${newStock} ${scanResult.item.unit}`,
      )

      // Log consumption
      setScanHistory((prev) => [
        {
          id: Date.now().toString(),
          barcode: scanResult.barcode,
          item_name: scanResult.item.name,
          scan_type: "consumption",
          quantity: consumeQuantity,
          treatment: selectedTreatment,
          timestamp: new Date().toISOString(),
        },
        ...prev.slice(0, 19),
      ])

      // Check for auto-order trigger
      if (newStock <= scanResult.item.reorder_point) {
        toast.info(
          `Achtung: Bestand von ${scanResult.item.name} ist unter dem Meldebestand. Auto-Bestellung wird geprüft.`,
        )
      }

      setScanDialogOpen(false)
      setConsumeQuantity(1)
      setSelectedTreatment("")
      onRefresh()
    } catch (error) {
      toast.error("Fehler bei der Entnahme")
    } finally {
      setLoading(false)
    }
  }

  // Approve auto-order
  const handleApproveAutoOrder = async (orderId: string) => {
    setAutoOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "approved", approved_at: new Date().toISOString() } : o)),
    )
    toast.success("Bestellung genehmigt")
  }

  // Reject auto-order
  const handleRejectAutoOrder = async (orderId: string) => {
    setAutoOrders((prev) => prev.filter((o) => o.id !== orderId))
    toast.info("Bestellung abgelehnt")
  }

  // Toggle auto-order rule
  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    setAutoOrderRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, is_active: isActive } : r)))
    toast.success(isActive ? "Auto-Bestellung aktiviert" : "Auto-Bestellung deaktiviert")
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="scanner" className="gap-2">
            <Scan className="h-4 w-4" />
            Scanner
          </TabsTrigger>
          <TabsTrigger value="expiration" className="gap-2 relative">
            <Calendar className="h-4 w-4" />
            Verfallsdaten
            {expirationAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                {expirationAlerts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="auto-order" className="gap-2 relative">
            <ShoppingCart className="h-4 w-4" />
            Auto-Bestellung
            {autoOrders.filter((o) => o.status === "pending").length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-[10px] text-white flex items-center justify-center">
                {autoOrders.filter((o) => o.status === "pending").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="prices" className="gap-2">
            <Euro className="h-4 w-4" />
            Preisvergleich
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Verbrauchsanalyse
          </TabsTrigger>
        </TabsList>

        {/* Scanner Tab */}
        <TabsContent value="scanner" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Scanner Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Barcode / QR-Scanner
                </CardTitle>
                <CardDescription>Scannen Sie Barcodes für schnelle Materialentnahme</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Camera View */}
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  {scannerActive ? (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                      <Camera className="h-12 w-12 mb-2 opacity-50" />
                      <p>Kamera nicht aktiv</p>
                    </div>
                  )}
                  {scannerActive && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-primary rounded-lg">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary"></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {!scannerActive ? (
                    <Button onClick={startCamera} className="flex-1">
                      <Camera className="mr-2 h-4 w-4" />
                      Kamera starten
                    </Button>
                  ) : (
                    <Button onClick={stopCamera} variant="outline" className="flex-1 bg-transparent">
                      <X className="mr-2 h-4 w-4" />
                      Kamera stoppen
                    </Button>
                  )}
                </div>

                {/* Manual Input */}
                <div className="space-y-2">
                  <Label>Manuelle Eingabe</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Barcode oder Artikelname eingeben..."
                      value={manualBarcode}
                      onChange={(e) => setManualBarcode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleBarcodeScan(manualBarcode)}
                    />
                    <Button onClick={() => handleBarcodeScan(manualBarcode)} disabled={!manualBarcode || loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scan className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scan History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Scan-Verlauf
                </CardTitle>
                <CardDescription>Letzte 20 Scans</CardDescription>
              </CardHeader>
              <CardContent>
                {scanHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Scan className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Noch keine Scans</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {scanHistory.map((scan) => (
                      <div key={scan.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{scan.item_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {scan.scan_type === "consumption" ? (
                              <span className="text-amber-600">-{scan.quantity} entnommen</span>
                            ) : (
                              "Nachgeschlagen"
                            )}
                            {scan.treatment && ` • ${TREATMENT_TYPES.find((t) => t.value === scan.treatment)?.label}`}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(scan.timestamp).toLocaleTimeString("de-DE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expiration Tab */}
        <TabsContent value="expiration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Verfallsdaten-Überwachung
              </CardTitle>
              <CardDescription>Artikel die bald ablaufen oder bereits abgelaufen sind</CardDescription>
            </CardHeader>
            <CardContent>
              {expirationAlerts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                  <p className="text-lg font-medium">Keine kritischen Verfallsdaten</p>
                  <p className="text-sm">Alle Artikel sind noch ausreichend haltbar</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Artikel</TableHead>
                      <TableHead>Verfallsdatum</TableHead>
                      <TableHead>Verbleibend</TableHead>
                      <TableHead>Menge</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aktion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expirationAlerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium">{alert.item_name}</TableCell>
                        <TableCell>{new Date(alert.expiration_date).toLocaleDateString("de-DE")}</TableCell>
                        <TableCell>
                          {alert.days_until_expiry < 0 ? (
                            <span className="text-red-600 font-medium">
                              {Math.abs(alert.days_until_expiry)} Tage überschritten
                            </span>
                          ) : (
                            <span className={alert.days_until_expiry < 14 ? "text-amber-600" : ""}>
                              {alert.days_until_expiry} Tage
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{alert.quantity}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              alert.alert_type === "expired"
                                ? "bg-red-100 text-red-700 border-red-200"
                                : "bg-amber-100 text-amber-700 border-amber-200"
                            }
                          >
                            {alert.alert_type === "expired" ? "Abgelaufen" : "Bald ablaufend"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            Priorisieren
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

        {/* Auto-Order Tab */}
        <TabsContent value="auto-order" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Pending Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Ausstehende Bestellungen
                </CardTitle>
                <CardDescription>Automatisch generierte Bestellvorschläge</CardDescription>
              </CardHeader>
              <CardContent>
                {autoOrders.filter((o) => o.status === "pending").length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                    <p>Keine ausstehenden Bestellungen</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {autoOrders
                      .filter((o) => o.status === "pending")
                      .map((order) => (
                        <div key={order.id} className="p-3 border rounded-lg space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{order.item_name}</p>
                              <p className="text-sm text-muted-foreground">{order.trigger_reason}</p>
                            </div>
                            <Badge variant="outline" className="bg-amber-100 text-amber-700">
                              Ausstehend
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>
                              {order.quantity} Stück × {order.unit_price?.toFixed(2)} €
                            </span>
                            <span className="font-medium">{order.total_price?.toFixed(2)} €</span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1" onClick={() => handleApproveAutoOrder(order.id)}>
                              <Check className="mr-1 h-3 w-3" />
                              Genehmigen
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 bg-transparent"
                              onClick={() => handleRejectAutoOrder(order.id)}
                            >
                              <X className="mr-1 h-3 w-3" />
                              Ablehnen
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Auto-Order Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Auto-Bestellregeln
                </CardTitle>
                <CardDescription>Automatische Nachbestellung konfigurieren</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {autoOrderRules.map((rule) => (
                    <div key={rule.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{rule.item_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Bestellen wenn unter {rule.trigger_threshold} Stück
                          </p>
                        </div>
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Bestellmenge: {rule.order_quantity}</span>
                        <span>{rule.preferred_supplier}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Price Comparison Tab */}
        <TabsContent value="prices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-emerald-500" />
                Lieferanten-Preisvergleich
              </CardTitle>
              <CardDescription>Finden Sie die besten Preise für Ihre Artikel</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artikel</TableHead>
                    <TableHead>Aktueller Preis</TableHead>
                    <TableHead>Bester Preis</TableHead>
                    <TableHead>Ersparnis</TableHead>
                    <TableHead>Bester Lieferant</TableHead>
                    <TableHead className="text-right">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceComparisons.map((comparison) => (
                    <TableRow key={comparison.item_id}>
                      <TableCell className="font-medium">{comparison.item_name}</TableCell>
                      <TableCell>{comparison.current_price?.toFixed(2)} €</TableCell>
                      <TableCell className="text-emerald-600 font-medium">
                        {comparison.best_price?.toFixed(2)} €
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-700">
                          {comparison.potential_savings?.toFixed(2)} € sparen
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {comparison.suppliers?.find((s: any) => s.price === comparison.best_price)?.supplier_name ||
                          "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Wechseln
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Savings Summary */}
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-emerald-900">Potenzielle Gesamtersparnis</p>
                    <p className="text-sm text-emerald-700">Bei Wechsel zu günstigsten Lieferanten für alle Artikel</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">
                    {priceComparisons.reduce((sum, c) => sum + (c.potential_savings || 0), 0).toFixed(2)} €
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Consumption by Treatment Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Verbrauch nach Behandlungsart</CardTitle>
                <CardDescription>Materialkosten pro Behandlung</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={consumptionByTreatment}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="treatment_name"
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(2)} €`, "Kosten"]}
                        labelFormatter={(label) => `Behandlung: ${label}`}
                      />
                      <Bar dataKey="total_cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Treatment Count Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Behandlungsverteilung</CardTitle>
                <CardDescription>Anzahl Behandlungen im Zeitraum</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={consumptionByTreatment}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ treatment_name, percent }) =>
                          `${treatment_name.slice(0, 10)}... ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="total_treatments"
                      >
                        {consumptionByTreatment.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Consumed Items by Treatment */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Top Verbrauchsartikel je Behandlung</CardTitle>
                <CardDescription>Die am meisten verwendeten Materialien</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {consumptionByTreatment.slice(0, 3).map((treatment) => (
                    <div key={treatment.treatment_type} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-3">{treatment.treatment_name}</h4>
                      <div className="space-y-2">
                        {treatment.top_items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{item.name}</span>
                            <span className="font-medium">{item.quantity}x</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Scan Result Dialog */}
      <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{scanResult?.found ? "Artikel gefunden" : "Artikel nicht gefunden"}</DialogTitle>
            <DialogDescription>
              {scanResult?.found ? `Barcode: ${scanResult.barcode}` : scanResult?.message}
            </DialogDescription>
          </DialogHeader>

          {scanResult?.found && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-lg">{scanResult.item.name}</h4>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Aktueller Bestand:</span>
                    <span className="ml-2 font-medium">
                      {scanResult.item.current_stock} {scanResult.item.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mindestbestand:</span>
                    <span className="ml-2">{scanResult.item.minimum_stock}</span>
                  </div>
                  {scanResult.item.expiration_date && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Verfallsdatum:</span>
                      <span className="ml-2">
                        {new Date(scanResult.item.expiration_date).toLocaleDateString("de-DE")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Entnahmemenge</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConsumeQuantity(Math.max(1, consumeQuantity - 1))}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={consumeQuantity}
                      onChange={(e) => setConsumeQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                      className="w-20 text-center"
                    />
                    <Button variant="outline" size="sm" onClick={() => setConsumeQuantity(consumeQuantity + 1)}>
                      +
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Behandlungsart (optional)</Label>
                  <Select value={selectedTreatment} onValueChange={setSelectedTreatment}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Behandlung auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TREATMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setScanDialogOpen(false)}>
              Abbrechen
            </Button>
            {scanResult?.found && (
              <Button onClick={handleConsumption} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PackageMinus className="mr-2 h-4 w-4" />
                )}
                Entnehmen
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
