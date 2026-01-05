import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  const { practiceId } = await params

  if (!practiceId || practiceId === "0") {
    return NextResponse.json({ error: "Invalid practice ID" }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    // Get auth user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch stats in parallel
    const [tasksResult, documentsResult, eventsResult, workflowsResult] = await Promise.all([
      // Tasks count
      supabase
        .from("tasks")
        .select("id, status", { count: "exact" })
        .eq("practice_id", practiceId),

      // Documents count
      supabase
        .from("documents")
        .select("id", { count: "exact" })
        .eq("practice_id", practiceId),

      // Events count
      supabase
        .from("calendar_events")
        .select("id", { count: "exact" })
        .eq("practice_id", practiceId),

      // Workflows count
      supabase
        .from("workflows")
        .select("id, status", { count: "exact" })
        .eq("practice_id", practiceId),
    ])

    // Calculate stats
    const tasks = tasksResult.data || []
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.status === "completed" || t.status === "done").length

    const totalDocuments = documentsResult.count || 0
    const totalEvents = eventsResult.count || 0

    const workflows = workflowsResult.data || []
    const totalWorkflows = workflows.length
    const activeWorkflows = workflows.filter((w) => w.status === "active" || w.status === "in_progress").length

    return NextResponse.json({
      totalTasks,
      completedTasks,
      totalDocuments,
      totalEvents,
      totalWorkflows,
      activeWorkflows,
    })
  } catch (error) {
    console.error("Error fetching practice stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
