export const dynamic = "force-dynamic"

import { redirect, notFound } from "next/navigation"
import { getCurrentUser, getCurrentPracticeId } from "@/lib/server/get-current-user"
import { getTeamMemberById } from "@/lib/server/get-team-data"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Mail, Briefcase, Building2, Calendar, Edit, FileText, ClipboardList, Briefcase as BriefcaseIcon, Clock, Folder, Laptop, Smartphone, Syringe } from "lucide-react"
import Link from "next/link"
import { ContractsManager } from "@/components/team/contracts-manager"
import { TeamMemberDocumentsTab } from "@/components/team/team-member-documents-tab"
import { TeamMemberResponsibilitiesTab } from "@/components/team/team-member-responsibilities-tab"
import { TeamMemberSkillsTab } from "@/components/team/team-member-skills-tab"
import { TeamMemberZeiterfassungTab } from "@/components/team/team-member-zeiterfassung-tab"

export default async function TeamMemberDetailPage(props: { params: Promise<{ id: string }> }) {
  // Await params in Next.js 16
  const params = await props.params
  const memberId = params.id
  
  // Fetch user and practice data server-side
  const [user, practiceId] = await Promise.all([
    getCurrentUser(),
    getCurrentPracticeId(),
  ])
  
  // Redirect if not authenticated
  if (!user) {
    redirect("/auth/login")
  }
  
  if (!practiceId) {
    redirect("/dashboard")
  }
  
  // Fetch team member data server-side
  const teamMember = await getTeamMemberById(memberId, practiceId)
  
  // If team member not found, show 404
  if (!teamMember) {
    notFound()
  }
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Build display name from first_name and last_name
  const fullName = [teamMember.first_name, teamMember.last_name].filter(Boolean).join(" ")
  const displayName = fullName || teamMember.email || "Teammitglied"
  const initials = displayName ? getInitials(displayName) : "TM"

  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/team">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Teammitglied Details</h1>
          </div>
          <Link href={`/team/${memberId}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={teamMember.avatar_url} alt={displayName} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{displayName}</CardTitle>
              {teamMember.role && (
                <Badge variant="secondary" className="mt-2">
                  {teamMember.role}
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="contracts">Verträge</TabsTrigger>
            <TabsTrigger value="responsibilities">Zuständigkeiten</TabsTrigger>
            <TabsTrigger value="competencies">Kompetenzen</TabsTrigger>
            <TabsTrigger value="time">Zeiterfassung</TabsTrigger>
            <TabsTrigger value="documents">Dokumente</TabsTrigger>
            <TabsTrigger value="equipment">Arbeitsmittel</TabsTrigger>
            <TabsTrigger value="devices">Geräte</TabsTrigger>
            <TabsTrigger value="vaccination">Impfstatus</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Persönliche Informationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm font-medium">E-Mail-Adresse</span>
                    </div>
                    <p className="text-base">{teamMember.email || "—"}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      <span className="text-sm font-medium">Rolle</span>
                    </div>
                    <p className="text-base">{teamMember.position || teamMember.role || "—"}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Abteilung</span>
                    </div>
                    <p className="text-base">{teamMember.department || "—"}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">Mitglied seit</span>
                    </div>
                    <p className="text-base">
                      {teamMember.created_at 
                        ? new Date(teamMember.created_at).toLocaleDateString("de-DE")
                        : "—"
                      }
                    </p>
                  </div>
                </div>

                {teamMember.bio && (
                  <div className="space-y-2 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground">Über</h3>
                    <p className="text-base">{teamMember.bio}</p>
                  </div>
                )}

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ClipboardList className="h-4 w-4" />
                    <span className="text-sm font-medium">Teamzuweisungen</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Keine Teams zugewiesen
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts" className="mt-6">
            <ContractsManager 
              memberId={memberId}
              memberName={displayName}
              practiceId={practiceId}
            />
          </TabsContent>

          <TabsContent value="responsibilities" className="mt-6">
            <TeamMemberResponsibilitiesTab 
              memberId={memberId}
              practiceId={practiceId}
              memberName={displayName}
            />
          </TabsContent>

          <TabsContent value="competencies" className="mt-6">
            <TeamMemberSkillsTab 
              memberId={memberId}
              practiceId={practiceId}
              memberName={displayName}
              isAdmin={true}
              currentUserId={user.id}
            />
          </TabsContent>

          <TabsContent value="time" className="mt-6">
            <TeamMemberZeiterfassungTab 
              memberId={memberId}
              practiceId={practiceId}
              memberName={displayName}
            />
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <TeamMemberDocumentsTab 
              teamMemberId={memberId}
              practiceId={practiceId}
              isAdmin={true}
              currentUserId={user.id}
              memberUserId={teamMember.user_id}
            />
          </TabsContent>

          <TabsContent value="equipment" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Arbeitsmittel</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Keine Arbeitsmittel zugewiesen</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Geräte</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Keine Geräte zugewiesen</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vaccination" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Impfstatus</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Kein Impfstatus hinterlegt</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
