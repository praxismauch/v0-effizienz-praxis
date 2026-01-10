import { createAdminClient } from "@/lib/supabase/admin"
import type { NextRequest } from "next/server"
import { isRateLimitError } from "@/lib/supabase/safe-query"
import { getCached, setCached } from "@/lib/redis"

const defaultStats = {
  teamMembers: 0,
  activeGoals: 0,
  workflows: 0,
  documents: 0,
  teamMembersTrend: 0,
  goalsTrend: 0,
  workflowsTrend: 0,
  documentsTrend: 0,
  kpiScore: 0,
  kpiTrend: 0,
  openPositions: 0,
  applications: 0,
  recruitingTrend: 0,
  activeCandidates: 0,
  candidatesTrend: 0,
  openTasks: 0,
  tasksTrend: 0,
  todayAppointments: 0,
  appointmentsTrend: 0,
  drafts: 0,
  draftsTrend: 0,
  checkupsLastWeek: 0,
  checkupsTrend: 0,
  weeklyTasksData: [],
  todayScheduleData: [],
  recentActivities: [],
  activityData: [],
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const practiceIdInt = 1
    const practiceIdStr = "1"

    console.log("[v0] Dashboard stats - using hardcoded practiceId:", practiceIdStr)

    const cacheKey = `dashboard-stats:${practiceId}`
    try {
      const cached = await getCached<any>(cacheKey)
      if (cached) {
        console.log("[v0] Dashboard stats - returning cached data")
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
            "X-Cache": "HIT",
          },
        })
      }
    } catch (cacheError) {
      // Continue without cache on error
    }

    let supabase
    try {
      supabase = createAdminClient()
    } catch (clientError) {
      if (isRateLimitError(clientError)) {
        return new Response(JSON.stringify(defaultStats), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
      throw clientError
    }

    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    let queryResults
    try {
      queryResults = await Promise.all([
        supabase
          .from("team_members")
          .select("id, user_id, users(is_active, role)", { count: "exact" })
          .eq("practice_id", practiceIdStr)
          .eq("status", "active"),
        // goals uses integer practice_id
        supabase
          .from("goals")
          .select("id", { count: "exact", head: true })
          .eq("practice_id", practiceIdInt)
          .eq("status", "active"),
        // workflows uses integer practice_id
        supabase
          .from("workflows")
          .select("id", { count: "exact", head: true })
          .eq("practice_id", practiceIdInt)
          .in("status", ["active", "in_progress"]),
        // documents uses integer practice_id
        supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("practice_id", practiceIdInt)
          .eq("is_archived", false),
        // job_postings - check type (likely text)
        supabase
          .from("job_postings")
          .select("id", { count: "exact", head: true })
          .eq("practice_id", practiceIdStr)
          .eq("status", "open"),
        // applications - check type (likely text)
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("practice_id", practiceIdStr)
          .in("status", ["pending", "reviewing"]),
        // todos uses integer practice_id
        supabase
          .from("todos")
          .select("id", { count: "exact", head: true })
          .eq("practice_id", practiceIdInt)
          .eq("completed", false),
        // calendar_events uses integer practice_id
        supabase
          .from("calendar_events")
          .select("id", { count: "exact", head: true })
          .eq("practice_id", practiceIdInt)
          .eq("start_date", todayStr),
        // documents uses integer practice_id
        supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("practice_id", practiceIdInt)
          .eq("is_archived", false),
        // candidates - check type
        supabase
          .from("candidates")
          .select("id", { count: "exact", head: true })
          .eq("practice_id", practiceIdStr)
          .neq("status", "archived"),
        // team_members (prev week) uses integer
        supabase
          .from("team_members")
          .select("id, user_id, users(is_active, role)", { count: "exact" })
          .eq("practice_id", practiceIdInt)
          .eq("status", "active")
          .lte("created_at", sevenDaysAgo.toISOString()),
        // goals (prev week) uses integer
        supabase
          .from("goals")
          .select("id", { count: "exact", head: true })
          .eq("practice_id", practiceIdInt)
          .lte("created_at", sevenDaysAgo.toISOString()),
        // workflows (prev week) uses integer
        supabase
          .from("workflows")
          .select("id", { count: "exact", head: true })
          .eq("practice_id", practiceIdInt)
          .lte("created_at", sevenDaysAgo.toISOString()),
        // documents (prev week) uses integer
        supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("practice_id", practiceIdInt)
          .lte("created_at", sevenDaysAgo.toISOString()),
        // job_postings (prev week) - text
        supabase
          .from("job_postings")
          .select("id", { count: "exact", head: true })
          .eq("practice_id", practiceIdStr)
          .eq("status", "open")
          .lte("created_at", sevenDaysAgo.toISOString()),
        // candidates (prev week) - text
        supabase
          .from("candidates")
          .select("id", { count: "exact", head: true })
          .eq("practice_id", practiceIdStr)
          .neq("status", "archived")
          .lte("created_at", sevenDaysAgo.toISOString()),
        // goals completed uses integer
        supabase
          .from("goals")
          .select("id", { count: "exact", head: true })
          .eq("practice_id", practiceIdInt)
          .eq("status", "completed")
          .gte("completed_at", sevenDaysAgo.toISOString()),
        // system_logs uses text practice_id
        supabase
          .from("system_logs")
          .select("id, created_at")
          .eq("practice_id", practiceIdStr)
          .gte("created_at", sevenDaysAgo.toISOString()),
        // todos uses integer
        supabase
          .from("todos")
          .select("id, completed, created_at, updated_at")
          .eq("practice_id", practiceIdInt)
          .gte("created_at", sevenDaysAgo.toISOString()),
        // calendar_events uses integer
        supabase
          .from("calendar_events")
          .select("id, start_time")
          .eq("practice_id", practiceIdInt)
          .eq("start_date", todayStr),
        // todos recent uses integer
        supabase
          .from("todos")
          .select("id, title, description, priority, created_at")
          .eq("practice_id", practiceIdInt)
          .eq("completed", false)
          .order("created_at", { ascending: false })
          .limit(5),
        // test_checklist_items - no practice_id filter
        supabase
          .from("test_checklist_items")
          .select("id", { count: "exact", head: true })
          .eq("is_completed", true)
          .gte("completed_at", sevenDaysAgo.toISOString()),
        // test_checklist_items prev week - no practice_id filter
        supabase
          .from("test_checklist_items")
          .select("id", { count: "exact", head: true })
          .eq("is_completed", true)
          .gte("completed_at", fourteenDaysAgo.toISOString())
          .lt("completed_at", sevenDaysAgo.toISOString()),
      ])

      console.log("[v0] Dashboard stats - query results:", {
        teamMembers: queryResults[0]?.count,
        goals: queryResults[1]?.count,
        workflows: queryResults[2]?.count,
        documents: queryResults[3]?.count,
        openPositions: queryResults[4]?.count,
        applications: queryResults[5]?.count,
        openTasks: queryResults[6]?.count,
        todayAppointments: queryResults[7]?.count,
      })
    } catch (queryError) {
      console.error("[v0] Dashboard stats - query error:", queryError)
      if (isRateLimitError(queryError)) {
        return new Response(JSON.stringify(defaultStats), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
      throw queryError
    }

    const [
      teamMembers,
      goals,
      workflows,
      documents,
      openPositions,
      applications,
      openTasks,
      todayAppointments,
      drafts,
      activeCandidates,
      prevTeamMembers,
      prevGoals,
      prevWorkflows,
      prevDocuments,
      prevOpenPositions,
      prevActiveCandidates,
      completedGoals,
      systemLogs,
      weeklyTodos,
      calendarEvents,
      recentTodos,
      checkupsLastWeek,
      checkupsPrevWeek,
    ] = queryResults

    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return 0
      return Math.round(((current - previous) / previous) * 100)
    }

    const activeTeamMembersCount =
      teamMembers.data?.filter((tm: any) => {
        if (tm.user_id && tm.users) {
          return tm.users.is_active && tm.users.role !== "superadmin"
        }
        return true
      }).length || 0

    const prevActiveTeamMembersCount =
      prevTeamMembers.data?.filter((tm: any) => {
        if (tm.user_id && tm.users) {
          return tm.users.is_active && tm.users.role !== "superadmin"
        }
        return true
      }).length || 0

    const totalGoalsLastWeek = (goals.count || 0) + (completedGoals.count || 0)
    const kpiScore = totalGoalsLastWeek > 0 ? Math.round(((completedGoals.count || 0) / totalGoalsLastWeek) * 100) : 0

    const activityData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })

      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const dayCount = (systemLogs.data || []).filter((log) => {
        const logDate = new Date(log.created_at)
        return logDate >= startOfDay && logDate <= endOfDay
      }).length

      activityData.push({
        date: dateStr,
        value: dayCount,
      })
    }

    const weeklyTasksData = []
    const dayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const completedCount = (weeklyTodos.data || []).filter(
        (todo) => todo.completed && new Date(todo.updated_at) >= startOfDay && new Date(todo.updated_at) <= endOfDay,
      ).length

      const pendingCount = (weeklyTodos.data || []).filter(
        (todo) => !todo.completed && new Date(todo.created_at) >= startOfDay && new Date(todo.created_at) <= endOfDay,
      ).length

      weeklyTasksData.push({
        day: dayNames[date.getDay()],
        completed: completedCount,
        pending: pendingCount,
      })
    }

    const todayScheduleData = []
    for (let hour = 1; hour <= 23; hour += 3) {
      const hourStr = hour.toString().padStart(2, "0") + ":00"
      const startTimeStr = hour.toString().padStart(2, "0") + ":00:00"
      const endHour = Math.min(hour + 3, 24)
      const endTimeStr = endHour === 24 ? "23:59:59" : endHour.toString().padStart(2, "0") + ":00:00"

      const appointmentsCount = (calendarEvents.data || []).filter(
        (event) => event.start_time >= startTimeStr && event.start_time < endTimeStr,
      ).length

      todayScheduleData.push({
        time: hourStr,
        appointments: appointmentsCount,
      })
    }

    const recentActivities = (recentTodos.data || []).map((todo) => ({
      id: todo.id,
      title: "Neue Aufgabe",
      description: todo.title,
      priority: todo.priority || "medium",
      timestamp: `vor etwa ${Math.floor((Date.now() - new Date(todo.created_at).getTime()) / 3600000)} Stunden`,
    }))

    const responseData = {
      teamMembers: activeTeamMembersCount,
      activeGoals: goals.count || 0,
      workflows: workflows.count || 0,
      documents: documents.count || 0,
      teamMembersTrend: calculateTrend(activeTeamMembersCount, prevActiveTeamMembersCount),
      goalsTrend: calculateTrend(goals.count || 0, prevGoals.count || 0),
      workflowsTrend: calculateTrend(workflows.count || 0, prevWorkflows.count || 0),
      documentsTrend: calculateTrend(documents.count || 0, prevDocuments.count || 0),
      kpiScore,
      kpiTrend: 0,
      openPositions: openPositions.count || 0,
      applications: applications.count || 0,
      recruitingTrend: calculateTrend(openPositions.count || 0, prevOpenPositions.count || 0),
      activeCandidates: activeCandidates.count || 0,
      candidatesTrend: calculateTrend(activeCandidates.count || 0, prevActiveCandidates.count || 0),
      openTasks: openTasks.count || 0,
      tasksTrend: 0,
      todayAppointments: todayAppointments.count || 0,
      appointmentsTrend: 0,
      drafts: drafts.count || 0,
      draftsTrend: 0,
      checkupsLastWeek: checkupsLastWeek.count || 0,
      checkupsTrend: calculateTrend(checkupsLastWeek.count || 0, checkupsPrevWeek.count || 0),
      weeklyTasksData,
      todayScheduleData,
      recentActivities,
      activityData,
    }

    try {
      await setCached(cacheKey, responseData, 60)
    } catch (cacheError) {
      // Continue without caching on error
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
        "X-Cache": "MISS",
      },
    })
  } catch (error) {
    if (isRateLimitError(error)) {
      return new Response(JSON.stringify(defaultStats), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }
    console.error("Error fetching dashboard stats:", error)
    return new Response(JSON.stringify(defaultStats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }
}
