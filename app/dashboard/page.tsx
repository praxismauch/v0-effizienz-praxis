export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getCurrentUser, getCurrentPracticeId } from "@/lib/server/get-current-user"
import { getDashboardData } from "@/lib/server/get-dashboard-data"
import PageClient from "./page-client"

export default async function DashboardPage() {
  // Fetch user and practice data server-side (deduped with cache)
  const [user, practiceId] = await Promise.all([
    getCurrentUser(),
    getCurrentPracticeId(),
  ])
  
  // Redirect if not authenticated
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch dashboard data in parallel if practice exists
  const dashboardData = practiceId ? await getDashboardData(practiceId) : null

  return (
    <PageClient 
      initialData={dashboardData} 
      practiceId={practiceId} 
      userId={user.id}
      userName={user.name || user.email || "User"}
    />
  )
}
