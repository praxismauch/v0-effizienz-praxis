export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getCurrentUser, getCurrentPracticeId } from "@/lib/server/get-current-user"
import { getTeamData } from "@/lib/server/get-team-data"
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
  
  // Fetch team data in parallel if practice exists
  const teamData = practiceId ? await getTeamData(practiceId) : null

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
