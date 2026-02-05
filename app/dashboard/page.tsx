export const dynamic = "force-dynamic"
import PageClient from "./page-client"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function getDashboardData(practiceId: string) {
  // Fetch dashboard data server-side to reduce client bundle
  try {
    const supabase = await createServerClient()
    
    // Fetch all dashboard data in parallel
    const [teamsData, membersData, todosData, eventsData] = await Promise.all([
      supabase.from("teams").select("id").eq("practice_id", practiceId),
      supabase.from("team_members").select("id").eq("practice_id", practiceId),
      supabase.from("todos").select("id, status").eq("practice_id", practiceId),
      supabase.from("calendar_events").select("id, start_time").eq("practice_id", practiceId).gte("start_time", new Date().toISOString()),
    ])

    const activeTodos = todosData.data?.filter(t => t.status !== "completed").length || 0
    const completedTodos = todosData.data?.filter(t => t.status === "completed").length || 0
    const upcomingEvents = eventsData.data?.length || 0

    return {
      totalTeams: teamsData.data?.length || 0,
      totalMembers: membersData.data?.length || 0,
      activeTodos,
      completedTodos,
      upcomingEvents,
    }
  } catch (error) {
    console.error("[v0] Dashboard data fetch error:", error)
    return {
      totalTeams: 0,
      totalMembers: 0,
      activeTodos: 0,
      completedTodos: 0,
      upcomingEvents: 0,
    }
  }
}

export default async function Page() {
  const supabase = await createServerClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get user's practice
  const { data: userData } = await supabase
    .from("users")
    .select("practice_id")
    .eq("id", user.id)
    .single()

  const practiceId = userData?.practice_id?.toString()
  
  // Fetch dashboard data server-side
  const dashboardData = practiceId ? await getDashboardData(practiceId) : null

  return <PageClient initialData={dashboardData} practiceId={practiceId} userId={user.id} />
}
