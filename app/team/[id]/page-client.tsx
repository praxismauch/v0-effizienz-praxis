export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getCurrentUser, getCurrentPracticeId } from "@/lib/server/get-current-user"
import { getTeamMemberById, getAllTeamData } from "@/lib/server/get-team-data"
import { AppLayout } from "@/components/app-layout"
import TeamMemberDetailClient from "./page-client"

interface PageProps {
  params: {
    id: string
  }
}

export default async function TeamMemberDetailPage({ params }: PageProps) {
  const { id: memberId } = params
  
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
    redirect("/team")
  }
  
  // Fetch team member data and all team data for context
  const [member, teamData] = await Promise.all([
    getTeamMemberById(memberId, practiceId),
    getAllTeamData(practiceId),
  ])

  return (
    <AppLayout>
      <TeamMemberDetailClient 
        initialMember={member}
        initialTeamData={teamData}
        memberId={memberId}
        practiceId={practiceId}
        userId={user.id}
        isAdmin={user.role === 'admin' || user.role === 'practiceadmin' || user.role === 'superadmin'}
      />
    </AppLayout>
  )
}
