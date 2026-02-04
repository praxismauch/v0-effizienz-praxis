"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Monitor, Calendar, MapPin, Wrench, AlertTriangle, ExternalLink, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

interface MedicalDevice {
  id: string
  name: string
  description?: string
  category?: string
  manufacturer?: string
  model?: string
  serial_number?: string
  location?: string
  status: string
  is_active: boolean
  next_maintenance_date?: string
  last_maintenance_date?: string
  warranty_end_date?: string
  image_url?: string
  rooms?: { id: string; name: string }[]
}

interface TeamMemberDevicesTabProps {
  memberId: string
  practiceId: string
  memberName: string
}

export function TeamMemberDevicesTab({ memberId, practiceId, memberName }: TeamMemberDevicesTabProps) {
  const router = useRouter()
  const [devices, setDevices] = useState<MedicalDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!practiceId || !memberId) {
      setLoading(false)
      return
    }

    let isCancelled = false
    const controller = new AbortController()

    async function fetchDevices() {
      try {
        setLoading(true)
        const response = await fetch(`/api/practices/${practiceId}/devices`, {
          signal: controller.signal
        })
        if (!response.ok) {
          throw new Error("Failed to fetch devices")
        }
        const data = await response.json()
        // Filter devices where this team member is responsible
        const memberDevices = (data.devices || []).filter(
          (device: MedicalDevice & { responsible_user_id?: string }) => device.responsible_user_id === memberId,
        )
        if (!isCancelled) {
          setDevices(memberDevices)
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError' && !isCancelled) {
          console.error("Error fetching devices:", err)
          setError("Fehler beim Laden der Geräte")
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchDevices()

    return () => {
      isCancelled = true
      controller.abort()
    }
  }, [practiceId, memberId])

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary">Inaktiv</Badge>
    }
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Aktiv</Badge>
      case "maintenance":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">In Wartung</Badge>
      case "defect":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Defekt</Badge>
      case "retired":
        return <Badge variant="secondary">Ausgemustert</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const isMaintenanceDue = (nextDate?: string) => {
    if (!nextDate) return false
    const next = new Date(nextDate)
    const today = new Date()
    const diffDays = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 14
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
  <Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="text-lg flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Zugewiesene Geräte
        </CardTitle>
        <CardDescription>
          {devices.length} Gerät{devices.length !== 1 ? "e" : ""} zugewiesen
        </CardDescription>
      </div>
      <Button size="sm" onClick={() => router.push("/devices")}>
        <Settings className="h-4 w-4 mr-2" />
        Zur Geräteverwaltung
      </Button>
    </div>
  </CardHeader>
  <CardContent>
        {devices.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Keine Geräte zugewiesen</p>
            <p className="text-sm mt-1">Diesem Teammitglied sind keine Geräte als Verantwortliche/r zugewiesen.</p>
            <Button className="mt-4" onClick={() => router.push("/devices")}>
              <Settings className="mr-2 h-4 w-4" />
              Zur Geräteverwaltung
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/devices?device=${device.id}`)}
              >
                {device.image_url ? (
                  <img
                    src={device.image_url || "/placeholder.svg"}
                    alt={device.name}
                    className="w-16 h-16 rounded-lg object-cover border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <Monitor className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium truncate">{device.name}</h4>
                      {device.manufacturer && (
                        <p className="text-sm text-muted-foreground">
                          {device.manufacturer} {device.model && `• ${device.model}`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isMaintenanceDue(device.next_maintenance_date) && (
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                          <Wrench className="h-3 w-3 mr-1" />
                          Wartung fällig
                        </Badge>
                      )}
                      {getStatusBadge(device.status, device.is_active)}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {device.category && (
                      <span className="flex items-center gap-1">
                        <Badge variant="outline" className="font-normal">
                          {device.category}
                        </Badge>
                      </span>
                    )}
                    {device.rooms && device.rooms.length > 0 && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {device.rooms.map((r) => r.name).join(", ")}
                      </span>
                    )}
                    {device.next_maintenance_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Nächste Wartung: {formatDate(device.next_maintenance_date)}
                      </span>
                    )}
                  </div>

                  {device.serial_number && (
                    <p className="text-xs text-muted-foreground mt-2">SN: {device.serial_number}</p>
                  )}
                </div>

                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/devices")}>
                <Settings className="mr-2 h-4 w-4" />
                Alle Geräte verwalten
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
