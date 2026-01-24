"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
  Settings,
  Shield,
  Users,
  Activity,
  FileText,
  CheckCircle2,
  TrendingUp,
  BarChart3,
} from "lucide-react"
import Link from "next/link"

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  avatar_url?: string
  position?: string
}

interface PracticeStats {
  totalTasks: number
  completedTasks: number
  totalDocuments: number
  totalEvents: number
  totalWorkflows: number
  activeWorkflows: number
}

function getEffectivePracticeId(practiceId: string | null): string {
  if (!practiceId || practiceId === "undefined" || practiceId === "null" || practiceId === "0") {
    return "1"
  }
  return practiceId
}

export default function PracticeDetailsPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const [practiceId, setPracticeId] = useState<string | null>(null)
  const router = useRouter()
  const { practices, currentPractice, setCurrentPractice } = usePractice()
  const { isSuperAdmin } = useUser()

  const [practice, setPractice] = useState<typeof currentPractice>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [stats, setStats] = useState<PracticeStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const resolveParams = async () => {
      if (params instanceof Promise) {
        const resolved = await params
        setPracticeId(getEffectivePracticeId(resolved.id))
      } else {
        setPracticeId(getEffectivePracticeId(params.id))
      }
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    const loadPracticeData = async () => {
      if (!practiceId) {
        toast.error("Keine Praxis-ID gefunden")
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // Find practice from context or fetch from API
        // Use String() comparison to handle both string and integer IDs
        const foundPractice = practices.find((p) => String(p.id) === String(practiceId))

        if (foundPractice) {
          setPractice(foundPractice)
        } else {
          // Fetch from API if not in context
          const response = await fetch(`/api/practices/${practiceId}`)
          if (response.ok) {
            const data = await response.json()
            setPractice(data.practice)
          } else {
            setError("Praxis nicht gefunden")
            return
          }
        }

        // Load team members
        const teamResponse = await fetch(`/api/practices/${practiceId}/team`)
        if (teamResponse.ok) {
          const teamData = await teamResponse.json()
          setTeamMembers(teamData.members || [])
        }

        // Load practice stats
        const statsResponse = await fetch(`/api/practices/${practiceId}/stats`)
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }
      } catch (err) {
        console.error("Error loading practice data:", err)
        setError("Fehler beim Laden der Praxisdaten")
      } finally {
        setIsLoading(false)
      }
    }

    if (practiceId) {
      loadPracticeData()
    }
  }, [practiceId, practices])

  const handleSelectPractice = () => {
    if (practice) {
      setCurrentPractice(practice)
      router.push("/dashboard")
    }
  }

  const practiceColor = practice?.color || "#3B82F6"
  const completionRate = stats ? Math.round((stats.completedTasks / Math.max(stats.totalTasks, 1)) * 100) : 0

  // Format date in German format
  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container max-w-6xl py-8 space-y-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-48 col-span-2" />
            <Skeleton className="h-48" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error || !practice) {
    return (
      <AppLayout>
        <div className="container max-w-6xl py-8">
          <Card className="border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Praxis nicht gefunden</h2>
              <p className="text-muted-foreground mb-4">
                {error || "Die angeforderte Praxis konnte nicht gefunden werden."}
              </p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container max-w-6xl py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div
              className="h-16 w-16 rounded-xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: practiceColor }}
            >
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold">{practice.name}</h1>
                {practice.isActive ? (
                  <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Aktiv
                  </Badge>
                ) : (
                  <Badge variant="secondary">Inaktiv</Badge>
                )}
              </div>
              <p className="text-muted-foreground">{practice.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentPractice?.id !== practice.id && (
              <Button onClick={handleSelectPractice} style={{ backgroundColor: practiceColor }}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Als aktive Praxis wählen
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Einstellungen
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Info Card */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 overflow-hidden">
            <div className="h-2" style={{ backgroundColor: practiceColor }} />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Praxisinformationen
              </CardTitle>
              <CardDescription>Allgemeine Informationen und Kontaktdaten</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Address */}
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                    <p className="font-medium">
                      {practice.street || practice.address || "-"}
                      {practice.city && (
                        <>
                          <br />
                          {practice.zipCode} {practice.city}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Telefon</p>
                    <p className="font-medium">{practice.phone || "-"}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">E-Mail</p>
                    {practice.email ? (
                      <a href={`mailto:${practice.email}`} className="font-medium text-primary hover:underline">
                        {practice.email}
                      </a>
                    ) : (
                      <p className="font-medium">-</p>
                    )}
                  </div>
                </div>

                {/* Website */}
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Website</p>
                    {practice.website ? (
                      <a
                        href={practice.website.startsWith("http") ? practice.website : `https://${practice.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        {practice.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="font-medium">-</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Erstellt am</p>
                    <p className="font-medium">{formatDate(practice.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Letzte Aktivität</p>
                    <p className="font-medium">{formatDateTime(practice.lastActivity)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Zeitzone</p>
                    <p className="font-medium">{practice.timezone || "Europe/Berlin"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Übersicht
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Aufgaben-Fortschritt</span>
                  <span className="text-sm font-medium">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Users className="h-6 w-6 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold">{practice.memberCount}</p>
                  <p className="text-xs text-muted-foreground">Team-Mitglieder</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Shield className="h-6 w-6 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold">{practice.adminCount}</p>
                  <p className="text-xs text-muted-foreground">Administratoren</p>
                </div>
              </div>

              {stats && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Aufgaben</span>
                    </div>
                    <span className="text-sm font-medium">
                      {stats.completedTasks}/{stats.totalTasks}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Dokumente</span>
                    </div>
                    <span className="text-sm font-medium">{stats.totalDocuments}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Termine</span>
                    </div>
                    <span className="text-sm font-medium">{stats.totalEvents}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Workflows</span>
                    </div>
                    <span className="text-sm font-medium">
                      {stats.activeWorkflows}/{stats.totalWorkflows}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Team Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team
              </CardTitle>
              <CardDescription>Mitglieder und Administratoren der Praxis</CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/team">
                Alle anzeigen
                <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Noch keine Teammitglieder</p>
                <Button variant="outline" className="mt-4 bg-transparent" asChild>
                  <Link href="/team">Team verwalten</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teamMembers.slice(0, 6).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {member.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.position || member.role}</p>
                    </div>
                    {member.role === "admin" && <Shield className="h-4 w-4 text-primary flex-shrink-0" />}
                  </div>
                ))}
              </div>
            )}
            {teamMembers.length > 6 && (
              <div className="text-center mt-4">
                <Button variant="ghost" asChild>
                  <Link href="/team">+{teamMembers.length - 6} weitere Mitglieder anzeigen</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => router.push("/dashboard")}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">Dashboard</p>
                <p className="text-sm text-muted-foreground">Übersicht ansehen</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push("/calendar")}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="font-medium">Kalender</p>
                <p className="text-sm text-muted-foreground">Termine verwalten</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push("/tasks")}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Aufgaben</p>
                <p className="text-sm text-muted-foreground">To-Dos bearbeiten</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push("/settings")}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Settings className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="font-medium">Einstellungen</p>
                <p className="text-sm text-muted-foreground">Praxis konfigurieren</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
