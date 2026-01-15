import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { isRateLimitError } from "@/lib/supabase/safe-query"

export const dynamic = "force-dynamic"

async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  retries = 3,
  delay = 1000,
): Promise<{ data: T | null; error: any }> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await fetchFn()
      return { data: result, error: null }
    } catch (error: any) {
      if (isRateLimitError(error)) {
        console.warn(`[v0] Analytics fetch attempt ${i + 1} rate limited`)
        return { data: null, error: { code: "RATE_LIMITED", message: "Rate limited" } }
      }

      console.error(`[v0] Fetch attempt ${i + 1} failed:`, error?.message || error)

      // If it's a 502 gateway error or network error, retry
      if (i < retries - 1 && (error?.status === 502 || error?.message?.includes("Network"))) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)))
        continue
      }

      return { data: null, error }
    }
  }
  return { data: null, error: new Error("Max retries exceeded") }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const practiceId = searchParams.get("practiceId")

    if (!practiceId) {
      return NextResponse.json(
        {
          error: "Praxis-ID fehlt",
          details: "Analytics-Daten können nicht ohne Praxis-ID geladen werden.",
        },
        { status: 400 },
      )
    }

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (clientError) {
      if (isRateLimitError(clientError)) {
        console.warn("[v0] Analytics GET - Rate limited creating client, returning empty data")
        return NextResponse.json({
          practiceGrowthData: [],
          taskCategoryData: [],
          teamSatisfactionData: [],
          kpiData: [],
          efficiencyData: [],
          qualityMetricsData: [],
        })
      }
      throw clientError
    }

    const results = await Promise.allSettled([
      fetchWithRetry(() =>
        supabase.from("todos").select("*").eq("practice_id", practiceId).order("created_at", { ascending: false }),
      ),
      fetchWithRetry(() =>
        supabase
          .from("calendar_events")
          .select("*")
          .eq("practice_id", practiceId)
          .order("start_date", { ascending: false }),
      ),
      fetchWithRetry(() =>
        supabase.from("team_members").select("*").eq("practice_id", practiceId).eq("is_active", true),
      ),
      fetchWithRetry(() =>
        supabase
          .from("knowledge_base")
          .select("*")
          .eq("practice_id", practiceId)
          .order("created_at", { ascending: false }),
      ),
      fetchWithRetry(() =>
        supabase
          .from("applications")
          .select("*")
          .eq("practice_id", practiceId)
          .order("applied_at", { ascending: false }),
      ),
      fetchWithRetry(() =>
        supabase
          .from("parameter_values")
          .select(`
            recorded_date,
            value,
            analytics_parameters!inner(name, category)
          `)
          .eq("practice_id", practiceId)
          .in("analytics_parameters.category", ["revenue", "satisfaction", "performance"])
          .gte("recorded_date", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
          .order("recorded_date", { ascending: false }),
      ),
    ])

    const todos = results[0].status === "fulfilled" && results[0].value.data?.data ? results[0].value.data.data : []
    const events = results[1].status === "fulfilled" && results[1].value.data?.data ? results[1].value.data.data : []
    const team = results[2].status === "fulfilled" && results[2].value.data?.data ? results[2].value.data.data : []
    const articles = results[3].status === "fulfilled" && results[3].value.data?.data ? results[3].value.data.data : []
    const applications =
      results[4].status === "fulfilled" && results[4].value.data?.data ? results[4].value.data.data : []
    const parameterValues =
      results[5].status === "fulfilled" && results[5].value.data?.data ? results[5].value.data.data : []

    results.forEach((result, index) => {
      if (result.status === "rejected" || (result.status === "fulfilled" && result.value.error)) {
        const tables = [
          "todos",
          "calendar_events",
          "team_members",
          "knowledge_base",
          "applications",
          "parameter_values",
        ]
        console.error(
          `[v0] Failed to fetch ${tables[index]}:`,
          result.status === "rejected" ? result.reason : result.value.error,
        )
      }
    })

    const parameterData = parameterValues.map((item: any) => ({
      recorded_date: item.recorded_date,
      value: item.value,
      name: item.analytics_parameters?.name,
      category: item.analytics_parameters?.category,
    }))

    // Calculate Practice Growth Data (last 6 months)
    const practiceGrowthData = calculatePracticeGrowth(todos, events, parameterData)

    // Calculate Task Category Data
    const taskCategoryData = calculateTaskCategories(todos)

    const teamSatisfactionData = calculateTeamSatisfaction(team, todos, parameterData)

    // Calculate KPI Data
    const kpiData = calculateKPIs(todos, team, articles, applications)

    // Calculate Efficiency Data
    const efficiencyData = calculateEfficiency(todos)

    // Calculate Quality Metrics Data
    const qualityMetricsData = calculateQualityMetrics(todos, events)

    return NextResponse.json({
      practiceGrowthData,
      taskCategoryData,
      teamSatisfactionData,
      kpiData,
      efficiencyData,
      qualityMetricsData,
    })
  } catch (error) {
    console.error("[v0] Error fetching analytics data:", error)
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 })
  }
}

// Helper functions to calculate analytics

function calculatePracticeGrowth(todos: any[], events: any[], parameterData: any[]) {
  const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun"]
  const now = new Date()

  return months.map((month, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - (5 - index) + 1, 1)

    const monthTodos = todos.filter((t) => {
      const createdAt = new Date(t.created_at)
      return createdAt >= monthDate && createdAt < nextMonth
    })

    const revenueData = parameterData.filter((p) => {
      const recordedDate = new Date(p.recorded_date)
      return p.category === "revenue" && recordedDate >= monthDate && recordedDate < nextMonth
    })

    const actualRevenue = revenueData.reduce((sum, item) => sum + (Number.parseFloat(item.value) || 0), 0)
    const revenue = actualRevenue > 0 ? actualRevenue : monthTodos.length * 100 // Fallback to estimate

    return {
      id: `growth-${index}`,
      month,
      tasks: monthTodos.length,
      revenue,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })
}

function calculateTaskCategories(todos: any[]) {
  const categories = {
    high: { name: "Hohe Priorität", color: "hsl(var(--destructive))", count: 0 },
    medium: { name: "Mittlere Priorität", color: "hsl(var(--warning))", count: 0 },
    low: { name: "Niedrige Priorität", color: "hsl(var(--success))", count: 0 },
    none: { name: "Keine Priorität", color: "hsl(var(--muted))", count: 0 },
  }

  todos.forEach((todo) => {
    const priority = todo.priority || "none"
    if (categories[priority as keyof typeof categories]) {
      categories[priority as keyof typeof categories].count++
    }
  })

  return Object.entries(categories).map(([key, data], index) => ({
    id: `category-${index}`,
    name: data.name,
    value: data.count,
    color: data.color,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))
}

function calculateTeamSatisfaction(team: any[], todos: any[], parameterData: any[]) {
  const weeks = ["Woche 1", "Woche 2", "Woche 3", "Woche 4"]
  const now = new Date()
  const completedTodos = todos.filter((t) => t.completed).length
  const totalTodos = todos.length
  const baseSatisfaction = totalTodos > 0 ? (completedTodos / totalTodos) * 5 : 4.5

  return weeks.map((week, index) => {
    const weekStart = new Date(now.getTime() - (4 - index) * 7 * 24 * 60 * 60 * 1000)
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)

    const satisfactionData = parameterData.filter((p) => {
      const recordedDate = new Date(p.recorded_date)
      return p.category === "satisfaction" && recordedDate >= weekStart && recordedDate < weekEnd
    })

    const actualSatisfaction =
      satisfactionData.length > 0
        ? satisfactionData.reduce((sum, item) => sum + (Number.parseFloat(item.value) || 0), 0) /
          satisfactionData.length
        : baseSatisfaction

    return {
      id: `satisfaction-${index}`,
      week,
      satisfaction: Math.min(5, actualSatisfaction),
      responses: team.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })
}

function calculateKPIs(todos: any[], team: any[], articles: any[], applications: any[]) {
  const completedTodos = todos.filter((t) => t.completed).length
  const totalTodos = todos.length
  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0

  const activeTeam = team.filter((t) => t.is_active).length
  const totalTeam = team.length
  const retentionRate = totalTeam > 0 ? Math.round((activeTeam / totalTeam) * 100) : 0

  return [
    {
      id: "kpi-1",
      title: "Aufgaben-Abschlussrate",
      value: `${completionRate}%`,
      target: "85%",
      progress: completionRate,
      trend: (completionRate >= 85 ? "up" : "down") as "up" | "down",
      change: `${completionRate >= 85 ? "+" : ""}${completionRate - 85}%`,
      icon: "CheckSquare",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "kpi-2",
      title: "Aktive Teammitglieder",
      value: `${activeTeam}`,
      target: `${totalTeam}`,
      progress: retentionRate,
      trend: (retentionRate >= 90 ? "up" : "down") as "up" | "down",
      change: `${activeTeam}/${totalTeam}`,
      icon: "Users",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "kpi-3",
      title: "QM Dokumentation",
      value: `${articles.length}`,
      target: "50",
      progress: Math.min(100, (articles.length / 50) * 100),
      trend: (articles.length >= 50 ? "up" : "down") as "up" | "down",
      change: `${articles.length} Artikel`,
      icon: "Star",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "kpi-4",
      title: "Bewerbungen",
      value: `${applications.length}`,
      target: "20",
      progress: Math.min(100, (applications.length / 20) * 100),
      trend: (applications.length >= 20 ? "up" : "down") as "up" | "down",
      change: `${applications.length} gesamt`,
      icon: "Users",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]
}

function calculateEfficiency(todos: any[]) {
  const weeks = ["Woche 1", "Woche 2", "Woche 3", "Woche 4"]
  const now = new Date()

  return weeks.map((week, index) => {
    const weekStart = new Date(now.getTime() - (4 - index) * 7 * 24 * 60 * 60 * 1000)
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)

    const weekTodos = todos.filter((t) => {
      const createdAt = new Date(t.created_at)
      return createdAt >= weekStart && createdAt < weekEnd
    })

    const completedWeekTodos = weekTodos.filter((t) => t.completed && t.updated_at)

    let avgProcessTime = 25
    if (completedWeekTodos.length > 0) {
      const totalProcessTime = completedWeekTodos.reduce((sum, todo) => {
        const created = new Date(todo.created_at).getTime()
        const completed = new Date(todo.updated_at).getTime()
        const hours = (completed - created) / (1000 * 60 * 60)
        return sum + hours
      }, 0)
      avgProcessTime = Math.round(totalProcessTime / completedWeekTodos.length)
    }

    return {
      id: `efficiency-${index}`,
      week,
      tasksPerDay: Math.round(weekTodos.length / 7),
      avgProcessTime,
      teamThroughput: weekTodos.length > 0 ? Math.round((completedWeekTodos.length / weekTodos.length) * 100) : 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })
}

function calculateQualityMetrics(todos: any[], events: any[]) {
  const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun"]
  const now = new Date()

  return months.map((month, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - (5 - index) + 1, 1)

    const monthTodos = todos.filter((t) => {
      const createdAt = new Date(t.created_at)
      return createdAt >= monthDate && createdAt < nextMonth
    })

    const completedTodos = monthTodos.filter((t) => t.completed)
    const completionRate = monthTodos.length > 0 ? Math.round((completedTodos.length / monthTodos.length) * 100) : 0

    return {
      id: `quality-${index}`,
      month,
      satisfaction: 4.5,
      completionRate,
      efficiency: completionRate,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })
}
