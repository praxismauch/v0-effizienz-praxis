export const dynamic = "force-dynamic"

import { redirect, notFound } from "next/navigation"
import { getCurrentUser, getCurrentPracticeId } from "@/lib/server/get-current-user"
import { getTeamMemberById } from "@/lib/server/get-team-data"

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
  
  // For now, redirect to team page until we create the detail client component
  // TODO: Create TeamMemberDetailClient component
  redirect("/team")
}
