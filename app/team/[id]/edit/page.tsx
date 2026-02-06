export const dynamic = "force-dynamic"

import { redirect, notFound } from "next/navigation"
import { getCurrentUser, getCurrentPracticeId } from "@/lib/server/get-current-user"
import { getTeamMemberById, getAllTeamData } from "@/lib/server/get-team-data"
import EditTeamMemberClient from "./page-client"

export default async function TeamMemberEditPage(props: { params: Promise<{ id: string }> }) {
  // Await params in Next.js 16
  const params = await props.params
  const memberId = params.id
  
  console.log("[v0] Edit page server - memberId:", memberId)
  
  // Fetch user and practice data server-side
  const [user, practiceId] = await Promise.all([
    getCurrentUser(),
    getCurrentPracticeId(),
  ])
  
  console.log("[v0] Edit page server - user:", user?.id, "practiceId:", practiceId)
  
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
  
  console.log("[v0] Edit page server - teamMember found:", !!teamMember, "teamData:", { 
    teams: teamData.teams.length, 
    teamMembers: teamData.teamMembers.length 
  })
  
  // If team member not found, show 404
  if (!teamMember) {
    console.log("[v0] Edit page server - calling notFound() for memberId:", memberId)
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
