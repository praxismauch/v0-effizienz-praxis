"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Building2, Users, Calendar, Activity } from "lucide-react"
import { SuperAdminLayout } from "@/components/super-admin-layout"

interface Practice {
  id: number
  name: string
  email: string
  type: string
  isActive: boolean
  memberCount: number
  adminCount: number
  lastActivity: string
  createdAt: string
  address?: string
  phone?: string
  website?: string
}

export default function PracticeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [practice, setPractice] = useState<Practice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPractice = async () => {
      try {
        const response = await fetch(`/api/superadmin/practices/${id}`)
        if (response.ok) {
          const data = await response.json()
          setPractice(data)
        }
      } catch (error) {
        console.error("[v0] Error fetching practice:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPractice()
  }, [id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <SuperAdminLayout initialTab="practices">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Praxis wird geladen...</p>
          </div>
        </div>
      ) : !practice ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">Praxis nicht gefunden</p>
            <Button onClick={() => router.push("/super-admin?tab=practices")} className="mt-4">
              Zurück zur Übersicht
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 w-full">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/super-admin?tab=practices")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{practice.name}</h1>
                <p className="text-muted-foreground">{practice.email}</p>
              </div>
            </div>
            <Badge variant={practice.isActive ? "default" : "secondary"} className="text-sm px-3 py-1">
              {practice.isActive ? "Aktiv" : "Inaktiv"}
            </Badge>
          </div>

          {/* Quick Stats - full width grid */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Praxis-ID</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">#{practice.id}</div>
                <p className="text-xs text-muted-foreground">{practice.type}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mitglieder</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{practice.memberCount}</div>
                <p className="text-xs text-muted-foreground">{practice.adminCount} Admins</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Letzte Aktivität</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDate(practice.lastActivity)}</div>
                <p className="text-xs text-muted-foreground">Zuletzt aktiv</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Erstellt</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDate(practice.createdAt)}</div>
                <p className="text-xs text-muted-foreground">Registrierungsdatum</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs - full width */}
          <Tabs defaultValue="overview" className="space-y-4 w-full">
            <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 h-auto gap-1">
              <TabsTrigger value="overview">Übersicht</TabsTrigger>
              <TabsTrigger value="members">Mitglieder</TabsTrigger>
              <TabsTrigger value="billing">Abrechnung</TabsTrigger>
              <TabsTrigger value="settings">Einstellungen</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Praxisinformationen</CardTitle>
                  <CardDescription>Allgemeine Details zur Praxis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <p className="text-base">{practice.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Typ</label>
                      <p className="text-base">{practice.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-base">{practice.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <p className="text-base">{practice.isActive ? "Aktiv" : "Inaktiv"}</p>
                    </div>
                    {practice.phone && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Telefon</label>
                        <p className="text-base">{practice.phone}</p>
                      </div>
                    )}
                    {practice.website && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Website</label>
                        <p className="text-base">{practice.website}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mitgliederverwaltung</CardTitle>
                  <CardDescription>Alle Mitglieder dieser Praxis</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Mitgliederliste wird hier angezeigt (Feature in Entwicklung)
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Abrechnungsdetails</CardTitle>
                  <CardDescription>Abonnement und Zahlungsinformationen</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Abrechnungsinformationen werden hier angezeigt (Feature in Entwicklung)
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    Einstellungen werden hier angezeigt (Feature in Entwicklung)
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </SuperAdminLayout>
  )
}
