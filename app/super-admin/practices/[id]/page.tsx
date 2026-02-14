"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  Building2,
  Users,
  Calendar,
  Activity,
  Mail,
  Phone,
  MapPin,
  Globe,
  CreditCard,
} from "lucide-react"

interface Practice {
  id: number
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  postal_code?: string
  color?: string
  logo_url?: string
  specialty?: string
  practice_type?: string
  subscription_plan?: string
  subscription_status?: string
  trial_ends_at?: string
  created_at: string
  updated_at?: string
  deleted_at?: string
  settings?: any
  onboarding_completed?: boolean
  team_members_count: number
  users_count: number
}

interface AuditLog {
  id: string
  action: string
  entity_type: string
  created_at: string
  user_id: string
}

export default function PracticeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [practice, setPractice] = useState<Practice | null>(null)
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPractice = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/superadmin/practices/${id}`)
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error || `Fehler ${response.status}`)
        }
        const data = await response.json()
        setPractice(data.practice)
        setRecentActivity(data.recentActivity || [])
      } catch (err: any) {
        setError(err.message || "Fehler beim Laden der Praxis")
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchPractice()
  }, [id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const subscriptionBadge = (status?: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
      case "trialing":
        return <Badge className="bg-blue-100 text-blue-800">Testphase</Badge>
      case "canceled":
        return <Badge variant="destructive">Gekündigt</Badge>
      case "past_due":
        return <Badge className="bg-orange-100 text-orange-800">Überfällig</Badge>
      default:
        return <Badge variant="secondary">{status || "Unbekannt"}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 w-full">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    )
  }

  if (error || !practice) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">{error || "Praxis nicht gefunden"}</p>
          <Button onClick={() => router.push("/super-admin?tab=practices")} className="mt-4">
            Zurück zur Übersicht
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/super-admin?tab=practices")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">{practice.name}</h1>
            <p className="text-muted-foreground">{practice.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {subscriptionBadge(practice.subscription_status)}
          <Badge variant={practice.deleted_at ? "destructive" : "default"}>
            {practice.deleted_at ? "Gelöscht" : "Aktiv"}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Praxis-ID</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{practice.id}</div>
            <p className="text-xs text-muted-foreground">{practice.practice_type || "Nicht angegeben"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team-Mitglieder</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{practice.team_members_count}</div>
            <p className="text-xs text-muted-foreground">{practice.users_count} Benutzer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abo-Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{practice.subscription_plan || "Kein"}</div>
            {practice.trial_ends_at && (
              <p className="text-xs text-muted-foreground">Test bis {formatDate(practice.trial_ends_at)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erstellt</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDate(practice.created_at)}</div>
            <p className="text-xs text-muted-foreground">Registrierungsdatum</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4 w-full">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 h-auto gap-1">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="activity">Aktivität</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Praxisinformationen</CardTitle>
              <CardDescription>Allgemeine Details zur Praxis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p>{practice.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">E-Mail</p>
                    <p>{practice.email || "---"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Telefon</p>
                    <p>{practice.phone || "---"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                    <p>
                      {practice.address
                        ? `${practice.address}, ${practice.postal_code || ""} ${practice.city || ""}`
                        : "---"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fachrichtung</p>
                    <p>{practice.specialty || "---"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Onboarding</p>
                    <p>{practice.onboarding_completed ? "Abgeschlossen" : "Offen"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Letzte Aktivitäten</CardTitle>
              <CardDescription>Die letzten 10 Aktionen dieser Praxis</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Keine Aktivitäten gefunden
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="text-xs text-muted-foreground">{log.entity_type}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDateTime(log.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Praxiseinstellungen</CardTitle>
              <CardDescription>Konfiguration und Verwaltung</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Abo-Plan</p>
                  <p className="capitalize">{practice.subscription_plan || "Kein Plan"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Abo-Status</p>
                  <div className="mt-1">{subscriptionBadge(practice.subscription_status)}</div>
                </div>
                {practice.trial_ends_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Testphase endet</p>
                    <p>{formatDate(practice.trial_ends_at)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Farbe</p>
                  <div className="flex items-center gap-2">
                    {practice.color ? (
                      <>
                        <div className="h-6 w-6 rounded border" style={{ backgroundColor: practice.color }} />
                        <span className="text-sm">{practice.color}</span>
                      </>
                    ) : (
                      <span>---</span>
                    )}
                  </div>
                </div>
                {practice.updated_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Zuletzt aktualisiert</p>
                    <p>{formatDateTime(practice.updated_at)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
