"use client"

import { useState } from "react"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { useTeam } from "@/contexts/team-context"
import useSWR from "swr"
import { SWR_KEYS } from "@/lib/swr-keys"
import { swrFetcher } from "@/lib/swr-fetcher"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search, Package } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
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
import { differenceInDays, parseISO } from "date-fns"

// Components
import { CreateDeviceDialog } from "@/components/devices/create-device-dialog"
import { ViewDeviceDialog } from "@/components/devices/view-device-dialog"
import { DeviceTrainingsDialog } from "@/components/devices/device-trainings-dialog"
import { DeviceMaintenanceDialog } from "@/components/devices/device-maintenance-dialog"
import { DeviceTrainingManagement } from "@/components/devices/device-training-management"

// Local components
import { DevicesStatsCards } from "./components/devices-stats-cards"
import { MaintenanceTab } from "./components/maintenance-tab"
import { DeviceCard } from "./components/device-card"
import { MedicalDevice, DEVICE_CATEGORIES, STATUS_CONFIG } from "./types"

export default function DevicesPageClient() {
  const { currentPractice } = usePractice()
  const { currentUser } = useUser()
  const { teamMembers } = useTeam()

  const {
    data: devicesData,
    error,
    isLoading,
    mutate: mutateDevices,
  } = useSWR<{ devices: MedicalDevice[] }>(
    currentPractice?.id ? SWR_KEYS.devices(currentPractice.id) : null,
    swrFetcher,
  )

  const devices = devicesData?.devices || []
  const loading = isLoading

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
  const [editingDevice, setEditingDevice] = useState<MedicalDevice | null>(null)

  // Computed values
  const devicesWithMaintenanceDue = devices.filter((d) => {
    if (!d.next_maintenance_date) return false
    const daysUntil = differenceInDays(parseISO(d.next_maintenance_date), new Date())
    return daysUntil <= 30 && daysUntil >= 0
  })

  const devicesOverdue = devices.filter((d) => {
    if (!d.next_maintenance_date) return false
    return differenceInDays(parseISO(d.next_maintenance_date), new Date()) < 0
  })

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

  // Helpers
  const getResponsibleName = (userId?: string) => {
    if (!userId) return "-"
    const member = teamMembers.find((m) => m.user_id === userId || m.id === userId)
    return member ? `${member.first_name} ${member.last_name}` : "-"
  }

  const handleDelete = async () => {
    if (!selectedDevice || !currentPractice?.id) return

    const previousDevices = devices

    try {
      await mutateDevices(
        (current) => ({
          devices: current?.devices.filter((d) => d.id !== selectedDevice.id) || [],
        }),
        { revalidate: false },
      )

      const response = await fetch(`/api/practices/${currentPractice.id}/devices/${selectedDevice.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete device")

      toast({ title: "Gerät gelöscht", description: "Das Gerät wurde erfolgreich gelöscht." })
      await mutateDevices()
    } catch (error) {
      await mutateDevices(() => ({ devices: previousDevices }), { revalidate: false })
      toast({ title: "Fehler", description: "Das Gerät konnte nicht gelöscht werden.", variant: "destructive" })
    } finally {
      setDeleteDialogOpen(false)
      setSelectedDevice(null)
    }
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
      <DevicesStatsCards 
        devices={devices} 
        devicesWithMaintenanceDue={devicesWithMaintenanceDue} 
        devicesOverdue={devicesOverdue} 
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto gap-1">
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
              {filteredDevices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  getResponsibleName={getResponsibleName}
                  onView={() => {
                    setSelectedDevice(device)
                    setViewDialogOpen(true)
                  }}
                  onTrainings={() => {
                    setSelectedDevice(device)
                    setTrainingsDialogOpen(true)
                  }}
                  onMaintenance={() => {
                    setSelectedDevice(device)
                    setMaintenanceDialogOpen(true)
                  }}
                  onDelete={() => {
                    setSelectedDevice(device)
                    setDeleteDialogOpen(true)
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <MaintenanceTab
            devicesOverdue={devicesOverdue}
            devicesWithMaintenanceDue={devicesWithMaintenanceDue}
            onMaintenanceClick={(device) => {
              setSelectedDevice(device)
              setMaintenanceDialogOpen(true)
            }}
          />
        </TabsContent>

        <TabsContent value="trainings" className="mt-4">
          <DeviceTrainingManagement devices={devices} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateDeviceDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open)
          if (!open) setEditingDevice(null)
        }}
        editDevice={editingDevice}
        onSuccess={() => {
          mutateDevices()
          setCreateDialogOpen(false)
          setEditingDevice(null)
        }}
      />

      {selectedDevice && (
        <>
          <ViewDeviceDialog
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
            device={selectedDevice}
            onEdit={() => {
              setEditingDevice(selectedDevice)
              setViewDialogOpen(false)
              setCreateDialogOpen(true)
            }}
            onRefresh={() => mutateDevices()}
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
            onMaintenanceAdded={() => mutateDevices()}
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
