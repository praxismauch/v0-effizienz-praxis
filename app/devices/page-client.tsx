"use client"

import { useState, useEffect, useCallback } from "react"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { useTeam } from "@/contexts/team-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plus,
  Search,
  Settings2,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Calendar,
  FileText,
  Users,
  Package,
  ImageIcon,
  MoreVertical,
  Trash2,
  Eye,
  GraduationCap,
  Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, differenceInDays, parseISO } from "date-fns"
import { de } from "date-fns/locale"
import { toast } from "@/components/ui/use-toast"
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
import { CreateDeviceDialog } from "@/components/devices/create-device-dialog"
import { ViewDeviceDialog } from "@/components/devices/view-device-dialog"
import { DeviceTrainingsDialog } from "@/components/devices/device-trainings-dialog"
import { DeviceMaintenanceDialog } from "@/components/devices/device-maintenance-dialog"
import { DeviceTrainingManagement } from "@/components/devices/device-training-management"

interface MedicalDevice {
  id: string
  practice_id: string
  name: string
  description?: string
  category?: string
  manufacturer?: string
  model?: string
  serial_number?: string
  inventory_number?: string
  purchase_date?: string
  purchase_price?: number
  currency?: string
  supplier_name?: string
  supplier_contact?: string
  warranty_end_date?: string
  location?: string
  room?: string
  responsible_user_id?: string
  image_url?: string
  handbook_url?: string
  ce_certificate_url?: string
  maintenance_interval_days?: number
  last_maintenance_date?: string
  next_maintenance_date?: string
  maintenance_service_partner?: string
  maintenance_service_contact?: string
  maintenance_service_phone?: string
  maintenance_service_email?: string
  consumables_supplier?: string
  consumables_order_url?: string
  consumables_notes?: string
  cleaning_instructions?: string
  maintenance_instructions?: string
  short_sop?: string
  status: string
  is_active: boolean
  created_at: string
}

const DEVICE_CATEGORIES = [
  { value: "diagnostik", label: "Diagnostik" },
  { value: "therapie", label: "Therapie" },
  { value: "labor", label: "Labor" },
  { value: "bildgebung", label: "Bildgebung" },
  { value: "chirurgie", label: "Chirurgie" },
  { value: "monitoring", label: "Monitoring" },
  { value: "it", label: "IT & EDV" },
  { value: "sonstiges", label: "Sonstiges" },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: "Aktiv", color: "bg-green-100 text-green-700", icon: CheckCircle },
  maintenance: { label: "In Wartung", color: "bg-yellow-100 text-yellow-700", icon: Wrench },
  defect: { label: "Defekt", color: "bg-red-100 text-red-700", icon: AlertTriangle },
  inactive: { label: "Inaktiv", color: "bg-gray-100 text-gray-700", icon: Settings2 },
  disposed: { label: "Entsorgt", color: "bg-gray-100 text-gray-500", icon: Trash2 },
}

export default function DevicesPageClient() {
  const { currentPractice } = usePractice()
  const { currentUser } = useUser()
  const { teamMembers } = useTeam()

  const [devices, setDevices] = useState<MedicalDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("overview")

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [trainingsDialogOpen, setTrainingsDialogOpen] = useState(false)
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<MedicalDevice | null>(null)

  const loadDevices = useCallback(async () => {
    if (!currentPractice?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/devices`)
      if (response.ok) {
        const data = await response.json()
        setDevices(data.devices || [])
      }
    } catch (error) {
      console.error("[v0] Error loading devices:", error)
    } finally {
      setLoading(false)
    }
  }, [currentPractice?.id])

  useEffect(() => {
    loadDevices()
  }, [loadDevices])

  const handleDelete = async () => {
    if (!selectedDevice || !currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/devices/${selectedDevice.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({ title: "Gerät gelöscht", description: "Das Gerät wurde erfolgreich gelöscht." })
        loadDevices()
      } else {
        throw new Error("Failed to delete device")
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Das Gerät konnte nicht gelöscht werden.", variant: "destructive" })
    } finally {
      setDeleteDialogOpen(false)
      setSelectedDevice(null)
    }
  }

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "all" || device.category === selectedCategory
    const matchesStatus = selectedStatus === "all" || device.status === selectedStatus

    return matchesSearch && matchesCategory && matchesStatus
  })

  const devicesWithMaintenanceDue = devices.filter((d) => {
    if (!d.next_maintenance_date) return false
    const daysUntil = differenceInDays(parseISO(d.next_maintenance_date), new Date())
    return daysUntil <= 30 && daysUntil >= 0
  })

  const devicesOverdue = devices.filter((d) => {
    if (!d.next_maintenance_date) return false
    return differenceInDays(parseISO(d.next_maintenance_date), new Date()) < 0
  })

  const getResponsibleName = (userId?: string) => {
    if (!userId) return "-"
    const member = teamMembers.find((m) => m.user_id === userId || m.id === userId)
    return member ? `${member.first_name} ${member.last_name}` : "-"
  }

  const getMaintenanceStatus = (device: MedicalDevice) => {
    if (!device.next_maintenance_date) return null
    const daysUntil = differenceInDays(parseISO(device.next_maintenance_date), new Date())

    if (daysUntil < 0) {
      return { label: "Überfällig", color: "bg-red-100 text-red-700", urgent: true }
    } else if (daysUntil <= 14) {
      return { label: `In ${daysUntil} Tagen`, color: "bg-orange-100 text-orange-700", urgent: true }
    } else if (daysUntil <= 30) {
      return { label: `In ${daysUntil} Tagen`, color: "bg-yellow-100 text-yellow-700", urgent: false }
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Geräte</h1>
          <p className="text-muted-foreground">Verwalten Sie Ihre medizinischen Geräte und Wartungspläne</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neues Gerät
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{devices.length}</p>
                <p className="text-sm text-muted-foreground">Geräte gesamt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{devices.filter((d) => d.status === "active").length}</p>
                <p className="text-sm text-muted-foreground">Aktiv</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Wrench className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{devicesWithMaintenanceDue.length}</p>
                <p className="text-sm text-muted-foreground">Wartung fällig</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{devicesOverdue.length}</p>
                <p className="text-sm text-muted-foreground">Überfällig</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="maintenance">
            Wartung
            {devicesWithMaintenanceDue.length + devicesOverdue.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {devicesWithMaintenanceDue.length + devicesOverdue.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="trainings">Einweisungen</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Gerät suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="all">Alle Kategorien</option>
              {DEVICE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="all">Alle Status</option>
              {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Devices Grid */}
          {filteredDevices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Keine Geräte gefunden</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {devices.length === 0
                    ? "Fügen Sie Ihr erstes Gerät hinzu, um mit der Verwaltung zu beginnen."
                    : "Keine Geräte entsprechen Ihren Filterkriterien."}
                </p>
                {devices.length === 0 && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Gerät hinzufügen
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDevices.map((device) => {
                const statusConfig = STATUS_CONFIG[device.status] || STATUS_CONFIG.active
                const StatusIcon = statusConfig.icon
                const maintenanceStatus = getMaintenanceStatus(device)

                return (
                  <Card
                    key={device.id}
                    className="group cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedDevice(device)
                      setViewDialogOpen(true)
                    }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {device.image_url ? (
                            <img
                              src={device.image_url || "/placeholder.svg"}
                              alt={device.name}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-base line-clamp-1">{device.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {device.manufacturer} {device.model && `- ${device.model}`}
                            </CardDescription>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedDevice(device)
                                setViewDialogOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Anzeigen
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedDevice(device)
                                setTrainingsDialogOpen(true)
                              }}
                            >
                              <GraduationCap className="h-4 w-4 mr-2" />
                              Einweisungen
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedDevice(device)
                                setMaintenanceDialogOpen(true)
                              }}
                            >
                              <Wrench className="h-4 w-4 mr-2" />
                              Wartung
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedDevice(device)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge className={cn("text-xs", statusConfig.color)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        {device.category && (
                          <Badge variant="outline" className="text-xs">
                            {DEVICE_CATEGORIES.find((c) => c.value === device.category)?.label || device.category}
                          </Badge>
                        )}
                        {maintenanceStatus && (
                          <Badge className={cn("text-xs", maintenanceStatus.color)}>
                            <Wrench className="h-3 w-3 mr-1" />
                            {maintenanceStatus.label}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1 text-sm text-muted-foreground">
                        {device.location && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5" />
                            <span className="truncate">
                              {device.location}
                              {device.room && ` / ${device.room}`}
                            </span>
                          </div>
                        )}
                        {device.serial_number && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5" />
                            <span className="truncate">SN: {device.serial_number}</span>
                          </div>
                        )}
                        {device.responsible_user_id && (
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5" />
                            <span className="truncate">{getResponsibleName(device.responsible_user_id)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <div className="space-y-4">
            {devicesOverdue.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Überfällige Wartungen ({devicesOverdue.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {devicesOverdue.map((device) => (
                      <div
                        key={device.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setSelectedDevice(device)
                          setMaintenanceDialogOpen(true)
                        }}
                      >
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Fällig seit:{" "}
                            {device.next_maintenance_date &&
                              format(parseISO(device.next_maintenance_date), "dd.MM.yyyy", { locale: de })}
                          </p>
                        </div>
                        <Button size="sm" variant="destructive">
                          <Wrench className="h-4 w-4 mr-2" />
                          Wartung dokumentieren
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {devicesWithMaintenanceDue.length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-yellow-700 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Anstehende Wartungen ({devicesWithMaintenanceDue.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {devicesWithMaintenanceDue.map((device) => {
                      const daysUntil = differenceInDays(parseISO(device.next_maintenance_date!), new Date())
                      return (
                        <div
                          key={device.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50"
                          onClick={() => {
                            setSelectedDevice(device)
                            setMaintenanceDialogOpen(true)
                          }}
                        >
                          <div>
                            <p className="font-medium">{device.name}</p>
                            <p className="text-sm text-muted-foreground">
                              In {daysUntil} Tagen (
                              {format(parseISO(device.next_maintenance_date!), "dd.MM.yyyy", { locale: de })})
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {device.maintenance_service_partner && (
                              <span className="text-sm text-muted-foreground">
                                {device.maintenance_service_partner}
                              </span>
                            )}
                            <Button size="sm" variant="outline">
                              <Calendar className="h-4 w-4 mr-2" />
                              Termin planen
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {devicesOverdue.length === 0 && devicesWithMaintenanceDue.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Alles auf dem neuesten Stand</h3>
                  <p className="text-muted-foreground text-center">
                    Keine anstehenden oder überfälligen Wartungen in den nächsten 30 Tagen.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trainings" className="mt-4">
          <DeviceTrainingManagement devices={devices} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateDeviceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          loadDevices()
          setCreateDialogOpen(false)
        }}
        editDevice={selectedDevice}
      />

      {selectedDevice && (
        <>
          <ViewDeviceDialog
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
            device={selectedDevice}
            onEdit={() => {
              setViewDialogOpen(false)
              setCreateDialogOpen(true)
            }}
            onRefresh={loadDevices}
          />

          <DeviceTrainingsDialog
            open={trainingsDialogOpen}
            onOpenChange={setTrainingsDialogOpen}
            device={selectedDevice}
          />

          <DeviceMaintenanceDialog
            open={maintenanceDialogOpen}
            onOpenChange={setMaintenanceDialogOpen}
            device={selectedDevice}
            onSuccess={loadDevices}
          />
        </>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gerät löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie das Gerät "{selectedDevice?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig
              gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
