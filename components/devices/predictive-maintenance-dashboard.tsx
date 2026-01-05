"use client"

import { useState, useEffect } from "react"
import { usePractice } from "@/contexts/practice-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CheckCircle,
  Clock,
  Cpu,
  Gauge,
  Package,
  RefreshCw,
  Settings,
  ShoppingCart,
  Sparkles,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Wrench,
  Zap,
} from "lucide-react"
import { format, addDays, differenceInDays } from "date-fns"
import { de } from "date-fns/locale"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface DeviceSensor {
  id: string
  device_id: string
  sensor_type: string
  sensor_name: string
  unit: string
  min_threshold?: number
  max_threshold?: number
  warning_threshold_low?: number
  warning_threshold_high?: number
  last_reading_value?: number
  last_reading_at?: string
}

interface MaintenancePrediction {
  id: string
  device_id: string
  device_name?: string
  prediction_type: string
  confidence_score: number
  predicted_date?: string
  risk_level: string
  description: string
  recommended_action: string
  estimated_cost?: number
  is_acknowledged: boolean
  is_resolved: boolean
}

interface DeviceConsumable {
  id: string
  device_id: string
  device_name?: string
  name: string
  part_number?: string
  category: string
  current_stock: number
  min_stock_level: number
  estimated_depletion_date?: string
  auto_order_enabled: boolean
}

interface AutoOrder {
  id: string
  item_name: string
  quantity: number
  estimated_cost?: number
  urgency: string
  reason: string
  status: string
  supplier_name?: string
}

interface DeviceHealthScore {
  device_id: string
  device_name: string
  overall_score: number
  reliability_score: number
  efficiency_score: number
  safety_score: number
  maintenance_score: number
  trend: "up" | "down" | "stable"
}

interface PredictiveMaintenanceDashboardProps {
  devices: Array<{ id: string; name: string; category?: string }>
}

export function PredictiveMaintenanceDashboard({ devices }: PredictiveMaintenanceDashboardProps) {
  const { currentPractice } = usePractice()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // State for all data
  const [predictions, setPredictions] = useState<MaintenancePrediction[]>([])
  const [consumables, setConsumables] = useState<DeviceConsumable[]>([])
  const [autoOrders, setAutoOrders] = useState<AutoOrder[]>([])
  const [healthScores, setHealthScores] = useState<DeviceHealthScore[]>([])
  const [sensorData, setSensorData] = useState<Record<string, DeviceSensor[]>>({})

  // Simulated data for demonstration
  useEffect(() => {
    if (!currentPractice?.id || devices.length === 0) {
      setLoading(false)
      return
    }

    // Simulate loading IoT data
    const loadData = async () => {
      setLoading(true)

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Generate simulated health scores for each device
      const simulatedHealthScores: DeviceHealthScore[] = devices.slice(0, 8).map((device) => ({
        device_id: device.id,
        device_name: device.name,
        overall_score: Math.floor(Math.random() * 30) + 70,
        reliability_score: Math.floor(Math.random() * 25) + 75,
        efficiency_score: Math.floor(Math.random() * 35) + 65,
        safety_score: Math.floor(Math.random() * 15) + 85,
        maintenance_score: Math.floor(Math.random() * 40) + 60,
        trend: ["up", "down", "stable"][Math.floor(Math.random() * 3)] as "up" | "down" | "stable",
      }))

      // Generate simulated predictions
      const simulatedPredictions: MaintenancePrediction[] = [
        {
          id: "pred-1",
          device_id: devices[0]?.id || "",
          device_name: devices[0]?.name || "Gerät 1",
          prediction_type: "part_replacement",
          confidence_score: 87,
          predicted_date: format(addDays(new Date(), 14), "yyyy-MM-dd"),
          risk_level: "medium",
          description: "Erhöhte Vibration deutet auf Verschleiß der Lager hin",
          recommended_action: "Lager innerhalb der nächsten 2 Wochen austauschen",
          estimated_cost: 180,
          is_acknowledged: false,
          is_resolved: false,
        },
        {
          id: "pred-2",
          device_id: devices[1]?.id || "",
          device_name: devices[1]?.name || "Gerät 2",
          prediction_type: "calibration",
          confidence_score: 92,
          predicted_date: format(addDays(new Date(), 7), "yyyy-MM-dd"),
          risk_level: "low",
          description: "Kalibrierung empfohlen basierend auf Nutzungsdaten",
          recommended_action: "Routinekalibrierung durchführen",
          estimated_cost: 50,
          is_acknowledged: true,
          is_resolved: false,
        },
        {
          id: "pred-3",
          device_id: devices[2]?.id || "",
          device_name: devices[2]?.name || "Gerät 3",
          prediction_type: "failure_risk",
          confidence_score: 78,
          predicted_date: format(addDays(new Date(), 5), "yyyy-MM-dd"),
          risk_level: "high",
          description: "Temperaturanomalie erkannt - Lüfterleistung reduziert",
          recommended_action: "Sofortige Inspektion des Kühlsystems empfohlen",
          estimated_cost: 250,
          is_acknowledged: false,
          is_resolved: false,
        },
      ]

      // Generate simulated consumables
      const simulatedConsumables: DeviceConsumable[] = [
        {
          id: "cons-1",
          device_id: devices[0]?.id || "",
          device_name: devices[0]?.name || "Gerät 1",
          name: "Filterpatrone",
          part_number: "FP-2024-A",
          category: "filter",
          current_stock: 2,
          min_stock_level: 3,
          estimated_depletion_date: format(addDays(new Date(), 21), "yyyy-MM-dd"),
          auto_order_enabled: true,
        },
        {
          id: "cons-2",
          device_id: devices[1]?.id || "",
          device_name: devices[1]?.name || "Gerät 2",
          name: "Einweg-Schläuche (10er Pack)",
          part_number: "ES-100",
          category: "tube",
          current_stock: 1,
          min_stock_level: 2,
          estimated_depletion_date: format(addDays(new Date(), 10), "yyyy-MM-dd"),
          auto_order_enabled: false,
        },
        {
          id: "cons-3",
          device_id: devices[2]?.id || "",
          device_name: devices[2]?.name || "Gerät 3",
          name: "Batteriepack",
          part_number: "BP-500",
          category: "battery",
          current_stock: 0,
          min_stock_level: 1,
          estimated_depletion_date: format(addDays(new Date(), 3), "yyyy-MM-dd"),
          auto_order_enabled: true,
        },
      ]

      // Generate auto-order suggestions
      const simulatedAutoOrders: AutoOrder[] = [
        {
          id: "order-1",
          item_name: "Filterpatrone FP-2024-A",
          quantity: 5,
          estimated_cost: 125,
          urgency: "normal",
          reason: "Bestand unter Mindestmenge (2 von 3)",
          status: "pending",
          supplier_name: "MedTech Supplies GmbH",
        },
        {
          id: "order-2",
          item_name: "Batteriepack BP-500",
          quantity: 2,
          estimated_cost: 89,
          urgency: "high",
          reason: "Bestand aufgebraucht - Gerät bald nicht einsatzfähig",
          status: "pending",
          supplier_name: "Medical Direct",
        },
      ]

      // Generate simulated sensor data
      const simulatedSensorData: Record<string, DeviceSensor[]> = {}
      devices.slice(0, 5).forEach((device) => {
        simulatedSensorData[device.id] = [
          {
            id: `sensor-${device.id}-temp`,
            device_id: device.id,
            sensor_type: "temperature",
            sensor_name: "Betriebstemperatur",
            unit: "°C",
            min_threshold: 15,
            max_threshold: 45,
            warning_threshold_low: 18,
            warning_threshold_high: 40,
            last_reading_value: Math.floor(Math.random() * 15) + 25,
            last_reading_at: new Date().toISOString(),
          },
          {
            id: `sensor-${device.id}-usage`,
            device_id: device.id,
            sensor_type: "usage_count",
            sensor_name: "Nutzungszyklen heute",
            unit: "Zyklen",
            last_reading_value: Math.floor(Math.random() * 50) + 10,
            last_reading_at: new Date().toISOString(),
          },
          {
            id: `sensor-${device.id}-power`,
            device_id: device.id,
            sensor_type: "power_consumption",
            sensor_name: "Stromverbrauch",
            unit: "kWh",
            last_reading_value: Math.random() * 5 + 1,
            last_reading_at: new Date().toISOString(),
          },
        ]
      })

      setHealthScores(simulatedHealthScores)
      setPredictions(simulatedPredictions)
      setConsumables(simulatedConsumables)
      setAutoOrders(simulatedAutoOrders)
      setSensorData(simulatedSensorData)
      setLoading(false)
    }

    loadData()
  }, [currentPractice?.id, devices])

  const runAIAnalysis = async () => {
    setRefreshing(true)
    toast({
      title: "KI-Analyse gestartet",
      description: "Die Sensordaten werden analysiert...",
    })

    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 2000))

    toast({
      title: "Analyse abgeschlossen",
      description: "3 neue Vorhersagen wurden erstellt.",
    })
    setRefreshing(false)
  }

  const acknowledgePredicton = (id: string) => {
    setPredictions((prev) => prev.map((p) => (p.id === id ? { ...p, is_acknowledged: true } : p)))
    toast({
      title: "Vorhersage bestätigt",
      description: "Die Vorhersage wurde als gesehen markiert.",
    })
  }

  const approveOrder = (id: string) => {
    setAutoOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "approved" } : o)))
    toast({
      title: "Bestellung genehmigt",
      description: "Die Bestellung wurde zur Ausführung freigegeben.",
    })
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 85) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    if (score >= 50) return "text-orange-600"
    return "text-red-600"
  }

  const getHealthBg = (score: number) => {
    if (score >= 85) return "bg-green-100"
    if (score >= 70) return "bg-yellow-100"
    if (score >= 50) return "bg-orange-100"
    return "bg-red-100"
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  const criticalPredictions = predictions.filter((p) => p.risk_level === "high" || p.risk_level === "critical")
  const lowStockConsumables = consumables.filter((c) => c.current_stock <= c.min_stock_level)
  const avgHealthScore =
    healthScores.length > 0
      ? Math.round(healthScores.reduce((acc, h) => acc + h.overall_score, 0) / healthScores.length)
      : 0

  return (
    <div className="space-y-6">
      {/* Header with AI Analysis Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            Predictive Maintenance & IoT-Monitoring
          </h3>
          <p className="text-sm text-muted-foreground">
            KI-gestützte Vorhersagen und Echtzeit-Überwachung Ihrer Geräte
          </p>
        </div>
        <Button onClick={runAIAnalysis} disabled={refreshing}>
          {refreshing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          KI-Analyse starten
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Geräte-Gesundheit</p>
                <p className={cn("text-2xl font-bold", getHealthColor(avgHealthScore))}>{avgHealthScore}%</p>
              </div>
              <div className={cn("p-3 rounded-full", getHealthBg(avgHealthScore))}>
                <Activity className={cn("h-5 w-5", getHealthColor(avgHealthScore))} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Kritische Warnungen</p>
                <p className="text-2xl font-bold text-orange-600">{criticalPredictions.length}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Niedriger Bestand</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockConsumables.length}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <Package className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Offene Bestellungen</p>
                <p className="text-2xl font-bold">{autoOrders.filter((o) => o.status === "pending").length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="predictions">
            Vorhersagen
            {criticalPredictions.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {criticalPredictions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="consumables">Verbrauchsmaterial</TabsTrigger>
          <TabsTrigger value="orders">Auto-Bestellungen</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Health Scores Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Geräte-Gesundheitsübersicht
              </CardTitle>
              <CardDescription>Echtzeit-Bewertung basierend auf Sensordaten und KI-Analyse</CardDescription>
            </CardHeader>
            <CardContent>
              {healthScores.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Keine Geräte mit Sensordaten verfügbar</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {healthScores.map((device) => (
                    <div
                      key={device.device_id}
                      className={cn("p-4 rounded-lg border", getHealthBg(device.overall_score))}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm truncate">{device.device_name}</span>
                        {device.trend === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
                        {device.trend === "down" && <TrendingDown className="h-4 w-4 text-red-600" />}
                      </div>
                      <div className="flex items-end gap-2">
                        <span className={cn("text-3xl font-bold", getHealthColor(device.overall_score))}>
                          {device.overall_score}
                        </span>
                        <span className="text-sm text-muted-foreground mb-1">/ 100</span>
                      </div>
                      <Progress value={device.overall_score} className="h-2 mt-2" />
                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Zuverlässigkeit</span>
                          <span className={getHealthColor(device.reliability_score)}>{device.reliability_score}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Effizienz</span>
                          <span className={getHealthColor(device.efficiency_score)}>{device.efficiency_score}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sicherheit</span>
                          <span className={getHealthColor(device.safety_score)}>{device.safety_score}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Wartung</span>
                          <span className={getHealthColor(device.maintenance_score)}>{device.maintenance_score}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Sensor Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Live-Sensordaten
              </CardTitle>
              <CardDescription>Aktuelle Messwerte der verbundenen Sensoren</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {Object.entries(sensorData).map(([deviceId, sensors]) => {
                    const device = devices.find((d) => d.id === deviceId)
                    return (
                      <div key={deviceId} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">{device?.name || "Unbekanntes Gerät"}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {sensors.map((sensor) => {
                            const isWarning =
                              sensor.warning_threshold_high && sensor.last_reading_value
                                ? sensor.last_reading_value > sensor.warning_threshold_high
                                : false
                            return (
                              <div
                                key={sensor.id}
                                className={cn(
                                  "p-3 rounded-lg",
                                  isWarning ? "bg-yellow-50 border border-yellow-200" : "bg-muted/50",
                                )}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  {sensor.sensor_type === "temperature" && (
                                    <Thermometer className="h-4 w-4 text-red-500" />
                                  )}
                                  {sensor.sensor_type === "usage_count" && (
                                    <Activity className="h-4 w-4 text-blue-500" />
                                  )}
                                  {sensor.sensor_type === "power_consumption" && (
                                    <Zap className="h-4 w-4 text-yellow-500" />
                                  )}
                                  <span className="text-sm text-muted-foreground">{sensor.sensor_name}</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                  <span className={cn("text-xl font-bold", isWarning && "text-yellow-600")}>
                                    {sensor.last_reading_value?.toFixed(1)}
                                  </span>
                                  <span className="text-sm text-muted-foreground">{sensor.unit}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BrainCircuit className="h-4 w-4" />
                KI-Wartungsvorhersagen
              </CardTitle>
              <CardDescription>
                Basierend auf Sensordaten, Nutzungsmustern und historischen Wartungsdaten
              </CardDescription>
            </CardHeader>
            <CardContent>
              {predictions.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Keine Vorhersagen</h3>
                  <p className="text-sm text-muted-foreground">Alle Geräte laufen im normalen Bereich</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {predictions.map((prediction) => (
                    <div
                      key={prediction.id}
                      className={cn(
                        "p-4 rounded-lg border",
                        prediction.risk_level === "high" || prediction.risk_level === "critical"
                          ? "border-orange-200 bg-orange-50"
                          : prediction.risk_level === "medium"
                            ? "border-yellow-200 bg-yellow-50"
                            : "border-green-200 bg-green-50",
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={cn("text-white", getRiskColor(prediction.risk_level))}>
                              {prediction.risk_level === "critical" && "Kritisch"}
                              {prediction.risk_level === "high" && "Hoch"}
                              {prediction.risk_level === "medium" && "Mittel"}
                              {prediction.risk_level === "low" && "Niedrig"}
                            </Badge>
                            <span className="text-sm font-medium">{prediction.device_name}</span>
                            <span className="text-xs text-muted-foreground">
                              Konfidenz: {prediction.confidence_score}%
                            </span>
                          </div>
                          <p className="font-medium mb-1">{prediction.description}</p>
                          <p className="text-sm text-muted-foreground mb-2">{prediction.recommended_action}</p>
                          <div className="flex items-center gap-4 text-sm">
                            {prediction.predicted_date && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Voraussichtlich:{" "}
                                {format(new Date(prediction.predicted_date), "dd.MM.yyyy", { locale: de })}
                              </span>
                            )}
                            {prediction.estimated_cost && (
                              <span className="flex items-center gap-1">
                                <span>Geschätzte Kosten: {prediction.estimated_cost.toFixed(2)} €</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!prediction.is_acknowledged && (
                            <Button size="sm" variant="outline" onClick={() => acknowledgePredicton(prediction.id)}>
                              Bestätigen
                            </Button>
                          )}
                          <Button size="sm">
                            <Wrench className="h-3 w-3 mr-1" />
                            Wartung planen
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

        {/* Consumables Tab */}
        <TabsContent value="consumables" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Verbrauchsmaterial-Überwachung
              </CardTitle>
              <CardDescription>Bestandsüberwachung mit automatischer Nachbestellungsvorhersage</CardDescription>
            </CardHeader>
            <CardContent>
              {consumables.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Keine Verbrauchsmaterialien konfiguriert</h3>
                  <p className="text-sm text-muted-foreground">
                    Fügen Sie Verbrauchsmaterialien zu Ihren Geräten hinzu
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {consumables.map((item) => {
                    const stockPercent = (item.current_stock / Math.max(item.min_stock_level * 2, 1)) * 100
                    const isLow = item.current_stock <= item.min_stock_level
                    const daysUntilEmpty = item.estimated_depletion_date
                      ? differenceInDays(new Date(item.estimated_depletion_date), new Date())
                      : null

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "p-4 rounded-lg border",
                          isLow ? "border-yellow-200 bg-yellow-50" : "bg-muted/30",
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            {item.part_number && (
                              <span className="text-sm text-muted-foreground ml-2">({item.part_number})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {item.auto_order_enabled && (
                              <Badge variant="outline" className="text-xs">
                                <Settings className="h-3 w-3 mr-1" />
                                Auto-Bestellung aktiv
                              </Badge>
                            )}
                            {isLow && (
                              <Badge variant="destructive" className="text-xs">
                                Nachbestellen
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">Für: {item.device_name}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span>
                                Bestand: {item.current_stock} / {item.min_stock_level * 2}
                              </span>
                              {daysUntilEmpty !== null && daysUntilEmpty > 0 && (
                                <span className={cn(daysUntilEmpty < 7 ? "text-orange-600" : "text-muted-foreground")}>
                                  Reicht noch ~{daysUntilEmpty} Tage
                                </span>
                              )}
                            </div>
                            <Progress
                              value={Math.min(stockPercent, 100)}
                              className={cn("h-2", isLow && "[&>div]:bg-yellow-500")}
                            />
                          </div>
                          <Button size="sm" variant={isLow ? "default" : "outline"}>
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Bestellen
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto-Orders Tab */}
        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Automatische Bestellvorschläge
              </CardTitle>
              <CardDescription>
                KI-generierte Bestellempfehlungen basierend auf Verbrauch und Vorhersagen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {autoOrders.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Keine offenen Bestellvorschläge</h3>
                  <p className="text-sm text-muted-foreground">Alle Bestände sind ausreichend</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {autoOrders.map((order) => (
                    <div
                      key={order.id}
                      className={cn(
                        "p-4 rounded-lg border",
                        order.urgency === "high" || order.urgency === "critical"
                          ? "border-orange-200 bg-orange-50"
                          : "bg-muted/30",
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{order.item_name}</span>
                            <Badge
                              variant={
                                order.urgency === "high" || order.urgency === "critical" ? "destructive" : "secondary"
                              }
                            >
                              {order.urgency === "critical" && "Dringend"}
                              {order.urgency === "high" && "Hoch"}
                              {order.urgency === "normal" && "Normal"}
                              {order.urgency === "low" && "Niedrig"}
                            </Badge>
                            <Badge variant="outline">
                              {order.status === "pending" && "Ausstehend"}
                              {order.status === "approved" && "Genehmigt"}
                              {order.status === "ordered" && "Bestellt"}
                              {order.status === "delivered" && "Geliefert"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{order.reason}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span>Menge: {order.quantity}</span>
                            {order.estimated_cost && <span>Geschätzt: {order.estimated_cost.toFixed(2)} €</span>}
                            {order.supplier_name && (
                              <span className="text-muted-foreground">Lieferant: {order.supplier_name}</span>
                            )}
                          </div>
                        </div>
                        {order.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              Ablehnen
                            </Button>
                            <Button size="sm" onClick={() => approveOrder(order.id)}>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Genehmigen
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PredictiveMaintenanceDashboard
