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

    const results = await Promise.all([
      // Tasks (incomplete)
      supabase
        .from("todos")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .eq("completed", false),
      // Goals (active)
      supabase
        .from("goals")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .not("status", "in", "(completed,cancelled)"),
      // Workflows (active)
      supabase
        .from("workflows")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .eq("status", "active"),
      // Candidates (not archived)
      supabase
        .from("candidates")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .neq("status", "Archiv"),
      // Tickets (open)
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .neq("status", "resolved")
        .neq("status", "closed"),
      // Team members (active)
      supabase
        .from("team_members")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .eq("status", "active"),
      // Responsibilities
      supabase
        .from("responsibilities")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .is("deleted_at", null),
      // Survey responses (completed)
      supabase
        .from("survey_responses")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .eq("status", "completed")
        .is("deleted_at", null),
      // Inventory items
      supabase
        .from("inventory_items")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .is("deleted_at", null),
      // Medical devices
      supabase
        .from("medical_devices")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .is("deleted_at", null),
      // Calendar events (today)
      supabase
        .from("calendar_events")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .gte("start_time", today)
        .lte("start_time", endOfDay.toISOString()),
      // Documents
      supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .is("deleted_at", null),
      // CIRS reports (open/pending)
      supabase
        .from("cirs_reports")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .in("status", ["new", "in_progress", "pending"]),
      // Contacts
      supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .is("deleted_at", null),
      // Hygiene tasks (due/overdue)
      supabase
        .from("hygiene_tasks")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .eq("status", "pending")
        .lte("due_date", today),
      // Training records (upcoming/required)
      supabase
        .from("training_records")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .eq("status", "required"),
      // Protocols (recent)
      supabase
        .from("protocols")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .is("deleted_at", null),
      // Journal entries
      supabase
        .from("practice_insights")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .is("deleted_at", null),
      // Appraisals (scheduled/pending)
      supabase
        .from("team_member_appraisals")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .in("status", ["scheduled", "pending", "in_progress"]),
      // Skills/Competencies
      supabase
        .from("skills")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .is("deleted_at", null),
      // Workplaces
      supabase
        .from("workplaces")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .is("deleted_at", null),
      // Rooms
      supabase
        .from("rooms")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .is("deleted_at", null),
      // Equipment/Arbeitsmittel
      supabase
        .from("equipment")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .is("deleted_at", null),
      // Dienstplan (shift plans for today/this week)
      supabase
        .from("shift_plans")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .gte("date", today),
      // Zeiterfassung (time entries for today)
      supabase
        .from("time_entries")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .gte("date", today),
      // Analytics/KPIs
      supabase
        .from("practice_parameters")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId),
      // Knowledge articles
      supabase
        .from("knowledge_articles")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .eq("status", "published"),
      // Strategy milestones (active)
      supabase
        .from("strategy_milestones")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .neq("status", "completed"),
      // Leadership items
      supabase
        .from("leadership_items")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId),
      // Wellbeing entries
      supabase
        .from("wellbeing_entries")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId),
      // Leitbild elements
      supabase
        .from("leitbild_elements")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId),
      // Self-check entries (pending)
      supabase
        .from("self_check_entries")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .eq("status", "pending"),
      // Organigramm nodes
      supabase
        .from("organigramm_nodes")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId),
    ])

    const [
      tasksResult,
      goalsResult,
      workflowsResult,
      candidatesResult,
      ticketsResult,
      teamResult,
      responsibilitiesResult,
      surveysResult,
      inventoryResult,
      devicesResult,
      calendarResult,
      documentsResult,
      cirsResult,
      contactsResult,
      hygieneResult,
      trainingResult,
      protocolsResult,
      journalResult,
      appraisalsResult,
      skillsResult,
      workplacesResult,
      roomsResult,
      equipmentResult,
      dienstplanResult,
      zeiterfassungResult,
      analyticsResult,
      knowledgeResult,
      strategyResult,
      leadershipResult,
      wellbeingResult,
      leitbildResult,
      selfcheckResult,
      organigrammResult,
    ] = results

    const badges = {
      tasks: Number(tasksResult.count) || 0,
      goals: Number(goalsResult.count) || 0,
      workflows: Number(workflowsResult.count) || 0,
      candidates: Number(candidatesResult.count) || 0,
      tickets: Number(ticketsResult.count) || 0,
      teamMembers: Number(teamResult.count) || 0,
      responsibilities: Number(responsibilitiesResult.count) || 0,
      surveys: Number(surveysResult.count) || 0,
      inventory: Number(inventoryResult.count) || 0,
      devices: Number(devicesResult.count) || 0,
      calendar: Number(calendarResult.count) || 0,
      documents: Number(documentsResult.count) || 0,
      cirs: Number(cirsResult.count) || 0,
      contacts: Number(contactsResult.count) || 0,
      hygiene: Number(hygieneResult.count) || 0,
      training: Number(trainingResult.count) || 0,
      protocols: Number(protocolsResult.count) || 0,
      journal: Number(journalResult.count) || 0,
      appraisals: Number(appraisalsResult.count) || 0,
      skills: Number(skillsResult.count) || 0,
      workplaces: Number(workplacesResult.count) || 0,
      rooms: Number(roomsResult.count) || 0,
      equipment: Number(equipmentResult.count) || 0,
      dienstplan: Number(dienstplanResult.count) || 0,
      zeiterfassung: Number(zeiterfassungResult.count) || 0,
      analytics: Number(analyticsResult.count) || 0,
      knowledge: Number(knowledgeResult.count) || 0,
      strategy: Number(strategyResult.count) || 0,
      leadership: Number(leadershipResult.count) || 0,
      wellbeing: Number(wellbeingResult.count) || 0,
      leitbild: Number(leitbildResult.count) || 0,
      selfcheck: Number(selfcheckResult.count) || 0,
      organigramm: Number(organigrammResult.count) || 0,
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
