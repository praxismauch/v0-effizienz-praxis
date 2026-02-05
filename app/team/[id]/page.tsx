export const dynamic = "force-dynamic"

import { redirect, notFound } from "next/navigation"
import { getCurrentUser, getCurrentPracticeId } from "@/lib/server/get-current-user"
import { getTeamMemberById } from "@/lib/server/get-team-data"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Mail, Briefcase, Building2, Calendar, Edit } from "lucide-react"
import Link from "next/link"

export default async function TeamMemberDetailPage({ params }: { params: { id: string } }) {
  console.log("[v0] Team member detail page accessed with ID:", params.id)
  
  // Fetch user and practice data server-side
  const [user, practiceId] = await Promise.all([
    getCurrentUser(),
    getCurrentPracticeId(),
  ])
  
  console.log("[v0] Team member detail - user:", user?.id, "practiceId:", practiceId)
  
  // Redirect if not authenticated
  if (!user) {
    console.log("[v0] No user, redirecting to login")
    redirect("/auth/login")
  }
  
  if (!practiceId) {
    console.log("[v0] No practiceId, redirecting to dashboard")
    redirect("/dashboard")
  }
  
  // Fetch team member data server-side
  console.log("[v0] About to fetch team member:", params.id, "for practice:", practiceId)
  const teamMember = await getTeamMemberById(params.id, practiceId)
  console.log("[v0] Team member fetch result:", teamMember ? "Found" : "NOT FOUND")
  
  // If team member not found, show 404
  if (!teamMember) {
    console.log("[v0] Calling notFound() for member ID:", params.id)
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

  const displayName = teamMember.name || teamMember.email || "Teammitglied"
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
          <Link href={`/team/${params.id}/edit`}>
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
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm font-medium">E-Mail</span>
                </div>
                <p className="text-base">{teamMember.email || "—"}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span className="text-sm font-medium">Position</span>
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
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
