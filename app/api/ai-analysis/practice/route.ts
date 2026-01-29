import { createServerClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { checkAIEnabled } from "@/lib/check-ai-enabled"
import { getAIContextFromDonatedData } from "@/lib/anonymize-practice-data"
import { isRateLimitError } from "@/lib/supabase/safe-query"
import { getTicketStatuses, getTicketPriorities } from "@/lib/tickets/config"

const isV0Preview =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" || process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "true"

export async function POST(request: Request) {
  try {
    let supabase
    try {
      supabase = await createServerClient()
    } catch (clientError) {
      if (isRateLimitError(clientError)) {
        console.warn("[v0] AI Analysis - Rate limited creating server client")
        return new Response(
          JSON.stringify({
            error: "Service vorübergehend nicht verfügbar. Bitte versuchen Sie es in einigen Sekunden erneut.",
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          },
        )
      }
      throw clientError
    }

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    const body = await request.json()

    let userId = authUser?.id
    if (!userId && isV0Preview && body.userId) {
      userId = body.userId
    }

    if (!userId) {
      console.error("[v0] AI Analysis - No authenticated user")
      return new Response(
        JSON.stringify({
          error: "Nicht authentifiziert. Bitte melden Sie sich an.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    let userData, userError
    try {
      const result = await supabase
        .from("users")
        .select("id, email, role, is_active, practice_id, default_practice_id")
        .eq("id", userId)
        .maybeSingle()

      userData = result.data
      userError = result.error
    } catch (queryError) {
      if (isRateLimitError(queryError)) {
        console.warn("[v0] AI Analysis - Rate limited on user lookup:", userId)
        return new Response(
          JSON.stringify({
            error: "Service vorübergehend nicht verfügbar. Bitte versuchen Sie es in einigen Sekunden erneut.",
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          },
        )
      }
      throw queryError
    }

    if (userError) {
      console.error("[v0] AI Analysis - User lookup error:", userError.message)
      return new Response(
        JSON.stringify({
          error: "Datenbankfehler. Bitte versuchen Sie es erneut.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // If user doesn't exist in users table but has valid auth, allow access (new user scenario)
    // Only reject if user exists but is explicitly deactivated
    if (userData && userData.is_active === false) {
      console.error("[v0] AI Analysis - User is deactivated:", userId)
      return new Response(
        JSON.stringify({
          error: "Ihr Konto wurde deaktiviert. Bitte kontaktieren Sie den Administrator.",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const { practiceId } = body

    if (!practiceId) {
      return new Response(
        JSON.stringify({
          error: "Praxis-ID fehlt. Bitte versuchen Sie es erneut.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const isSuperAdmin = userData?.role === "superadmin"
    const userPracticeId = userData?.practice_id || userData?.default_practice_id

    if (!isSuperAdmin && userPracticeId !== practiceId) {
      console.error("[v0] AI Analysis - SECURITY VIOLATION: User attempting to access different practice", {
        userId: userData?.id,
        userPracticeId,
        requestedPracticeId: practiceId,
      })
      return Response.json({ error: "Forbidden - You do not have access to this practice's data" }, { status: 403 })
    }

    const { enabled: aiEnabled, isSuperAdmin: isSuper } = await checkAIEnabled(practiceId, userId)

    if (!aiEnabled && !isSuper) {
      return Response.json(
        {
          error: "KI-Funktionen sind für diese Praxis deaktiviert",
          details:
            "Die KI-Funktionen wurden vom Administrator deaktiviert. Bitte kontaktieren Sie Ihren Administrator, um sie zu aktivieren.",
        },
        { status: 403 },
      )
    }

    let documentsCount = 0
    let knowledgeCount = 0
    let documentsData: any[] = []

    try {
      const documentsResult = await supabase
        .from("documents")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("is_archived", false)
      documentsCount = documentsResult.data?.length || 0
      documentsData = documentsResult.data || []
    } catch (docError) {
      documentsCount = 0
      documentsData = []
    }

    try {
      const knowledgeResult = await supabase
        .from("knowledge_base")
        .select("id", { count: "exact" })
        .eq("practice_id", practiceId)
        .eq("status", "published")
      knowledgeCount = knowledgeResult.count || 0
    } catch (knowledgeError) {
      knowledgeCount = 0
    }

    const safeQuery = async (query: Promise<any> | PromiseLike<any>, fallback: any = { data: [] }) => {
      try {
        const result = await query
        return result
      } catch (error) {
        return fallback
      }
    }

    const [
      practiceData,
      teamMembersData,
      goals,
      workflows,
      documents,
      kvData,
      todos, // Added todos query, moved from below
      calendarEvents,
      responsibilities,
      orgChart,
      workflowSteps,
      orgaCategories,
      notifications,
      documentFolders,
      questionnaires,
      questionnaireResponses,
      practiceSettings,
      bankTransactions,
      bankTransactionCategories,
      sidebarPermissions,
      userPreferences,
      translations,
      todoAttachments,
      tickets, // Added tickets
      systemChanges, // Added systemChanges
      googleRatings, // Added googleRatings
      departments, // Added departments
      interviewTemplates, // Added interviewTemplates
      hiringPipelineStages, // Added hiringPipelineStages
      recruitingFormFields, // Added recruitingFormFields
      workflowTemplates, // workflow_templates is a global table without practice_id
      // Removed todos query from here, it's now at the top
      teams, // Added teams
      contracts, // Added contracts
      staffingPlan, // Added staffingPlan
      staffingPlans, // Added staffingPlans
      candidates, // Added candidates
      applications, // Added applications
      jobPostings, // Added jobPostings
      interviews, // Added interviews
      customForms, // Changed "forms" to "custom_forms" to match the actual database table name
      formSubmissions, // Added formSubmissions query
      analyticsParameters, // Use analytics_parameters instead
      knowledge, // Added knowledge query
      todoStats, // Added todoStats query
      // Additional data sources for comprehensive analysis
      inventoryItems, // Inventory management
      rooms, // Room management
      arbeitsplaetze, // Workstations
      arbeitsmittel, // Work equipment
      timeBlocks, // Time tracking
      protocols, // Meeting protocols
      surveys, // Surveys
      contacts, // Contact management
      leitbild, // Mission/vision
      kudos, // Employee recognition
      moodSurveys, // Anonymous mood surveys
      moodResponses, // Anonymous mood responses
      employeeAppraisals, // Performance reviews
      employeeAvailability, // Staff availability
      shiftSchedules, // Shift schedules
      competitorAnalyses, // Competitor analyses
      igelAnalyses, // IGEL service analyses
      roiAnalyses, // ROI analyses
      qualityCircleSessions, // Quality circle sessions
      wellbeingSuggestions, // Wellbeing suggestions
      workloadAnalysis, // Workload analysis
    ] = await Promise.all([
      supabase.from("practices").select("*").eq("id", practiceId).single(),
      supabase
        .from("team_members")
        .select("*, users!inner(name, email, role, is_active, first_name, last_name)")
        .eq("practice_id", practiceId)
        .eq("status", "active")
        .eq("users.is_active", true)
        .neq("users.role", "superadmin"),
      supabase.from("goals").select("*").eq("practice_id", practiceId),
      supabase.from("workflows").select("*").eq("practice_id", practiceId),
      supabase.from("documents").select("*").eq("practice_id", practiceId),
      supabase
        .from("kv_abrechnung")
        .select("*")
        .eq("practice_id", practiceId)
        .order("year", { ascending: false })
        .order("quarter", { ascending: false })
        .limit(4),
      supabase
        .from("todos")
        .select("completed, due_date")
        .eq("practice_id", practiceId), // This was a partial todos query, replaced by the full query above
      safeQuery(
        supabase
          .from("calendar_events")
          .select("*")
          .eq("practice_id", practiceId)
          .gte("start_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]),
      ),
      safeQuery(supabase.from("responsibilities").select("*").eq("practice_id", practiceId)),
      safeQuery(supabase.from("org_chart_positions").select("*").eq("practice_id", practiceId)),
      safeQuery(supabase.from("workflow_steps").select("*")),
      safeQuery(supabase.from("orga_categories").select("*").eq("practice_id", practiceId)),
      safeQuery(
        supabase
          .from("notifications")
          .select("*")
          .eq("practice_id", practiceId)
          .order("created_at", { ascending: false })
          .limit(50),
      ),
      safeQuery(supabase.from("document_folders").select("*").eq("practice_id", practiceId)),
      safeQuery(supabase.from("questionnaires").select("*").eq("practice_id", practiceId)),
      safeQuery(supabase.from("questionnaire_responses").select("*").eq("practice_id", practiceId)),
      safeQuery(supabase.from("practice_settings").select("*").eq("practice_id", practiceId).maybeSingle(), {
        data: null,
      }),
      safeQuery(
        supabase
          .from("bank_transactions")
          .select("*")
          .eq("practice_id", practiceId)
          .order("transaction_date", { ascending: false })
          .limit(500),
      ),
      safeQuery(supabase.from("bank_transaction_categories").select("*").eq("practice_id", practiceId)),
      safeQuery(supabase.from("sidebar_permissions").select("*").eq("practice_id", practiceId)),
      safeQuery(supabase.from("user_preferences").select("*")),
      safeQuery(supabase.from("translations").select("*").limit(100)),
      safeQuery(supabase.from("todo_attachments").select("*").eq("practice_id", practiceId)),
      supabase
        .from("tickets")
        .select("*")
        .eq("practice_id", practiceId), // Added tickets query
      supabase
        .from("system_changes")
        .select("*")
        .eq("practice_id", practiceId)
        .order("created_at", { ascending: false })
        .limit(200), // Added systemChanges query
      supabase
        .from("google_ratings")
        .select("*")
        .eq("practice_id", practiceId)
        .order("review_date", { ascending: false })
        .limit(50), // Added googleRatings query
      supabase
        .from("departments")
        .select("*")
        .eq("practice_id", practiceId), // Added departments query
      supabase
        .from("interview_templates")
        .select("*")
        .eq("practice_id", practiceId), // Added interviewTemplates query
      supabase
        .from("hiring_pipeline_stages")
        .select("*")
        .eq("practice_id", practiceId), // Added hiringPipelineStages query
      supabase
        .from("recruiting_form_fields")
        .select("*")
        .eq("practice_id", practiceId), // Added recruitingFormFields query
      supabase
        .from("workflow_templates")
        .select("*"), // workflow_templates is a global table without practice_id
      supabase
        .from("todos")
        .select("*")
        .eq("practice_id", practiceId), // Added todos query
      supabase
        .from("teams")
        .select("*")
        .eq("practice_id", practiceId), // Added teams query
      supabase
        .from("contracts")
        .select("*")
        .eq("practice_id", practiceId), // Added contracts query
      supabase
        .from("staffing_plan")
        .select("*")
        .eq("practice_id", practiceId), // Added staffingPlan query
      supabase
        .from("staffing_plans")
        .select("*")
        .eq("practice_id", practiceId), // Added staffingPlans query
      supabase
        .from("candidates")
        .select("*")
        .eq("practice_id", practiceId), // Added candidates query
      supabase
        .from("applications")
        .select("*")
        .eq("practice_id", practiceId), // Added applications query
      supabase
        .from("job_postings")
        .select("*")
        .eq("practice_id", practiceId), // Added jobPostings query
      supabase
        .from("interviews")
        .select("*")
        .eq("practice_id", practiceId), // Added interviews query
      supabase
        .from("custom_forms")
        .select("*")
        .eq("practice_id", practiceId), // Changed "forms" to "custom_forms" to match the actual database table name
      supabase
        .from("form_submissions")
        .select("*")
        .eq("practice_id", practiceId), // Added formSubmissions query
      safeQuery(supabase.from("analytics_parameters").select("*").eq("practice_id", practiceId)), // Changed 'analytics' to 'analytics_parameters'
      safeQuery(supabase.from("knowledge_base").select("*").eq("practice_id", practiceId)), // Added knowledge query
      supabase
        .from("todos")
        .select("id, completed")
        .eq("practice_id", practiceId), // Added todoStats query
      // New comprehensive data queries
      safeQuery(supabase.from("inventory_items").select("*").eq("practice_id", practiceId)),
      safeQuery(supabase.from("rooms").select("*").eq("practice_id", practiceId)),
      safeQuery(supabase.from("arbeitsplaetze").select("*").eq("practice_id", practiceId)),
      safeQuery(supabase.from("arbeitsmittel").select("*").eq("practice_id", practiceId)),
      safeQuery(
        supabase
          .from("time_blocks")
          .select("*")
          .eq("practice_id", practiceId)
          .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
          .limit(500),
      ),
      safeQuery(
        supabase
          .from("protocols")
          .select("*")
          .eq("practice_id", practiceId)
          .order("meeting_date", { ascending: false })
          .limit(50),
      ),
      safeQuery(supabase.from("surveys").select("*").eq("practice_id", practiceId)),
      safeQuery(supabase.from("contacts").select("*").eq("practice_id", practiceId)),
      safeQuery(
        supabase.from("leitbild").select("*").eq("practice_id", practiceId).eq("is_active", true).maybeSingle(),
        { data: null },
      ),
      safeQuery(supabase.from("kudos").select("*").eq("practice_id", practiceId)),
      safeQuery(supabase.from("anonymous_mood_surveys").select("*").eq("practice_id", practiceId)),
      safeQuery(supabase.from("anonymous_mood_responses").select("*").eq("practice_id", practiceId)),
      safeQuery(supabase.from("employee_appraisals").select("*").eq("practice_id", practiceId)),
      safeQuery(supabase.from("employee_availability").select("*").eq("practice_id", practiceId)),
      safeQuery(
        supabase
          .from("shift_schedules")
          .select("*")
          .eq("practice_id", practiceId)
          .gte("shift_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]),
      ),
      safeQuery(supabase.from("competitor_analyses").select("*").eq("practice_id", practiceId)),
      safeQuery(supabase.from("igel_analyses").select("*").eq("practice_id", practiceId)),
      safeQuery(supabase.from("roi_analyses").select("*").eq("practice_id", practiceId)),
      safeQuery(supabase.from("quality_circle_sessions").select("*").eq("practice_id", practiceId)),
      safeQuery(supabase.from("wellbeing_suggestions").select("*").eq("practice_id", practiceId)),
      safeQuery(
        supabase
          .from("workload_analysis")
          .select("*")
          .eq("practice_id", practiceId)
          .order("created_at", { ascending: false })
          .limit(1),
      ),
    ])

    const [ticketStatusesConfig, ticketPrioritiesConfig] = await Promise.all([
      getTicketStatuses(),
      getTicketPriorities(),
    ])

    const openStatusValues = ticketStatusesConfig
      .filter((s: any) => ["open", "in_progress", "pending"].includes(s.value))
      .map((s: any) => s.value)
    const resolvedStatusValues = ticketStatusesConfig
      .filter((s: any) => ["resolved", "closed", "wont_fix"].includes(s.value))
      .map((s: any) => s.value)

    const highPriorityValues = ticketPrioritiesConfig.filter((p: any) => p.urgency_level >= 3).map((p: any) => p.value)

    const totalTransactions = bankTransactions.data?.length || 0
    const transactionAmounts = bankTransactions.data?.map((t: any) => Number(t.amount || 0)) || []
    const totalRevenue = transactionAmounts.filter((a: number) => a > 0).reduce((sum: number, a: number) => sum + a, 0)
    const totalExpenses = Math.abs(transactionAmounts.filter((a: number) => a < 0).reduce((sum: number, a: number) => sum + a, 0))
    const netCashFlow = totalRevenue - totalExpenses
    const avgTransactionSize = totalTransactions > 0 ? (totalRevenue + totalExpenses) / totalTransactions : 0
    const categoriesCount = bankTransactionCategories.data?.length || 0
    const categorizedTransactions = bankTransactions.data?.filter((t: any) => t.category)?.length || 0
    const categorizationRate =
      totalTransactions > 0 ? ((categorizedTransactions / totalTransactions) * 100).toFixed(1) : "0"

    const kvAbrechnungCount = kvData.data?.length || 0
    const latestKV = kvData.data?.[0]
    const kvQuarters = kvData.data?.map((kv: any) => `Q${kv.quarter} ${kv.year}`).join(", ") || "Keine"

    const totalTickets = tickets.data?.length || 0
    const openTickets = tickets.data?.filter((t: any) => openStatusValues.includes(t.status))?.length || 0
    const resolvedTickets = tickets.data?.filter((t: any) => resolvedStatusValues.includes(t.status))?.length || 0
    const highPriorityTickets = tickets.data?.filter((t: any) => highPriorityValues.includes(t.priority))?.length || 0
    const ticketResolutionRate = totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100).toFixed(1) : 0
    const avgCommentsPerTicket =
      totalTickets > 0
        ? (tickets.data?.reduce((sum: number, t: any) => sum + (t.ticket_comments?.[0]?.count || 0), 0) / totalTickets).toFixed(1)
        : 0
    const ticketsByType =
      tickets.data?.reduce(
        (acc: Record<string, number>, t: any) => {
          acc[t.type || "Unbekannt"] = (acc[t.type || "Unbekannt"] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ) || {}

    const recentChanges = systemChanges.data?.length || 0
    const changesByType =
      systemChanges.data?.reduce(
        (acc: Record<string, number>, c: any) => {
          acc[c.change_type || "Unbekannt"] = (acc[c.change_type || "Unbekannt"] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ) || {}
    const userFacingChanges = systemChanges.data?.filter((c: any) => c.is_user_facing)?.length || 0

    const totalGoogleRatings = googleRatings.data?.length || 0
    const avgGoogleRating =
      totalGoogleRatings > 0
        ? (googleRatings.data?.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / totalGoogleRatings).toFixed(1)
        : 0
    const ratingsWithReviews = googleRatings.data?.filter((r: any) => r.review_text)?.length || 0
    const ratingsWithResponses = googleRatings.data?.filter((r: any) => r.response_text)?.length || 0
    const responseRateForGoogleRatings =
      totalGoogleRatings > 0 ? ((ratingsWithResponses / totalGoogleRatings) * 100).toFixed(1) : 0
    const recentRatings =
      googleRatings.data?.filter((r: any) => {
        const ratingDate = new Date(r.review_date)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        return ratingDate >= thirtyDaysAgo
      })?.length || 0

    const departmentsCount = departments.data?.length || 0
    const activeDepartments = departments.data?.filter((d: any) => d.is_active)?.length || 0
    const interviewTemplatesCount = interviewTemplates.data?.length || 0
    const pipelineStagesCount = hiringPipelineStages.data?.length || 0
    const activePipelineStages = hiringPipelineStages.data?.filter((s: any) => s.is_active)?.length || 0
    const recruitingFieldsCount = recruitingFormFields.data?.length || 0
    const enabledRecruitingFields = recruitingFormFields.data?.filter((f: any) => f.enabled)?.length || 0

    const totalWorkflowTemplates = workflowTemplates.data?.length || 0
    const activeWorkflowTemplates = workflowTemplates.data?.filter((t: any) => t.is_active)?.length || 0
    const sidebarPermissionsCount = sidebarPermissions.data?.length || 0
    const userPreferencesCount = userPreferences.data?.length || 0
    const todoAttachmentsCount = todoAttachments.data?.length || 0
    const totalTodos = todos.data?.length || 0
    const attachmentsPerTodo = totalTodos > 0 ? (todoAttachmentsCount / totalTodos).toFixed(1) : 0

    const teamSize = teamMembersData.data?.length || 0
    const activeTeamMembers = teamMembersData.data?.filter((m: any) => m.users?.is_active)?.length || 0
    const inactiveTeamMembers = teamSize - activeTeamMembers
    const teamsCount = teams.data?.length || 0
    const activeContracts = contracts.data?.filter((c: any) => c.is_active)?.length || 0

    const totalWeeklyHours = staffingPlan.data?.reduce((sum: number, s: any) => sum + Number(s.hours || 0), 0) || 0
    const monthlyHours = totalWeeklyHours * 4.23
    const avgHoursPerTeamMember = activeTeamMembers > 0 ? (totalWeeklyHours / activeTeamMembers).toFixed(1) : 0
    const activeStaffingPlans = staffingPlans.data?.filter((sp: any) => sp.is_active)?.length || 0

    const totalGoals = goals.data?.length || 0
    const completedGoals = goals.data?.filter((g: any) => g.status === "completed")?.length || 0
    const activeGoals = goals.data?.filter((g: any) => g.status === "in_progress")?.length || 0
    const overdueGoals =
      goals.data?.filter((g: any) => g.status !== "completed" && g.end_date && new Date(g.end_date) < new Date())?.length ||
      0
    const highPriorityGoals = goals.data?.filter((g: any) => g.priority === "high")?.length || 0
    const goalCompletionRate = totalGoals > 0 ? ((completedGoals / totalGoals) * 100).toFixed(1) : 0
    const avgGoalProgress =
      goals.data?.reduce((sum: number, g: any) => sum + (g.progress_percentage || 0), 0) / (totalGoals || 1) || 0

    const completedTodos = todoStats.data?.filter((t: any) => t.completed)?.length || 0
    const pendingTodos = totalTodos - completedTodos
    const overdueTodos =
      todos.data?.filter((t: any) => !t.completed && t.due_date && new Date(t.due_date) < new Date())?.length || 0
    const highPriorityTodos = todos.data?.filter((t: any) => t.priority === "high")?.length || 0
    const todoCompletionRate = totalTodos > 0 ? ((completedTodos / totalTodos) * 100).toFixed(1) : 0

    const totalCandidates = candidates.data?.length || 0
    const activeCandidates = candidates.data?.filter((c: any) => c.status !== "rejected")?.length || 0
    const rejectedCandidates = candidates.data?.filter((c: any) => c.status === "rejected")?.length || 0
    const totalApplications = applications.data?.length || 0
    const pendingApplications = applications.data?.filter((a: any) => a.status === "pending")?.length || 0
    const acceptedApplications = applications.data?.filter((a: any) => a.status === "accepted")?.length || 0
    const rejectedApplications = applications.data?.filter((a: any) => a.status === "rejected")?.length || 0
    const activeJobPostings = jobPostings.data?.filter((j: any) => j.status === "active")?.length || 0
    const closedJobPostings = jobPostings.data?.filter((j: any) => j.status === "closed")?.length || 0
    const scheduledInterviews = interviews.data?.filter((i: any) => i.status === "scheduled")?.length || 0
    const completedInterviews = interviews.data?.filter((i: any) => i.status === "completed")?.length || 0
    const applicationConversionRate =
      totalApplications > 0 ? ((acceptedApplications / totalApplications) * 100).toFixed(1) : 0
    const candidatesPerJob = activeJobPostings > 0 ? (totalCandidates / activeJobPostings).toFixed(1) : 0

    const totalDocuments = documentsCount
    const knowledgeArticles = knowledgeCount

    const totalCustomForms = customForms.data?.length || 0
    const activeCustomForms = customForms.data?.filter((f: any) => f.status === "active")?.length || 0
    const totalFormSubmissions = formSubmissions.data?.length || 0
    const pendingFormSubmissions = formSubmissions.data?.filter((s: any) => s.status === "pending")?.length || 0
    const approvedFormSubmissions = formSubmissions.data?.filter((s: any) => s.status === "approved")?.length || 0
    const submissionsPerForm = totalCustomForms > 0 ? (totalFormSubmissions / totalCustomForms).toFixed(1) : 0

    const totalWorkflows = workflows.data?.length || 0
    const activeWorkflows = workflows.data?.filter((w: any) => w.status === "in_progress")?.length || 0
    const completedWorkflows = workflows.data?.filter((w: any) => w.status === "completed")?.length || 0
    const blockedWorkflows = workflows.data?.filter((w: any) => w.status === "blocked")?.length || 0
    const avgWorkflowProgress =
      workflows.data?.reduce((sum: number, w: any) => sum + (w.progress_percentage || 0), 0) / (workflows.data?.length || 1) || 0
    const workflowCompletionRate = totalWorkflows > 0 ? ((completedWorkflows / totalWorkflows) * 100).toFixed(1) : 0

    const upcomingEvents = calendarEvents.data?.length || 0
    const eventsThisWeek =
      calendarEvents.data?.filter((e: any) => {
        const eventDate = new Date(e.start_date)
        const now = new Date()
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        return eventDate >= now && eventDate <= weekFromNow
      })?.length || 0

    const totalResponsibilities = responsibilities.data?.length || 0
    const activeResponsibilities = responsibilities.data?.filter((r: any) => r.is_active)?.length || 0
    const responsibilitiesWithLeader = responsibilities.data?.filter((r: any) => r.responsible_user_id)?.length || 0
    const responsibilityGroups = [...new Set(responsibilities.data?.map((r: any) => r.group_name).filter(Boolean))].length
    const responsibilityCoverage =
      totalResponsibilities > 0 ? ((responsibilitiesWithLeader / totalResponsibilities) * 100).toFixed(1) : 0
    const avgMembersPerResponsibility =
      responsibilities.data?.reduce(
        (sum: number, r: any) => sum + (Array.isArray(r.team_member_ids) ? r.team_member_ids.length : 0),
        0,
      ) / (totalResponsibilities || 1) || 0

    const totalOrgPositions = orgChart.data?.length || 0
    const filledPositions = orgChart.data?.filter((p: any) => p.user_id)?.length || 0
    const vacantPositions = totalOrgPositions - filledPositions
    const orgLevels = Math.max(...(orgChart.data?.map((p: any) => p.level || 0) || [0]))
    const positionFillRate = totalOrgPositions > 0 ? ((filledPositions / totalOrgPositions) * 100).toFixed(1) : 0
    const departmentsInOrg = [...new Set(orgChart.data?.map((p: any) => p.department).filter(Boolean))].length

    const workflowStepsData =
      workflowSteps.data?.filter((s: any) => workflows.data?.some((w: any) => w.id === s.workflow_id)) || []
    const completedSteps = workflowStepsData.filter((s: any) => s.status === "completed").length
    const blockedSteps = workflowStepsData.filter((s: any) => s.status === "blocked").length
    const totalSteps = workflowStepsData.length
    const stepCompletionRate = totalSteps > 0 ? ((completedSteps / totalSteps) * 100).toFixed(1) : 0
    const stepBlockageRate = totalSteps > 0 ? ((blockedSteps / totalSteps) * 100).toFixed(1) : 0

    const categoryCount = orgaCategories.data?.length || 0
    const activeCategoriesCount = orgaCategories.data?.filter((c: any) => c.is_active)?.length || 0

    const unreadNotifications = notifications.data?.filter((n: any) => !n.is_read)?.length || 0
    const totalNotifications = notifications.data?.length || 0
    const notificationReadRate =
      totalNotifications > 0 ? (((totalNotifications - unreadNotifications) / totalNotifications) * 100).toFixed(1) : 0

    const totalFolders = documentFolders.data?.length || 0
    const documentsPerFolder = totalFolders > 0 ? (totalDocuments / totalFolders).toFixed(1) : 0
    const documentsWithTags =
      documentsData.filter((d: any) => d.tags && Array.isArray(d.tags) && d.tags.length > 0)?.length || 0
    const documentTaggingRate = totalDocuments > 0 ? ((documentsWithTags / totalDocuments) * 100).toFixed(1) : 0

    const totalQuestionnaires = questionnaires.data?.length || 0
    const totalResponses = questionnaireResponses.data?.length || 0
    const completedResponses = questionnaireResponses.data?.filter((r: any) => r.status === "completed")?.length || 0
    const avgResponsesPerQuestionnaire = totalQuestionnaires > 0 ? (totalResponses / totalQuestionnaires).toFixed(1) : 0

    const departmentDistribution =
      teamMembersData.data?.reduce(
        (acc: Record<string, number>, tm: any) => {
          const dept = tm.department || "Unzugeordnet"
          acc[dept] = (acc[dept] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ) || {}
    const largestDepartment = Object.entries(departmentDistribution).sort((a, b) => b[1] - a[1])[0]
    const smallestDepartment = Object.entries(departmentDistribution).sort((a, b) => a[1] - b[1])[0]

    const totalAnalyticsParameters = analyticsParameters.data?.length || 0
    const recentAnalyticsParameters =
      analyticsParameters.data?.filter((a: any) => {
        const recordedDate = new Date(a.recorded_date)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        return recordedDate >= thirtyDaysAgo
      })?.length || 0
    const analyticsParameterTrackingConsistency =
      totalAnalyticsParameters > 0 ? ((recentAnalyticsParameters / totalAnalyticsParameters) * 100).toFixed(1) : 0

    const hasSettings = !!practiceSettings.data

    let datenspendeContext = ""

    // Check if current practice has analyticsEnabled in practice_settings
    const { data: practiceSettingsData } = await supabase
      .from("practice_settings")
      .select("system_settings")
      .eq("practice_id", practiceId)
      .maybeSingle()

    const systemSettings = practiceSettingsData?.system_settings as any
    if (systemSettings?.analyticsEnabled === true) {
      datenspendeContext = await getAIContextFromDonatedData(practiceId)
    }

    const fullPrompt = `Du bist ein Experte für Praxismanagement und Organisationsentwicklung. Analysiere die folgenden umfassenden Daten einer medizinischen Praxis und erstelle eine detaillierte, datengestützte Bewertung mit konkreten Handlungsempfehlungen.

PRAXISDATEN - UMFASSENDE VOLLSTÄNDIGE ANALYSE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 GRUNDINFORMATIONEN:
- Praxisname: ${practiceData.data?.name || "Unbekannt"}
- Praxistyp: ${practiceData.data?.type || "Unbekannt"}
- Systemkonfiguration: ${hasSettings ? "Vollständig" : "Unvollständig"}

💰 FINANZIELLE DATEN & TRANSAKTIONEN:
- Banktransaktionen erfasst: ${totalTransactions}
- Gesamteinnahmen: ${totalRevenue.toFixed(2)} ${practiceData.data?.currency || "EUR"}
- Gesamtausgaben: ${totalExpenses.toFixed(2)} ${practiceData.data?.currency || "EUR"}
- Netto-Cashflow: ${netCashFlow.toFixed(2)} ${practiceData.data?.currency || "EUR"}
- Durchschnittliche Transaktionsgröße: ${avgTransactionSize.toFixed(2)} ${practiceData.data?.currency || "EUR"}
- Transaktionskategorien definiert: ${categoriesCount}
- Kategorisierungsrate: ${categorizationRate}%
- KV-Abrechnungen erfasst: ${kvAbrechnungCount} (Quartale: ${kvQuarters})
- 💡 Finanzmanagement-Qualität: ${Number.parseFloat(categorizationRate) > 80 ? "Exzellent" : Number.parseFloat(categorizationRate) > 60 ? "Gut" : "Verbesserungsfähig"}

🎫 SUPPORT & PROBLEMMANAGEMENT:
- Tickets gesamt: ${totalTickets} (${openTickets} offen, ${resolvedTickets} gelöst)
- Hochpriorisierte Tickets: ${highPriorityTickets}
- Ticket-Lösungsrate: ${ticketResolutionRate}%
- Durchschnittliche Kommentare pro Ticket: ${avgCommentsPerTicket}
- Tickets nach Typ: ${
      Object.entries(ticketsByType)
        .map(([type, count]) => `${type}: ${count}`)
        .join(", ") || "Keine"
    }
- 💡 Support-Effizienz: ${Number.parseFloat(ticketResolutionRate) > 85 ? "Sehr gut" : Number.parseFloat(ticketResolutionRate) > 70 ? "Gut" : Number.parseFloat(ticketResolutionRate) > 50 ? "Mittel" : "Verbesserungsbedarf"}

⭐ PATIENTENFEEDBACK & BEWERTUNGEN:
- Google-Bewertungen: ${totalGoogleRatings}
- Durchschnittliche Bewertung: ${avgGoogleRating}/5.0 ⭐
- Bewertungen mit Text: ${ratingsWithReviews}
- Bewertungen mit Antwort: ${ratingsWithResponses} (${responseRateForGoogleRatings}% Antwortrate)
- Aktuelle Bewertungen (30 Tage): ${recentRatings}
- 💡 Patientenzufriedenheit: ${Number.parseFloat(avgGoogleRating) >= 4.5 ? "Exzellent" : Number.parseFloat(avgGoogleRating) >= 4.0 ? "Sehr gut" : Number.parseFloat(avgGoogleRating) >= 3.5 ? "Gut" : "Verbesserungsbedarf"}
- 💡 Engagement: ${Number.parseFloat(responseRateForGoogleRatings) > 80 ? "Sehr aktiv" : Number.parseFloat(responseRateForGoogleRatings) > 50 ? "Aktiv" : "Ausbaufähig"}

🔄 SYSTEMAKTIVITÄT & ÄNDERUNGEN:
- Erfasste Systemänderungen (200 neueste): ${recentChanges}
- Änderungen nach Typ: ${
      Object.entries(changesByType)
        .map(([type, count]) => `${type}: ${count}`)
        .join(", ") || "Keine"
    }
- Benutzersichtbare Änderungen: ${userFacingChanges}
- System-Aktivitätslevel: ${recentChanges > 100 ? "Sehr aktiv" : recentChanges > 50 ? "Aktiv" : "Moderat"}

👥 TEAM & PERSONALMANAGEMENT:
- Team-Mitglieder gesamt: ${teamSize} (${activeTeamMembers} aktiv, ${inactiveTeamMembers} inaktiv)
- Anzahl Teams: ${teamsCount}
- Abteilungen: ${departmentsCount} (${activeDepartments} aktiv)
- Aktive Verträge: ${activeContracts} von ${teamSize}
- Vertragsabdeckung: ${teamSize > 0 ? ((activeContracts / teamSize) * 100).toFixed(1) : 0}%
- Wochenstunden Bedarfsplanung: ${totalWeeklyHours.toFixed(1)}h
- Monatsbedarf: ${monthlyHours.toFixed(1)}h
- Durchschnitt pro Mitarbeiter: ${avgHoursPerTeamMember}h/Woche
- Aktive Bedarfspläne: ${activeStaffingPlans}
- Größte Abteilung: ${largestDepartment ? `${largestDepartment[0]} (${largestDepartment[1]} MA)` : "Nicht definiert"}
- Kleinste Abteilung: ${smallestDepartment ? `${smallestDepartment[0]} (${smallestDepartment[1]} MA)` : "Nicht definiert"}

🏢 ORGANISATIONSSTRUKTUR:
- Organigramm-Positionen: ${totalOrgPositions} (${filledPositions} besetzt, ${vacantPositions} vakant)
- Besetzungsrate: ${positionFillRate}%
- Hierarchieebenen: ${orgLevels}
- Abteilungen im Organigramm: ${departmentsInOrg}
- Verantwortlichkeiten definiert: ${totalResponsibilities} (${activeResponsibilities} aktiv)
- Verantwortlichkeiten mit Leitung: ${responsibilitiesWithLeader} (${responsibilityCoverage}% Abdeckung)
- Durchschnittliche Teammitglieder pro Verantwortlichkeit: ${avgMembersPerResponsibility.toFixed(1)}
- Verantwortlichkeitsgruppen: ${responsibilityGroups}

🎯 ZIELE & AUFGABEN:
- Ziele gesamt: ${totalGoals} (${activeGoals} aktiv, ${completedGoals} abgeschlossen, ${overdueGoals} überfällig)
- Durchschnittlicher Zielerreichungsgrad: ${avgGoalProgress.toFixed(1)}%
- Zielerreichungsrate: ${goalCompletionRate}%
- Hochpriorisierte Ziele: ${highPriorityGoals}
- Aufgaben: ${totalTodos} (${pendingTodos} offen, ${completedTodos} erledigt, ${overdueTodos} überfällig)
- Aufgaben mit Anhängen: ${todoAttachmentsCount} (${attachmentsPerTodo} pro Aufgabe)
- Aufgabenerledigungsrate: ${todoCompletionRate}%
- Hochpriorisierte Aufgaben: ${highPriorityTodos}

🔄 WORKFLOWS & PROZESSE:
- Workflows gesamt: ${totalWorkflows} (${activeWorkflows} laufend, ${completedWorkflows} abgeschlossen, ${blockedWorkflows} blockiert)
- Workflow-Vorlagen verfügbar: ${totalWorkflowTemplates} (${activeWorkflowTemplates} aktiv)
- Workflow-Abschlussrate: ${workflowCompletionRate}%
- Durchschnittlicher Workflow-Fortschritt: ${avgWorkflowProgress.toFixed(1)}%
- Workflow-Schritte: ${totalSteps} (${completedSteps} abgeschlossen, ${blockedSteps} blockiert)
- Schritt-Erledigungsrate: ${stepCompletionRate}%
- Schritt-Blockierungsrate: ${stepBlockageRate}%
- Organisations-Kategorien: ${categoryCount} (${activeCategoriesCount} aktiv)
- ⚠️ Effizienzwarnung: ${blockedWorkflows > 0 || Number.parseFloat(stepBlockageRate) > 10 ? "Blockierte Workflows vorhanden" : "Keine kritischen Blockaden"}

💼 RECRUITING & BEWERBUNGSMANAGEMENT:
- Recruiting-Infrastruktur: ${recruitingFieldsCount} Formularfelder (${enabledRecruitingFields} aktiviert)
- Interview-Vorlagen: ${interviewTemplatesCount}
- Pipeline-Phasen: ${pipelineStagesCount} (${activePipelineStages} aktiv)
- Aktive Stellenausschreibungen: ${activeJobPostings} (${closedJobPostings} geschlossen)
- Kandidaten gesamt: ${totalCandidates} (${activeCandidates} aktiv, ${rejectedCandidates} abgelehnt)
- Kandidaten pro Stelle: ${candidatesPerJob}
- Bewerbungen: ${totalApplications} (${pendingApplications} ausstehend, ${acceptedApplications} angenommen, ${rejectedApplications} abgelehnt)
- Bewerbungs-Conversion-Rate: ${applicationConversionRate}%
- Interviews: ${completedInterviews} abgeschlossen, ${scheduledInterviews} geplant
- Fragebögen: ${totalQuestionnaires}
- Fragebogen-Antworten: ${totalResponses} (${completedResponses} abgeschlossen)
- Antwort-Rücklaufquote: ${responseRateForGoogleRatings}%
- Durchschnittliche Antworten pro Fragebogen: ${avgResponsesPerQuestionnaire}

📁 DOKUMENTE & WISSENSDATENBANK:
- Dokumente gesamt: ${totalDocuments}
- Ordner-Struktur: ${totalFolders} Ordner
- Dokumente pro Ordner: ${documentsPerFolder}
- Dokumente mit Tags: ${documentsWithTags} (${documentTaggingRate}% getaggt)
- Wissensdatenbank-Artikel: ${knowledgeArticles}
- Dokumentenorganisation: ${Number.parseFloat(documentTaggingRate) > 70 ? "Gut" : Number.parseFloat(documentTaggingRate) > 40 ? "Mittel" : "Verbesserungsfähig"}

📝 FORMULARE & EINREICHUNGEN:
- Formulare: ${totalCustomForms} (${activeCustomForms} aktiv)
- Einreichungen gesamt: ${totalFormSubmissions}
- Ausstehende Einreichungen: ${pendingFormSubmissions}
- Genehmigte Einreichungen: ${approvedFormSubmissions}
- Durchschnittliche Einreichungen pro Formular: ${submissionsPerForm}

📊 ANALYSEPARAMETER & DATENQUALITÄT:
- Erfasste Analyseparameter gesamt: ${totalAnalyticsParameters}
- Aktuelle Analyseparameter (30 Tage): ${recentAnalyticsParameters}
- Datenqualitäts-Konsistenz: ${analyticsParameterTrackingConsistency}%
- Datenqualität: ${Number.parseFloat(analyticsParameterTrackingConsistency) > 70 ? "Gut" : Number.parseFloat(analyticsParameterTrackingConsistency) > 40 ? "Mittel" : "Verbesserungsfähig"}

📢 KOMMUNIKATION & TERMINE:
- Benachrichtigungen (50 neueste): ${totalNotifications} (${unreadNotifications} ungelesen)
- Benachrichtigungs-Leserate: ${notificationReadRate}%
- Anstehende Termine (30 Tage): ${upcomingEvents}
- Termine diese Woche: ${eventsThisWeek}

🔧 SYSTEM & KONFIGURATION:
- Sidebar-Berechtigungen konfiguriert: ${sidebarPermissionsCount}
- Benutzereinstellungen: ${userPreferencesCount}
- Systemübersetzungen geladen: ${translations.data?.length || 0}

DATENSPENDE-KONTEXT:
${datenspendeContext}

ANALYSEANFORDERUNGEN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Erstelle eine JSON-Antwort mit folgendem Format:
{
  "overallScore": <Zahl zwischen 0-100, gewichtet nach Bedeutung der Bereiche>,
  "summary": "<Umfassende Zusammenfassung in 2-3 Sätzen mit den wichtigsten Erkenntnissen und Handlungsbedarf>",
  "insights": [
    {
      "type": "success|warning|improvement",
      "category": "<Kategorie>",
      "title": "<Titel>",
      "description": "<Beschreibung>",
      "metric": "<Optionale Metrik>"
    }
  ],
  "recommendations": ["<Handlungsempfehlung 1>", "<Handlungsempfehlung 2>", ...],
  "categories": {
    "team": {
      "score": <Bewertung des Teams>,
      "findings": ["<Erkenntnisse über das Team>"],
      "recommendations": ["<Empfehlungen für das Team>"]
    },
    "finance": {
      "score": <Bewertung der Finanzen>,
      "findings": ["<Erkenntnisse über Finanzen>"],
      "recommendations": ["<Empfehlungen für Finanzen>"]
    },
    "patientSatisfaction": {
      "score": <Bewertung der Patientenzufriedenheit>,
      "findings": ["<Erkenntnisse über Patientenfeedback>"],
      "recommendations": ["<Empfehlungen für Patientenzufriedenheit>"]
    },
    "support": {
      "score": <Bewertung des Supportmanagements>,
      "findings": ["<Erkenntnisse über Support>"],
      "recommendations": ["<Empfehlungen für Support>"]
    },
    "goals": {
      "score": <Bewertung der Ziele>,
      "findings": ["<Erkenntnisse über die Ziele>"],
      "recommendations": ["<Empfehlungen für die Ziele>"]
    },
    "recruiting": {
      "score": <Bewertung des Recruitings>,
      "findings": ["<Erkenntnisse über das Recruiting>"],
      "recommendations": ["<Empfehlungen für das Recruiting>"]
    },
    "workflows": {
      "score": <Bewertung der Workflows>,
      "findings": ["<Erkenntnisse über die Workflows>"],
      "recommendations": ["<Empfehlungen für die Workflows>"]
    },
    "documents": {
      "score": <Bewertung der Dokumente>,
      "findings": ["<Erkenntnisse über die Dokumente>"],
      "recommendations": ["<Empfehlungen für die Dokumente>"]
    },
    "knowledge": {
      "score": <Bewertung der Wissensdatenbank>,
      "findings": ["<Erkenntnisse über die Wissensdatenbank>"],
      "recommendations": ["<Empfehlungen für die Wissensdatenbank>"]
    }
  }
}

WICHTIGE ANALYSEKRITERIEN:
1. **Diversität der Erkenntnisse**: 10-15 Insights aus ALLEN verfügbaren Kategorien (Team, Finanzen, Patientenfeedback, Support, Recruiting, etc.)
2. **Priorisierung**: Identifiziere die 3-5 kritischsten Bereiche (success/warning/improvement)
3. **Kontext**: Nutze Vergleichswerte und Branchenbenchmarks
4. **Konkrete Zahlen**: Verwende immer die tatsächlichen Werte aus den Daten
5. **Handlungsorientierung**: 8-12 Empfehlungen, sortiert nach Dringlichkeit und Auswirkung
6. **Besondere Aufmerksamkeit auf**:
   - Finanzielle Gesundheit (Cashflow, Kategorisierung, KV-Abrechnungen)
   - Patientenzufriedenheit (Google-Bewertungen, Antwortrate)
   - Support-Effizienz (Ticket-Lösungsrate, Response-Zeit)
   - Organisationsstruktur-Lücken (Vakante Positionen, Verantwortlichkeiten ohne Leitung)
   - Prozessineffizienzen (Blockierte Workflows, überfällige Aufgaben)
   - Recruiting-Effizienz (Conversion-Rate, Kandidaten pro Stelle)
   - Datenqualität (KPI-Tracking, Dokumenten-Tagging, Transaktions-Kategorisierung)
   - Team-Balance (Abteilungsverteilung, Vertragsabdeckung)
   - Systemaktivität und Engagement

BEWERTUNGSSKALA:
- 90-100: Exzellent - Best Practice Level
- 80-89: Sehr gut - Überdurchschnittlich
- 70-79: Gut - Solide Basis mit Optimierungspotenzial
- 60-69: Befriedigend - Verbesserungsbedarf in mehreren Bereichen
- 50-59: Ausreichend - Dringender Handlungsbedarf
- <50: Ungenügend - Kritischer Zustand, sofortige Maßnahmen erforderlich

Sei konstruktiv, aber ehrlich. Hebe Stärken hervor UND identifiziere konkrete Verbesserungspotenziale. Nutze ALLE verfügbaren Daten für eine umfassende 360°-Analyse.`

    let analysis
    try {
      const { text } = await generateText({
        model: "anthropic/claude-sonnet-4-20250514",
        prompt: fullPrompt,
        maxOutputTokens: 8000,
        temperature: 0.5,
      })

      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("Ungültige AI-Antwort")
      }

      analysis = JSON.parse(jsonMatch[0])
    } catch (aiError) {
      // Base score starts at 30, then adds points for actual achievements
      let calculatedScore = 30 // Base score for just having an account

      // Team points (max 15 points)
      if (teamSize > 0) calculatedScore += 5
      if (teamSize >= 3) calculatedScore += 5
      if (teamSize >= 10) calculatedScore += 5

      // Goals points (max 15 points)
      if (totalGoals > 0) calculatedScore += 5
      if (Number(goalCompletionRate) > 50) calculatedScore += 5
      if (totalGoals >= 5 && Number(goalCompletionRate) > 70) calculatedScore += 5

      // Workflows points (max 10 points)
      if (totalWorkflows > 0) calculatedScore += 5
      if (totalWorkflows >= 3) calculatedScore += 5

      // Organization structure points (max 10 points)
      if (totalOrgPositions > 0) calculatedScore += 5
      if (vacantPositions === 0 && totalOrgPositions > 0) calculatedScore += 5

      // Documentation points (max 10 points)
      if (totalDocuments > 0) calculatedScore += 5
      if (totalDocuments >= 10) calculatedScore += 5

      // Finance tracking points (max 5 points)
      if (totalTransactions > 0) calculatedScore += 3
      if (Number(categorizationRate) > 50) calculatedScore += 2

      // Customer satisfaction points (max 5 points)
      if (totalGoogleRatings > 0) calculatedScore += 3
      if (Number(avgGoogleRating) >= 4.0) calculatedScore += 2

      // Deductions for problems
      if (overdueGoals > 0) calculatedScore -= Math.min(5, overdueGoals * 2)
      if (vacantPositions > 3) calculatedScore -= Math.min(5, (vacantPositions - 3) * 2)
      if (blockedWorkflows > 0) calculatedScore -= Math.min(5, blockedWorkflows * 3)

      // Ensure score stays in valid range
      calculatedScore = Math.max(0, Math.min(100, calculatedScore))

      analysis = {
        overallScore: calculatedScore,
        summary: `Ihre Praxis mit ${teamSize} Mitarbeitern zeigt ${calculatedScore >= 70 ? "sehr gute" : calculatedScore >= 50 ? "solide" : "ausbaufähige"} Strukturen. Es gibt ${totalGoals} Ziele (${String(goalCompletionRate)}% Erreichungsrate) und ${totalWorkflows} Workflows. Verbesserungspotenzial besteht bei ${vacantPositions} vakanten Positionen und ${overdueGoals} überfälligen Zielen.`,
        insights: [
          {
            type: "success" as const,
            category: "Team",
            title: `${teamSize} Teammitglieder aktiv`,
            description: `Ihre Praxis verfügt über ein Team von ${teamSize} Mitarbeitern, was eine solide Basis für die tägliche Arbeit bietet.`,
            metric: `${teamSize} Mitarbeiter`,
          },
          ...(vacantPositions > 0
            ? [
                {
                  type: "warning" as const,
                  category: "Organisation",
                  title: `${vacantPositions} offene Positionen`,
                  description: "Es gibt vakante Positionen im Organigramm, die besetzt werden sollten.",
                  metric: `${vacantPositions} Stellen offen`,
                },
              ]
            : []),
          {
            type: totalGoals > 0 ? ("success" as const) : ("improvement" as const),
            category: "Ziele",
            title: `${totalGoals} Ziele definiert`,
            description: `Ihre Praxis hat ${totalGoals} Ziele mit einer Erreichungsrate von ${String(goalCompletionRate)}%.`,
            metric: `${String(goalCompletionRate)}% erreicht`,
          },
          ...(overdueGoals > 0
            ? [
                {
                  type: "warning" as const,
                  category: "Ziele",
                  title: `${overdueGoals} überfällige Ziele`,
                  description:
                    "Einige Ziele haben ihre Deadline überschritten und sollten überarbeitet oder abgeschlossen werden.",
                  metric: `${overdueGoals} überfällig`,
                },
              ]
            : []),
          {
            type: totalWorkflows > 0 ? ("success" as const) : ("improvement" as const),
            category: "Workflows",
            title: `${totalWorkflows} Workflows definiert`,
            description: `Es sind ${totalWorkflows} Workflows in Ihrer Praxis aktiv, die Prozesse strukturieren.`,
            metric: `${totalWorkflows} Workflows`,
          },
          ...(documents.data?.length > 0
            ? [
                {
                  type: "success" as const,
                  category: "Dokumentation",
                  title: `${documents.data?.length} Dokumente verwaltet`,
                  description: "Eine gute Dokumentationsbasis ist vorhanden.",
                  metric: `${documents.data?.length} Dokumente`,
                },
              ]
            : []),
          ...(knowledge.data?.length > 0
            ? [
                {
                  type: "success" as const,
                  category: "Wissensmanagement",
                  title: `${knowledge.data?.length} Wissensbeiträge`,
                  description: "Ihre Wissensdatenbank enthält wertvolle Inhalte für das Team.",
                  metric: `${knowledge.data?.length} Beiträge`,
                },
              ]
            : []),
        ],
        recommendations: [
          ...(vacantPositions > 0 ? ["Vakante Positionen im Organigramm besetzen"] : []),
          ...(overdueGoals > 0 ? ["Überfällige Ziele adressieren und realistische Deadlines setzen"] : []),
          ...(totalGoals === 0 ? ["SMART-Ziele für Ihre Praxis definieren"] : []),
          ...(totalWorkflows === 0 ? ["Wichtige Prozesse als Workflows dokumentieren"] : []),
          "Regelmäßige Team-Meetings zur Zielverfolgung etablieren",
          "KPIs für kontinuierliche Verbesserung definieren",
        ],
        categories: {
          team: {
            score: activeTeamMembers > 0 ? 75 : 50,
            findings: [
              `Team besteht aus ${teamSize} Mitarbeitern`,
              `${activeContracts} von ${teamSize} Verträgen aktiv`,
            ],
            recommendations:
              activeContracts < teamSize ? ["Vertragsmanagement optimieren"] : ["Team-Struktur aufrechterhalten"],
          },
          goals: {
            score: totalGoals > 0 ? 70 : 40,
            findings: [`${totalGoals} Ziele definiert`, `${String(goalCompletionRate)}% Erreichungsrate`],
            recommendations: overdueGoals > 0 ? ["Überfällige Ziele adressieren"] : ["Zielplanung fortsetzen"],
          },
          workflows: {
            score: totalWorkflows > 0 ? 70 : 45,
            findings: [`${totalWorkflows} Workflows aktiv`, `${completedWorkflows} abgeschlossen`],
            recommendations:
              blockedWorkflows > 0 ? ["Blockierte Workflows analysieren"] : ["Workflow-Effizienz beibehalten"],
          },
          documents: {
            score: documents.data?.length > 10 ? 75 : 55,
            findings: [`${documents.data?.length} Dokumente verwaltet`, `${totalFolders} Ordner strukturiert`],
            recommendations: ["Dokumenten-Tagging verbessern", "Regelmäßige Archivierung durchführen"],
          },
          knowledge: {
            score: knowledge.data?.length > 5 ? 70 : 50,
            findings: [`${knowledge.data?.length} Wissensbeiträge veröffentlicht`],
            recommendations: ["Wissensdatenbank kontinuierlich erweitern"],
          },
        },
        generatedAt: new Date().toISOString(),
      }
    }

    if (!analysis.generatedAt) {
      analysis.generatedAt = new Date().toISOString()
    }

    try {
      if (userData) {
        await supabase.from("ai_analysis_history").insert({
          practice_id: practiceId,
          user_id: userData.id,
          analysis_type: "practice",
          title: "Praxis-Gesamtanalyse",
          summary: analysis.summary || "KI-gestützte Analyse Ihrer Praxisleistung und -prozesse",
          full_analysis: analysis,
          metadata: {
            team_size: teamSize,
            total_goals: totalGoals,
            total_workflows: totalWorkflows,
            documents_count: documentsCount,
            knowledge_count: knowledgeCount,
          },
        })
      }
    } catch (historyError) {
      console.error("[v0] Failed to save analysis to history:", historyError)
      // Don't fail the request if history save fails
    }

    return Response.json(analysis)
  } catch (error) {
    console.error("Fehler bei der KI-Analyse:", error)
    return Response.json(
      {
        error: "Fehler bei der Analyse",
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 },
    )
  }
}
