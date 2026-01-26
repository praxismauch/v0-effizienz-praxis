"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Plus,
  Package,
  ImageIcon,
  MoreVertical,
  Trash2,
  Eye,
  GraduationCap,
  Wrench,
  Building2,
  FileText,
  Users,
  CheckCircle,
  AlertTriangle,
  Settings2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MedicalDevice, DEVICE_CATEGORIES, STATUS_CONFIG } from "../types"

const STATUS_ICONS: Record<string, any> = {
  active: CheckCircle,
  maintenance: Wrench,
  defect: AlertTriangle,
  inactive: Settings2,
  disposed: Trash2,
}

interface OverviewTabProps {
  devices: MedicalDevice[]
  filteredDevices: MedicalDevice[]
  searchTerm: string
  setSearchTerm: (value: string) => void
  selectedCategory: string
  setSelectedCategory: (value: string) => void
  selectedStatus: string
  setSelectedStatus: (value: string) => void
  getResponsibleName: (userId?: string) => string
  getMaintenanceStatus: (device: MedicalDevice) => { label: string; color: string; urgent: boolean } | null
  onViewDevice: (device: MedicalDevice) => void
  onViewTrainings: (device: MedicalDevice) => void
  onViewMaintenance: (device: MedicalDevice) => void
  onDeleteDevice: (device: MedicalDevice) => void
  onCreateDevice: () => void
}

export function OverviewTab({
  devices,
  filteredDevices,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
  getResponsibleName,
  getMaintenanceStatus,
  onViewDevice,
  onViewTrainings,
  onViewMaintenance,
  onDeleteDevice,
  onCreateDevice,
}: OverviewTabProps) {
  return (
    <>
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
              <Button onClick={onCreateDevice}>
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
            const StatusIcon = STATUS_ICONS[device.status] || CheckCircle
            const maintenanceStatus = getMaintenanceStatus(device)

            return (
              <Card
                key={device.id}
                className="group cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onViewDevice(device)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {device.image_url ? (
                        <img
                          src={device.image_url}
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
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDevice(device) }}>
                          <Eye className="h-4 w-4 mr-2" />
                          Anzeigen
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewTrainings(device) }}>
                          <GraduationCap className="h-4 w-4 mr-2" />
                          Einweisungen
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewMaintenance(device) }}>
                          <Wrench className="h-4 w-4 mr-2" />
                          Wartung
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); onDeleteDevice(device) }}
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
