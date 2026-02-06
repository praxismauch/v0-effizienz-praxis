import { redirect } from "next/navigation"
import { getCurrentUser, getCurrentPracticeId } from "@/lib/server/get-current-user"
import { getDienstplanData } from "@/lib/server/get-dienstplan-data"
import { getAllTeamData } from "@/lib/server/get-team-data"
import { startOfWeek } from "date-fns"
import { AppLayout } from "@/components/app-layout"
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

  return (
    <AppLayout>
      <DienstplanPageClient 
        initialData={dienstplanData}
        initialWeek={weekStart}
        teams={teamData.teams}
        practiceId={practiceId}
        userId={user.id}
      />
    </AppLayout>
  )
}
