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
import { Separator } from "@/components/ui/separator"
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
  MapPin,
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

        {/* Profile Hero */}
        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-[#4F7CBA] to-[#3A5F8A]" />
          <CardContent className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={teamMember.avatar_url} alt={displayName} />
                  <AvatarFallback className="text-2xl font-semibold bg-[#4F7CBA] text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-background ${
                    isActive ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
              </div>

              {/* Name & Role */}
              <div className="flex-1 sm:pb-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                  <Badge
                    variant="outline"
                    className={
                      isActive
                        ? "border-green-200 bg-green-50 text-green-700 w-fit"
                        : "border-gray-200 bg-gray-50 text-gray-600 w-fit"
                    }
                  >
                    {isActive ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-0.5">
                  {teamMember.position || getRoleLabel(teamMember.role)}
                  {teamMember.department && ` · ${teamMember.department}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 sm:pb-1">
                <Link href={`/team/${memberId}/edit`}>
                  <Button size="sm" className="gap-2">
                    <Edit className="h-4 w-4" />
                    Bearbeiten
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Info Bar */}
            <Separator className="my-5" />
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              {teamMember.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <a href={`mailto:${teamMember.email}`} className="hover:text-foreground transition-colors">
                    {teamMember.email}
                  </a>
                </div>
              )}
              {teamMember.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>{teamMember.phone}</span>
                </div>
              )}
              {teamMember.department && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 flex-shrink-0" />
                  <span>{teamMember.department}</span>
                </div>
              )}
              {memberSince && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>Dabei seit {memberSince}</span>
                </div>
              )}
            </div>

            {/* Bio */}
            {teamMember.bio && (
              <>
                <Separator className="my-5" />
                <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                  {teamMember.bio}
                </p>
              </>
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
              practiceId={parseInt(practiceId, 10)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
