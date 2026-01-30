"use client"

import { Package, CheckCircle, Wrench, AlertTriangle } from "lucide-react"
import { StatsGrid } from "@/components/shared/stats-card"
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
  const stats = [
    {
      label: "Geräte gesamt",
      value: devices.length,
      icon: Package,
      iconColor: "text-blue-600",
      iconBgColor: "bg-blue-100",
    },
    {
      label: "Aktiv",
      value: devices.filter((d) => d.status === "active").length,
      icon: CheckCircle,
      iconColor: "text-green-600",
      iconBgColor: "bg-green-100",
    },
    {
      label: "Wartung fällig",
      value: devicesWithMaintenanceDue.length,
      icon: Wrench,
      iconColor: "text-yellow-600",
      iconBgColor: "bg-yellow-100",
    },
    {
      label: "Überfällig",
      value: devicesOverdue.length,
      icon: AlertTriangle,
      iconColor: "text-red-600",
      iconBgColor: "bg-red-100",
    },
  ]

  return <StatsGrid stats={stats} columns={4} />
}
