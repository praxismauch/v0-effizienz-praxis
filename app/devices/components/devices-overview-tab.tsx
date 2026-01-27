"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Package,
  Plus,
  MoreVertical,
  Eye,
  GraduationCap,
  Wrench,
  Trash2,
  ImageIcon,
  Building2,
  FileText,
  Users,
  CheckCircle,
  AlertTriangle,
  Settings2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { differenceInDays, parseISO } from "date-fns"
import { MedicalDevice, DEVICE_CATEGORIES, STATUS_CONFIG } from "../types"

const ICON_MAP: Record<string, any> = {
  CheckCircle,
  Wrench,
  AlertTriangle,
  Settings2,
  Trash2,
}

interface DevicesOverviewTabProps {
  devices: MedicalDevice[]
  searchTerm: string
  selectedCategory: string
  selectedStatus: string
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onStatusChange: (value: string) => void
  onDeviceClick: (device: MedicalDevice) => void
  onViewDevice: (device: MedicalDevice) => void
  onTrainingsClick: (device: MedicalDevice) => void
  onMaintenanceClick: (device: MedicalDevice) => void
  onDeleteClick: (device: MedicalDevice) => void
  onCreateClick: () => void
  getResponsibleName: (userId?: string) => string
}

export function DevicesOverviewTab({
  devices,
  searchTerm,
  selectedCategory,
  selectedStatus,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onDeviceClick,
  onViewDevice,
  onTrainingsClick,
  onMaintenanceClick,
  onDeleteClick,
  onCreateClick,
  getResponsibleName,
}: DevicesOverviewTabProps) {
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

  return (
    <>
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Gerät suchen..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
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
          onChange={(e) => onStatusChange(e.target.value)}
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
              <Button onClick={onCreateClick}>
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
            const StatusIcon = ICON_MAP[statusConfig.iconName] || CheckCircle
            const maintenanceStatus = getMaintenanceStatus(device)

            return (
              <Card
                key={device.id}
                className="group cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onDeviceClick(device)}
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
                            onViewDevice(device)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Anzeigen
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onTrainingsClick(device)
                          }}
                        >
                          <GraduationCap className="h-4 w-4 mr-2" />
                          Einweisungen
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onMaintenanceClick(device)
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
                            onDeleteClick(device)
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
    </>
  )
}
