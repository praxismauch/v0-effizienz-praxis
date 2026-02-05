export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getCurrentUser, getCurrentPracticeId } from "@/lib/server/get-current-user"
import { getTeamsByPractice } from "@/lib/server/get-team-data"
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
  
  // Fetch team data if practice exists
  const teams = practiceId ? await getTeamsByPractice(practiceId) : []

  return (
    <AppLayout>
      <PageClient 
        initialData={{
          teamMembers: [],
          teams: teams,
          responsibilities: [],
          staffingPlans: [],
          holidayRequests: [],
          sickLeaves: []
        }}
        practiceId={practiceId}
        userId={user.id}
      />
    </AppLayout>
  )
}
