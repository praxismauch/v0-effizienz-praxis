export const dynamic = "force-dynamic"

import { redirect, notFound } from "next/navigation"
import { getCurrentUser, getCurrentPracticeId } from "@/lib/server/get-current-user"
import { getTeamMemberById } from "@/lib/server/get-team-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function TeamMemberDetailPage({ params }: { params: { id: string } }) {
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
  const teamMember = await getTeamMemberById(params.id, practiceId)
  
  // If team member not found, show 404
  if (!teamMember) {
    notFound()
  }
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/team">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Teammitglied Details</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{teamMember.name || teamMember.email || "Teammitglied"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">E-Mail</p>
              <p className="font-medium">{teamMember.email || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rolle</p>
              <p className="font-medium">{teamMember.role || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Abteilung</p>
              <p className="font-medium">{teamMember.department || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{teamMember.status || "Aktiv"}</p>
            </div>
          </div>
          
          <div className="pt-4 flex gap-2">
            <Link href={`/team/${params.id}/edit`}>
              <Button>Bearbeiten</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
