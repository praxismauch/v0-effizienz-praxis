export const dynamic = "force-dynamic"

import { redirect, notFound } from "next/navigation"
import { getCurrentUser, getCurrentPracticeId } from "@/lib/server/get-current-user"
import { getTeamMemberById, getAllTeamData } from "@/lib/server/get-team-data"
import { AppLayout } from "@/components/app-layout"
import EditTeamMemberClient from "./page-client"

export default async function TeamMemberEditPage({ params }: { params: { id: string } }) {
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
  
  // Fetch team member and all team data server-side
  const [teamMember, teamData] = await Promise.all([
    getTeamMemberById(params.id, practiceId),
    getAllTeamData(practiceId),
  ])
  
  // If team member not found, show 404
  if (!teamMember) {
    notFound()
  }
  
  return (
    <AppLayout>
      <EditTeamMemberClient 
        member={teamMember}
        teams={teamData.teams}
        allTeamMembers={teamData.teamMembers}
        practiceId={practiceId}
        currentUser={user}
      />
    </AppLayout>
  )
}
