"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useTeam } from "@/contexts/team-context"
import { useUser } from "@/contexts/user-context"
import { Shield, UserIcon, ArrowLeft, Edit, Mail, Calendar, Users, CircleUser as FileUser } from "lucide-react"
import { ArbeitsmittelAssignments } from "@/components/team/arbeitsmittel-assignments"
import { useTranslation } from "@/contexts/translation-context"
import { useRoleColors } from "@/lib/use-role-colors"
import { TeamMemberSkillsTab } from "@/components/team/team-member-skills-tab"
import { AppLayout } from "@/components/app-layout"
import { TeamMemberDevicesTab } from "@/components/team/team-member-devices-tab"
import { TeamMemberResponsibilitiesTab } from "@/components/team/team-member-responsibilities-tab"
import { TeamMemberVaccinationTab } from "@/components/team/team-member-vaccination-tab"

const roleLabels = {
  admin: "Praxis Admin",
  practiceadmin: "Praxis Admin",
  poweruser: "Power User",
  user: "Benutzer",
  superadmin: "Super Admin",
}

const roleDescriptions = {
  practiceadmin: "Vollständiger administrativer Zugriff auf alle Praxisfunktionen und Einstellungen",
  admin: "Vollständiger administrativer Zugriff auf alle Praxisfunktionen und Einstellungen",
  poweruser: "Erweiterte Berechtigungen für wichtige Funktionen und Teamverwaltung",
  user: "Standardzugriff für grundlegende Funktionen und tägliche Aufgaben",
  superadmin: "Systemweiter Zugriff auf alle Praxen und Funktionen",
}

const calculateAge = (dateOfBirth: string | null): number | null => {
  if (!dateOfBirth) return null
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

const availablePermissions = [
  { id: "all", label: "Alle Berechtigungen", description: "Voller Zugriff auf alle Systemfunktionen" },
  { id: "dashboard", label: "Dashboard", description: "Übersichtsseite und Statistiken anzeigen" },
  { id: "analytics", label: "Analysen", description: "Praxisanalysen und Auswertungen einsehen" },
  { id: "leitbild", label: "Leitbild", description: "Praxisleitbild und Vision verwalten" },
  { id: "wunschpatient", label: "Wunschpatient", description: "Wunschpatienten-Profile erstellen und bearbeiten" },
  { id: "profile", label: "Praxisprofil", description: "Praxisprofil und Informationen bearbeiten" },
  { id: "team", label: "Teamverwaltung", description: "Teammitglieder und Zuweisungen verwalten" },
  { id: "hiring", label: "Recruiting", description: "Stellenausschreibungen und Bewerber verwalten" },
  { id: "training", label: "Fortbildungen", description: "Fortbildungen und Schulungen verwalten" },
  { id: "skills", label: "Kompetenzen", description: "Mitarbeiterkompetenzen und Fähigkeiten pflegen" },
  { id: "responsibilities", label: "Zuständigkeiten", description: "Verantwortungsbereiche definieren" },
  { id: "calendar", label: "Kalenderverwaltung", description: "Praxiskalender und Termine verwalten" },
  { id: "tasks", label: "Aufgaben", description: "Aufgaben erstellen und verwalten" },
  { id: "goals", label: "Ziele", description: "Praxis- und Teamziele definieren" },
  { id: "workflows", label: "Workflows", description: "Arbeitsabläufe und Prozesse verwalten" },
  { id: "documents", label: "Dokumente", description: "Dokumente hochladen und verwalten" },
  { id: "knowledge", label: "Wissensdatenbank", description: "Wissensdatenbank pflegen und nutzen" },
  { id: "contacts", label: "Kontakte", description: "Geschäftskontakte und Partner verwalten" },
  { id: "rooms", label: "Räume", description: "Praxisräume verwalten" },
  { id: "workplaces", label: "Arbeitsplätze", description: "Arbeitsplätze konfigurieren" },
  { id: "equipment", label: "Ausstattung", description: "Geräte und Ausstattung verwalten" },
  { id: "billing", label: "Abrechnung", description: "Abrechnungs- und Finanzunterlagen verwalten" },
  { id: "reports", label: "Berichte", description: "Praxisberichte generieren und einsehen" },
  { id: "settings", label: "Einstellungen", description: "Praxiseinstellungen konfigurieren" },
  { id: "security", label: "Sicherheit", description: "Sicherheitseinstellungen und Benutzerrechte" },
]

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date)
}

export default function TeamMemberDetailPage() {
  const router = useRouter()
  const params = useParams()
  const memberId = params.id as string
  
  const { t } = useTranslation()
  const { roleColors } = useRoleColors()

  const { teamMembers, teams, practiceId: teamPracticeId } = useTeam()
  const { currentUser, isAdmin } = useUser()
  
  // Use team context practice ID as fallback
  const practiceId = teamPracticeId || "1"

  const [member, setMember] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [mounted, setMounted] = useState(false)
  
  // Ensure client-side only
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch member data
  useEffect(() => {
    const fetchMember = async () => {
      console.log("[v0] Team member lookup - memberId:", memberId)
      console.log("[v0] Team members in context:", teamMembers.length)
      if (teamMembers.length > 0) {
        console.log("[v0] Sample IDs from context:", teamMembers.slice(0, 3).map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          team_member_id: m.team_member_id
        })))
      }
      
      // First, try to find in context - check id, user_id, and team_member_id fields
      const contextMember = teamMembers.find((m: any) => 
        m.id === memberId || m.user_id === memberId || m.team_member_id === memberId
      )
      
      if (contextMember) {
        console.log("[v0] Found member in context:", contextMember.name)
        setMember(contextMember)
        setLoading(false)
        return
      }
      
      console.log("[v0] Member not in context, checking API")
      console.log("[v0] Using practice ID:", practiceId)
      
      try {
        const apiUrl = `/api/practices/${practiceId}/team-members`
        console.log("[v0] Fetching from:", apiUrl)
        const response = await fetch(apiUrl)
        
        if (response.ok) {
          const data = await response.json()
          console.log("[v0] API returned", data.teamMembers?.length || 0, "members")
          
          if (data.teamMembers && data.teamMembers.length > 0) {
            console.log("[v0] Sample IDs from API:", data.teamMembers.slice(0, 3).map((m: any) => ({
              id: m.id,
              user_id: m.user_id,
              team_member_id: m.team_member_id
            })))
          }
          
          // Check id, user_id, and team_member_id fields when searching
          const fetchedMember = data.teamMembers?.find((m: any) => 
            m.id === memberId || m.user_id === memberId || m.team_member_id === memberId
          )
          
          if (fetchedMember) {
            console.log("[v0] Found member in API:", fetchedMember.name)
            setMember(fetchedMember)
          } else {
            console.log("[v0] Member not found in API results")
          }
        } else {
          console.log("[v0] API response not OK:", response.status)
        }
      } catch (error) {
        console.error("[v0] Error fetching member:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchMember()
  }, [memberId, teamMembers, practiceId])

  const canEdit = isAdmin || currentUser?.id === memberId

  // Prevent SSR mismatch - only render on client
  if (!mounted) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
            <p className="text-muted-foreground">Lädt...</p>
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  if (loading) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
            <p className="text-muted-foreground">Lade Teammitglied...</p>
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  if (!member) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Teammitglied nicht gefunden</h3>
            <p className="text-muted-foreground mb-4">
              Das angeforderte Teammitglied existiert nicht oder Sie haben keine Berechtigung, es anzuzeigen.
            </p>
            <Button onClick={() => router.push("/team")}>Zurück zur Übersicht</Button>
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  const age = calculateAge(member.date_of_birth)

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/team")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Team
          </Button>
          {member.candidate_id && (
            <Button variant="outline" onClick={() => router.push(`/hiring/candidates/${member.candidate_id}`)}>
              <FileUser className="mr-2 h-4 w-4" />
              Kandidatenprofil ansehen
            </Button>
          )}
        </div>

        {member.candidate_id && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <FileUser className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-blue-900">Konvertiert aus Kandidat</div>
              <div className="text-sm text-blue-700">
                Dieses Teammitglied wurde aus einem Kandidatenprofil übernommen. Sie können das ursprüngliche
                Kandidatenprofil mit allen Bewerbungsunterlagen einsehen.
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={member.avatar || ""} alt={member.name} />
            <AvatarFallback>
              {member.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-semibold">
              {member.name} {age && <span className="text-muted-foreground">({age})</span>}
            </h2>
          </div>
          {canEdit && (
            <Button onClick={() => router.push(`/team/${memberId}/edit`)} className="ml-auto">
              <Edit className="mr-2 h-4 w-4" />
              Bearbeiten
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 h-auto gap-1 mb-6">
                <TabsTrigger value="overview">Übersicht</TabsTrigger>
                <TabsTrigger value="skills">Kompetenzen</TabsTrigger>
                <TabsTrigger value="vaccinations">Impfstatus</TabsTrigger>
                <TabsTrigger value="zeiterfassung">Zeiterfassung</TabsTrigger>
                <TabsTrigger value="arbeitsmittel">Arbeitsmittel</TabsTrigger>
                <TabsTrigger value="devices">Geräte</TabsTrigger>
                <TabsTrigger value="responsibilities">Zuständigkeiten</TabsTrigger>
                <TabsTrigger value="documents">Dokumente</TabsTrigger>
              </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Persönliche Informationen</CardTitle>
                  <CardDescription>Grundlegende Profilinformationen und Kontaktdaten</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={member.avatar || ""} alt={member.name} />
                      <AvatarFallback className="text-2xl">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">{member.name}</h3>
                      {age && <p className="text-muted-foreground">{age} Jahre alt</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        Vollständiger Name
                      </Label>
                      <p className="font-medium">{member.name}</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        E-Mail-Adresse
                      </Label>
                      <p className="font-medium">
                        {member.email?.includes("@placeholder.local") ? "Keine E-Mail" : member.email}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Rolle
                      </Label>
                      <Badge className={roleColors[member.role as keyof typeof roleColors] || roleColors.user}>
                        {roleLabels[member.role as keyof typeof roleLabels] || member.role}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Mitglied seit
                      </Label>
                      <p className="font-medium">
                        {member.created_at ? formatDate(new Date(member.created_at)) : "Unbekannt"}
                      </p>
                    </div>

                    {member.date_of_birth && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Geburtsdatum</Label>
                        <p className="font-medium">{formatDate(new Date(member.date_of_birth))}</p>
                      </div>
                    )}

                    <div className="space-y-2 col-span-2">
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Teamzuweisungen
                      </Label>
                      {member.teamIds && member.teamIds.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {member.teamIds.map((teamId) => {
                            const team = teams.find((t) => t.id === teamId)
                            if (!team) return null
                            return (
                              <Badge
                                key={teamId}
                                variant="outline"
                                className="px-2 py-1"
                                style={{
                                  backgroundColor: `${team.color}15`,
                                  borderColor: team.color,
                                  color: team.color,
                                }}
                              >
                                <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: team.color }} />
                                {team.name}
                              </Badge>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Keine Teamzuweisungen</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team
                  </CardTitle>
                  <CardDescription>Team, dem dieses Mitglied zugewiesen ist</CardDescription>
                </CardHeader>
                <CardContent>
                  {member.teamIds && member.teamIds.length > 0 ? (
                    <div className="space-y-3">
                      {member.teamIds.map((teamId) => {
                        const team = teams.find((t) => t.id === teamId)
                        if (!team) return null
                        return (
                          <div key={teamId} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: team.color || "#3b82f6" }}
                              />
                              <div>
                                <div className="font-medium">{team.name}</div>
                                <div className="text-sm text-muted-foreground">{team.description}</div>
                              </div>
                            </div>
                            <Badge variant="outline">{team.memberCount || 0} Mitglieder</Badge>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Dieses Mitglied ist keinem Team zugewiesen</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

              <TabsContent value="skills" className="space-y-4">
                {member && (
                  <TeamMemberSkillsTab
                    memberId={memberId}
                    practiceId={member.practice_id}
                    firstName={member.first_name}
                    lastName={member.last_name}
                  />
                )}
              </TabsContent>

              <TabsContent value="vaccinations" className="space-y-4">
                {member && (
                  <TeamMemberVaccinationTab
                    teamMemberId={memberId}
                    practiceId={member.practice_id}
                  />
                )}
              </TabsContent>

            <TabsContent value="zeiterfassung" className="space-y-4">
              {/* Zeiterfassung content here */}
            </TabsContent>

            <TabsContent value="arbeitsmittel" className="space-y-4">
              {member && (
                <ArbeitsmittelAssignments
                  teamMemberId={memberId}
                  practiceId={member.practice_id || ""}
                  isAdmin={isAdmin}
                />
              )}
            </TabsContent>

            <TabsContent value="devices" className="space-y-4">
              {member && (
                <TeamMemberDevicesTab
                  memberId={memberId}
                  practiceId={member.practice_id || ""}
                  memberName={member.name}
                />
              )}
            </TabsContent>

            <TabsContent value="responsibilities" className="space-y-4">
              {member && (
                <TeamMemberResponsibilitiesTab
                  memberId={memberId}
                  practiceId={member.practice_id || ""}
                  memberName={member.name}
                />
              )}
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              {/* Documents content here */}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  )
}
