/**
 * Optimized database queries for effizienz-praxis.de
 * Wraps existing Supabase queries with performance monitoring
 */

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { safeSupabaseQuery, isRateLimitError } from "@/lib/supabase/safe-query"

export async function getNotifications(userId: string, options: { limit?: number; unreadOnly?: boolean } = {}) {
  const { limit = 20, unreadOnly = false } = options
  const supabase = await createClient()

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (unreadOnly) {
    query = query.eq("is_read", false)
  }

  const { data, error } = await safeSupabaseQuery(() => query, [])

  if (error && error.code !== "RATE_LIMITED") {
    return { data: [], error }
  }

  return { data: data || [], error: null }
}

export async function getSidebarBadges(practiceId: string) {
  const defaultBadges = {
    tasks: 0,
    goals: 0,
    workflows: 0,
    candidates: 0,
    tickets: 0,
    teamMembers: 0,
    responsibilities: 0,
    surveys: 0,
    inventory: 0,
    devices: 0,
    calendar: 0,
    documents: 0,
    cirs: 0,
    contacts: 0,
    hygiene: 0,
    training: 0,
    protocols: 0,
    journal: 0,
    appraisals: 0,
    skills: 0,
    workplaces: 0,
    rooms: 0,
    equipment: 0,
    dienstplan: 0,
    zeiterfassung: 0,
    analytics: 0,
    knowledge: 0,
    strategy: 0,
    leadership: 0,
    wellbeing: 0,
    leitbild: 0,
    selfcheck: 0,
    organigramm: 0,
  }

  try {
    let supabase
    try {
      supabase = await createAdminClient()
    } catch (clientError) {
      if (isRateLimitError(clientError)) {
        return { data: defaultBadges, error: null }
      }
      throw clientError
    }

    // Get today's date for calendar events
    const today = new Date().toISOString().split("T")[0]
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

  // Helper to safely run a count query - returns 0 on any error
  const safeCount = async (query: Promise<{ count: number | null; error: any }>): Promise<number> => {
    try {
      const result = await query
      return Number(result.count) || 0
    } catch {
      return 0
    }
  }

  const [
    tasks, goals, workflows, candidates, tickets, teamMembers,
    responsibilities, surveys, inventory, devices, calendar, documents,
    cirs, contacts, hygiene, training, protocols, journal,
    appraisals, skills, workplaces, rooms, equipment,
    dienstplan, zeiterfassung, analytics, knowledge,
    strategy, leadership, wellbeing, leitbild, selfcheck, organigramm,
  ] = await Promise.all([
    // Tasks (incomplete)
    safeCount(supabase.from("todos").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).eq("completed", false)),
    // Goals (active)
    safeCount(supabase.from("goals").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).not("status", "in", "(completed,cancelled)")),
    // Workflows (active)
    safeCount(supabase.from("workflows").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).eq("status", "active")),
    // Candidates (not archived)
    safeCount(supabase.from("candidates").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).neq("status", "Archiv")),
    // Tickets (open)
    safeCount(supabase.from("tickets").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).neq("status", "resolved").neq("status", "closed")),
    // Team members (active)
    safeCount(supabase.from("team_members").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).eq("status", "active")),
    // Responsibilities
    safeCount(supabase.from("responsibilities").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).is("deleted_at", null)),
    // Survey responses (completed)
    safeCount(supabase.from("survey_responses").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).eq("status", "completed").is("deleted_at", null)),
    // Inventory items
    safeCount(supabase.from("inventory_items").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).is("deleted_at", null)),
    // Medical devices
    safeCount(supabase.from("medical_devices").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).is("deleted_at", null)),
    // Calendar events (today)
    safeCount(supabase.from("calendar_events").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).gte("start_time", today).lte("start_time", endOfDay.toISOString())),
    // Documents
    safeCount(supabase.from("documents").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).is("deleted_at", null)),
    // CIRS incidents (open/pending)
    safeCount(supabase.from("cirs_incidents").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).in("status", ["new", "in_progress", "pending"])),
    // Contacts
    safeCount(supabase.from("contacts").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).is("deleted_at", null)),
    // Hygiene plan executions (due/overdue)
    safeCount(supabase.from("hygiene_plan_executions").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).eq("status", "pending").lte("due_date", today)),
    // Training events (upcoming/required)
    safeCount(supabase.from("training_events").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).eq("status", "required")),
    // Protocols
    safeCount(supabase.from("protocols").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).is("deleted_at", null)),
    // Journal entries
    safeCount(supabase.from("practice_journals").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).is("deleted_at", null)),
    // Appraisals (scheduled/pending)
    safeCount(supabase.from("employee_appraisals").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).in("status", ["scheduled", "pending", "in_progress"])),
    // Skills/Competencies
    safeCount(supabase.from("skill_definitions").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).is("deleted_at", null)),
    // Workplaces (Arbeitsplaetze)
    safeCount(supabase.from("arbeitsplaetze").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).is("deleted_at", null)),
    // Rooms
    safeCount(supabase.from("rooms").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).is("deleted_at", null)),
    // Equipment/Arbeitsmittel
    safeCount(supabase.from("equipment").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).is("deleted_at", null)),
    // Dienstplan (shift schedules for today/this week)
    safeCount(supabase.from("shift_schedules").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).gte("shift_date", today)),
    // Zeiterfassung (time stamps for today)
    safeCount(supabase.from("time_stamps").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).gte("date", today)),
    // Analytics/KPIs
    safeCount(supabase.from("analytics_parameters").select("*", { count: "exact", head: true }).eq("practice_id", practiceId)),
    // Knowledge base articles
    safeCount(supabase.from("knowledge_base_articles").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).eq("status", "published")),
    // Roadmap items / strategy (active)
    safeCount(supabase.from("roadmap_items").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).neq("status", "completed")),
    // Leadership / Leitbild items
    safeCount(supabase.from("leitbild").select("*", { count: "exact", head: true }).eq("practice_id", practiceId)),
    // Wellbeing suggestions
    safeCount(supabase.from("wellbeing_suggestions").select("*", { count: "exact", head: true }).eq("practice_id", practiceId)),
    // Leitbild count (separate from leadership badge)
    safeCount(supabase.from("leitbild").select("*", { count: "exact", head: true }).eq("practice_id", practiceId)),
    // Self-check entries (pending)
    safeCount(supabase.from("user_self_checks").select("*", { count: "exact", head: true }).eq("practice_id", practiceId).eq("status", "pending")),
    // Organigramm (org chart positions)
    safeCount(supabase.from("org_chart_positions").select("*", { count: "exact", head: true }).eq("practice_id", practiceId)),
  ])

    // Contacts count includes team members (as they are shown merged in the contacts list)
    const contactsCount = contacts + teamMembers

    const badges = {
      tasks,
      goals,
      workflows,
      candidates,
      tickets,
      teamMembers,
      responsibilities,
      surveys,
      inventory,
      devices,
      calendar,
      documents,
      cirs,
      contacts: contactsCount,
      hygiene,
      training,
      protocols,
      journal,
      appraisals,
      skills,
      workplaces,
      rooms,
      equipment,
      dienstplan,
      zeiterfassung,
      analytics,
      knowledge,
      strategy,
      leadership,
      wellbeing,
      leitbild,
      selfcheck,
      organigramm,
    }

    return {
      data: badges,
      error: null,
    }
  } catch (error: any) {
    console.error("[v0] Error in getSidebarBadges:", error?.message || error)
    if (isRateLimitError(error)) {
      return { data: defaultBadges, error: null }
    }
    return { data: defaultBadges, error }
  }
}

export async function getTicketStats(practiceId: string) {
  try {
    const supabase = await createAdminClient()

    const { data, error } = await supabase.from("tickets").select("status, priority").eq("practice_id", practiceId)

    if (error) {
      return { data: null, error }
    }

    const stats = {
      total: data.length,
      open: data.filter((t) => t.status === "open").length,
      inProgress: data.filter((t) => t.status === "in-progress").length,
      resolved: data.filter((t) => t.status === "resolved").length,
      closed: data.filter((t) => t.status === "closed").length,
      highPriority: data.filter((t) => t.priority === "high" || t.priority === "urgent").length,
    }

    return { data: stats, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
