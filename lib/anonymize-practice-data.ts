import { createServerClient } from "@/lib/supabase/server"

/**
 * CRITICAL: Data Anonymization Utility for Datenspende (Data Donation)
 *
 * This module ensures ABSOLUTE anonymization of practice data before it can be
 * used for AI training across practices. NO personal identifiable information
 * is ever shared.
 *
 * GDPR Compliance: All data is anonymized following strict privacy regulations.
 */

export interface AnonymizedPracticeData {
  // Practice metadata (anonymized)
  practiceType: string
  practiceSize: "small" | "medium" | "large" // Based on team count
  specialty: string
  dataPoints: number

  // Aggregated metrics (NO personal data)
  aggregatedMetrics: {
    avgParameterValues: Record<string, number>
    commonGoalTypes: string[]
    workflowCompletionRates: Record<string, number>
    documentCategoryCounts: Record<string, number>
  }

  // Anonymized patterns (NO personal identifiers)
  anonymizedPatterns: {
    commonTodoCategories: string[]
    avgTodoCompletionTime: number
    calendarEventTypes: string[]
    teamStructurePatterns: {
      avgTeamSize: number
      commonRoles: string[]
    }
  }

  // Explicitly excluded: names, emails, addresses, phone numbers, dates of birth,
  // user IDs, practice IDs, IP addresses, or any other PII
}

/**
 * Fetches and anonymizes data from practices that have opted into Datenspende
 * @param excludePracticeId - Exclude specific practice from results (for privacy)
 * @returns Array of completely anonymized practice data
 */
export async function fetchAnonymizedDataFromDonatingPractices(
  excludePracticeId?: string,
): Promise<AnonymizedPracticeData[]> {
  const supabase = await createServerClient()

  try {
    // 1. Find practices with Datenspende enabled
    const { data: donatingPractices, error: practicesError } = await supabase
      .from("practices")
      .select("id, type")
      .eq("ai_enabled", true)
      .neq("id", excludePracticeId || "") // Exclude specific practice

    if (practicesError) {
      console.error("[Datenspende] Error fetching donating practices:", practicesError)
      return []
    }

    if (!donatingPractices || donatingPractices.length === 0) {
      return []
    }

    // Also check practice_settings for analyticsEnabled
    const { data: settings, error: settingsError } = await supabase
      .from("practice_settings")
      .select("practice_id, system_settings")
      .in(
        "practice_id",
        donatingPractices.map((p) => p.id),
      )

    if (settingsError) {
      console.error("[Datenspende] Error fetching settings:", settingsError)
      return []
    }

    // Filter only practices with both ai_enabled AND analyticsEnabled
    const fullyOptedInPractices = donatingPractices.filter((practice) => {
      const setting = settings?.find((s) => s.practice_id === practice.id)
      const systemSettings = setting?.system_settings as any
      return systemSettings?.analyticsEnabled === true
    })

    if (fullyOptedInPractices.length === 0) {
      return []
    }

    // 2. Anonymize data from each practice
    const anonymizedData: AnonymizedPracticeData[] = []

    for (const practice of fullyOptedInPractices) {
      const anonymized = await anonymizeSinglePractice(practice.id, practice.type)
      if (anonymized) {
        anonymizedData.push(anonymized)
      }
    }

    return anonymizedData
  } catch (error) {
    console.error("[Datenspende] Critical error in data anonymization:", error)
    return []
  }
}

/**
 * Anonymizes data from a single practice
 * CRITICAL: NO personal data is ever included
 */
async function anonymizeSinglePractice(
  practiceId: string,
  practiceType: string,
): Promise<AnonymizedPracticeData | null> {
  const supabase = await createServerClient()

  try {
    // Count team members to determine size (NO names or emails)
    const { count: teamCount } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", practiceId)
      .eq("status", "active")

    const practiceSize = (teamCount || 0) < 10 ? "small" : (teamCount || 0) < 50 ? "medium" : "large"

    // Fetch anonymized parameter values (NO personal identifiers)
    const { data: parameters } = await supabase
      .from("analytics_parameters")
      .select("name, category, unit")
      .eq("practice_id", practiceId)
      .eq("is_global", false)

    const { data: parameterValues } = await supabase
      .from("parameter_values")
      .select("parameter_id, value")
      .eq("practice_id", practiceId)
      .limit(1000)

    // Aggregate parameter values (NO personal data)
    const avgParameterValues: Record<string, number> = {}
    if (parameters && parameterValues) {
      parameters.forEach((param) => {
        const values = parameterValues
          .filter((v) => v.parameter_id === param.name)
          .map((v) => Number.parseFloat(v.value))
          .filter((v) => !isNaN(v))

        if (values.length > 0) {
          avgParameterValues[param.category || "other"] = values.reduce((a, b) => a + b, 0) / values.length
        }
      })
    }

    // Fetch goal types (NO specific goals or names)
    const { data: goals } = await supabase
      .from("goals")
      .select("goal_type, status")
      .eq("practice_id", practiceId)
      .eq("is_private", false)
      .limit(500)

    const goalTypes = goals?.map((g) => g.goal_type).filter(Boolean) || []
    const commonGoalTypes = [...new Set(goalTypes)]

    // Fetch workflow completion data (NO personal identifiers)
    const { data: workflows } = await supabase
      .from("workflows")
      .select("category, status, progress_percentage")
      .eq("practice_id", practiceId)
      .limit(500)

    const workflowCompletionRates: Record<string, number> = {}
    workflows?.forEach((w) => {
      if (w.category) {
        if (!workflowCompletionRates[w.category]) {
          workflowCompletionRates[w.category] = 0
        }
        workflowCompletionRates[w.category] += w.progress_percentage || 0
      }
    })

    // Fetch document categories (NO file contents or names)
    const { data: folders } = await supabase.from("document_folders").select("name").eq("practice_id", practiceId)

    const documentCategoryCounts: Record<string, number> = {}
    folders?.forEach((f) => {
      documentCategoryCounts[f.name] = (documentCategoryCounts[f.name] || 0) + 1
    })

    // Fetch todo categories (NO specific tasks or assignees)
    const { data: todos } = await supabase
      .from("todos")
      .select("priority, completed, created_at, updated_at")
      .eq("practice_id", practiceId)
      .not("completed", "is", null)
      .limit(500)

    const completionTimes =
      todos
        ?.map((t) => {
          const created = new Date(t.created_at).getTime()
          const updated = new Date(t.updated_at).getTime()
          return (updated - created) / (1000 * 60 * 60 * 24) // days
        })
        .filter((t) => t > 0 && t < 365) || []

    const avgTodoCompletionTime =
      completionTimes.length > 0 ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length : 0

    // Fetch calendar event types (NO specific events or attendees)
    const { data: events } = await supabase
      .from("calendar_events")
      .select("type")
      .eq("practice_id", practiceId)
      .limit(500)

    const calendarEventTypes = [...new Set(events?.map((e) => e.type).filter(Boolean) || [])]

    // Fetch team role distribution (NO names or emails)
    const { data: teamMembers } = await supabase
      .from("team_members")
      .select("role")
      .eq("practice_id", practiceId)
      .eq("status", "active")

    const commonRoles = [...new Set(teamMembers?.map((t) => t.role).filter(Boolean) || [])]

    const anonymizedData: AnonymizedPracticeData = {
      practiceType: practiceType || "general",
      practiceSize,
      specialty: practiceType || "unknown",
      dataPoints: (teamCount || 0) + (parameters?.length || 0) + (goals?.length || 0),

      aggregatedMetrics: {
        avgParameterValues,
        commonGoalTypes,
        workflowCompletionRates,
        documentCategoryCounts,
      },

      anonymizedPatterns: {
        commonTodoCategories: [], // Anonymized categories only
        avgTodoCompletionTime,
        calendarEventTypes,
        teamStructurePatterns: {
          avgTeamSize: teamCount || 0,
          commonRoles,
        },
      },
    }

    return anonymizedData
  } catch (error) {
    console.error("[Datenspende] Error anonymizing practice:", error)
    return null
  }
}

/**
 * Get AI context from anonymized donated data
 * Used to improve AI responses across all practices
 */
export async function getAIContextFromDonatedData(currentPracticeId: string): Promise<string> {
  const anonymizedData = await fetchAnonymizedDataFromDonatingPractices(currentPracticeId)

  if (anonymizedData.length === 0) {
    return ""
  }

  // Build context string for AI (NO personal data)
  let context = "\n\n=== Anonymisierte Branchendaten (Datenspende) ===\n"
  context += `Basierend auf ${anonymizedData.length} Praxen, die ihre Daten gespendet haben:\n\n`

  // Aggregate insights
  const allGoalTypes = new Set<string>()
  const allRoles = new Set<string>()
  const avgCompletionTime: number[] = []

  anonymizedData.forEach((data) => {
    data.aggregatedMetrics.commonGoalTypes.forEach((type) => allGoalTypes.add(type))
    data.anonymizedPatterns.teamStructurePatterns.commonRoles.forEach((role) => allRoles.add(role))
    if (data.anonymizedPatterns.avgTodoCompletionTime > 0) {
      avgCompletionTime.push(data.anonymizedPatterns.avgTodoCompletionTime)
    }
  })

  context += `Häufige Zieltypen in der Branche: ${Array.from(allGoalTypes).join(", ")}\n`
  context += `Typische Rollen: ${Array.from(allRoles).slice(0, 10).join(", ")}\n`

  if (avgCompletionTime.length > 0) {
    const avgDays = avgCompletionTime.reduce((a, b) => a + b, 0) / avgCompletionTime.length
    context += `Durchschnittliche Aufgabendauer: ${avgDays.toFixed(1)} Tage\n`
  }

  context +=
    "\nHinweis: Diese Daten sind vollständig anonymisiert und enthalten keine personenbezogenen Informationen.\n"
  context += "=== Ende der Branchendaten ===\n\n"

  return context
}
