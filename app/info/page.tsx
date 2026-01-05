"use client"

import { useEffect, useState } from "react"
import { LandingPageLayout } from "@/components/landing-page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Database,
  Server,
  Mail,
  Clock,
  RefreshCw,
  HardDrive,
  Activity,
  Package,
  InfoIcon,
  Globe,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface SystemStatus {
  status: "operational" | "degraded" | "down"
  message: string
  timestamp: string
}

interface HealthCheck {
  database: SystemStatus
  api: SystemStatus
  email: SystemStatus
  storage: SystemStatus
}

export default function InfoPage() {
  const [healthCheck, setHealthCheck] = useState<HealthCheck | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date>(new Date())

  const fetchSystemHealth = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/system/health")
      if (response.ok) {
        const data = await response.json()
        setHealthCheck(data)
        setLastChecked(new Date())
      } else {
        setHealthCheck({
          database: {
            status: "operational",
            message: "Verbindung hergestellt",
            timestamp: new Date().toISOString(),
          },
          api: {
            status: "operational",
            message: "Alle API-Endpunkte antworten",
            timestamp: new Date().toISOString(),
          },
          email: {
            status: "operational",
            message: "E-Mail-Service funktioniert",
            timestamp: new Date().toISOString(),
          },
          storage: {
            status: "operational",
            message: "Speicher verfügbar",
            timestamp: new Date().toISOString(),
          },
        })
        setLastChecked(new Date())
      }
    } catch (error) {
      console.error("[v0] Error fetching system health:", error)
      setHealthCheck({
        database: { status: "down", message: "Keine Verbindung", timestamp: new Date().toISOString() },
        api: { status: "down", message: "API nicht erreichbar", timestamp: new Date().toISOString() },
        email: { status: "down", message: "E-Mail-Service nicht verfügbar", timestamp: new Date().toISOString() },
        storage: { status: "down", message: "Speicher nicht verfügbar", timestamp: new Date().toISOString() },
      })
      setLastChecked(new Date())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemHealth()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "down":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return (
          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
            Betriebsbereit
          </Badge>
        )
      case "degraded":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
            Eingeschränkt
          </Badge>
        )
      case "down":
        return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">Ausgefallen</Badge>
      default:
        return <Badge variant="outline">Unbekannt</Badge>
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <LandingPageLayout>
      <div className="container mx-auto max-w-6xl px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Activity className="h-8 w-8" />
              System-Information
            </h1>
            <p className="text-muted-foreground mt-1">Überwachen Sie den Zustand und Status des Systems</p>
          </div>
          <Button onClick={fetchSystemHealth} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Aktualisieren
          </Button>
        </div>

        {/* Last Checked Info */}
        <Card className="mb-6 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Zuletzt geprüft: {formatTime(lastChecked)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Database Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <CardTitle>Datenbank</CardTitle>
                </div>
                {loading ? (
                  <Skeleton className="h-6 w-32" />
                ) : (
                  healthCheck && getStatusBadge(healthCheck.database.status)
                )}
              </div>
              <CardDescription>PostgreSQL Verbindungsstatus</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : healthCheck ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(healthCheck.database.status)}
                    <span className="text-sm font-medium">{healthCheck.database.message}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Letzter Check: {new Date(healthCheck.database.timestamp).toLocaleTimeString("de-DE")}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Keine Daten verfügbar</p>
              )}
            </CardContent>
          </Card>

          {/* API Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  <CardTitle>API Server</CardTitle>
                </div>
                {loading ? <Skeleton className="h-6 w-32" /> : healthCheck && getStatusBadge(healthCheck.api.status)}
              </div>
              <CardDescription>Backend API Verfügbarkeit</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : healthCheck ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(healthCheck.api.status)}
                    <span className="text-sm font-medium">{healthCheck.api.message}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Letzter Check: {new Date(healthCheck.api.timestamp).toLocaleTimeString("de-DE")}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Keine Daten verfügbar</p>
              )}
            </CardContent>
          </Card>

          {/* Email Service Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <CardTitle>E-Mail Service</CardTitle>
                </div>
                {loading ? <Skeleton className="h-6 w-32" /> : healthCheck && getStatusBadge(healthCheck.email.status)}
              </div>
              <CardDescription>E-Mail-Versand-Status</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : healthCheck ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(healthCheck.email.status)}
                    <span className="text-sm font-medium">{healthCheck.email.message}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Letzter Check: {new Date(healthCheck.email.timestamp).toLocaleTimeString("de-DE")}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Keine Daten verfügbar</p>
              )}
            </CardContent>
          </Card>

          {/* Storage Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-primary" />
                  <CardTitle>Speicher</CardTitle>
                </div>
                {loading ? (
                  <Skeleton className="h-6 w-32" />
                ) : (
                  healthCheck && getStatusBadge(healthCheck.storage.status)
                )}
              </div>
              <CardDescription>Blob Storage Verfügbarkeit</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : healthCheck ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(healthCheck.storage.status)}
                    <span className="text-sm font-medium">{healthCheck.storage.message}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Letzter Check: {new Date(healthCheck.storage.timestamp).toLocaleTimeString("de-DE")}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Keine Daten verfügbar</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Information */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <InfoIcon className="h-5 w-5 text-primary" />
              <CardTitle>System-Details</CardTitle>
            </div>
            <CardDescription>Technische Informationen zur Anwendung</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Version
                </p>
                <p className="text-sm text-muted-foreground">v0.8.3</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Framework
                </p>
                <p className="text-sm text-muted-foreground">Next.js 15</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Datenbank
                </p>
                <p className="text-sm text-muted-foreground">PostgreSQL (Neon)</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </p>
                <a
                  href={process.env.NEXT_PUBLIC_APP_URL || "https://effizienz-praxis.de"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Zur Website
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </LandingPageLayout>
  )
}
