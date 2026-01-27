"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreVertical,
  Trash2,
  Eye,
  GraduationCap,
  Wrench,
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
import type { MedicalDevice } from "../types"
import { DEVICE_CATEGORIES } from "../types"

const STATUS_ICONS: Record<string, any> = {
  active: CheckCircle,
  maintenance: Wrench,
  defect: AlertTriangle,
  inactive: Settings2,
  disposed: Trash2,
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "Aktiv", color: "bg-green-100 text-green-700" },
  maintenance: { label: "In Wartung", color: "bg-yellow-100 text-yellow-700" },
  defect: { label: "Defekt", color: "bg-red-100 text-red-700" },
  inactive: { label: "Inaktiv", color: "bg-gray-100 text-gray-700" },
  disposed: { label: "Entsorgt", color: "bg-gray-100 text-gray-500" },
}

interface DeviceCardProps {
  device: MedicalDevice
  getResponsibleName: (userId?: string) => string
  onView: () => void
  onTrainings: () => void
  onMaintenance: () => void
  onDelete: () => void
}

export function DeviceCard({
  device,
  getResponsibleName,
  onView,
  onTrainings,
  onMaintenance,
  onDelete,
}: DeviceCardProps) {
  const statusConfig = STATUS_CONFIG[device.status] || STATUS_CONFIG.active
  const StatusIcon = STATUS_ICONS[device.status] || CheckCircle

  const getMaintenanceStatus = () => {
    if (!device.next_maintenance_date) return null
    const daysUntil = differenceInDays(parseISO(device.next_maintenance_date), new Date())

    if (daysUntil < 0) {
      return { label: "Überfällig", color: "bg-red-100 text-red-700" }
    } else if (daysUntil <= 14) {
      return { label: `In ${daysUntil} Tagen`, color: "bg-orange-100 text-orange-700" }
    } else if (daysUntil <= 30) {
      return { label: `In ${daysUntil} Tagen`, color: "bg-yellow-100 text-yellow-700" }
    }
    return null
  }

  const maintenanceStatus = getMaintenanceStatus()

  return (
    <Card
      className="group cursor-pointer hover:shadow-md transition-shadow"
      onClick={onView}
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
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
                <Eye className="h-4 w-4 mr-2" />
                Anzeigen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTrainings(); }}>
                <GraduationCap className="h-4 w-4 mr-2" />
                Einweisungen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMaintenance(); }}>
                <Wrench className="h-4 w-4 mr-2" />
                Wartung
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
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
}
