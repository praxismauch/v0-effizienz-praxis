import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const practiceId = searchParams.get("practiceId")

    if (!practiceId || practiceId === "undefined" || practiceId === "null" || practiceId === "0") {
      return NextResponse.json({ activities: [] }, { status: 200 })
    }

    const [todosResult, eventsResult, knowledgeResult] = await Promise.all([
      supabase
        .from("todos")
        .select("id, title, description, completed, updated_at, priority")
        .eq("practice_id", practiceId)
        .eq("completed", true)
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("calendar_events")
        .select("id, title, description, created_at")
        .eq("practice_id", practiceId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("knowledge_base")
        .select("id, title, status, created_at, updated_at")
        .eq("practice_id", practiceId)
        .order("created_at", { ascending: false })
        .limit(5),
    ])

    // Combine and format activities
    const activities: any[] = []

    // Process todos
    if (todosResult.data) {
      todosResult.data.forEach((todo: any) => {
        activities.push({
          id: `todo-${todo.id}`,
          type: "task",
          title: "Aufgabe erledigt",
          description: todo.title,
          time: todo.updated_at,
          status: "completed",
          priority: todo.priority,
        })
      })
    }

    // Process calendar events
    if (eventsResult.data) {
      eventsResult.data.forEach((event: any) => {
        activities.push({
          id: `event-${event.id}`,
          type: "calendar",
          title: "Neuer Termin",
          description: event.title,
          time: event.created_at,
          status: "new",
        })
      })
    }

    // Process knowledge base articles
    if (knowledgeResult.data) {
      knowledgeResult.data.forEach((article: any) => {
        activities.push({
          id: `kb-${article.id}`,
          type: "document",
          title: "QM-Dokument erstellt",
          description: article.title,
          time: article.created_at,
          status: article.status,
        })
      })
    }

    // Sort by time (most recent first) and limit to 10
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    const recentActivities = activities.slice(0, 10)

    return NextResponse.json({ activities: recentActivities })
  } catch (error) {
    console.error("[v0] Error fetching recent activities:", error)
    return NextResponse.json({ activities: [], error: "Failed to fetch activities" }, { status: 200 })
  }
}
