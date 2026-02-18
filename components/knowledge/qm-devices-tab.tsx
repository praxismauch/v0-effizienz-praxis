"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { usePractice } from "@/contexts/practice-context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Cpu,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Calendar,
} from "lucide-react"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => { if (!r.ok) throw new Error("Fetch failed"); return r.json() })

interface Device {
  id: string
  name: string
  manufacturer?: string
  model?: string
  serial_number?: string
  location?: string
  category?: string
  status?: string
  created_at: string
}

interface DeviceTraining {
  id: string
  device_id: string
  team_member_id: string
  team_member_name: string
  training_date: string
  valid_until?: string
  is_valid: boolean
  training_type: string
}

export function QmDevicesTab() {
  const { currentPractice } = usePractice()
  const practiceId = currentPractice?.id
  const [searchQuery, setSearchQuery] = useState("")

  const { data: devicesData, isLoading: devicesLoading } = useSWR(
    practiceId ? `/api/practices/${practiceId}/devices` : null,
    fetcher,
    { refreshInterval: 60000 }
  )

  const { data: trainingsData, isLoading: trainingsLoading } = useSWR(
    practiceId ? `/api/practices/${practiceId}/device-trainings` : null,
    fetcher,
    { refreshInterval: 60000 }
  )

  const devices: Device[] = devicesData?.devices || devicesData || []
  const trainings: DeviceTraining[] = trainingsData?.trainings || []

  const isLoading = devicesLoading || trainingsLoading

  // Build training stats per device
  const trainingStats = useMemo(() => {
    const stats: Record<string, { total: number; valid: number; expired: number }> = {}
    for (const t of trainings) {
      if (!stats[t.device_id]) stats[t.device_id] = { total: 0, valid: 0, expired: 0 }
      stats[t.device_id].total++
      const isExpired = t.valid_until && new Date(t.valid_until) < new Date()
      if (t.is_valid && !isExpired) {
        stats[t.device_id].valid++
      } else {
        stats[t.device_id].expired++
      }
    }
    return stats
  }, [trainings])

  const filteredDevices = useMemo(() => {
    if (!searchQuery) return devices
    const q = searchQuery.toLowerCase()
    return devices.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.manufacturer?.toLowerCase().includes(q) ||
        d.category?.toLowerCase().includes(q) ||
        d.location?.toLowerCase().includes(q)
    )
  }, [devices, searchQuery])

  // Group by category
  const categoryGroups = useMemo(() => {
    const groups: Record<string, Device[]> = {}
    for (const device of filteredDevices) {
      const cat = device.category || "Sonstige"
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(device)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredDevices])

  // Summary stats
  const summary = useMemo(() => {
    let totalTrainings = 0
    let expiredTrainings = 0
    let devicesWithoutTraining = 0
    for (const d of devices) {
      const s = trainingStats[d.id]
      if (!s || s.total === 0) {
        devicesWithoutTraining++
      } else {
        totalTrainings += s.total
        expiredTrainings += s.expired
      }
    }
    return { totalTrainings, expiredTrainings, devicesWithoutTraining }
  }, [devices, trainingStats])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (devices.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Cpu className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Keine Geräte vorhanden</h3>
        <p className="text-muted-foreground mb-4">
          Verwalten Sie Ihre Geräte und Einweisungen in der Geräteverwaltung.
        </p>
        <Link href="/devices">
          <Button variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Zur Geräteverwaltung
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <Badge variant="secondary" className="gap-1.5 py-1">
            <Cpu className="h-3.5 w-3.5" />
            {devices.length} Geräte
          </Badge>
          <Badge variant="secondary" className="gap-1.5 py-1">
            <Users className="h-3.5 w-3.5" />
            {summary.totalTrainings} Einweisungen
          </Badge>
          {summary.expiredTrainings > 0 && (
            <Badge variant="destructive" className="gap-1.5 py-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {summary.expiredTrainings} abgelaufen
            </Badge>
          )}
          {summary.devicesWithoutTraining > 0 && (
            <Badge variant="outline" className="gap-1.5 py-1 text-amber-600 border-amber-300">
              <Clock className="h-3.5 w-3.5" />
              {summary.devicesWithoutTraining} ohne Einweisung
            </Badge>
          )}
        </div>
        <Link href="/devices">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Geräteverwaltung
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Geräte suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Device list by category */}
      {categoryGroups.map(([category, categoryDevices]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {category} ({categoryDevices.length})
          </h3>
          <div className="grid gap-3">
            {categoryDevices.map((device) => {
              const stats = trainingStats[device.id]
              const hasTraining = stats && stats.total > 0
              const hasExpired = stats && stats.expired > 0
              return (
                <Card key={device.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium">{device.name}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          {device.manufacturer && <span>{device.manufacturer}</span>}
                          {device.model && <span>{device.model}</span>}
                          {device.serial_number && <span>SN: {device.serial_number}</span>}
                          {device.location && <span>Standort: {device.location}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {hasExpired ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {stats.expired} abgelaufen
                          </Badge>
                        ) : hasTraining ? (
                          <Badge variant="default" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            {stats.valid} eingewiesen
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                            <Clock className="h-3 w-3" />
                            Keine Einweisung
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
