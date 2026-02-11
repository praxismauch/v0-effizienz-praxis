import { redirect } from "next/navigation"
import { getCurrentUser, getCurrentPracticeId } from "@/lib/server/get-current-user"
import { getDienstplanData } from "@/lib/server/get-dienstplan-data"
import { getAllTeamData } from "@/lib/server/get-team-data"
import { startOfWeek } from "date-fns"
import DienstplanPageClient from "./page-client"

export const metadata = {
  title: "Dienstplan | Effizienz Praxis",
  description: "KI-gestützte Dienstplanung für faire, rechtssichere und effiziente Schichtplanung",
}

export const dynamic = "force-dynamic"

export default async function DienstplanPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  // Await searchParams for Next.js 16
  const params = await searchParams
  
  // Fetch user and practice server-side
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

  // Parse week from URL or use current week
  const weekStart = params.week 
    ? new Date(params.week) 
    : startOfWeek(new Date(), { weekStartsOn: 1 })

  // Fetch all dienstplan data and team data server-side
  const [dienstplanData, teamData] = await Promise.all([
    getDienstplanData(practiceId, weekStart),
    getAllTeamData(practiceId),
  ])

  console.log("[v0] Dienstplan server data:", {
    teamMembers: dienstplanData.teamMembers?.length || 0,
    shiftTypes: dienstplanData.shiftTypes?.length || 0,
    schedules: dienstplanData.schedules?.length || 0,
    availability: dienstplanData.availability?.length || 0,
    swapRequests: dienstplanData.swapRequests?.length || 0,
    teams: teamData.teams?.length || 0,
  })

  // Ensure all data is an array, never null
  const safeInitialData = {
    teamMembers: dienstplanData.teamMembers || [],
    shiftTypes: dienstplanData.shiftTypes || [],
    schedules: dienstplanData.schedules || [],
    availability: dienstplanData.availability || [],
    swapRequests: dienstplanData.swapRequests || [],
  }

  return (
    <DienstplanPageClient 
      initialData={safeInitialData}
      initialWeek={weekStart}
      teams={teamData.teams || []}
      practiceId={practiceId}
      userId={user.id}
    />
  )
}
