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
import {
  ArrowLeft,
  Mail,
  Briefcase,
  Building2,
  Calendar,
  Edit,
  FileText,
  ClipboardList,
  Clock,
  Laptop,
  Syringe,
  Star,
  Wrench,
  Phone,
} from "lucide-react"
import Link from "next/link"
import { ContractsManager } from "@/components/team/contracts-manager"
import { TeamMemberDocumentsTab } from "@/components/team/team-member-documents-tab"
import { TeamMemberResponsibilitiesTab } from "@/components/team/team-member-responsibilities-tab"
import { TeamMemberSkillsTab } from "@/components/team/team-member-skills-tab"
import { TeamMemberZeiterfassungTab } from "@/components/team/team-member-zeiterfassung-tab"
import { ArbeitsmittelAssignments } from "@/components/team/arbeitsmittel-assignments"
import { TeamMemberDevicesTab } from "@/components/team/team-member-devices-tab"
import { TeamMemberVaccinationTab } from "@/components/team/team-member-vaccination-tab"
import { getRoleLabel } from "@/lib/roles"

export default async function TeamMemberDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const memberId = params.id

  const [user, practiceId] = await Promise.all([
    getCurrentUser(),
    getCurrentPracticeId(),
  ])

  if (!user) redirect("/auth/login")
  if (!practiceId) redirect("/dashboard")

  const teamMember = await getTeamMemberById(memberId, practiceId)
  if (!teamMember) notFound()

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

  const fullName = [teamMember.first_name, teamMember.last_name].filter(Boolean).join(" ")
  const displayName = fullName || teamMember.email || "Teammitglied"
  const initials = displayName ? getInitials(displayName) : "TM"
  const isActive = teamMember.status === "active"
  const memberSince = teamMember.created_at
    ? new Date(teamMember.created_at).toLocaleDateString("de-DE", { month: "long", year: "numeric" })
    : null

  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        {/* Navigation */}
        <div className="flex items-center gap-3">
          <Link href="/team">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Team
            </Button>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground">{displayName}</span>
        </div>

        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={teamMember.avatar_url} alt={displayName} />
                  <AvatarFallback className="text-lg font-semibold bg-muted text-muted-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background ${
                    isActive ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
              </div>

              {/* Name & Role */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold text-foreground">{displayName}</h1>
                  <Badge variant={isActive ? "default" : "secondary"}>
                    {isActive ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {teamMember.position || getRoleLabel(teamMember.role)}
                  {teamMember.department && ` · ${teamMember.department}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0">
                <Link href={`/team/${memberId}/edit`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit className="h-4 w-4" />
                    Bearbeiten
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Info */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 pt-4 border-t text-sm text-muted-foreground">
              {teamMember.email && (
                <a href={`mailto:${teamMember.email}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <Mail className="h-3.5 w-3.5" />
                  {teamMember.email}
                </a>
              )}
              {teamMember.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {teamMember.phone}
                </span>
              )}
              {teamMember.department && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {teamMember.department}
                </span>
              )}
              {memberSince && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Dabei seit {memberSince}
                </span>
              )}
            </div>

            {/* Bio */}
            {teamMember.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed mt-3 pt-3 border-t max-w-3xl">
                {teamMember.bio}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="contracts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
            <TabsTrigger value="contracts" className="gap-1.5 text-xs sm:text-sm">
              <FileText className="h-3.5 w-3.5" />
              <span>Verträge</span>
            </TabsTrigger>
            <TabsTrigger value="responsibilities" className="gap-1.5 text-xs sm:text-sm">
              <ClipboardList className="h-3.5 w-3.5" />
              <span>Zuständigkeiten</span>
            </TabsTrigger>
            <TabsTrigger value="competencies" className="gap-1.5 text-xs sm:text-sm">
              <Star className="h-3.5 w-3.5" />
              <span>Kompetenzen</span>
            </TabsTrigger>
            <TabsTrigger value="time" className="gap-1.5 text-xs sm:text-sm">
              <Clock className="h-3.5 w-3.5" />
              <span>Zeiterfassung</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1.5 text-xs sm:text-sm">
              <Briefcase className="h-3.5 w-3.5" />
              <span>Dokumente</span>
            </TabsTrigger>
            <TabsTrigger value="equipment" className="gap-1.5 text-xs sm:text-sm">
              <Wrench className="h-3.5 w-3.5" />
              <span>Arbeitsmittel</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className="gap-1.5 text-xs sm:text-sm">
              <Laptop className="h-3.5 w-3.5" />
              <span>Geräte</span>
            </TabsTrigger>
            <TabsTrigger value="vaccination" className="gap-1.5 text-xs sm:text-sm">
              <Syringe className="h-3.5 w-3.5" />
              <span>Impfstatus</span>
            </TabsTrigger>
          </TabsList>

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
            <ArbeitsmittelAssignments
              teamMemberId={memberId}
              practiceId={practiceId}
            />
          </TabsContent>

          <TabsContent value="devices" className="mt-6">
            <TeamMemberDevicesTab
              memberId={memberId}
              practiceId={practiceId}
              memberName={displayName}
            />
          </TabsContent>

          <TabsContent value="vaccination" className="mt-6">
            <TeamMemberVaccinationTab
              teamMemberId={memberId}
              practiceId={practiceId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
