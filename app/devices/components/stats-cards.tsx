"use client"

import { Package, CheckCircle, Wrench, AlertTriangle } from "lucide-react"
import { StatCard, statCardColors } from "@/components/ui/stat-card"
import type { MedicalDevice } from "../types"

interface StatsCardsProps {
  devices: MedicalDevice[]
  devicesWithMaintenanceDue: MedicalDevice[]
  devicesOverdue: MedicalDevice[]
}

export function StatsCards({ devices, devicesWithMaintenanceDue, devicesOverdue }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label="Geräte gesamt"
        value={devices.length}
        icon={Package}
        {...statCardColors.blue}
      />
      <StatCard
        label="Aktiv"
        value={devices.filter((d) => d.status === "active").length}
        icon={CheckCircle}
        {...statCardColors.green}
      />
      <StatCard
        label="Wartung fällig"
        value={devicesWithMaintenanceDue.length}
        icon={Wrench}
        {...statCardColors.amber}
      />
      <StatCard
        label="Überfällig"
        value={devicesOverdue.length}
        icon={AlertTriangle}
        {...statCardColors.red}
      />
    </div>
  )
}
