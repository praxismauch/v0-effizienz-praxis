"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Package, CheckCircle, Wrench, AlertTriangle } from "lucide-react"
import type { MedicalDevice } from "../types"

interface DevicesStatsCardsProps {
  devices: MedicalDevice[]
  devicesWithMaintenanceDue: MedicalDevice[]
  devicesOverdue: MedicalDevice[]
}

export function DevicesStatsCards({
  devices,
  devicesWithMaintenanceDue,
  devicesOverdue,
}: DevicesStatsCardsProps) {
  return (
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
  )
}
