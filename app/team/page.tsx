export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getCurrentUser, getCurrentPracticeId } from "@/lib/server/get-current-user"
import { getAllTeamData } from "@/lib/server/get-team-data"
import { AppLayout } from "@/components/app-layout"
import PageClient from "./page-client"

export default async function TeamPage() {
  // Fetch user and practice data server-side
  const [user, practiceId] = await Promise.all([
    getCurrentUser(),
    getCurrentPracticeId(),
  ])
  
  // Redirect if not authenticated
  if (!user) {
    redirect("/auth/login")
  }
  
  // Fetch all team data if practice exists
  const teamData = practiceId ? await getAllTeamData(practiceId) : {
    teams: [],
    teamMembers: [],
    staffingPlans: [],
    holidayRequests: [],
    sickLeaves: []
  }

  return (
    <AppLayout>
      <PageClient 
        initialData={teamData}
        practiceId={practiceId}
        userId={user.id}
      />
    </AppLayout>
  )
}
