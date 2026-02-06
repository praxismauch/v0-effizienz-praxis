export const dynamic = "force-dynamic"

import { redirect, notFound } from "next/navigation"
import { getCurrentUser, getCurrentPracticeId } from "@/lib/server/get-current-user"
import { getTeamMemberById, getAllTeamData } from "@/lib/server/get-team-data"
import { AppLayout } from "@/components/app-layout"
import EditTeamMemberClient from "./page-client"

export default async function TeamMemberEditPage(props: { params: Promise<{ id: string }> }) {
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
  
  // Fetch team member and all team data server-side
  const [teamMember, teamData] = await Promise.all([
    getTeamMemberById(memberId, practiceId),
    getAllTeamData(practiceId),
  ])
  
  // If team member not found, show 404
  if (!teamMember) {
    notFound()
  }
  
  return (
    <EditTeamMemberClient 
      initialMember={teamMember}
      teams={teamData.teams}
      allTeamMembers={teamData.teamMembers}
      practiceId={practiceId}
      currentUser={user}
    />
  )
}
